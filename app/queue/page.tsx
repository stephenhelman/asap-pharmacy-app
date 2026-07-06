"use client";

import { useSession } from "@/lib/session";
import { WorkQueue } from "@/components/screens/WorkQueue";
import { PatientDashboard } from "@/components/screens/PatientDashboard";

export default function QueuePage() {
  const { session } = useSession();
  // Guard: a patient identity has no queue — show their dashboard instead.
  if (session.kind === "patient" && session.patientId)
    return <PatientDashboard patientId={session.patientId} />;
  return <WorkQueue />;
}
