"use client";

import { use } from "react";
import { TechPack } from "@/components/screens/TechPack";

export default function TechPackPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  return <TechPack orderId={orderId} />;
}
