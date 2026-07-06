"use client";

import { useState } from "react";
import type { DocumentSlotRow, DocumentSlotType } from "@/lib/types";
import { uploadService } from "@/lib/services";
import { Icon, IconTile, StatusPill, cn } from "@/components/ui";

/**
 * The itemized document surface (§5.1.1). ONE component, two entry points:
 *  - `mode="intake"` — seeded, requested-but-unfilled slots the patient fills
 *    during intake (partial-able; upload flips the slot).
 *  - `mode="manage"` — the permanent Documents screen: each row gets
 *    view · update · download · delete.
 */

const DOC_META: Record<
  DocumentSlotType,
  { label: string; icon: string; note?: string }
> = {
  GOV_ID: { label: "Government ID", icon: "ti-id" },
  INSURANCE_CARD: { label: "Insurance card", icon: "ti-cards" },
  RX_PHOTO: {
    label: "Prescription photo",
    icon: "ti-prescription",
    note: "Reference only — the original is collected from your prescriber.",
  },
  DIAGNOSIS_LETTER: {
    label: "Diagnosis letter",
    icon: "ti-file-text",
    note: "Optional — helps us move faster if you have one.",
  },
};

export function DocumentSlots({
  slots,
  mode,
  onUpload,
  onDelete,
}: {
  slots: DocumentSlotRow[];
  mode: "intake" | "manage";
  /** returns the fake R2 ref for the uploaded slot */
  onUpload: (slot: DocumentSlotRow, fileRef: string) => void;
  onDelete?: (slot: DocumentSlotRow) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {slots.map((s) => (
        <SlotRow
          key={s.id}
          slot={s}
          mode={mode}
          onUpload={onUpload}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function SlotRow({
  slot,
  mode,
  onUpload,
  onDelete,
}: {
  slot: DocumentSlotRow;
  mode: "intake" | "manage";
  onUpload: (slot: DocumentSlotRow, fileRef: string) => void;
  onDelete?: (slot: DocumentSlotRow) => void;
}) {
  const meta = DOC_META[slot.type];
  const [busy, setBusy] = useState(false);
  const uploaded = slot.status === "UPLOADED";

  async function handleUpload() {
    setBusy(true);
    // Demo-fake: no real file picker needed — the service returns success.
    const res = await uploadService.put(null);
    setBusy(false);
    onUpload(slot, res.ref);
  }

  return (
    <div
      className={cn(
        "rounded-card border bg-card p-3.5 shadow-card",
        uploaded ? "border-border" : "border-dashed border-border-strong",
      )}
    >
      <div className="flex items-center gap-3">
        <IconTile
          name={meta.icon}
          tone={uploaded ? "teal" : "neutral"}
          iconSize={18}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-title-card text-text-primary">
              {meta.label}
            </p>
            {!slot.required && (
              <span className="text-micro text-text-muted">Optional</span>
            )}
          </div>
          {uploaded ? (
            <p className="flex items-center gap-1 text-micro text-teal-dark">
              <Icon name="ti-circle-check" size={13} /> Uploaded
            </p>
          ) : (
            <p className="text-micro text-text-muted">
              {slot.required ? "Required" : "Not required"} · not uploaded
            </p>
          )}
        </div>
        {uploaded ? (
          <StatusPill tone="success" icon="ti-check">
            Done
          </StatusPill>
        ) : (
          <button
            onClick={handleUpload}
            disabled={busy}
            className="inline-flex h-8 items-center gap-1 rounded-control bg-teal-light px-3 text-label-strong text-teal-dark transition-colors active:bg-teal-mid disabled:opacity-60"
          >
            <Icon name={busy ? "ti-loader-2" : "ti-upload"} size={15} />
            {busy ? "Uploading…" : "Upload"}
          </button>
        )}
      </div>

      {meta.note && (
        <p className="mt-2 pl-[46px] text-micro text-text-muted">{meta.note}</p>
      )}

      {mode === "manage" && uploaded && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 pl-[46px]">
          <DocAction icon="ti-eye" label="View" />
          <DocAction icon="ti-refresh" label="Update" onClick={handleUpload} />
          <DocAction icon="ti-download" label="Download" />
          <DocAction
            icon="ti-trash"
            label="Delete"
            danger
            onClick={() => onDelete?.(slot)}
          />
        </div>
      )}
    </div>
  );
}

function DocAction({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: string;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-control border px-2.5 py-1 text-label-strong transition-colors active:bg-fill-control",
        danger
          ? "border-[#F3C6C6] text-red"
          : "border-border-strong text-text-secondary",
      )}
    >
      <Icon name={icon} size={14} className={danger ? "text-red" : "text-teal"} />
      {label}
    </button>
  );
}
