"use client";

import { use } from "react";
import { ClinicalCheck } from "@/components/screens/ClinicalCheck";

export default function ClinicalCheckPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  return <ClinicalCheck orderId={orderId} />;
}
