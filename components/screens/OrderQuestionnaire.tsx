"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getOrder,
  getPatient,
  getPatientMetrics,
  getSupplies,
  TODAY,
} from "@/lib/dataProvider";
import { useSession } from "@/lib/session";
import { useMutations } from "@/lib/mutations";
import type { BleedDetail, PatientDetail } from "@/lib/types";
import {
  Button,
  Icon,
  TopBarNav,
  ProgressBar,
  SectionLabel,
  StatusPill,
  TagType,
  Card,
  FieldText,
  TogglePair,
  StepperInput,
  CheckboxRow,
  NotePrefill,
  SignaturePad,
  NoticeInfo,
} from "@/components/ui";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

function thisMonth(iso: string) {
  const d = new Date(iso);
  return (
    d.getUTCFullYear() === TODAY.getUTCFullYear() &&
    d.getUTCMonth() === TODAY.getUTCMonth()
  );
}

const CYCLE_LABEL = TODAY.toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function OrderQuestionnaire({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { session } = useSession();
  const existing = getOrder(orderId);
  const patientId = existing?.patientId ?? session.patientId ?? "pat_marcos";
  const p = getPatient(patientId);

  const [stage, setStage] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  if (!p) return null;

  const prophyRx = p.prescriptions.find((rx) => rx.doseType === "PROPHYLAXIS");
  const metrics = getPatientMetrics(p);
  const openBleeds = p.bleeds.filter((b) => !b.closedAt);
  const cycleInfusions = p.infusions.filter((i) => thisMonth(i.infusedAt));
  const cycleBleeds = p.bleeds.filter((b) => thisMonth(b.onsetAt));

  return (
    <div className="flex h-full flex-col xl:h-auto lg:mx-auto lg:w-full lg:max-w-[600px]">
      <TopBarNav
        title="Monthly order"
        onDismiss={() => (stage > 1 && !submitted ? setStage(stage - 1) : router.push("/"))}
      />
      {!submitted && (
        <div className="border-b border-border bg-card px-4 py-2.5">
          <ProgressBar total={3} done={stage} />
        </div>
      )}

      <main className="flex-1 min-h-0 overflow-y-auto p-4">
        {submitted ? (
          <SubmittedView patientName={p.firstName} onDone={() => router.push("/")} />
        ) : stage === 1 ? (
          <Stage1
            prophyName={prophyRx?.productName ?? "Your medication"}
            prophyIu={prophyRx?.targetIu ?? 0}
            openBleeds={openBleeds}
            cycleInfusions={cycleInfusions.length}
            onContinue={() => setStage(2)}
          />
        ) : stage === 2 ? (
          <Stage2
            p={p}
            allotment={metrics.allotment}
            dosesOnHand={metrics.dosesOnHand}
            prophyName={prophyRx?.productName ?? "Your medication"}
            prophyIu={prophyRx?.targetIu ?? 0}
            openBleeds={openBleeds}
            onContinue={() => setStage(3)}
          />
        ) : (
          <Stage3
            p={p}
            allotment={metrics.allotment}
            dosesOnHand={metrics.dosesOnHand}
            prophyName={prophyRx?.productName ?? "Your medication"}
            prophyIu={prophyRx?.targetIu ?? 0}
            openBleeds={openBleeds}
            cycleInfusions={cycleInfusions}
            cycleBleeds={cycleBleeds}
            orderId={orderId}
            onSubmit={() => setSubmitted(true)}
          />
        )}
      </main>
    </div>
  );
}

// ── Stage 1 — Check-in ──────────────────────────────────────────────────────
function Stage1({
  prophyName,
  prophyIu,
  openBleeds,
  cycleInfusions,
  onContinue,
}: {
  prophyName: string;
  prophyIu: number;
  openBleeds: BleedDetail[];
  cycleInfusions: number;
  onContinue: () => void;
}) {
  const [issues, setIssues] = useState("");
  const [missed, setMissed] = useState<"no" | "yes">("no");
  const [changes, setChanges] = useState("");
  const [bleedState, setBleedState] = useState<Record<string, "affected" | "resolved">>({});

  return (
    <div className="flex flex-col">
      <p className="mb-3.5 text-body text-text-secondary">
        Quick check-in for {CYCLE_LABEL}. This takes about a minute — your answers
        shape the order.
      </p>

      {/* Medication card (read-only, locked dose) */}
      <Card padding="14" className="mb-4.5">
        <div className="flex items-center gap-3">
          <Icon name="ti-prescription" size={20} className="text-teal" />
          <div className="flex-1">
            <p className="text-title-card text-navy">{prophyName}</p>
            <p className="text-micro text-text-muted">
              {prophyIu.toLocaleString()} IU · prophylaxis
            </p>
          </div>
          <StatusPill tone="neutral" icon="ti-lock">
            Locked to Rx
          </StatusPill>
        </div>
      </Card>

      {/* Issues / side-effects */}
      <Prompt>Any issues or side effects this month?</Prompt>
      <FieldText
        multiline
        placeholder="Optional — anything you'd want your team to know"
        value={issues}
        onChange={setIssues}
      />
      <Spacer />

      {/* Open-bleed reconciliation */}
      <Prompt>Open bleeds — where do these stand?</Prompt>
      {openBleeds.length === 0 ? (
        <div className="rounded-card border border-border bg-teal-light p-3.5 text-body text-teal-dark">
          <Icon name="ti-mood-smile" size={16} className="mr-1.5 inline" />
          No open bleeds — that's good news. Nothing to reconcile.
        </div>
      ) : (
        openBleeds.map((b) => (
          <div
            key={b.id}
            className="mb-2 rounded-card border border-border-danger bg-red-light p-3.5"
          >
            <div className="mb-2.5 flex items-center gap-2">
              <Icon name="ti-droplet" size={16} className="text-red" />
              <span className="text-title-card text-navy">{b.site}</span>
              <span className="text-micro text-text-muted">
                onset {fmtDate(b.onsetAt)}
              </span>
            </div>
            <TogglePair
              options={[
                { key: "affected", label: "Still affected" },
                { key: "resolved", label: "Resolved — close" },
              ]}
              value={bleedState[b.id] ?? "affected"}
              onChange={(v) => setBleedState((s) => ({ ...s, [b.id]: v }))}
            />
          </div>
        ))
      )}
      <Spacer />

      {/* Missed doses (pre-filled from log) */}
      <Prompt>Did you miss any prophylaxis doses?</Prompt>
      <TogglePair
        options={[
          { key: "no", label: "No, all on time" },
          { key: "yes", label: "Yes, missed some" },
        ]}
        value={missed}
        onChange={setMissed}
      />
      <div className="mt-1.5">
        <NotePrefill>
          {cycleInfusions} infusion{cycleInfusions === 1 ? "" : "s"} logged this
          month — pre-filled from your log
        </NotePrefill>
      </div>
      <Spacer />

      {/* Med / allergy changes */}
      <Prompt>Any medication or allergy changes?</Prompt>
      <FieldText
        multiline
        placeholder="Optional — new meds, reactions, anything new"
        value={changes}
        onChange={setChanges}
      />

      <div className="mt-6">
        <Button variant="primary" block icon="ti-arrow-right" onClick={onContinue}>
          Continue to order
        </Button>
      </div>
    </div>
  );
}

// ── Stage 2 — Order ─────────────────────────────────────────────────────────
function Stage2({
  p,
  allotment,
  dosesOnHand,
  prophyName,
  prophyIu,
  openBleeds,
  onContinue,
}: {
  p: PatientDetail;
  allotment: number;
  dosesOnHand: number;
  prophyName: string;
  prophyIu: number;
  openBleeds: BleedDetail[];
  onContinue: () => void;
}) {
  const [onHand, setOnHand] = useState(dosesOnHand);
  const prophyQty = Math.max(0, allotment - onHand);
  const prnQty = openBleeds.length;

  // supply recommender (regulars pre-checked / suggested amber / others)
  const supplies = getSupplies();
  const pastSupplyIds = new Set(
    p.orders.flatMap((o) =>
      o.lineItems.filter((li) => li.supplyItemId).map((li) => li.supplyItemId!),
    ),
  );
  const regulars = supplies.filter((s) => pastSupplyIds.has(s.id));
  const effectiveRegulars =
    regulars.length > 0 ? regulars : supplies.slice(0, 2);
  const suggested = supplies
    .filter((s) => !effectiveRegulars.includes(s))
    .slice(0, 1);

  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(effectiveRegulars.map((s) => [s.id, true])),
  );

  return (
    <div className="flex flex-col">
      {/* Doses on hand */}
      <Prompt>How many doses do you have on hand?</Prompt>
      <div className="flex items-center gap-3">
        <StepperInput value={onHand} onChange={setOnHand} max={allotment} />
        <span className="text-body text-text-secondary">
          of {allotment} / month
        </span>
      </div>
      <div className="mt-1.5">
        <NotePrefill>Pre-filled from your log · editable</NotePrefill>
      </div>
      <Spacer />

      {/* Shipping list */}
      <SectionLabel className="mb-2">This order will ship</SectionLabel>
      <Card padding="14" className="mb-2">
        <ShipLine
          icon="ti-vaccine"
          title={`${prophyName} ${prophyIu.toLocaleString()} IU`}
          sub="Prophylaxis dose"
          qty={prophyQty}
        />
      </Card>
      {prnQty > 0 && (
        <Card padding="14" className="mb-2">
          <ShipLine
            icon="ti-first-aid-kit"
            title={`${prophyName} · PRN replacement`}
            sub="Auto-added from this month's bleeds"
            qty={prnQty}
            prn
          />
        </Card>
      )}
      <p className="mb-4.5 text-micro text-text-muted">
        Quantities are locked to your prescription. {allotment} allotted −{" "}
        {onHand} on hand = {prophyQty} to ship.
      </p>

      {/* Supplies */}
      <SectionLabel className="mb-2">Supplies</SectionLabel>
      <Card padding="14" className="mb-2">
        <div className="[&>*+*]:border-t [&>*+*]:border-border">
          {[...effectiveRegulars, ...suggested].map((s) => (
            <CheckboxRow
              key={s.id}
              label={s.name}
              qty={s.unit ? `1 ${s.unit}` : undefined}
              checked={!!checked[s.id]}
              suggested={suggested.includes(s)}
              onToggle={() =>
                setChecked((c) => ({ ...c, [s.id]: !c[s.id] }))
              }
            />
          ))}
        </div>
      </Card>
      <Button variant="dashed-add" block icon="ti-plus" className="mb-4.5">
        Request another supply
      </Button>

      <Button variant="primary" block icon="ti-arrow-right" onClick={onContinue}>
        Review &amp; sign
      </Button>
    </div>
  );
}

