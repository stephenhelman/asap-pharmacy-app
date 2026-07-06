import type { NavItem } from "@/components/ui";

export const PATIENT_NAV: NavItem[] = [
  { key: "home", label: "Home", icon: "ti-home", activeIcon: "ti-home-filled", href: "/" },
  { key: "logs", label: "Logs", icon: "ti-notes", href: "/logs" },
  { key: "scan", label: "Scan", icon: "ti-scan", href: "/scan" },
  { key: "more", label: "More", icon: "ti-dots", href: "/more" },
];

export const STAFF_NAV: NavItem[] = [
  { key: "roster", label: "Roster", icon: "ti-users", href: "/" },
  { key: "queue", label: "Queue", icon: "ti-list-check", href: "/queue" },
  { key: "messages", label: "Messages", icon: "ti-messages", href: "/messages" },
  { key: "more", label: "More", icon: "ti-dots", href: "/more" },
];
