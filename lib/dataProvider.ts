/**
 * SEAM 1 — the single data-access module.
 *
 * Components NEVER import dummy-data.json. They call these typed methods, which
 * return schema-shaped (Prisma-include-shaped) objects. The fixtures impl reads
 * the flat JSON and follows foreign keys in JS — exactly what Prisma `include`
 * will do later. To go live, swap this file's body for prisma.* calls; the
 * return types and every caller stay unchanged.
 */
import { db, ANCHOR_TODAY } from "./fixtures";
import type {
  StaffRole,
  PatientRow,
  PatientDetail,
  OrderDetail,
  PrescriptionDetail,
  BleedDetail,
  GateDetail,
  StaffUser,
  SupplyItemRow,
  ThreadRow,
  MessageRow,
  InternalNoteRow,
  UserRow,
  NotificationRow,
} from "./types";

// The story's fixed "today" — deterministic so the demo never drifts.
export const TODAY = new Date(ANCHOR_TODAY);

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

// ── Simple lookups ──────────────────────────────────────────────────────────

export function getPatients(): PatientRow[] {
  return db.patients;
}

export function getStaff(): StaffUser[] {
  return db.users.map((u) => ({
    ...u,
    roles: db.userRoles
      .filter((r) => r.userId === u.id)
      .map((r) => r.role),
  }));
}

export function getUser(id: string): StaffUser | null {
  const u = db.users.find((x) => x.id === id);
  if (!u) return null;
  return {
    ...u,
    roles: db.userRoles.filter((r) => r.userId === u.id).map((r) => r.role),
  };
}

export function getSupplies(): SupplyItemRow[] {
  return db.supplyItems.filter((s) => s.active);
}

// ── Joins ────────────────────────────────────────────────────────────────────

function prescriptionsFor(patientId: string): PrescriptionDetail[] {
  return db.prescriptions
    .filter((rx) => rx.patientId === patientId)
    .map((rx) => ({
      ...rx,
      assayComponents: db.assayComponents.filter(
        (ac) => ac.prescriptionId === rx.id,
      ),
    }));
}

function bleedsFor(patientId: string): BleedDetail[] {
  return db.bleeds
    .filter((b) => b.patientId === patientId)
    .map((b) => ({
      ...b,
      treatments: db.infusionEntries.filter((i) => i.bleedId === b.id),
    }))
    .sort((a, b) => b.onsetAt.localeCompare(a.onsetAt));
}

export function getOrder(id: string): OrderDetail | null {
  const o = db.orders.find((x) => x.id === id);
  if (!o) return null;
  return {
    ...o,
    lineItems: db.orderLineItems.filter((li) => li.orderId === o.id),
    signature: db.orderSignatures.find((s) => s.orderId === o.id) ?? null,
    clinicalCheck: db.clinicalChecks.find((c) => c.orderId === o.id) ?? null,
    delivery: db.deliveries.find((d) => d.orderId === o.id) ?? null,
    packedManifest: db.packedVials.filter((p) => p.orderId === o.id),
  };
}

