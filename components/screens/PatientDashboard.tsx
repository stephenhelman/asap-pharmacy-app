"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getPatient,
  getPatientMetrics,
  getNextOrder,
  getActiveDelivery,
  getUnreadFromTeam,
  getIntakeChecklist,
} from "@/lib/dataProvider";
import type { DeliveryStatus } from "@/lib/types";
import {
  Avatar,
  Button,
  Icon,
  StatusPill,
  MetricTile,
  BadgeCount,
  BottomNav,
  StepperHorizontal,
  StepperVertical,
  ProgressBar,
  NoticeInfo,
  NavRow,
  RowCard,
  type Step,
} from "@/components/ui";
import { PATIENT_NAV } from "./nav-config";
import { NotificationsBell } from "./NotificationsBell";

export function PatientDashboard({ patientId }: { patientId: string }) {
  const p = getPatient(patientId);
  if (!p) return null;

  return (
    <div className="flex h-full flex-col xl:h-auto">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 pb-3 pt-4">
        <div>
          <p className="text-body text-text-secondary">Welcome back,</p>
          <p className="text-title-name text-navy">{p.firstName}</p>
        </div>
        <div className="flex items-center gap-2.5 xl:hidden">
          <NotificationsBell patientId={patientId} />
          <Avatar name={p.firstName + " " + p.lastName} size={32} tone="navy" />
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 pt-3">
        {p.lifecycle === "ACTIVE" ? (
          <ActiveDashboard patientId={patientId} />
        ) : p.lifecycle === "INTAKE" ? (
          <IntakeDashboard patientId={patientId} />
        ) : p.lifecycle === "ONBOARDING" ? (
          <OnboardingDashboard patientId={patientId} />
        ) : (
          <InactiveDashboard />
        )}
      </main>

      <BottomNav items={PATIENT_NAV} activeKey="home" />
    </div>
  );
}

// ── Active state (P1) ───────────────────────────────────────────────────────
function ActiveDashboard({ patientId }: { patientId: string }) {
  const router = useRouter();
  const p = getPatient(patientId)!;
  const metrics = getPatientMetrics(p);
  const delivery = getActiveDelivery(p);
  const unread = getUnreadFromTeam(patientId);

  return (
    // Landscape-tablet (lg): stackable cards flow into 2 columns (browsing 2-up).
    <div className="lg:columns-2 lg:gap-4 xl:columns-1 [&>*]:lg:break-inside-avoid">
      {/* Status pills */}
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        <StatusPill tone="success" icon="ti-circle-check">
          Active
        </StatusPill>
        <StatusPill
          tone={metrics.bleedsThisMonth > 0 ? "warning" : "success"}
          icon={metrics.bleedsThisMonth > 0 ? "ti-activity" : "ti-mood-smile"}
        >
          {metrics.bleedsThisMonth > 0 ? "Recovering well" : "On schedule"}
        </StatusPill>
      </div>

      {/* Next-order hero card */}
      <NextOrderCard patientId={patientId} />

      {/* Metrics */}
      <div className="mb-3.5 grid grid-cols-3 gap-2">
        <MetricTile
          value={metrics.dosesOnHand}
          label="doses on hand"
          tone={metrics.dosesLow ? "amber" : "neutral"}
        />
        <MetricTile
          value={metrics.bleedsThisMonth}
          label="bleeds this month"
          tone={metrics.bleedsThisMonth > 0 ? "amber" : "neutral"}
        />
        <MetricTile
          value={
            metrics.daysSinceInfusion === null
              ? "—"
              : metrics.daysSinceInfusion === 0
                ? "Today"
                : metrics.daysSinceInfusion
          }
          label="since infusion"
          tone="teal"
        />
      </div>

      {/* Quick actions */}
      <div className="mb-3.5 grid grid-cols-2 gap-2">
        <Button variant="quick" icon="ti-droplet-plus" label="Log infusion" onClick={() => router.push("/logs?new=infusion")} />
        <Button variant="quick" icon="ti-first-aid-kit" label="Log a bleed" onClick={() => router.push("/logs?new=bleed")} />
      </div>

      {/* Delivery stepper */}
      {delivery?.delivery && (
        <DeliveryCard
          orderId={delivery.id}
          status={delivery.delivery.status}
          carrier={delivery.delivery.carrier ?? "Carrier"}
        />
      )}

      {/* Nav list */}
      <RowCard>
        <NavRow
          icon="ti-message-2"
          iconTone="teal"
          title="Message your team"
          sub="Nurse, pharmacist & rep"
          href="/messages"
          trailing={unread > 0 ? <BadgeCount>{unread} new</BadgeCount> : undefined}
        />
        <NavRow
          icon="ti-folder"
          title="My records"
          sub="Prescriptions, orders & logs"
          href="/logs"
        />
      </RowCard>
    </div>
  );
}

