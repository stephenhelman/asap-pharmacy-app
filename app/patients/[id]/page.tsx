"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { TopBarNav } from "@/components/ui";
import { PatientRecordContent } from "@/components/screens/PatientRecordContent";

/**
 * Full-page patient record — the ⤢ "open full profile" destination.
 * When reached via a deep link (`?as=` present), there's no meaningful history,
 * so we present a Close affordance: try window.close() (works for the
 * script-opened tab) and fall back to the staff roster if the browser blocks it.
 */
export default function PatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ as?: string }>;
}) {
  const { id } = use(params);
  const { as } = use(searchParams);
  const router = useRouter();
  const deepLinked = !!as;

  function dismiss() {
    if (deepLinked) {
      window.close();
      // Blocked (e.g. a pasted URL in a manually-opened tab) → route to roster.
      window.setTimeout(() => router.replace("/"), 150);
    } else {
      router.push("/");
    }
  }

  return (
    <div className="flex h-full flex-col xl:h-auto lg:mx-auto lg:w-full lg:max-w-[680px]">
      <TopBarNav
        title="Patient record"
        mode={deepLinked ? "close" : "back"}
        onDismiss={dismiss}
      />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <PatientRecordContent patientId={id} />
      </div>
    </div>
  );
}
