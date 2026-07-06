"use client";

import { useSession } from "@/lib/session";
import { PatientCommsHub } from "@/components/screens/PatientCommsHub";
import { StaffCommsHub } from "@/components/screens/StaffCommsHub";

export default function MessagesPage() {
  const { session } = useSession();
  if (session.kind === "patient" && session.patientId)
    return <PatientCommsHub patientId={session.patientId} />;
  return <StaffCommsHub />;
}