function NextOrderCard({ patientId }: { patientId: string }) {
  const router = useRouter();
  const p = getPatient(patientId)!;
  const next = getNextOrder(p);

  const config = {
    due: {
      label: "Your order is ready",
      cta: "Start my order",
      icon: "ti-package",
      sub:
        next.daysUntilDue !== null && next.daysUntilDue >= 0
          ? `Due in ${next.daysUntilDue} day${next.daysUntilDue === 1 ? "" : "s"}`
          : "Due now",
    },
    in_progress: {
      label: "Order in progress",
      cta: "Finish my order",
      icon: "ti-progress-check",
      sub: "Pick up where you left off",
    },
    preview: {
      label: "Next order",
      cta: "Preview my order",
      icon: "ti-calendar-clock",
      sub:
        next.daysUntilDue !== null
          ? `Opens in ${next.daysUntilDue} day${next.daysUntilDue === 1 ? "" : "s"}`
          : "Not due yet",
    },
  }[next.state];

  const orderHref = next.order
    ? `/order/${next.order.id}`
    : "/order/new";

  return (
    <div className="mb-3 rounded-card border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-label text-text-muted">
        <Icon name={config.icon} size={16} className="text-teal" />
        {config.label}
      </div>
      <p className="mt-1 text-num-hero text-navy">{config.sub}</p>
      <p className="mb-3 mt-0.5 text-body text-text-secondary">
        {p.prescriptions.find((rx) => rx.doseType === "PROPHYLAXIS")?.productName ??
          "Your medication"}{" "}
        · prophylaxis
      </p>
      <Button
        variant="primary"
        block
        icon="ti-arrow-right"
        className="h-10"
        onClick={() => router.push(orderHref)}
      >
        {config.cta}
      </Button>
    </div>
  );
}

function DeliveryCard({
  orderId,
  status,
  carrier,
}: {
  orderId: string;
  status: DeliveryStatus;
  carrier: string;
}) {
  const order: DeliveryStatus[] = [
    "PENDING",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ];
  const labels = ["Ordered", "Packed", "Shipped", "Out for delivery", "Delivered"];
  // map 4 statuses onto 5 display nodes (Ordered + Packed collapse to "in prep")
  const activeIdx = order.indexOf(status);
  const nodeStates: Step[] = labels.map((label, i) => {
    // node index 0=Ordered,1=Packed,2=Shipped,3=Out,4=Delivered
    const statusForNode = [0, 0, 1, 2, 3][i]; // maps node → status index
    let state: Step["state"] = "future";
    if (statusForNode < activeIdx) state = "done";
    else if (statusForNode === activeIdx) state = "current";
    return { label, state };
  });

  return (
    <div className="mb-3 rounded-card border border-border bg-card p-3.5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="ti-truck-delivery" size={18} className="text-teal" />
          <span className="text-title-card">This month's delivery</span>
        </div>
        <Link
          href={`/deliveries/${orderId}`}
          className="text-label-strong text-navy-light"
        >
          {carrier}
        </Link>
      </div>
      <StepperHorizontal steps={nodeStates} />
    </div>
  );
}

