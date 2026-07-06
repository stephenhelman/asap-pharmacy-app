"use client";

import { use } from "react";
import { OrderQuestionnaire } from "@/components/screens/OrderQuestionnaire";

export default function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  return <OrderQuestionnaire orderId={orderId} />;
}
