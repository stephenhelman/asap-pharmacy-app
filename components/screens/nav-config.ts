import type { NavItem } from "@/components/ui";

export const PATIENT_NAV: NavItem[] = [
  { key: "home", label: "Home", icon: "ti-home", activeIcon: "ti-home", href: "/" },
  { key: "logs", label: "Logs", icon: "ti-notes", href: "/logs" },
  { key: "scan", label: "Scan", icon: "ti-scan", href: "/scan" },
  { key: "more", label: "More", icon: "ti-dots", href: "/more" },
];

/**
 * Desktop spine navigation — the FULL list, with "More" unrolled into real
 * entries. On mobile these collapse behind the "More" tab; on desktop there's
 * room to show everything (per the layout-maps desktop nav decision).
 */
export const PATIENT_SPINE_NAV: NavItem[] = [
  { key: "home", label: "Home", icon: "ti-home", href: "/" },
  { key: "logs", label: "Logs", icon: "ti-notes", href: "/logs" },
  { key: "deliveries", label: "Deliveries", icon: "ti-truck-delivery", href: "/deliveries" },
  { key: "messages", label: "Messages", icon: "ti-messages", href: "/messages" },
  { key: "documents", label: "Documents", icon: "ti-files", href: "/documents" },
  { key: "scan", label: "Scan", icon: "ti-scan", href: "/scan" },
  { key: "profile", label: "Profile", icon: "ti-user-circle", href: "/profile" },
  { key: "help", label: "Help & support", icon: "ti-help-circle", href: "/help" },
];

export const STAFF_NAV: NavItem[] = [
  { key: "roster", label: "Roster", icon: "ti-users", href: "/" },
  { key: "queue", label: "Queue", icon: "ti-list-check", href: "/queue" },
  { key: "messages", label: "Messages", icon: "ti-messages", href: "/messages" },
  { key: "more", label: "More", icon: "ti-dots", href: "/more" },
];