function ShipLine({
  icon,
  title,
  sub,
  qty,
  prn = false,
}: {
  icon: string;
  title: string;
  sub: string;
  qty: number;
  prn?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon name={icon} size={20} className={prn ? "text-red" : "text-teal"} />
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-title-card text-navy">{title}</span>
          {prn && <TagType kind="PRN" />}
        </div>
        <p className="text-micro text-text-muted">{sub}</p>
      </div>
      <span className="text-num-hero text-navy">×{qty}</span>
    </div>
  );
}

// ── Stage 3 — Review & sign ─────────────────────────────────────────────────
function Stage3({
  p,
  allotment,
  dosesOnHand,
  prophyName,
  prophyIu,
  openBleeds,
  cycleInfusions,
  cycleBleeds,
  orderId,
  onSubmit,
}: {
  p: PatientDetail;
  allotment: number;
  dosesOnHand: number;
  prophyName: string;
  prophyIu: number;
  openBleeds: BleedDetail[];
  cycleInfusions: PatientDetail["infusions"];
  cycleBleeds: BleedDetail[];
  orderId: string;
  onSubmit: () => void;
}) {
  const { submitOrder } = useMutations();
  const [signed, setSigned] = useState(false);
  const prophyQty = Math.max(0, allotment - dosesOnHand);
  const fullName = `${p.firstName} ${p.lastName}`;

  function handleSubmit() {
    submitOrder(orderId, fullName);
    onSubmit();
  }

  return (
    <div className="flex flex-col">
      {/* Order summary */}
      <SectionLabel className="mb-2">Order summary</SectionLabel>
      <Card padding="0" className="mb-4.5">
        <div className="[&>*+*]:border-t [&>*+*]:border-border">
          <SummaryRow label={`${prophyName} ${prophyIu.toLocaleString()} IU · prophylaxis`} value={`×${prophyQty}`} />
          {openBleeds.length > 0 && (
            <SummaryRow label={`${prophyName} · PRN replacement`} value={`×${openBleeds.length}`} />
          )}
          <SummaryRow label="Supplies" value="Gauze, wipes" />
        </div>
      </Card>

      {/* This month's log being attested */}
      <SectionLabel className="mb-2">This month's log</SectionLabel>
      <Card padding="14" className="mb-1.5">
        <p className="mb-2.5 text-micro text-text-muted">
          You're attesting these entries are accurate:
        </p>
        <div className="flex flex-col gap-2">
          {cycleInfusions.map((i) => (
            <div key={i.id} className="flex items-center gap-2.5">
              <Icon name="ti-droplet" size={16} className="text-teal" />
              <span className="flex-1 text-body text-text-primary">
                {i.productName} {i.targetIu.toLocaleString()} IU
              </span>
              <span className="text-micro text-text-muted">{fmtDate(i.infusedAt)}</span>
              <TagType kind={i.doseType} />
            </div>
          ))}
          {cycleBleeds.map((b) => (
            <div key={b.id} className="flex items-center gap-2.5">
              <Icon name="ti-droplet" size={16} className="text-red" />
              <span className="flex-1 text-body text-text-primary">
                Bleed · {b.site}
              </span>
              <span className="text-micro text-text-muted">{fmtDate(b.onsetAt)}</span>
            </div>
          ))}
          {cycleInfusions.length === 0 && cycleBleeds.length === 0 && (
            <p className="text-body text-text-muted">No entries this month.</p>
          )}
        </div>
      </Card>
      <Spacer />

      {/* Sign */}
      <SectionLabel className="mb-2">Sign to authorize</SectionLabel>
      <p className="mb-2.5 text-body text-text-secondary">
        Your signature confirms this month's log is accurate and authorizes this
        order.
      </p>
      <SignaturePad
        signed={signed}
        signedName={fullName}
        onSign={() => setSigned((s) => !s)}
      />
      <p className="mb-5.5 mt-1.5 flex items-center gap-1.5 text-micro text-text-muted">
        <Icon name="ti-lock" size={13} />
        One signature covers both the log attestation and the order.
      </p>

      <Button
        variant="primary"
        block
        icon="ti-circle-check"
        disabled={!signed}
        onClick={handleSubmit}
      >
        Submit order
      </Button>
      <p className="mt-3 text-center text-micro text-text-muted">
        Your rep reviews every order before it ships.
      </p>
    </div>
  );
}

function SubmittedView({
  patientName,
  onDone,
}: {
  patientName: string;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-light">
        <Icon name="ti-circle-check" size={36} className="text-teal" />
      </div>
      <div>
        <p className="text-h2 text-navy">Order submitted</p>
        <p className="mt-1 max-w-[280px] text-body text-text-secondary">
          Thanks, {patientName}. Your rep will review it shortly — you'll get a
          notification at each step.
        </p>
      </div>
      <NoticeInfo icon="ti-clock-check">
        Next: rep confirmation → pharmacist check → packed & shipped. Track it all
        from your dashboard.
      </NoticeInfo>
      <Button variant="primary" block icon="ti-home" onClick={onDone}>
        Back to dashboard
      </Button>
    </div>
  );
}

// ── small helpers ───────────────────────────────────────────────────────────
function Prompt({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-body-strong text-text-primary">{children}</p>;
}
function Spacer() {
  return <div className="h-4.5" />;
}
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2.5">
      <span className="text-body text-text-primary">{label}</span>
      <span className="text-body-strong text-navy">{value}</span>
    </div>
  );
}
