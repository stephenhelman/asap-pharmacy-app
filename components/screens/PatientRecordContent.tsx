"use client";

import Link from "next/link";
import { useState } from "react";
import { getPatient, TODAY, GATE_LABELS, DOC_SLOT_LABELS } from "@/lib/dataProvider";
import { ROLE_LABELS } from "@/lib/session";
import type { GateStatus, GateType, StaffRole, PatientDetail } from "@/lib/types";
import {
  Avatar,
  Icon,
  StatusPill,
  SectionLabel,
  TagType,
  Tabs,
  RowCard,
  cn,
  type StatusTone,
} from "@/components/ui";

function age(dob: string): number {
  const d = new Date(dob);
  let a = TODAY.getUTCFullYear() - d.getUTCFullYear();
  const m = TODAY.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && TODAY.getUTCDate() < d.getUTCDate())) a -= 1;
  return a;
}

function daysUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - TODAY.getTime()) / 86_400_000);
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

// Chronological, left→right as the patient moves through the system.
// Intake (creation) and Onboarding (gates) are distinct, permanent phases.
const TABS = [
  { key: "intake", label: "Intake" },
  { key: "onboarding", label: "Onboarding" },
  { key: "clinical", label: "Clinical" },
  { key: "orders", label: "Orders" },
  { key: "renewals", label: "Renewals" },
];

const LIFECYCLE_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  INTAKE: "Intake",
  ONBOARDING: "Onboarding",
  TRANSFERRED_OUT: "Transferred out",
  INACTIVE: "Inactive",
};

// The six sub-pipeline gates in order (§5.1), with their owning role. Used to
// render a COMPLETE itemized onboarding history even when a patient has no gate
// records of their own (e.g. a long-Active patient whose gates all satisfied).
const GATE_TEMPLATE: { type: GateType; ownerRole: StaffRole }[] = [
  { type: "BENEFITS_VERIFICATION", ownerRole: "VERIFICATION" },
  { type: "VIABILITY", ownerRole: "PHARMACIST" },
  { type: "CLINICAL_RECORDS", ownerRole: "NURSE" },
  { type: "PRIOR_AUTHORIZATION", ownerRole: "PHARMACIST" },
  { type: "ASSISTANCE_ENROLLMENT", ownerRole: "SOCIAL_WORKER" },
  { type: "PATIENT_INTAKE", ownerRole: "NURSE" },
];

