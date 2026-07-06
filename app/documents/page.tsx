"use client";

import { ComingSoon } from "@/components/screens/ComingSoon";

export default function DocumentsPage() {
  return (
    <ComingSoon
      title="Documents"
      icon="ti-files"
      milestone="Milestone 3+"
      activeKey="documents"
      note="Prescriptions, insurance letters, and shared forms. Upload plumbing is intentionally stubbed in the prototype."
    />
  );
}
