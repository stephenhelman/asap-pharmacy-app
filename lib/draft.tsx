"use client";

/**
 * DRAFT PATIENT — the transient, in-memory patient the intake flow builds up.
 *
 * The identity switcher (Seam 2) selects an EXISTING patient; intake needs a
 * brand-new one that doesn't exist yet. This context holds that half-built
 * patient as a schema-shaped `PatientRow` (+ its itemized document slots) that
 * each intake screen writes into. On "finish intake" the draft is committed to
 * the live fixtures db via `registerDraftPatient` and promoted to the active
 * session identity — from there the dashboard reads it exactly like any fixture
 * patient (same shape → zero special-casing).
 *
 * Nothing persists: a refresh re-evaluates the module and the draft evaporates,
 * consistent with lib/mutations. Switching identity mid-draft discards it.
 */
import { createContext, useContext, useMemo, useState } from "react";
import type {
  PatientRow,
  DocumentSlotRow,
  DocumentSlotType,
  DocumentSlotStatus,
} from "./types";
import {
  registerDraftPatient,
  isIntakeComplete,
  getPatients,
  getPatient,
  TODAY,
} from "./dataProvider";

export type OnRamp = "rep_led" | "patient_led";

export interface Draft {
  patient: PatientRow;
  docSlots: DocumentSlotRow[];
  onRamp: OnRamp;
  referringRepId: string | null;
  /** true once the patient has passed OTP (account "created") */
  accountCreated: boolean;
  /** step the flow opens at; null = the on-ramp's first step (normal intake). */
  entryStep: string | null;
}

// The three required + one optional doc slots seeded at intake (§5.1.1).
const SEED_SLOTS: {
  type: DocumentSlotType;
  required: boolean;
}[] = [
  { type: "GOV_ID", required: true },
  { type: "INSURANCE_CARD", required: true },
  { type: "RX_PHOTO", required: true },
  { type: "DIAGNOSIS_LETTER", required: false },
];

function isoNow(): string {
  // Real wall-clock is fine here (client mutation), but anchor to the story's
  // TODAY so timestamps read consistently with the rest of the demo.
  return new Date(TODAY.getTime()).toISOString();
}

function freshPatient(id: string): PatientRow {
  const now = isoNow();
  return {
    id,
    firstName: "",
    lastName: "",
    dob: "",
    phone: "",
    email: null,
    hemophiliaType: "A",
    severity: "MODERATE",
    lifecycle: "INTAKE",
    addressLine1: null,
    city: null,
    state: null,
    zip: null,
    isMinor: false,
    guardianName: null,
    guardianPhone: null,
    prescriberName: null,
    prescriberPractice: null,
    prescriberPhone: null,
    prescriberFax: null,
    prescriberNpi: null,
    nextOrderDueDate: null,
    leadTimeDays: null,
    // pre-consent safe state: DND on, nothing consented (§5.1.1)
    smsConsent: false,
    emailConsent: false,
    preferredChannel: "SMS",
    dndEnabled: true,
    hipaaConsentedAt: null,
    hipaaSignedBy: null,
    createdAt: now,
    updatedAt: now,
  };
}

function freshSlots(patientId: string): DocumentSlotRow[] {
  return SEED_SLOTS.map((s) => ({
    id: `dds_${patientId}_${s.type.toLowerCase()}`,
    patientId,
    type: s.type,
    required: s.required,
    status: "PENDING",
    fileRef: null,
    requestedDuringOnboarding: true,
    uploadedAt: null,
  }));
}

interface DraftContextValue {
  draft: Draft | null;
  startDraft: (onRamp: OnRamp, referringRepId: string | null) => string;
  /**
   * Seed a draft FROM an existing fixture patient (tour entry points, §5.1.1):
   * the switcher drops a tester into the intake flow scoped to that patient's
   * data and opens it at `entryStep`. Reuses the patient's own id so `commitDraft`
   * upserts over the fixture on finish (promotes to ONBOARDING like any intake).
   */
  startDraftFromExisting: (
    patientId: string,
    onRamp: OnRamp,
    entryStep: string,
  ) => void;
  updatePatient: (patch: Partial<PatientRow>) => void;
  setDocSlot: (
    type: DocumentSlotType,
    status: DocumentSlotStatus,
    fileRef?: string | null,
  ) => void;
  markAccountCreated: () => void;
  /** commit to the live db + return the id; caller promotes it to the session */
  commitDraft: () => string | null;
  discardDraft: () => void;
}

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<Draft | null>(null);

  const value = useMemo<DraftContextValue>(
    () => ({
      draft,
      startDraft: (onRamp, referringRepId) => {
        const id = `pat_draft_${Date.now()}`;
        setDraft({
          patient: freshPatient(id),
          docSlots: freshSlots(id),
          onRamp,
          referringRepId,
          accountCreated: false,
          entryStep: null,
        });
        return id;
      },
      startDraftFromExisting: (patientId, onRamp, entryStep) => {
        const row = getPatients().find((p) => p.id === patientId);
        if (!row) return;
        // Its persisted doc slots (all pending on the tour fixtures) become the
        // draft's slots; fall back to a fresh set if none were authored.
        const detail = getPatient(patientId);
        const docSlots =
          detail && detail.documentSlots.length > 0
            ? detail.documentSlots.map((s) => ({ ...s }))
            : freshSlots(patientId);
        const referringRepId =
          detail?.careTeam.find((c) => c.role === "REP")?.userId ?? null;
        setDraft({
          patient: { ...row },
          docSlots,
          onRamp,
          referringRepId,
          accountCreated: false,
          entryStep,
        });
      },
      updatePatient: (patch) =>
        setDraft((d) =>
          d
            ? { ...d, patient: { ...d.patient, ...patch, updatedAt: isoNow() } }
            : d,
        ),
      setDocSlot: (type, status, fileRef = null) =>
        setDraft((d) =>
          d
            ? {
                ...d,
                docSlots: d.docSlots.map((s) =>
                  s.type === type
                    ? {
                        ...s,
                        status,
                        fileRef: status === "UPLOADED" ? fileRef : null,
                        uploadedAt: status === "UPLOADED" ? isoNow() : null,
                      }
                    : s,
                ),
              }
            : d,
        ),
      markAccountCreated: () =>
        setDraft((d) => (d ? { ...d, accountCreated: true } : d)),
      commitDraft: () => {
        if (!draft) return null;
        // Intake complete (required docs + consent + info + HIPAA all done) moves
        // the new patient toward ONBOARDING; otherwise it lands in INTAKE with a
        // checklist. Reuse the same completeness rule the dashboard renders from.
        const complete = isIntakeComplete({
          ...draft.patient,
          documentSlots: draft.docSlots,
        });
        const patient: PatientRow = {
          ...draft.patient,
          lifecycle: complete ? "ONBOARDING" : "INTAKE",
        };
        registerDraftPatient({
          patient,
          docSlots: draft.docSlots,
          referringRepId: draft.referringRepId,
        });
        setDraft(null);
        return patient.id;
      },
      discardDraft: () => setDraft(null),
    }),
    [draft],
  );

  return (
    <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
  );
}

export function useDraft(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used within DraftProvider");
  return ctx;
}
