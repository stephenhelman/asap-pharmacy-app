"use client";

import { useSession } from "@/lib/session";
import { DocumentsScreen } from "@/components/screens/DocumentsScreen";
import { ComingSoon } from "@/components/screens/ComingSoon";

export default function DocumentsPage() {
  const { session } = useSession();
  if (session.kind === "patient" && session.patientId)
    return <DocumentsScreen patientId={session.patientId} />;
  return (
    <ComingSoon
      title="Documents"
      icon="ti-files"
      milestone="Patient view"
      activeKey="documents"
      note="The patient-facing Documents screen renders when logged in as a patient."
    />
  );
}
