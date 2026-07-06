"use client";

import { use } from "react";
import { GateAction } from "@/components/screens/GateAction";

export default function GatePage({
  params,
}: {
  params: Promise<{ gateId: string }>;
}) {
  const { gateId } = use(params);
  return <GateAction gateId={gateId} />;
}
