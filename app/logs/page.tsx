"use client";

import { Suspense } from "react";
import { LogsScreen } from "@/components/screens/LogsScreen";

export default function LogsPage() {
  return (
    <Suspense fallback={null}>
      <LogsScreen />
    </Suspense>
  );
}
