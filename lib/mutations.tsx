"use client";

/**
 * In-memory "electricity". Clicking Approve / Submit / Confirm / Log should DO
 * something — so these session-only overrides layer on top of the fixtures.
 * Nothing persists: a refresh resets to the fixtures' initial state. This is
 * the illusion of a backend, not a backend.
 */
import { createContext, useContext, useMemo, useState } from "react";

export interface LoggedInfusion {
  id: string;
  patientId: string;
  doseType: "PROPHYLAXIS" | "PRN";
  productName: string;
  targetIu: number;
  lotNumber: string | null;
  infusedAt: string;
  enteredViaScan: boolean;
  bleedId: string | null;
}

export interface LoggedBleed {
  id: string;
  patientId: string;
  site: string;
  cause: "SPONTANEOUS" | "INJURY" | "POST_ACTIVITY" | "OTHER" | null;
  tier: "MILD" | "MODERATE" | "SEVERE" | null;
  onsetAt: string;
  closedAt: string | null;
}

type ClinicalDecision = "approved" | "held";

export interface SentMessage {
  id: string;
  threadId: string;
  body: string;
  staffAuthorId: string;
  sentAt: string;
}

export interface AddedNote {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  tags: string[]; // StaffRole[]
  createdAt: string;
}

interface MutationState {
  submittedOrders: Record<string, string>; // orderId → signedByName
  confirmedDeliveries: Record<string, "scan" | "manual">;
  gateOutcomes: Record<string, { outcome: string; note?: string }>;
  clinicalDecisions: Record<string, { decision: ClinicalDecision; reason?: string }>;
  shippedOrders: Record<string, { trackingNumber: string }>;
  loggedInfusions: LoggedInfusion[];
  loggedBleeds: LoggedBleed[];
  closedBleeds: Record<string, string>; // bleedId → closedAt
  sentMessages: SentMessage[];
  addedNotes: AddedNote[];
  seenNotifications: Record<string, boolean>;
}

const EMPTY: MutationState = {
  submittedOrders: {},
  confirmedDeliveries: {},
  gateOutcomes: {},
  clinicalDecisions: {},
  shippedOrders: {},
  loggedInfusions: [],
  loggedBleeds: [],
  closedBleeds: {},
  sentMessages: [],
  addedNotes: [],
  seenNotifications: {},
};

interface MutationContextValue extends MutationState {
  submitOrder: (orderId: string, signedByName: string) => void;
  confirmDelivery: (orderId: string, method: "scan" | "manual") => void;
  recordGate: (gateId: string, outcome: string, note?: string) => void;
  decideClinical: (orderId: string, decision: ClinicalDecision, reason?: string) => void;
  shipOrder: (orderId: string, trackingNumber: string) => void;
  logInfusion: (i: LoggedInfusion) => void;
  logBleed: (b: LoggedBleed) => void;
  closeBleed: (bleedId: string, closedAt: string) => void;
  sendMessage: (m: SentMessage) => void;
  addNote: (n: AddedNote) => void;
  seeNotification: (id: string) => void;
  reset: () => void;
}

const MutationContext = createContext<MutationContextValue | null>(null);

export function MutationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MutationState>(EMPTY);

  const value = useMemo<MutationContextValue>(
    () => ({
      ...state,
      submitOrder: (orderId, signedByName) =>
        setState((s) => ({
          ...s,
          submittedOrders: { ...s.submittedOrders, [orderId]: signedByName },
        })),
      confirmDelivery: (orderId, method) =>
        setState((s) => ({
          ...s,
          confirmedDeliveries: { ...s.confirmedDeliveries, [orderId]: method },
        })),
      recordGate: (gateId, outcome, note) =>
        setState((s) => ({
          ...s,
          gateOutcomes: { ...s.gateOutcomes, [gateId]: { outcome, note } },
        })),
      decideClinical: (orderId, decision, reason) =>
        setState((s) => ({
          ...s,
          clinicalDecisions: {
            ...s.clinicalDecisions,
            [orderId]: { decision, reason },
          },
        })),
      shipOrder: (orderId, trackingNumber) =>
        setState((s) => ({
          ...s,
          shippedOrders: { ...s.shippedOrders, [orderId]: { trackingNumber } },
        })),
      logInfusion: (i) =>
        setState((s) => ({ ...s, loggedInfusions: [...s.loggedInfusions, i] })),
      logBleed: (b) =>
        setState((s) => ({ ...s, loggedBleeds: [...s.loggedBleeds, b] })),
      closeBleed: (bleedId, closedAt) =>
        setState((s) => ({
          ...s,
          closedBleeds: { ...s.closedBleeds, [bleedId]: closedAt },
        })),
      sendMessage: (m) =>
        setState((s) => ({ ...s, sentMessages: [...s.sentMessages, m] })),
      addNote: (n) =>
        setState((s) => ({ ...s, addedNotes: [...s.addedNotes, n] })),
      seeNotification: (id) =>
        setState((s) => ({
          ...s,
          seenNotifications: { ...s.seenNotifications, [id]: true },
        })),
      reset: () => setState(EMPTY),
    }),
    [state],
  );

  return (
    <MutationContext.Provider value={value}>
      {children}
    </MutationContext.Provider>
  );
}

export function useMutations(): MutationContextValue {
  const ctx = useContext(MutationContext);
  if (!ctx) throw new Error("useMutations must be used within MutationProvider");
  return ctx;
}
