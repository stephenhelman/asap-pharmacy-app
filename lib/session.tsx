"use client";

/**
 * SEAM 2 — identity.
 *
 * There is no auth in the prototype, so this context stands in for the session
 * that production (NextAuth) will provide. Components read `session` and render
 * data-driven from it; they NEVER know how it was set. In production, NextAuth
 * writes this same object shape and the login-as switcher is the only thing
 * that goes away.
 */
import { createContext, useContext, useMemo, useState } from "react";
import type { StaffRole } from "./types";
import { getStaff, getPatients } from "./dataProvider";

export interface Session {
  kind: "patient" | "staff";
  /** set when logged in as a patient; null for staff */
  patientId: string | null;
  roles: StaffRole[];
  user: { id: string; name: string };
  /** the full staff user when kind === "staff" */
  staffId: string | null;
}

interface SessionContextValue {
  session: Session;
  loginAsPatient: (patientId: string) => void;
  loginAsStaff: (userId: string) => void;
}

function patientSession(patientId: string): Session {
  const p = getPatients().find((x) => x.id === patientId);
  return {
    kind: "patient",
    patientId,
    roles: [],
    user: { id: patientId, name: p ? `${p.firstName} ${p.lastName}` : "Patient" },
    staffId: null,
  };
}

function staffSession(userId: string): Session {
  const u = getStaff().find((x) => x.id === userId)!;
  return {
    kind: "staff",
    patientId: null,
    roles: u.roles,
    user: { id: u.id, name: u.fullName },
    staffId: u.id,
  };
}

// Default landing: the hero patient (Marcos) — the richest first screen.
const DEFAULT_SESSION = patientSession("pat_marcos");

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(DEFAULT_SESSION);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      loginAsPatient: (id) => setSession(patientSession(id)),
      loginAsStaff: (id) => setSession(staffSession(id)),
    }),
    [session],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

// Role display helpers (switcher + chrome).
export const ROLE_LABELS: Record<StaffRole, string> = {
  REP: "Rep",
  NURSE: "Nurse",
  PHARMACIST: "Pharmacist",
  TECH: "Tech",
  SOCIAL_WORKER: "Social Worker",
  VERIFICATION: "Verification",
  MANAGEMENT: "Management",
};

export function roleSummary(roles: StaffRole[]): string {
  if (roles.length === 0) return "";
  if (roles.length === 1) return ROLE_LABELS[roles[0]];
  if (roles.length >= 4) return "Multi-Role";
  return roles.map((r) => ROLE_LABELS[r]).join(" · ");
}
