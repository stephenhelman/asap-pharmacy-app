"use client";

import { useRef, useState } from "react";
import { getPatient, TODAY } from "@/lib/dataProvider";
import { useMutations } from "@/lib/mutations";
import type { DoseType, PrnTier, AssayComponentRow } from "@/lib/types";
import {
  Modal,
  Button,
  Icon,
  TogglePair,
  StepperInput,
  FieldInline,
  NotePrefill,
  cn,
} from "@/components/ui";

const nowDate = TODAY.toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

interface RowState {
  checked: boolean;
  qty: number;
}

/**
 * P5 · Infusion Entry (Spec B) — a dose is a RECIPE of assay-component vials,
 * not a fixed readout. Type toggle → resolves a Prescription → its AssayComponent
 * rows render as confirmable/adjustable line items (pre-checked to the recipe
 * default). Running IU total reconciles to the Rx target. Scan is only an
 * accelerator that fills the same fields. Manual is the default path.
 */
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
  const openBleeds = p.bleeds.filter((b) => !b.closedAt);

  const [type, setType] = useState<DoseType>(defaultType);
  const [tier, setTier] = useState<PrnTier>("MODERATE");
  const [scanned, setScanned] = useState(false);
  const [lot, setLot] = useState<string | null>(null);
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [bleedId, setBleedId] = useState<string | null>(openBleeds[0]?.id ?? "new");
  const [saved, setSaved] = useState(false);
  const seq = useRef(0);

  // Type (+ tier for PRN) resolves to a specific Prescription.
  const resolvedRx =
    type === "PROPHYLAXIS"
      ? p.prescriptions.find((rx) => rx.doseType === "PROPHYLAXIS")
      : p.prescriptions.find(
          (rx) => rx.doseType === "PRN" && rx.prnTier === tier,
        );

  const productName = resolvedRx?.productName ?? "Advate";
  const targetIu = resolvedRx?.targetIu ?? 0;

  // The recipe: the Rx's assay components, or a single synthesized vial if the
  // Rx defines no breakdown (so every dose still renders as a recipe).
  const recipe: AssayComponentRow[] = !resolvedRx
    ? []
    : resolvedRx.assayComponents.length
      ? resolvedRx.assayComponents
      : [
          {
            id: `${resolvedRx.id}-syn`,
            prescriptionId: resolvedRx.id,
            iu: resolvedRx.targetIu,
            quantity: 1,
          },
        ];

  // Per-component state keyed by id; absent key = the recipe default (checked,
  // default quantity) — so switching dose shows the new recipe's defaults with
  // no effect/reset needed.
  const rowFor = (c: AssayComponentRow): RowState =>
    rowState[c.id] ?? { checked: true, qty: c.quantity };
  const setRow = (c: AssayComponentRow, next: Partial<RowState>) =>
    setRowState((s) => ({ ...s, [c.id]: { ...rowFor(c), ...next } }));

  const runningIu = recipe.reduce(
    (sum, c) => sum + (rowFor(c).checked ? c.iu * rowFor(c).qty : 0),
    0,
  );
  const matchesTarget = runningIu === targetIu;

  function simulateScan() {
    // Scan accelerator: fills the whole recipe (checks each vial at its default
    // quantity) and captures the lot — the same fields manual entry would set.
    setScanned(true);
    setLot("27171JJ");
    setRowState((s) => {
      const next = { ...s };
      recipe.forEach((c) => (next[c.id] = { checked: true, qty: c.quantity }));
      return next;
    });
  }

  function save(addAnother: boolean) {
    logInfusion({
      id: `inf_new_${TODAY.getTime()}_${seq.current++}`,
      patientId,
      doseType: type,
      productName,
      targetIu: runningIu, // the actual dose assembled from the recipe
      lotNumber: lot,
      infusedAt: TODAY.toISOString(),
      enteredViaScan: scanned,
      bleedId: type === "PRN" && bleedId !== "new" ? bleedId : null,
    });
    if (addAnother) {
      setSaved(false);
      setScanned(false);
      setLot(null);
      setRowState({});
    } else {
      setSaved(true);
    }
  }

  if (saved) {
    return (
      <Modal title="Log infusion" onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-light">
            <Icon name="ti-circle-check" size={30} className="text-teal" />
          </div>
          <p className="text-h2 text-navy">Dose logged</p>
          <p className="max-w-[260px] text-body text-text-secondary">
            {productName} {runningIu.toLocaleString()} IU ·{" "}
            {type === "PROPHYLAXIS" ? "prophylaxis" : "on-demand"} · added to your
            log.
          </p>
          <Button variant="primary" block icon="ti-check" onClick={onClose}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  const canSave = runningIu > 0;

  return (
    <Modal
      title="Log infusion"
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            block
            icon="ti-circle-check"
            disabled={!canSave}
            onClick={() => save(false)}
          >
            Save infusion · {runningIu.toLocaleString()} IU
          </Button>
          <Button variant="secondary" block icon="ti-plus" onClick={() => save(true)}>
            Save &amp; add another
          </Button>
        </div>
      }
    >
      {/* 1 · Dose selector (type → resolves the prescription) */}
      <p className="mb-2 text-body-strong text-text-primary">Which dose?</p>
      <TogglePair
        options={[
          { key: "PROPHYLAXIS", label: "Prophylaxis", icon: "ti-calendar-check" },
          { key: "PRN", label: "On-demand", icon: "ti-first-aid-kit" },
        ]}
        value={type}
        onChange={(v) => setType(v as DoseType)}
      />
      {type === "PRN" && (
        <div className="mt-2">
          <p className="mb-1.5 text-micro text-text-muted">Severity tier</p>
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

      {/* 2 · Assay-component recipe (the dose build) + scan accelerator */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-body-strong text-text-primary">Vials in this dose</p>
        <Button variant="scan-inline" onClick={simulateScan}>
          Scan vial
        </Button>
      </div>
      <p className="mb-2.5 text-micro text-text-muted">
        {productName} · pre-filled to your recipe. Adjust if the actual vials
        differ, or scan to fill.
      </p>

      <div className="overflow-hidden rounded-card border border-border bg-card">
        <div className="[&>*+*]:border-t [&>*+*]:border-border">
          {recipe.map((c) => {
            const rs = rowFor(c);
            return (
              <div key={c.id} className="flex items-center gap-3 px-3.5 py-2.5">
                <button
                  onClick={() => setRow(c, { checked: !rs.checked })}
                  className="flex items-center gap-2.5 text-left"
                >
                  <Icon
                    name={rs.checked ? "ti-square-check" : "ti-square"}
                    size={20}
                    className={rs.checked ? "text-teal" : "text-border-strong"}
                  />
                  <div>
                    <p className="text-title-card text-text-primary">
                      {c.iu.toLocaleString()} IU vial
                    </p>
                    <p className="text-micro text-text-muted">
                      {rs.checked
                        ? `${(c.iu * rs.qty).toLocaleString()} IU`
                        : "not used"}
                    </p>
                  </div>
                </button>
                <div className="flex-1" />
                <StepperInput
                  value={rs.qty}
                  onChange={(q) => setRow(c, { qty: q, checked: q > 0 })}
                  min={0}
                  max={9}
                />
              </div>
            );
          })}
        </div>
        {/* running total */}
        <div
          className={cn(
            "flex items-center justify-between border-t px-3.5 py-2.5",
            matchesTarget
              ? "border-border bg-teal-light"
              : "border-amber-light bg-amber-light",
          )}
        >
          <span className="text-label-strong text-text-secondary">Dose total</span>
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "text-title-card",
                matchesTarget ? "text-teal-dark" : "text-amber",
              )}
            >
              {runningIu.toLocaleString()} IU
            </span>
            <span className="text-micro text-text-muted">
              target {targetIu.toLocaleString()}
            </span>
            <Icon
              name={matchesTarget ? "ti-circle-check" : "ti-alert-circle"}
              size={16}
              className={matchesTarget ? "text-teal" : "text-amber"}
            />
          </span>
        </div>
      </div>
      {scanned && (
        <div className="mt-1.5">
          <NotePrefill>Scanned · vials, lot &amp; dose filled from the label</NotePrefill>
        </div>
      )}
      <div className="mb-4.5" />

      {/* 3 · Lot / expiration */}
      <p className="mb-2 text-body-strong text-text-primary">
        Lot <span className="text-text-muted">(optional)</span>
      </p>
      <FieldInline icon="ti-barcode">
        {lot ? (
          <span className="text-text-primary">{lot}</span>
        ) : (
          <span className="text-text-muted">Scan a vial or leave blank</span>
        )}
      </FieldInline>
      <div className="mb-4.5" />

      {/* 4 · PRN → link to bleed */}
      {type === "PRN" && (
        <>
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

      {/* 5 · When */}
      <p className="mb-2 text-body-strong text-text-primary">When</p>
      <div className="grid grid-cols-2 gap-2.5">
        <FieldInline icon="ti-calendar">{nowDate}</FieldInline>
        <FieldInline icon="ti-clock">8:15 AM</FieldInline>
      </div>
      <p className="mb-4.5 mt-1.5 text-micro text-text-muted">
        Defaults to now. You can back-date it.
      </p>
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
        name={icon ?? "ti-droplet"}
        size={18}
        className={selected ? "text-navy" : "text-red"}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-title-card text-text-primary">{label}</p>
        <p className="truncate text-micro text-text-muted">{sub}</p>
      </div>
      <Icon
        name={selected ? "ti-circle-check" : "ti-circle"}
        size={18}
        className={selected ? "text-teal" : "text-border-strong"}
      />
    </button>
  );
}
