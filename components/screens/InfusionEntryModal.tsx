"use client";

import { useMemo, useState } from "react";
import { getPatient, TODAY } from "@/lib/dataProvider";
import { useMutations } from "@/lib/mutations";
import type { DoseType, PrnTier } from "@/lib/types";
import {
  Modal,
  Button,
  Icon,
  Card,
  TogglePair,
  FieldInline,
  NotePrefill,
  NoticeCareteam,
  cn,
} from "@/components/ui";

const nowDate = TODAY.toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** P5 · Infusion Entry — manual-default dose + inline scan; PRN links to a bleed. */
export function InfusionEntryModal({
  patientId,
  defaultType = "PROPHYLAXIS",
  onClose,
}: {
  patientId: string;
  defaultType?: DoseType;
  onClose: () => void;
}) {
  const p = getPatient(patientId)!;
  const { logInfusion } = useMutations();

  const prophyRx = p.prescriptions.find((rx) => rx.doseType === "PROPHYLAXIS");
  const prnByTier = useMemo(() => {
    const m: Partial<Record<PrnTier, number>> = {};
    p.prescriptions
      .filter((rx) => rx.doseType === "PRN" && rx.prnTier)
      .forEach((rx) => (m[rx.prnTier!] = rx.targetIu));
    return m;
  }, [p]);

  const productName = prophyRx?.productName ?? "Advate";
  const openBleeds = p.bleeds.filter((b) => !b.closedAt);

  const [type, setType] = useState<DoseType>(defaultType);
  const [tier, setTier] = useState<PrnTier>("MODERATE");
  const [scanned, setScanned] = useState(false);
  const [lot, setLot] = useState<string | null>(null);
  const [bleedId, setBleedId] = useState<string | null>(
    openBleeds[0]?.id ?? "new",
  );
  const [saved, setSaved] = useState(false);

  const targetIu =
    type === "PROPHYLAXIS"
      ? (prophyRx?.targetIu ?? 3000)
      : (prnByTier[tier] ?? 3000);

  function save(addAnother: boolean) {
    logInfusion({
      id: `inf_new_${Math.round(TODAY.getTime())}_${Math.random().toString(36).slice(2, 7)}`,
      patientId,
      doseType: type,
      productName,
      targetIu,
      lotNumber: lot,
      infusedAt: TODAY.toISOString(),
      enteredViaScan: scanned,
      bleedId: type === "PRN" && bleedId !== "new" ? bleedId : null,
    });
    if (addAnother) {
      setSaved(false);
      setScanned(false);
      setLot(null);
    } else {
      setSaved(true);
    }
  }

  function simulateScan() {
    setScanned(true);
    setLot("27171JJ");
  }

  if (saved) {
    return (
      <Modal title="Log infusion" onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-light">
            <Icon name="ti-circle-check-filled" size={30} className="text-teal" />
          </div>
          <p className="text-h2 text-navy">Dose logged</p>
          <p className="max-w-[260px] text-body text-text-secondary">
            {productName} {targetIu.toLocaleString()} IU ·{" "}
            {type === "PROPHYLAXIS" ? "prophylaxis" : "on-demand"} · added to your
            ledger.
          </p>
          <Button variant="primary" block icon="ti-check" onClick={onClose}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Log infusion"
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2">
          <Button variant="primary" block icon="ti-circle-check" onClick={() => save(false)}>
            Save infusion
          </Button>
          <Button variant="secondary" block icon="ti-plus" onClick={() => save(true)}>
            Save &amp; add another
          </Button>
        </div>
      }
    >
      {/* Dose + scan accelerator */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-body-strong text-text-primary">Which dose?</p>
        <Button variant="scan-inline" onClick={simulateScan}>
          Scan vial
        </Button>
      </div>
      <p className="mb-2.5 text-micro text-text-muted">
        Manual by default — or scan the vial to auto-fill lot &amp; dose.
      </p>

      <Card selected padding="14" className="mb-2">
        <div className="flex items-center gap-3">
          <Icon name="ti-vaccine" size={20} className="text-teal" />
          <div className="flex-1">
            <p className="text-title-card text-navy">
              {productName} {targetIu.toLocaleString()} IU
            </p>
            <p className="text-micro text-text-muted">
              {type === "PROPHYLAXIS" ? "Prophylaxis dose" : `PRN · ${tier.toLowerCase()}`}
              {lot ? ` · lot ${lot}` : ""}
            </p>
          </div>
          <Icon name="ti-circle-check-filled" size={20} className="text-teal" />
        </div>
      </Card>
      {scanned && (
        <div className="mb-4.5">
          <NotePrefill>Scanned — lot &amp; dose filled from the vial label</NotePrefill>
        </div>
      )}
      {!scanned && <div className="mb-4.5" />}

      {/* Type */}
      <p className="mb-2 text-body-strong text-text-primary">Type</p>
      <TogglePair
        options={[
          { key: "PROPHYLAXIS", label: "Prophylaxis", icon: "ti-calendar-check" },
          { key: "PRN", label: "On-demand", icon: "ti-first-aid-kit" },
        ]}
        value={type}
        onChange={(v) => setType(v as DoseType)}
      />
      <div className="mb-4.5" />

      {/* PRN → tier + link-to-bleed */}
      {type === "PRN" && (
        <>
          <p className="mb-2 text-body-strong text-text-primary">Severity tier</p>
          <TogglePair
            options={[
              { key: "MILD", label: "Mild" },
              { key: "MODERATE", label: "Moderate" },
              { key: "SEVERE", label: "Severe" },
            ]}
            value={tier}
            onChange={(v) => setTier(v as PrnTier)}
          />
          <div className="mb-4.5" />

          <p className="mb-2 text-body-strong text-text-primary">Link to a bleed</p>
          <div className="flex flex-col gap-1.5">
            {openBleeds.map((b) => (
              <LinkOption
                key={b.id}
                label={b.site}
                sub={`open · onset ${new Date(b.onsetAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`}
                selected={bleedId === b.id}
                onClick={() => setBleedId(b.id)}
              />
            ))}
            <LinkOption
              label="Log for a new bleed"
              sub="We'll create the bleed entry too"
              icon="ti-plus"
              selected={bleedId === "new"}
              onClick={() => setBleedId("new")}
            />
          </div>
          <div className="mb-4.5" />
        </>
      )}

      {/* When */}
      <p className="mb-2 text-body-strong text-text-primary">When</p>
      <div className="grid grid-cols-2 gap-2.5">
        <FieldInline icon="ti-calendar">{nowDate}</FieldInline>
        <FieldInline icon="ti-clock">8:15 AM</FieldInline>
      </div>
      <p className="mb-4.5 mt-1.5 text-micro text-text-muted">
        Defaults to now — retroactive entries are allowed.
      </p>

      <NoticeCareteam>
        Your care team sees every logged dose. Log honestly — it protects you.
      </NoticeCareteam>
    </Modal>
  );
}

function LinkOption({
  label,
  sub,
  icon,
  selected,
  onClick,
}: {
  label: string;
  sub: string;
  icon?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-card border bg-card px-3.5 py-3 text-left transition-colors",
        selected ? "border-[1.5px] border-navy" : "border-border",
      )}
    >
      <Icon
        name={icon ?? "ti-droplet-filled"}
        size={18}
        className={selected ? "text-navy" : "text-red"}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-title-card text-text-primary">{label}</p>
        <p className="truncate text-micro text-text-muted">{sub}</p>
      </div>
      <Icon
        name={selected ? "ti-circle-check-filled" : "ti-circle"}
        size={18}
        className={selected ? "text-teal" : "text-border-strong"}
      />
    </button>
  );
}