export function PatientRecordContent({ patientId }: { patientId: string }) {
  const p = getPatient(patientId);
  const [tab, setTab] = useState("intake");
  if (!p) return null;

  const rep = p.careTeam.find((c) => c.role === "REP");
  const prophyRx = p.prescriptions.find((rx) => rx.doseType === "PROPHYLAXIS");

  return (
    <div className="flex flex-col">
      {/* Header card */}
      <div className="border-b border-border bg-card px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={`${p.firstName} ${p.lastName}`} size={46} tone="navy" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-title-name text-navy">
              {p.firstName} {p.lastName}
            </p>
            <p className="text-body text-text-secondary">
              {age(p.dob)}y · Hemophilia {p.hemophiliaType} ·{" "}
              {p.severity.charAt(0) + p.severity.slice(1).toLowerCase()}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <StatusPill
            tone={p.lifecycle === "ACTIVE" ? "success" : "neutral"}
            icon={p.lifecycle === "ACTIVE" ? "ti-circle-check" : "ti-progress"}
          >
            {LIFECYCLE_LABEL[p.lifecycle] ?? p.lifecycle}
          </StatusPill>
          {prophyRx && (
            <StatusPill tone="neutral" icon="ti-prescription">
              {prophyRx.productName} {prophyRx.targetIu.toLocaleString()} IU
            </StatusPill>
          )}
          {p.isMinor && (
            <StatusPill tone="neutral" icon="ti-user-shield">
              Minor · guardian
            </StatusPill>
          )}
        </div>
      </div>

      {/* Rep reference — name only, no contact action (§ affordances by viewer's job) */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5">
        <span className="text-label text-text-muted">Assigned rep</span>
        <span className="text-body-strong text-text-primary">
          {rep?.user.fullName ?? "Unassigned"}
        </span>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="px-4 py-4">
        {tab === "intake" && <IntakeTab p={p} />}
        {tab === "onboarding" && <OnboardingTab p={p} />}
        {tab === "clinical" && <ClinicalTab p={p} />}
        {tab === "orders" && <OrdersTab p={p} />}
        {tab === "renewals" && <RenewalsTab p={p} />}
      </div>
    </div>
  );

  // ── Intake tab — the CREATION record (docs, consents, info) ────────────────
  // Permanent, accumulating history: what the patient provided and when.
  function IntakeTab({ p }: { p: PatientDetail }) {
    const consentItems = [
      { label: "SMS consent", done: p.smsConsent, when: null as string | null },
      { label: "Email consent", done: p.emailConsent, when: null },
      {
        label: "HIPAA consent",
        done: !!p.hipaaConsentedAt,
        when: p.hipaaConsentedAt ? fmt(p.hipaaConsentedAt) : null,
      },
    ];
    const infoItems = [
      { label: "Contact (phone / email)", done: !!p.phone },
      {
        label: "Mailing address",
        done: !!(p.addressLine1 && p.city && p.state && p.zip),
      },
      { label: "Date of birth", done: !!p.dob },
      { label: "Prescriber", done: !!p.prescriberName },
    ];

    return (
      <div className="flex flex-col gap-4">
        <div>
          <SectionLabel className="mb-2.5">Consents</SectionLabel>
          <RowCard>
            {consentItems.map((it) => (
              <CheckRow key={it.label} label={it.label} done={it.done} when={it.when} />
            ))}
          </RowCard>
        </div>
        <div>
          <SectionLabel className="mb-2.5">Information</SectionLabel>
          <RowCard>
            {infoItems.map((it) => (
              <CheckRow key={it.label} label={it.label} done={it.done} />
            ))}
          </RowCard>
        </div>
        <div>
          <SectionLabel className="mb-2.5">Documents</SectionLabel>
          {p.documentSlots.length === 0 ? (
            <EmptyState icon="ti-files" title="No document slots" />
          ) : (
            <RowCard>
              {p.documentSlots.map((s) => (
                <CheckRow
                  key={s.id}
                  label={`${DOC_SLOT_LABELS[s.type]}${s.required ? "" : " (optional)"}`}
                  done={s.status === "UPLOADED"}
                  when={s.uploadedAt ? fmt(s.uploadedAt) : null}
                  pendingLabel="Pending"
                />
              ))}
            </RowCard>
          )}
        </div>
      </div>
    );
  }

  // ── Onboarding tab — the GATE progression toward Active ────────────────────
  // Always an itemized list of the six sub-pipeline gates (like the Intake tab),
  // so a completed onboarding reads as a full green history — not an empty state.
  function OnboardingTab({ p }: { p: PatientDetail }) {
    // Ordering constraint made visible: gates can't begin until intake completes.
    if (p.lifecycle === "INTAKE")
      return (
        <EmptyState
          icon="ti-lock"
          title="Onboarding not started"
          body="Onboarding gates begin once the patient finishes intake. Intake must complete first."
        />
      );

    // Merge the patient's real gate records over the canonical template. A gate
    // with no record defaults to satisfied for an Active patient (they cleared
    // it) or not-started for one still onboarding.
    const byType = new Map(
      (p.onboarding?.gates ?? []).map((g) => [g.type, g]),
    );
    const rows = GATE_TEMPLATE.map((t) => {
      const g = byType.get(t.type);
      if (g)
        return {
          key: g.id,
          gateId: g.id,
          type: t.type,
          status: g.status,
          outcome: g.outcome,
          note: g.outcomeNote,
          ownerRole: g.ownerRole,
        };
      const satisfied = p.lifecycle === "ACTIVE";
      return {
        key: `tmpl-${t.type}`,
        gateId: null,
        type: t.type,
        status: (satisfied ? "SATISFIED" : "NOT_STARTED") as GateStatus,
        outcome: satisfied ? "satisfied" : null,
        note: null,
        ownerRole: t.ownerRole,
      };
    });

    const doneCount = rows.filter((r) => r.status === "SATISFIED").length;

    return (
      <>
        <div className="mb-2.5 flex items-center justify-between">
          <SectionLabel>Onboarding gates</SectionLabel>
          <span className="text-micro text-text-muted">
            {doneCount} of {rows.length} cleared
          </span>
        </div>
        <RowCard>
          {rows.map((r) => (
            <GateRow
              key={r.key}
              gateId={r.gateId}
              name={GATE_LABELS[r.type]}
              status={r.status}
              outcome={r.outcome}
              note={r.note}
              ownerRole={ROLE_LABELS[r.ownerRole]}
            />
          ))}
        </RowCard>
      </>
    );
  }

  function RenewalsTab({ p }: { p: PatientDetail }) {
    if (p.authorizations.length === 0)
      return <EmptyState icon="ti-shield" title="No standing authorizations" />;
    return (
      <>
        <SectionLabel className="mb-2.5">Renewals & authorizations</SectionLabel>
        <RowCard>
          {p.authorizations.map((a) => {
            const expiry =
              a.expiresAt !== null ? daysUntil(a.expiresAt) : null;
            const tone: StatusTone =
              a.status === "ACTIVE"
                ? "success"
                : a.status === "EXPIRING" || a.status === "PENDING"
                  ? "warning"
                  : a.status === "LAPSED"
                    ? "danger"
                    : "neutral";
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 px-3.5 py-3"
              >
                <Icon
                  name={
                    a.type === "PRIOR_AUTHORIZATION"
                      ? "ti-file-certificate"
                      : "ti-heart-handshake"
                  }
                  size={18}
                  className="text-navy-light"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-title-card text-text-primary">
                    {a.type === "PRIOR_AUTHORIZATION"
                      ? "Prior authorization"
                      : `Assistance${a.programName ? ` · ${a.programName}` : ""}`}
                  </p>
                  <p className="text-micro text-text-muted">
                    {a.expiresAt
                      ? expiry !== null && expiry >= 0
                        ? `Expires ${fmt(a.expiresAt)} · ${expiry}d`
                        : `Lapsed ${fmt(a.expiresAt)}`
                      : "No expiry on file"}
                  </p>
                </div>
                <StatusPill tone={tone}>
                  {a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                </StatusPill>
              </div>
            );
          })}
        </RowCard>
      </>
    );
  }

  function ClinicalTab({ p }: { p: PatientDetail }) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <SectionLabel className="mb-2.5">Open bleeds</SectionLabel>
          {p.bleeds.filter((b) => !b.closedAt).length === 0 ? (
            <EmptyState
              icon="ti-mood-smile"
              title="No open bleeds"
              body="Good news — nothing active right now."
            />
          ) : (
            <RowCard>
              {p.bleeds
                .filter((b) => !b.closedAt)
                .map((b) => (
                  <div key={b.id} className="flex items-center gap-3 px-3.5 py-3">
                    <Icon name="ti-droplet" size={18} className="text-red" />
                    <div className="flex-1">
                      <p className="text-title-card text-text-primary">{b.site}</p>
                      <p className="text-micro text-text-muted">
                        Onset {fmt(b.onsetAt)} · {b.treatments.length} PRN dose
                        {b.treatments.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <StatusPill tone="danger">
                      {(b.tier ?? "OPEN").toString().toLowerCase()}
                    </StatusPill>
                  </div>
                ))}
            </RowCard>
          )}
        </div>
        <div>
          <SectionLabel className="mb-2.5">Infusion log</SectionLabel>
          <RowCard>
            {p.infusions.slice(0, 6).map((i) => (
              <div key={i.id} className="flex items-center gap-3 px-3.5 py-3">
                <Icon name="ti-droplet" size={18} className="text-teal" />
                <div className="flex-1">
                  <p className="text-title-card text-text-primary">
                    {i.productName} {i.targetIu.toLocaleString()} IU
                  </p>
                  <p className="text-micro text-text-muted">{fmt(i.infusedAt)}</p>
                </div>
                <TagType kind={i.doseType} />
              </div>
            ))}
          </RowCard>
        </div>
      </div>
    );
  }

  function OrdersTab({ p }: { p: PatientDetail }) {
    if (p.orders.length === 0)
      return <EmptyState icon="ti-package" title="No orders yet" />;
    return (
      <>
        <SectionLabel className="mb-2.5">Order history</SectionLabel>
        <RowCard>
          {p.orders.map((o) => {
            const href =
              o.stage === "CLINICAL_CHECK"
                ? `/orders/${o.id}/clinical-check`
                : o.stage === "PROCESSING"
                  ? `/orders/${o.id}/pack`
                  : o.delivery
                    ? `/deliveries/${o.id}`
                    : null;
            const pill = (
              <StatusPill
                tone={
                  o.stage === "DELIVERED"
                    ? "success"
                    : o.status === "ON_HOLD" || o.status === "SHIPPED_INCOMPLETE"
                      ? "warning"
                      : "neutral"
                }
              >
                {o.stage === "DELIVERED"
                  ? "Delivered"
                  : o.stage === "ORDER_DUE"
                    ? "Due"
                    : o.stage === "CLINICAL_CHECK"
                      ? "Check"
                      : o.stage === "PROCESSING"
                        ? "Packing"
                        : "In flight"}
              </StatusPill>
            );
            const inner = (
              <>
                <Icon name="ti-package" size={18} className="text-navy-light" />
                <div className="flex-1">
                  <p className="text-title-card text-text-primary">{o.cycleLabel}</p>
                  <p className="text-micro text-text-muted">
                    {o.lineItems.length} line items ·{" "}
                    {o.stage.replace(/_/g, " ").toLowerCase()}
                  </p>
                </div>
                {pill}
                {href && <Icon name="ti-chevron-right" size={16} className="text-text-muted" />}
              </>
            );
            return href ? (
              <Link key={o.id} href={href} className="flex items-center gap-3 px-3.5 py-3 transition-colors active:bg-fill-control">
                {inner}
              </Link>
            ) : (
              <div key={o.id} className="flex items-center gap-3 px-3.5 py-3">
                {inner}
              </div>
            );
          })}
        </RowCard>
      </>
    );
  }
}