// ── Intake state — the patient's to-do checklist (§5.1.1) ───────────────────
// Shown until the patient's part of intake is complete; then the lifecycle
// advances to ONBOARDING and they see the tracker instead. Checklist ≠ tracker.
function IntakeDashboard({ patientId }: { patientId: string }) {
  const p = getPatient(patientId)!;
  const checklist = getIntakeChecklist(p);
  const doneCount = checklist.items.filter((i) => i.done).length;

  return (
    <>
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        <StatusPill tone="warning" icon="ti-progress">
          Finishing your setup
        </StatusPill>
      </div>

      {/* Polite, specific callout naming exactly what's still needed */}
      {checklist.callout && (
        <div className="mb-3.5">
          <NoticeInfo icon="ti-alert-circle">{checklist.callout}</NoticeInfo>
        </div>
      )}

      {/* The intake checklist — complete items show complete; incomplete ones
          deep-link to where they're finished. */}
      <div className="mb-3 rounded-card border border-border bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-title-card text-navy">Your checklist</span>
          <span className="text-label text-text-muted">
            {doneCount} of {checklist.items.length}
          </span>
        </div>
        <div className="mb-4">
          <ProgressBar
            total={checklist.items.length}
            done={doneCount}
            showCount={false}
          />
        </div>
        <div className="[&>*+*]:border-t [&>*+*]:border-border">
          {checklist.items.map((item) =>
            item.done ? (
              <div key={item.key} className="flex items-center gap-3 py-2.5">
                <Icon name="ti-circle-check" size={20} className="text-teal" />
                <div className="min-w-0 flex-1">
                  <p className="text-body-strong text-text-primary">{item.label}</p>
                  <p className="truncate text-micro text-text-muted">{item.sub}</p>
                </div>
                <span className="text-micro text-teal-dark">Done</span>
              </div>
            ) : (
              <Link
                key={item.key}
                href={item.href}
                className="flex items-center gap-3 py-2.5 active:opacity-70"
              >
                <Icon name="ti-circle" size={20} className="text-border-strong" />
                <div className="min-w-0 flex-1">
                  <p className="text-body-strong text-navy">{item.label}</p>
                  <p className="truncate text-micro text-text-muted">{item.sub}</p>
                </div>
                <Icon name="ti-chevron-right" size={18} className="text-text-muted" />
              </Link>
            ),
          )}
        </div>
      </div>

      <RowCard>
        <NavRow
          icon="ti-message-2"
          iconTone="teal"
          title="Message your team"
          sub="Questions? We're here to help."
          href="/messages"
        />
      </RowCard>
    </>
  );
}

// ── Onboarding state (compact P2) ───────────────────────────────────────────
function OnboardingDashboard({ patientId }: { patientId: string }) {
  const p = getPatient(patientId)!;
  const gates = p.onboarding?.gates ?? [];

  // friendly human milestones — abstraction of intake gates (no machinery shown)
  const milestones = [
    { label: "Account created", done: true },
    {
      label: "Documents received",
      done: gates.some(
        (g) => g.type === "CLINICAL_RECORDS" && g.status === "SATISFIED",
      ),
    },
    {
      label: "Insurance verified",
      done: gates.some(
        (g) => g.type === "BENEFITS_VERIFICATION" && g.status === "SATISFIED",
      ),
    },
    {
      label: "Approval in progress",
      done: gates.some(
        (g) => g.type === "PRIOR_AUTHORIZATION" && g.status === "SATISFIED",
      ),
    },
    { label: "First order", done: false },
  ];
  const doneCount = milestones.filter((m) => m.done).length;
  const currentIdx = milestones.findIndex((m) => !m.done);

  const steps: Step[] = milestones.map((m, i) => ({
    label: m.label,
    state: m.done ? "done" : i === currentIdx ? "current" : "future",
  }));

  return (
    <>
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        <StatusPill tone="neutral" icon="ti-progress">
          Getting you set up
        </StatusPill>
      </div>

      <div className="mb-3 rounded-card border border-border bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-title-card text-navy">Your setup</span>
          <span className="text-label text-text-muted">
            {doneCount} of {milestones.length}
          </span>
        </div>
        <div className="mb-4">
          <ProgressBar total={milestones.length} done={doneCount} showCount={false} />
        </div>
        <StepperVertical steps={steps} />
      </div>

      <div className="mb-3">
        <NoticeInfo>
          We're working on your setup behind the scenes — nothing needed from you
          right now. We'll reach out if we need anything.
        </NoticeInfo>
      </div>

      <RowCard>
        <NavRow
          icon="ti-message-2"
          iconTone="teal"
          title="Message your team"
          sub="Questions? We're here."
          href="/messages"
        />
      </RowCard>
    </>
  );
}

function InactiveDashboard() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Icon name="ti-arrow-right-circle" size={40} className="text-text-muted" />
      <p className="text-title-name text-navy">Care transferred</p>
      <p className="max-w-[280px] text-body text-text-secondary">
        Your care has been transferred to a specialty partner. This account is no
        longer active — reach out if you need anything.
      </p>
    </div>
  );
}
