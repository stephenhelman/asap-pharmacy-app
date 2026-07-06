"use client";

import { ComingSoon } from "@/components/screens/ComingSoon";

export default function DeliveriesIndexPage() {
  return (
    <ComingSoon
      title="Deliveries"
      icon="ti-truck-delivery"
      milestone="Milestone 2+"
      activeKey="deliveries"
      note="All your deliveries in one place. Open a specific delivery from your dashboard tracker to confirm receipt."
    />
  );
}
