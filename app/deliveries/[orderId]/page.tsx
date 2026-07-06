"use client";

import { use } from "react";
import { DeliveryConfirm } from "@/components/screens/DeliveryConfirm";

export default function DeliveryPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  return <DeliveryConfirm orderId={orderId} />;
}
