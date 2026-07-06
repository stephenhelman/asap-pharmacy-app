"use client";

import { useSession } from "@/lib/session";
import { PatientDashboard } from "@/components/screens/PatientDashboard";
import { StaffRoster } from "@/components/screens/StaffRoster";

/**
 * Home. One route, rendered data-driven from `session` — the portal-collapse
 * model. Patient identity → their dashboard; staff identity → the roster.
 */
export default function Home() {
  const { session } = useSession();
  if (session.kind === "patient" && session.patientId)
    return <PatientDashboard patientId={session.patientId} />;
  return <StaffRoster />;
}