function ordersFor(patientId: string): OrderDetail[] {
  return db.orders
    .filter((o) => o.patientId === patientId)
    .map((o) => getOrder(o.id)!)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getPatient(id: string): PatientDetail | null {
  const p = db.patients.find((x) => x.id === id);
  if (!p) return null;

  const onboarding = db.onboardings.find((o) => o.patientId === id) ?? null;

  return {
    ...p,
    prescriptions: prescriptionsFor(id),
    orders: ordersFor(id),
    infusions: db.infusionEntries
      .filter((i) => i.patientId === id)
      .sort((a, b) => b.infusedAt.localeCompare(a.infusedAt)),
    bleeds: bleedsFor(id),
    authorizations: db.authorizations.filter((a) => a.patientId === id),
    onboarding: onboarding
      ? {
          ...onboarding,
          gates: db.gates
            .filter((g) => g.onboardingId === onboarding.id)
            .map((g) => ({
              ...g,
              events: db.gateEvents.filter((e) => e.gateId === g.id),
            })),
        }
      : null,
    careTeam: db.careTeamAssignments
      .filter((c) => c.patientId === id)
      .map((c) => ({ ...c, user: db.users.find((u) => u.id === c.userId)! })),
    authorizedUsers: db.authorizedUsers.filter((a) => a.patientId === id),
  };
}

/** A single gate + its patient — context for the gate-action surface (S4). */
export function getGate(
  gateId: string,
): { gate: GateDetail; patient: PatientRow } | null {
  const g = db.gates.find((x) => x.id === gateId);
  if (!g) return null;
  const onb = db.onboardings.find((o) => o.id === g.onboardingId);
  const patient = db.patients.find((p) => p.id === onb?.patientId);
  if (!patient) return null;
  return {
    gate: { ...g, events: db.gateEvents.filter((e) => e.gateId === g.id) },
    patient,
  };
}

// ── Comms ─────────────────────────────────────────────────────────────────────

export function getThread(
  patientId: string,
  role: StaffRole,
): (ThreadRow & { messages: MessageRow[] }) | null {
  const t = db.threads.find(
    (x) => x.patientId === patientId && x.role === role,
  );
  if (!t) return null;
  return {
    ...t,
    messages: db.messages
      .filter((m) => m.threadId === t.id)
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt)),
  };
}

export interface ThreadSummary {
  id: string;
  role: StaffRole;
  roleLabel: string;
  roleNumber: string | null;
  memberName: string | null; // the staff holding that role for this patient
  lastBody: string | null;
  lastAt: string | null;
  lastSender: MessageRow["sender"] | null;
  unreadFromStaff: boolean;
}

const ROLE_LABEL: Record<StaffRole, string> = {
  REP: "Rep",
  NURSE: "Nurse",
  PHARMACIST: "Pharmacy",
  TECH: "Tech",
  SOCIAL_WORKER: "Social Worker",
  VERIFICATION: "Verification",
  MANAGEMENT: "Management",
};

/** Every role thread for a patient, with a preview — the comms hub index. */
export function getPatientThreads(patientId: string): ThreadSummary[] {
  return db.threads
    .filter((t) => t.patientId === patientId)
    .map((t) => {
      const msgs = db.messages
        .filter((m) => m.threadId === t.id)
        .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
      const last = msgs[msgs.length - 1];
      const member = db.careTeamAssignments.find(
        (c) => c.patientId === patientId && c.role === t.role,
      );
      const memberUser = member
        ? db.users.find((u) => u.id === member.userId)
        : undefined;
      return {
        id: t.id,
        role: t.role,
        roleLabel: ROLE_LABEL[t.role],
        roleNumber: t.roleNumber,
        memberName: memberUser?.fullName ?? null,
        lastBody: last?.body ?? (last?.kind === "CALL_EVENT" ? "Call" : null),
        lastAt: last?.sentAt ?? null,
        lastSender: last?.sender ?? null,
        unreadFromStaff: last?.sender === "STAFF",
      };
    })
    .sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));
}

export interface ThreadDetail {
  thread: ThreadRow;
  patient: PatientRow;
  roleLabel: string;
  messages: MessageRow[];
  notes: (InternalNoteRow & {
    author: UserRow | null;
    tags: StaffRole[];
    acks: { user: UserRow; seenAt: string }[];
  })[];
}

/** One thread with messages AND internal notes (staff-only) resolved. */
export function getThreadDetail(threadId: string): ThreadDetail | null {
  const t = db.threads.find((x) => x.id === threadId);
  if (!t) return null;
  const patient = db.patients.find((p) => p.id === t.patientId);
  if (!patient) return null;

  const notes = db.internalNotes
    .filter((n) => n.threadId === threadId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((n) => ({
      ...n,
      author: db.users.find((u) => u.id === n.authorId) ?? null,
      tags: db.noteTags.filter((tg) => tg.noteId === n.id).map((tg) => tg.taggedRole),
      acks: db.noteAcknowledgements
        .filter((a) => a.noteId === n.id)
        .map((a) => ({
          user: db.users.find((u) => u.id === a.userId)!,
          seenAt: a.seenAt,
        })),
    }));

  return {
    thread: t,
    patient,
    roleLabel: ROLE_LABEL[t.role],
    messages: db.messages
      .filter((m) => m.threadId === threadId)
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt)),
    notes,
  };
}

