/**
 * TOUR ENTRY POINTS — data-driven intake-flow routing for the self-guided demo.
 *
 * Most fixture patients load to their dashboard when selected in the identity
 * switcher. A small set of "tour" fixtures instead drop the tester directly into
 * the intake flow at a specific step, so a context-free tester (patient, rep, or
 * pharmacist) can drive an onboarding on-ramp end-to-end without the rep-side
 * "Add new → open as patient" bridge.
 *
 * This is a lookup table keyed by patient id — NOT a column on the patient. The
 * Prisma `Patient` model is the production contract (§ types.ts); demo-only flow
 * routing does not belong there. The switcher reads this generically (any id in
 * the map is a tour entry), so adding/removing a tour patient is a data edit
 * here, never a special-case branch in switcher logic. Other patients are
 * unaffected — `getTourEntry` returns null and they load to their dashboard.
 */
import type { OnRamp } from "./draft";

export interface TourEntry {
  /** which on-ramp's step sequence to walk (see STEPS in IntakeFlow). */
  onRamp: OnRamp;
  /** the step the flow opens at, skipping everything before it. */
  entryStep: string;
}

export const TOUR_ENTRY_POINTS: Record<string, TourEntry> = {
  // Patient A — fresh, patient-led from the confirm-info start. Walks the full
  // patient sequence: confirm → otp → info → docs → hipaa → done.
  pat_tour_new: { onRamp: "patient_led", entryStep: "confirm" },
  // Patient B — rep-led handoff landing. The rep already entered the data, so
  // the patient-only scoped tail runs: confirm → otp → docs → hipaa → done
  // (the rep_led sequence entered at confirm has no patient intake-data step).
  pat_tour_docs: { onRamp: "rep_led", entryStep: "confirm" },
};

export function getTourEntry(patientId: string): TourEntry | null {
  return TOUR_ENTRY_POINTS[patientId] ?? null;
}
