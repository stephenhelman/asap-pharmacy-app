"use client";

import { Suspense } from "react";
import { useSession } from "@/lib/session";
import { PatientCommsHub } from "@/components/screens/PatientCommsHub";
import { StaffCommsHub } from "@/components/screens/StaffCommsHub";

export default function MessagesPage() {
  const { session } = useSession();
  if (session.kind === "patient" && session.patientId)
    return <PatientCommsHub patientId={session.patientId} />;
  // StaffCommsHub reads ?patient/?note via useSearchParams → needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <StaffCommsHub />
    </Suspense>
  );
}
