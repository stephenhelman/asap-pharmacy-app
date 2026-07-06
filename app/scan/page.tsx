"use client";

import { ComingSoon } from "@/components/screens/ComingSoon";

export default function ScanPage() {
  return (
    <ComingSoon
      title="Scan"
      icon="ti-scan"
      milestone="Milestone 2"
      activeKey="scan"
      note="Scan a vial to accelerate an infusion log or confirm a delivery ticket. The inline scan accelerator lives inside those flows too."
    />
  );
}
