"use client";

import { ComingSoon } from "@/components/screens/ComingSoon";

export default function ProfilePage() {
  return (
    <ComingSoon
      title="Profile"
      icon="ti-user-circle"
      milestone="Milestone 3+"
      activeKey="profile"
      note="Your details, authorized users, and preferences."
    />
  );
}