export interface Conversation {
  patient: PatientRow;
  threads: ThreadSummary[];
  lastAt: string | null;
  lastPreview: string | null;
  unread: number;
}

/** Staff comms index: patients with any thread, most-recent first. */
export function getStaffConversations(): Conversation[] {
  const patientIds = Array.from(new Set(db.threads.map((t) => t.patientId)));
  return patientIds
    .map((pid) => {
      const patient = db.patients.find((p) => p.id === pid)!;
      const threads = getPatientThreads(pid);
      const withMsg = threads.filter((t) => t.lastAt);
      const latest = withMsg.sort((a, b) =>
        (b.lastAt ?? "").localeCompare(a.lastAt ?? ""),
      )[0];
      return {
        patient,
        threads,
        lastAt: latest?.lastAt ?? null,
        lastPreview: latest?.lastBody ?? null,
        unread: threads.filter((t) => t.unreadFromStaff).length,
      };
    })
    .sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));
}

export function getNotifications(patientId: string): NotificationRow[] {
  return db.notifications
    .filter((n) => n.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ── Derived patient metrics (dashboard) ───────────────────────────────────────

export interface PatientMetrics {
  dosesOnHand: number;
  dosesLow: boolean;
  bleedsThisMonth: number;
  daysSinceInfusion: number | null;
  allotment: number; // prophylaxis doses/cycle target
}

export function getPatientMetrics(p: PatientDetail): PatientMetrics {
  // doses-on-hand ≈ last shipped/delivered order's prophylaxis qty − prophylaxis
  // doses consumed since (the ledger relationship, §5.3.1).
  const fulfilled = p.orders
    .filter((o) => ["SHIPPED", "DELIVERED"].includes(o.stage))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latest = fulfilled[0];
  const ordered =
    latest?.lineItems
      .filter((li) => li.kind === "PROPHYLAXIS_DOSE")
      .reduce((s, li) => s + li.quantity, 0) ?? 0;
  const consumedSince = latest
    ? p.infusions.filter(
        (i) =>
          i.doseType === "PROPHYLAXIS" &&
          i.infusedAt >= latest.createdAt,
      ).length
    : 0;
  const dosesOnHand = Math.max(0, ordered - consumedSince);

  const bleedsThisMonth = p.bleeds.filter((b) => {
    const d = new Date(b.onsetAt);
    return (
      d.getUTCFullYear() === TODAY.getUTCFullYear() &&
      d.getUTCMonth() === TODAY.getUTCMonth()
    );
  }).length;

  const lastInfusion = p.infusions[0]; // sorted desc
  const daysSinceInfusion = lastInfusion
    ? daysBetween(TODAY, new Date(lastInfusion.infusedAt))
    : null;

  const prophyRx = p.prescriptions.find((rx) => rx.doseType === "PROPHYLAXIS");
  const allotment = prophyRx ? (prophyRx.frequencyPerWeek ?? 2) * 4 : 8;

  return {
    dosesOnHand,
    dosesLow: dosesOnHand <= 2,
    bleedsThisMonth,
    daysSinceInfusion,
    allotment,
  };
}

/** The single "next order" a patient acts on, plus its display state. */
export type NextOrderState = "preview" | "due" | "in_progress";

export function getNextOrder(p: PatientDetail): {
  order: OrderDetail | null;
  state: NextOrderState;
  daysUntilDue: number | null;
} {
  const open = p.orders.find(
    (o) => o.stage === "ORDER_DUE" || o.stage === "SUBMITTED",
  );
  const inFlight = p.orders.find((o) =>
    ["CONFIRMED", "CLINICAL_CHECK", "PROCESSING", "SHIPPED"].includes(o.stage),
  );
  const daysUntilDue = p.nextOrderDueDate
    ? daysBetween(new Date(p.nextOrderDueDate), TODAY)
    : null;

  if (open?.stage === "ORDER_DUE")
    return { order: open, state: "due", daysUntilDue };
  if (open?.stage === "SUBMITTED")
    return { order: open, state: "in_progress", daysUntilDue };
  // an order already in fulfillment → next cycle is a preview
  return { order: inFlight ?? null, state: "preview", daysUntilDue };
}

/** Active outbound delivery for the dashboard stepper (in-transit only). */
export function getActiveDelivery(p: PatientDetail): OrderDetail | null {
  return (
    p.orders.find(
      (o) =>
        o.delivery &&
        ["SHIPPED", "OUT_FOR_DELIVERY"].includes(o.delivery.status),
    ) ?? null
  );
}

/** Unread badge for "Message your team" — last message from staff, unseen. */
export function getUnreadFromTeam(patientId: string): number {
  const threads = db.threads.filter((t) => t.patientId === patientId);
  let count = 0;
  for (const t of threads) {
    const msgs = db.messages
      .filter((m) => m.threadId === t.id)
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
    const last = msgs[msgs.length - 1];
    if (last && last.sender === "STAFF") count += 1;
  }
  return count;
}

// ── Roster (S1) ───────────────────────────────────────────────────────────────

export interface LeadSignal {
  label: string;
  tone: "danger" | "warning" | "success" | "neutral";
  icon: string;
}

export interface RosterRow {
  patient: PatientRow;
  lifecycleLabel: string;
  lifecycleTone: "success" | "neutral";
  lead: LeadSignal;
}

/** Single lead signal by severity priority (§S1). */
function leadSignalFor(patientId: string): LeadSignal {
  const detail = getPatient(patientId)!;

  const openBleed = detail.bleeds.find((b) => !b.closedAt);
  if (openBleed)
    return {
      label:
        openBleed.tier === "SEVERE" ? "Severe bleed — open" : "Open bleed",
      tone: "danger",
      icon: "ti-droplet-filled",
    };

  const paExpiring = detail.authorizations.find(
    (a) => a.type === "PRIOR_AUTHORIZATION" && a.status === "EXPIRING",
  );
  if (paExpiring)
    return { label: "PA expiring", tone: "warning", icon: "ti-clock-exclamation" };

  const assistProblem = detail.authorizations.find(
    (a) => a.type === "ASSISTANCE" && a.status === "LAPSED",
  );
  if (assistProblem)
    return { label: "Assistance lapsed", tone: "warning", icon: "ti-shield-x" };

  const orderDue = detail.orders.find((o) => o.stage === "ORDER_DUE");
  if (orderDue)
    return { label: "Ready to order", tone: "warning", icon: "ti-package" };

  if (detail.lifecycle === "ONBOARDING")
    return { label: "In setup", tone: "neutral", icon: "ti-progress" };

  if (detail.lifecycle === "TRANSFERRED_OUT")
    return { label: "Transferred out", tone: "neutral", icon: "ti-arrow-right-circle" };

  const activeDelivery = getActiveDelivery(detail);
  if (activeDelivery)
    return { label: "Delivery in transit", tone: "success", icon: "ti-truck-delivery" };

  return { label: "On schedule", tone: "success", icon: "ti-circle-check" };
}

export function getRoster(): RosterRow[] {
  return db.patients.map((p) => {
    const active = p.lifecycle === "ACTIVE";
    return {
      patient: p,
      lifecycleLabel: active
        ? "Active"
        : p.lifecycle === "ONBOARDING"
          ? "Onboarding"
          : p.lifecycle === "TRANSFERRED_OUT"
            ? "Transferred"
            : "Inactive",
      lifecycleTone: active ? "success" : "neutral",
      lead: leadSignalFor(p.id),
    };
  });
}

// ── Work queue (S2) ───────────────────────────────────────────────────────────

export type Triage = "danger" | "warning" | "neutral";

export interface WorkItem {
  id: string;
  label: string;
  category: string;
  triage: Triage;
  ownerRoles: StaffRole[];
  href: string;
}

export interface QueueRow {
  patient: PatientRow;
  lifecycleLabel: string;
  items: WorkItem[];
}

function workItemsFor(patientId: string): WorkItem[] {
  const d = getPatient(patientId)!;
  const items: WorkItem[] = [];

  // Onboarding gates that still need someone to act.
  for (const g of d.onboarding?.gates ?? []) {
    if (g.status === "SATISFIED") continue;
    const triage: Triage =
      g.status === "BLOCKED"
        ? "danger"
        : g.status === "IN_PROGRESS"
          ? "warning"
          : "neutral";
    items.push({
      id: `gate-${g.id}`,
      label: GATE_LABELS[g.type],
      category: "Intake",
      triage,
      ownerRoles: [g.ownerRole],
      href: `/gates/${g.id}`,
    });
  }

  // Order pipeline stages that are staff work.
  for (const o of d.orders) {
    if (o.stage === "ORDER_DUE")
      items.push(mk(`order-${o.id}`, "Order due", "Orders", "warning", ["REP"], `/patients/${patientId}`));
    if (o.stage === "CLINICAL_CHECK")
      items.push(mk(`cc-${o.id}`, "Clinical check", "Fulfillment", "warning", ["PHARMACIST"], `/orders/${o.id}/clinical-check`));
    if (o.stage === "PROCESSING")
      items.push(mk(`pack-${o.id}`, "Pack & ship", "Fulfillment", "neutral", ["TECH"], `/orders/${o.id}/pack`));
    if (o.status === "SHIPPED_INCOMPLETE")
      items.push(mk(`partial-${o.id}`, "Partial ship — reorder", "Orders", "warning", ["REP", "PHARMACIST"], `/patients/${patientId}`));
  }

  // Renewals nearing expiry.
  for (const a of d.authorizations) {
    if (a.type === "PRIOR_AUTHORIZATION" && a.status === "EXPIRING")
      items.push(mk(`pa-${a.id}`, "PA expiring", "Renewals", "warning", ["PHARMACIST", "VERIFICATION"], `/patients/${patientId}`));
    if (a.type === "ASSISTANCE" && a.status === "LAPSED")
      items.push(mk(`asst-${a.id}`, "Assistance lapsed", "Renewals", "warning", ["SOCIAL_WORKER"], `/patients/${patientId}`));
  }

  // Open bleeds → clinical follow-up.
  for (const b of d.bleeds) {
    if (!b.closedAt)
      items.push(
        mk(
          `bleed-${b.id}`,
          b.tier === "SEVERE" ? "Severe bleed check-in" : "Bleed follow-up",
          "Clinicals",
          b.tier === "SEVERE" ? "danger" : "warning",
          ["NURSE", "REP"],
          `/patients/${patientId}`,
        ),
      );
  }

  return items;
}

function mk(
  id: string,
  label: string,
  category: string,
  triage: Triage,
  ownerRoles: StaffRole[],
  href: string,
): WorkItem {
  return { id, label, category, triage, ownerRoles, href };
}

export const GATE_LABELS: Record<string, string> = {
  BENEFITS_VERIFICATION: "Benefits verification",
  VIABILITY: "Viability decision",
  CLINICAL_RECORDS: "Clinical records",
  PRIOR_AUTHORIZATION: "Prior authorization",
  ASSISTANCE_ENROLLMENT: "Assistance enrollment",
  PATIENT_INTAKE: "Patient intake",
};

/**
 * The role-scoped work queue. MANAGEMENT (and multi-role) sees the union;
 * a single-role user sees only items their role owns. Same component, different
 * session — the portal-collapse proof.
 */
export function getWorkQueue(roles: StaffRole[]): QueueRow[] {
  const isManagement = roles.includes("MANAGEMENT");
  const rows: QueueRow[] = [];

  for (const p of db.patients) {
    const all = workItemsFor(p.id);
    const scoped = isManagement
      ? all
      : all.filter((it) => it.ownerRoles.some((r) => roles.includes(r)));
    if (scoped.length === 0) continue;
    rows.push({
      patient: p,
      lifecycleLabel:
        p.lifecycle === "ACTIVE"
          ? "Active"
          : p.lifecycle === "ONBOARDING"
            ? "Onboarding"
            : "—",
      items: scoped,
    });
  }

  // Danger-first ordering.
  const rank = (r: QueueRow) =>
    r.items.some((i) => i.triage === "danger")
      ? 0
      : r.items.some((i) => i.triage === "warning")
        ? 1
        : 2;
  return rows.sort((a, b) => rank(a) - rank(b));
}
