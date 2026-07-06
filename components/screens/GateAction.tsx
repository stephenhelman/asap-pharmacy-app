"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getGate, getPatient, GATE_LABELS } from "@/lib/dataProvider";
import { useSession, ROLE_LABELS, roleSummary } from "@/lib/session";
import { useMutations } from "@/lib/mutations";
import {
  Button,
  Icon,
  TopBarNav,
  SectionLabel,
  StatusPill,
  Card,
  FieldText,
  NoticeInfo,
  Avatar,
  cn,
} from "@/components/ui";

/**
 * S4 · Gate Action — the reusable gate primitive. Only the reference data and
 * typed outcomes change per gate; the shell is identical. Shown: Viability v1
 * decision-recorder. Authorization = gate.ownerRole × session.roles, or MANAGEMENT.
 */
export function GateAction({ gateId }: { gateId: string }) {
  const router = useRouter();
  const { session } = useSession();
  const { recordGate, gateOutcomes } = useMutations();
  const ctx = getGate(gateId);
  const [note, setNote] = useState("");

  if (!ctx) {
    return (
      <div className="flex h-full flex-col xl:h-auto">
        <TopBarNav title="Gate" onDismiss={() => router.back()} />
        <div className="flex flex-1 items-center justify-center text-body text-text-muted">
          Gate not found.
        </div>
      </div>
    );
  }

  const { gate, patient } = ctx;
  const detail = getPatient(patient.id)!;
  const prophyRx = detail.prescriptions.find((rx) => rx.doseType === "PROPHYLAXIS");
  const benefits = detail.onboarding?.gates.find(
    (g) => g.type === "BENEFITS_VERIFICATION",
  );

  const recorded =
    gateOutcomes[gateId] ??
    (gate.outcome && gate.status !== "IN_PROGRESS" && gate.status !== "NOT_STARTED"
      ? { outcome: gate.outcome, note: gate.outcomeNote ?? undefined }
      : null);

  const canAct =
    session.roles.includes("MANAGEMENT") ||
    session.roles.includes(gate.ownerRole);

  const actingRole = session.roles.includes("MANAGEMENT")
    ? "MANAGEMENT"
    : gate.ownerRole;

  function decide(outcome: string) {
    recordGate(gateId, outcome, note || undefined);
  }

  const isViability = gate.type === "VIABILITY";

  return (
    <div className="flex h-full flex-col xl:h-auto md:mx-auto md:w-full md:max-w-[680px]">
      <TopBarNav
        title={GATE_LABELS[gate.type]}
        onDismiss={() => router.back()}
        right={
          <StatusPill tone={recorded ? "success" : "warning"} icon={recorded ? "ti-circle-check" : "ti-alert-circle"}>
            {recorded ? "Decided" : "Needs decision"}
          </StatusPill>
        }
      />

      {/* Patient context row → record */}
      <button
        onClick={() => router.push(`/patients/${patient.id}`)}
        className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 text-left active:bg-fill-control"
      >
        <Avatar name={`${patient.firstName} ${patient.lastName}`} size={32} />
        <div className="flex-1">
          <p className="text-title-card text-text-primary">
            {patient.firstName} {patient.lastName}
          </p>
          <p className="text-micro text-text-muted">
            Hemophilia {patient.hemophiliaType} · {patient.severity.toLowerCase()}
          </p>
        </div>
        <Icon name="ti-chevron-right" size={18} className="text-text-muted" />
      </button>

      <main className="flex-1 min-h-0 overflow-y-auto p-4">
        {/* For-reference card */}
        <SectionLabel className="mb-2">For reference</SectionLabel>
        <Card padding="0" className="mb-2">
          <div className="[&>*+*]:border-t [&>*+*]:border-border">
            <RefRow label="Product" value={prophyRx?.productName ?? "—"} />
            <RefRow
              label="Prescribed dose"
              value={
                prophyRx ? `${prophyRx.targetIu.toLocaleString()} IU · prophylaxis` : "—"
              }
            />
            <RefRow label="Factor" value={prophyRx?.factorType ?? "—"} />
            <RefRow
              label="Benefits"
              value={benefits?.status === "SATISFIED" ? "Verified" : "Pending"}
            />
          </div>
        </Card>
        <div className="mb-4.5">
          <NoticeInfo icon="ti-database-search">
            Reimbursement &amp; acquisition are checked in your adjudication system.
            v1 records the decision; v1.1 computes margin inline.
          </NoticeInfo>
        </div>

        {recorded ? (
          <RecordedState outcome={recorded.outcome} note={recorded.note} actingRole={ROLE_LABELS[actingRole]} />
        ) : (
          <>
            {/* Optional note */}
            <p className="mb-2 text-body-strong text-text-primary">
              Add a note <span className="text-text-muted">(optional)</span>
            </p>
            <FieldText
              multiline
              placeholder="Context for the record — reasoning, who you consulted…"
              value={note}
              onChange={setNote}
            />
            <div className="mb-4.5" />

            {/* Typed outcomes */}
            <SectionLabel className="mb-2">Record a decision</SectionLabel>
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                block
                icon="ti-circle-check"
                onClick={() => decide(isViability ? "viable" : "satisfied")}
              >
                {isViability ? "Mark viable" : "Mark satisfied"}
              </Button>
              <Button
                variant="secondary"
                block
                icon="ti-bulb"
                onClick={() => decide("suggest-alternatives")}
              >
                Suggest alternatives
              </Button>
              <Button
                variant="danger-outline"
                block
                icon="ti-arrow-right-circle"
                onClick={() => decide("not-viable-transfer-out")}
              >
                Not viable — transfer out
              </Button>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-micro text-text-muted">
              <Icon name="ti-shield-lock" size={13} />
              Recorded as {roleSummary(session.roles) || "staff"} · acting role{" "}
              {ROLE_LABELS[actingRole]}
              {!canAct && " · owner role differs (management override)"}
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function RefRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2.5">
      <span className="text-label text-text-muted">{label}</span>
      <span className="text-body-strong text-text-primary">{value}</span>
    </div>
  );
}

function RecordedState({
  outcome,
  note,
  actingRole,
}: {
  outcome: string;
  note?: string;
  actingRole: string;
}) {
  const positive = outcome === "viable" || outcome === "satisfied";
  const transfer = outcome.includes("transfer");
  return (
    <div
      className={cn(
        "rounded-card border p-4 text-center",
        positive ? "border-border bg-teal-light" : transfer ? "border-border-danger bg-red-light" : "border-border bg-amber-light",
      )}
    >
      <Icon
        name={positive ? "ti-circle-check" : transfer ? "ti-arrow-right-circle" : "ti-bulb"}
        size={26}
        className={cn("mb-1", positive ? "text-teal" : transfer ? "text-red" : "text-amber")}
      />
      <p className="text-title-card capitalize text-navy">
        {outcome.replace(/-/g, " ")}
      </p>
      {note && <p className="mt-1 text-body text-text-secondary">"{note}"</p>}
      <p className="mt-2 text-micro text-text-muted">
        Decision recorded · acting role {actingRole}
      </p>
    </div>
  );
}
