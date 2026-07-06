"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOrder, getPatient } from "@/lib/dataProvider";
import { useMutations } from "@/lib/mutations";
import {
  Button,
  Icon,
  TopBarNav,
  SectionLabel,
  StatusPill,
  Card,
  FieldText,
  Avatar,
  cn,
} from "@/components/ui";

/**
 * S5 · Fulfillment — Pharmacist Clinical Check. Mandatory every-order review
 * (linear pipeline stage, not a gate). Order-vs-Rx checks + bleed flag → approve/hold.
 */
export function ClinicalCheck({ orderId }: { orderId: string }) {
  const router = useRouter();
  const order = getOrder(orderId);
  const { decideClinical, clinicalDecisions } = useMutations();
  const [holding, setHolding] = useState(false);
  const [reason, setReason] = useState("");

  if (!order)
    return (
      <div className="flex min-h-[100dvh] flex-col md:min-h-[844px]">
        <TopBarNav title="Clinical check" onDismiss={() => router.back()} />
        <div className="flex flex-1 items-center justify-center text-body text-text-muted">
          Order not found.
        </div>
      </div>
    );

  const patient = getPatient(order.patientId)!;
  const prophyRx = patient.prescriptions.find((rx) => rx.doseType === "PROPHYLAXIS");
  const cc = order.clinicalCheck;

  const decision =
    clinicalDecisions[orderId] ??
    (cc?.approved === true
      ? { decision: "approved" as const }
      : cc?.approved === false
        ? { decision: "held" as const }
        : null);

  // assay build "2000 + 500 + 500 = 3000"
  const assay = prophyRx?.assayComponents ?? [];
  const assayParts = assay.flatMap((c) => Array(c.quantity).fill(c.iu));
  const assaySum = assayParts.reduce((s, n) => s + n, 0);
  const assayValid = assaySum === (prophyRx?.targetIu ?? assaySum);

  const doseMatches = cc?.doseMatchesRx ?? true;
  const withinAllowance = cc?.withinAllowance ?? true;
  const bleedFlag =
    cc?.bleedFlag ??
    patient.bleeds.some((b) => new Date(b.onsetAt).getUTCMonth() === new Date(order.createdAt).getUTCMonth());

  const prophyLines = order.lineItems.filter((li) => li.kind !== "SUPPLY");
  const supplies = order.lineItems.filter((li) => li.kind === "SUPPLY");

  function approve() {
    decideClinical(orderId, "approved");
  }
  function hold() {
    decideClinical(orderId, "held", reason || "Needs review");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col md:min-h-[844px] lg:mx-auto lg:min-h-[100dvh] lg:w-full lg:max-w-[680px]">
      <TopBarNav
        title="Clinical check"
        onDismiss={() => router.back()}
        right={
          <StatusPill
            tone={decision?.decision === "approved" ? "success" : decision?.decision === "held" ? "warning" : "warning"}
            icon={decision?.decision === "approved" ? "ti-circle-check" : "ti-stethoscope"}
          >
            {decision?.decision === "approved" ? "Approved" : decision?.decision === "held" ? "On hold" : "Needs review"}
          </StatusPill>
        }
      />

      <PatientContextRow patient={patient} cycle={order.cycleLabel} onClick={() => router.push(`/patients/${patient.id}`)} />

      <main className="flex-1 overflow-y-auto p-4">
        {/* Order vs prescription */}
        <SectionLabel className="mb-2">Order vs. prescription</SectionLabel>
        <Card padding="0" className="mb-4">
          <div className="[&>*+*]:border-t [&>*+*]:border-border">
            <CheckRow
              ok={doseMatches}
              label="Dose matches Rx"
              detail={`${prophyRx?.targetIu.toLocaleString()} IU · prophylaxis`}
            />
            <CheckRow
              ok={assayValid}
              label="Assay build sums"
              detail={`${assayParts.join(" + ")} = ${assaySum.toLocaleString()}`}
            />
            <CheckRow
              ok={withinAllowance}
              label="Within insurance allowance"
              detail={`${prophyLines.reduce((s, l) => s + l.quantity, 0)} doses this cycle`}
            />
          </div>
        </Card>

        {/* Supplies */}
        <SectionLabel className="mb-2">Supplies requested</SectionLabel>
        <Card padding="14" className="mb-4">
          <div className="flex flex-col gap-2">
            {supplies.length === 0 ? (
              <p className="text-body text-text-muted">No supplies on this order.</p>
            ) : (
              supplies.map((s) => (
                <div key={s.id} className="flex items-center gap-2.5">
                  <Icon name="ti-box" size={16} className="text-navy-light" />
                  <span className="flex-1 text-body text-text-primary">{s.label}</span>
                  <span className="text-label text-text-muted">×{s.quantity}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Bleed / adherence flag */}
        {bleedFlag && (
          <div className="mb-4.5 flex gap-2.5 rounded-card border border-amber-light bg-amber-light p-3">
            <Icon name="ti-alert-triangle" size={18} className="mt-px shrink-0 text-amber" />
            <div className="text-body text-amber">
              <span className="font-semibold">Bleeds &amp; PRN this cycle.</span>{" "}
              Review the clinical picture before approving.
            </div>
          </div>
        )}

        {/* Actions */}
        {decision ? (
          <DecisionState decision={decision.decision} reason={decision.reason} onNext={() => router.push("/queue")} />
        ) : holding ? (
          <>
            <SectionLabel className="mb-2">Hold reason</SectionLabel>
            <FieldText
              multiline
              placeholder="Why is this order being held?"
              value={reason}
              onChange={setReason}
            />
            <div className="mt-3 flex flex-col gap-2">
              <Button variant="primary" block icon="ti-player-pause" onClick={hold}>
                Confirm hold
              </Button>
              <Button variant="secondary" block onClick={() => setHolding(false)}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button variant="primary" block icon="ti-circle-check" onClick={approve}>
              Approve — send to tech
            </Button>
            <Button
              variant="secondary"
              block
              icon="ti-player-pause"
              className="mt-2 border-amber-light text-amber"
              onClick={() => setHolding(true)}
            >
              Hold — add reason
            </Button>
            <p className="mt-3 text-center text-micro text-text-muted">
              Every order passes this check before packing. Logged to the audit trail.
            </p>
          </>
        )}
      </main>
    </div>
  );
}

export function PatientContextRow({
  patient,
  cycle,
  onClick,
}: {
  patient: { firstName: string; lastName: string; hemophiliaType: string; severity: string };
  cycle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 text-left active:bg-fill-control"
    >
      <Avatar name={`${patient.firstName} ${patient.lastName}`} size={32} />
      <div className="flex-1">
        <p className="text-title-card text-text-primary">
          {patient.firstName} {patient.lastName}
        </p>
        <p className="text-micro text-text-muted">
          {cycle} · Hemophilia {patient.hemophiliaType} · {patient.severity.toLowerCase()}
        </p>
      </div>
      <Icon name="ti-chevron-right" size={18} className="text-text-muted" />
    </button>
  );
}

function CheckRow({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <Icon
        name={ok ? "ti-circle-check" : "ti-alert-circle"}
        size={20}
        className={ok ? "text-teal" : "text-amber"}
      />
      <div className="flex-1">
        <p className="text-title-card text-text-primary">{label}</p>
        <p className="text-micro text-text-muted">{detail}</p>
      </div>
      <span className={cn("text-label-strong", ok ? "text-teal-dark" : "text-amber")}>
        {ok ? "Valid" : "Check"}
      </span>
    </div>
  );
}

function DecisionState({
  decision,
  reason,
  onNext,
}: {
  decision: "approved" | "held";
  reason?: string;
  onNext: () => void;
}) {
  const approved = decision === "approved";
  return (
    <div
      className={cn(
        "rounded-card border p-4 text-center",
        approved ? "border-border bg-teal-light" : "border-amber-light bg-amber-light",
      )}
    >
      <Icon
        name={approved ? "ti-circle-check" : "ti-player-pause"}
        size={26}
        className={cn("mb-1", approved ? "text-teal" : "text-amber")}
      />
      <p className="text-title-card text-navy">
        {approved ? "Approved — sent to tech" : "Order held"}
      </p>
      {!approved && reason && (
        <p className="mt-1 text-body text-text-secondary">"{reason}"</p>
      )}
      <p className="mt-1 text-body text-text-secondary">
        {approved
          ? "The tech queue picks it up for packing next."
          : "The rep is notified to resolve the hold."}
      </p>
      <Button variant="primary" block icon="ti-list-check" className="mt-3" onClick={onNext}>
        Back to queue
      </Button>
    </div>
  );
}
