"use client";

import { SectionStub } from "@/components/screens/SectionStub";

export default function ScanPage() {
  return (
    <SectionStub
      title="Scan"
      icon="ti-scan"
      activeKey="more"
      blurb="Scan a vial or delivery barcode to jump straight to the right log or receipt. For now, scanning lives inside the infusion and delivery flows."
    />
  );
}
