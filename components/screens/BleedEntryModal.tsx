"use client";

import { useState } from "react";
import { getPatient, TODAY } from "@/lib/dataProvider";
import { useMutations } from "@/lib/mutations";
import type { BleedCause, PrnTier } from "@/lib/types";
import {
  Modal,
  Button,
  Icon,
  Card,
  FieldSelect,
  FieldInline,
  TogglePair,
  NoticeCareteam,
  cn,
} from "@/components/ui";

const nowDate = TODAY.toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const JOINTS = [
  { key: "ankle", label: "Ankle", cx: 42, cy: 250 },
  { key: "knee", label: "Knee", cx: 42, cy: 200 },
  { key: "elbow", label: "Elbow", cx: 20, cy: 150 },
  { key: "wrist", label: "Wrist", cx: 14, cy: 185 },
  { key: "shoulder", label: "Shoulder", cx: 32, cy: 92 },
];

const CAUSES: { key: BleedCause; label: string }[] = [
  { key: "SPONTANEOUS", label: "Spontaneous" },
  { key: "INJURY", label: "Injury" },
  { key: "POST_ACTIVITY", label: "Post-activity" },
  { key: "OTHER", label: "Other" },
];

/** P6 · Bleed Entry — site picker, cause/when, linked PRN treatment. */
export function BleedEntryModal({
  patientId,
  onClose,
}: {
  patientId: string;
  onClose: () => void;
}) {
  const p = getPatient(patientId)!;
  const { logBleed, logInfusion } = useMutations();
  const prnRx = p.prescriptions.find((rx) => rx.doseType === "PRN");
  const productName = prnRx?.productName ?? "Advate";

  const [side, setSide] = useState<"Left" | "Right">("Right");
  const [joint, setJoint] = useState<string>("ankle");
  const [cause, setCause] = useState<BleedCause>("SPONTANEOUS");
  const [tier, setTier] = useState<PrnTier>("MODERATE");
  const [alsoLogDose, setAlsoLogDose] = useState(true);
  const [showCause, setShowCause] = useState(false);
  const [saved, setSaved] = useState(false);

  const site = `${side} ${JOINTS.find((j) => j.key === joint)?.label.toLowerCase()}`;
  const prnIu =
    p.prescriptions.find((rx) => rx.doseType === "PRN" && rx.prnTier === tier)
      ?.targetIu ?? 3000;

  function save() {
    const bleedId = `bleed_new_${Math.round(TODAY.getTime())}`;
    logBleed({
      id: bleedId,
      patientId,
      site: site.charAt(0).toUpperCase() + site.slice(1),
      cause,
      tier,
      onsetAt: TODAY.toISOString(),
      closedAt: null,
    });
    if (alsoLogDose) {
      logInfusion({
        id: `inf_${bleedId}`,
        patientId,
        doseType: "PRN",
        productName,
        targetIu: prnIu,
        lotNumber: null,
        infusedAt: TODAY.toISOString(),
        enteredViaScan: false,
        bleedId,
      });
    }
    setSaved(true);
  }

  if (saved)
    return (
      <Modal title="Log a bleed" onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-light">
            <Icon name="ti-circle-check" size={30} className="text-teal" />
          </div>
          <p className="text-h2 text-navy">Bleed logged</p>
          <p className="max-w-[260px] text-body text-text-secondary">
            {site.charAt(0).toUpperCase() + site.slice(1)} ·{" "}
            {tier.toLowerCase()}
            {alsoLogDose ? ` · 1 PRN dose linked` : ""}. Your care team is notified.
          </p>
          <Button variant="primary" block icon="ti-check" onClick={onClose}>
            Done
          </Button>
        </div>
      </Modal>
    );

  return (
    <Modal
      title="Log a bleed"
      onClose={onClose}
      footer={
        <Button variant="primary" block icon="ti-circle-check" onClick={save}>
          Save bleed{alsoLogDose ? " + dose" : ""}
        </Button>
      }
    >
      {/* Site picker */}
      <p className="mb-2 text-body-strong text-text-primary">Where is the bleed?</p>
      <div className="mb-2.5 flex gap-3">
        <BodyMap selected={joint} onSelect={setJoint} />
        <div className="flex flex-1 flex-col gap-1.5">
          <TogglePair
            options={[
              { key: "Left", label: "Left" },
              { key: "Right", label: "Right" },
            ]}
            value={side}
            onChange={(v) => setSide(v as "Left" | "Right")}
          />
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            {JOINTS.map((j) => (
              <button
                key={j.key}
                onClick={() => setJoint(j.key)}
                className={cn(
                  "rounded-control border px-2 py-2 text-label transition-colors",
                  joint === j.key
                    ? "border-[1.5px] border-navy bg-icon-tile text-navy"
                    : "border-border-strong bg-card text-text-secondary",
                )}
              >
                {j.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="mb-4.5 text-micro text-text-muted">
        Selected: <span className="text-text-primary">{site}</span>
      </p>

      {/* Cause + when */}
      <div className="mb-4.5 grid grid-cols-2 gap-2.5">
        <div>
          <p className="mb-2 text-body-strong text-text-primary">Cause</p>
          <FieldSelect
            icon="ti-help-circle"
            value={CAUSES.find((c) => c.key === cause)?.label}
            onClick={() => setShowCause((s) => !s)}
          />
          {showCause && (
            <div className="mt-1.5 overflow-hidden rounded-control border border-border bg-card">
              {CAUSES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    setCause(c.key);
                    setShowCause(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-body text-text-primary active:bg-fill-control"
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="mb-2 text-body-strong text-text-primary">When</p>
          <FieldInline icon="ti-calendar">{nowDate}</FieldInline>
        </div>
      </div>

      {/* Linked PRN treatment */}
      <p className="mb-2 text-body-strong text-text-primary">Treatment</p>
      <Card padding="14" className="mb-2">
        <button
          onClick={() => setAlsoLogDose((s) => !s)}
          className="flex w-full items-center gap-3 text-left"
        >
          <Icon
            name={alsoLogDose ? "ti-square-check" : "ti-square"}
            size={20}
            className={alsoLogDose ? "text-teal" : "text-border-strong"}
          />
          <div className="flex-1">
            <p className="text-title-card text-text-primary">
              Also log a PRN dose for this bleed
            </p>
            <p className="text-micro text-text-muted">
              {productName} {prnIu.toLocaleString()} IU · linked to this bleed
            </p>
          </div>
        </button>
      </Card>
      {alsoLogDose && (
        <div className="mb-2">
          <p className="mb-1.5 text-micro text-text-muted">Dose severity tier</p>
          <TogglePair
            options={[
              { key: "MILD", label: "Mild" },
              { key: "MODERATE", label: "Moderate" },
              { key: "SEVERE", label: "Severe" },
            ]}
            value={tier}
            onChange={(v) => setTier(v as PrnTier)}
          />
        </div>
      )}
      <div className="mb-4.5" />

      <NoticeCareteam>
        A logged bleed alerts your nurse and rep.
      </NoticeCareteam>
    </Modal>
  );
}

function BodyMap({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (k: string) => void;
}) {
  return (
    <svg
      viewBox="0 0 84 300"
      className="h-[220px] w-[70px] shrink-0 rounded-card border border-border bg-page"
    >
      {/* Simple mirrored silhouette. SVG attributes can't take utility classes,
          so these literals mirror design tokens: #EDF2F7 fill-control,
          #CBD5E0 border-strong, #C53030 red, #64748B text-muted, #fff card. */}
      <g fill="#EDF2F7" stroke="#CBD5E0" strokeWidth="1">
        <circle cx="42" cy="26" r="13" />
        <rect x="27" y="42" width="30" height="60" rx="12" />
        {/* arms */}
        <rect x="12" y="46" width="12" height="80" rx="6" />
        <rect x="60" y="46" width="12" height="80" rx="6" />
        {/* legs */}
        <rect x="30" y="100" width="11" height="150" rx="6" />
        <rect x="43" y="100" width="11" height="150" rx="6" />
      </g>
      {JOINTS.map((j) => {
        const on = selected === j.key;
        return (
          <circle
            key={j.key}
            cx={j.cx}
            cy={j.cy}
            r={on ? 7 : 5}
            className="cursor-pointer"
            fill={on ? "#C53030" : "#64748B"}
            stroke="#fff"
            strokeWidth="1.5"
            onClick={() => onSelect(j.key)}
          />
        );
      })}
    </svg>
  );
}