function GateRow({
  gateId,
  name,
  status,
  outcome,
  note,
  ownerRole,
}: {
  gateId: string | null;
  name: string;
  status: GateStatus;
  outcome: string | null;
  note: string | null;
  ownerRole: string;
}) {
  const node = {
    SATISFIED: { cls: "bg-teal text-white border-teal", icon: "ti-check" },
    IN_PROGRESS: { cls: "bg-amber-light text-amber border-amber-light", icon: "ti-clock" },
    BLOCKED: { cls: "bg-red-light text-red border-red-light", icon: "ti-alert-triangle" },
    NOT_STARTED: { cls: "bg-card text-text-muted border-border-strong", icon: "" },
  }[status];

  const outcomeLabel =
    status === "SATISFIED"
      ? (outcome ?? "Satisfied")
      : status === "IN_PROGRESS"
        ? "In progress"
        : status === "BLOCKED"
          ? (outcome ?? "Blocked")
          : "Not started";

  // Only real gate instances are actionable; synthesized template rows (gateId
  // null) are display-only.
  const actionable = status !== "SATISFIED" && gateId !== null;

  const inner = (
    <>
      <span
        className={cn(
          "mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border",
          node.cls,
        )}
      >
        {node.icon && <Icon name={node.icon} size={12} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-title-card text-text-primary">{name}</p>
        <p className="text-micro capitalize text-text-muted">
          {outcomeLabel.replace(/-/g, " ")} · {ownerRole}
        </p>
        {note && <p className="mt-0.5 text-micro text-text-secondary">{note}</p>}
      </div>
      {actionable && (
        <Icon name="ti-chevron-right" size={16} className="mt-0.5 text-text-muted" />
      )}
    </>
  );

  if (actionable)
    return (
      <Link
        href={`/gates/${gateId}`}
        className="flex items-start gap-3 px-3.5 py-2.5 transition-colors active:bg-fill-control"
      >
        {inner}
      </Link>
    );
  return <div className="flex items-start gap-3 px-3.5 py-2.5">{inner}</div>;
}

function CheckRow({
  label,
  done,
  when,
  pendingLabel = "Not yet",
}: {
  label: string;
  done: boolean;
  when?: string | null;
  pendingLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5">
      <Icon
        name={done ? "ti-circle-check" : "ti-circle"}
        size={18}
        className={done ? "text-teal" : "text-border-strong"}
      />
      <div className="min-w-0 flex-1">
        <p className="text-title-card text-text-primary">{label}</p>
        {done && when && (
          <p className="text-micro text-text-muted">{when}</p>
        )}
      </div>
      <span
        className={cn(
          "text-micro",
          done ? "text-teal-dark" : "text-text-muted",
        )}
      >
        {done ? "Done" : pendingLabel}
      </span>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Icon name={icon} size={32} className="text-text-muted" />
      <p className="text-title-card text-navy">{title}</p>
      {body && <p className="max-w-[240px] text-body text-text-secondary">{body}</p>}
    </div>
  );
}
