"use client";

import { ComingSoon } from "@/components/screens/ComingSoon";

export default function MorePage() {
  return (
    <ComingSoon
      title="More"
      icon="ti-dots"
      milestone="Milestone 3"
      activeKey="more"
      note="Profile, settings, authorized users, documents. Nav becomes role/patient-configurable here."
    />
  );
}
