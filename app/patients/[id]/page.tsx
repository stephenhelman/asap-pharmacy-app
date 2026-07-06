"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { TopBarNav } from "@/components/ui";
import { PatientRecordContent } from "@/components/screens/PatientRecordContent";

/** Full-page patient record — the ⤢ "open full profile" destination. */
export default function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  return (
    <div className="flex min-h-[100dvh] flex-col md:min-h-[844px]">
      <TopBarNav title="Patient record" onDismiss={() => router.push("/")} />
      <div className="flex-1 overflow-y-auto">
        <PatientRecordContent patientId={id} />
      </div>
    </div>
  );
}
