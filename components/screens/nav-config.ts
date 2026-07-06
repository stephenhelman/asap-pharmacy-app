import type { NavItem } from "@/components/ui";

/**
 * One nav source, rendered three ways: the mobile bottom bar (primary items +
 * a "More" tab), the mobile "More" menu (the `*_MORE_NAV` set), and the desktop
 * spine/sidebar (primary + more, unrolled). Keep the item sets here as the
 * single source of truth; the surfaces below compose from them.
 */

const moreTab: NavItem = { key: "more", label: "More", icon: "ti-dots", href: "/more" };

// ── Patient ─────────────────────────────────────────────────────────────────
// Bottom-bar primaries. Scan is intentionally NOT here — scanning a barcode
// deep-links into the relevant flow; the standalone Scan surface lives in More.
const PATIENT_PRIMARY: NavItem[] = [
  { key: "home", label: "Home", icon: "ti-home", activeIcon: "ti-home", href: "/" },
  { key: "logs", label: "Logs", icon: "ti-notes", href: "/logs" },
  { key: "deliveries", label: "Deliveries", icon: "ti-truck-delivery", href: "/deliveries" },
];

/** The "More" set — the mobile More menu AND the desktop spine unroll these. */
export const PATIENT_MORE_NAV: NavItem[] = [
  { key: "messages", label: "Messages", icon: "ti-messages", href: "/messages" },
  { key: "documents", label: "Documents", icon: "ti-files", href: "/documents" },
  { key: "scan", label: "Scan", icon: "ti-scan", href: "/scan" },
  { key: "profile", label: "Profile", icon: "ti-user-circle", href: "/profile" },
  { key: "help", label: "Help & support", icon: "ti-help-circle", href: "/help" },
];

export const PATIENT_NAV: NavItem[] = [...PATIENT_PRIMARY, moreTab];
export const PATIENT_SPINE_NAV: NavItem[] = [...PATIENT_PRIMARY, ...PATIENT_MORE_NAV];

// ── Staff ─────────────────────────────────────────────────────────────────
const STAFF_PRIMARY: NavItem[] = [
  { key: "roster", label: "Roster", icon: "ti-users", href: "/" },
  { key: "queue", label: "Queue", icon: "ti-list-check", href: "/queue" },
  { key: "messages", label: "Messages", icon: "ti-messages", href: "/messages" },
];

/** The "More" set for staff — mobile More menu AND desktop sidebar secondary.
 * Fulfillment was dropped: it's the Work queue's job, not a separate section. */
export const STAFF_MORE_NAV: NavItem[] = [
  { key: "reports", label: "Reports", icon: "ti-chart-bar", href: "/reports" },
  { key: "settings", label: "Settings", icon: "ti-settings", href: "/settings" },
];

export const STAFF_NAV: NavItem[] = [...STAFF_PRIMARY, moreTab];
export const STAFF_SPINE_NAV: NavItem[] = [...STAFF_PRIMARY, ...STAFF_MORE_NAV];
