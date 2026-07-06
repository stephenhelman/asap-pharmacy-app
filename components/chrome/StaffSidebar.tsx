"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, roleSummary } from "@/lib/session";
import { Avatar, Icon, cn } from "@/components/ui";

interface Item {
  key: string;
  label: string;
  icon: string;
  activeIcon?: string;
  href: string;
  match: (path: string) => boolean;
}

// "More" unrolled into full nav items (GHL-style), per the responsive brief.
const PRIMARY: Item[] = [
  { key: "roster", label: "Roster", icon: "ti-users", href: "/", match: (p) => p === "/" },
  { key: "queue", label: "Work queue", icon: "ti-list-check", href: "/queue", match: (p) => p.startsWith("/queue") },
  { key: "messages", label: "Messages", icon: "ti-messages", href: "/messages", match: (p) => p.startsWith("/messages") },
];
const SECONDARY: Item[] = [
  { key: "reports", label: "Reports", icon: "ti-chart-bar", href: "/more", match: () => false },
  { key: "fulfillment", label: "Fulfillment", icon: "ti-package", href: "/queue", match: () => false },
  { key: "settings", label: "Settings", icon: "ti-settings", href: "/more", match: (p) => p.startsWith("/more") },
];

/** Desktop-only navy collapsible sidebar (icons+labels → icons). Replaces the
 *  bottom nav at ≥lg; the record still opens as the slide-in pane over the table. */
export function StaffSidebar({ className }: { className?: string }) {
  const { session } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-dvh shrink-0 flex-col bg-navy-dark text-white transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-[224px]",
        className,
      )}
    >
      {/* brand */}
      <div className={cn("flex h-16 items-center gap-2.5 px-4", collapsed && "justify-center px-0")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal text-white">
          <Icon name="ti-cross" size={18} />
        </div>
        {!collapsed && <span className="text-title-card font-semibold tracking-tight">ASAP</span>}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {PRIMARY.map((it) => (
          <NavLink key={it.key} it={it} active={it.match(pathname)} collapsed={collapsed} />
        ))}
        <div className={cn("my-2 border-t border-white/10", collapsed ? "mx-2" : "mx-1")} />
        {!collapsed && (
          <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            More
          </p>
        )}
        {SECONDARY.map((it) => (
          <NavLink key={it.key} it={it} active={it.match(pathname)} collapsed={collapsed} />
        ))}
      </nav>

      {/* identity + collapse */}
      <div className="border-t border-white/10 p-3">
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          <Avatar name={session.user.name} size={30} tone="teal" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-label-strong">{session.user.name}</p>
              <p className="truncate text-[10px] text-teal-mid">{roleSummary(session.roles) || "Staff"}</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-control text-white/60 transition-colors hover:bg-white/10",
          )}
        >
          <Icon name={collapsed ? "ti-chevron-right" : "ti-chevron-left"} size={16} />
          {!collapsed && <span className="text-micro">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function NavLink({
  it,
  active,
  collapsed,
}: {
  it: Item;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={it.href}
      title={collapsed ? it.label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-control px-3 py-2.5 text-body-strong transition-colors",
        collapsed && "justify-center px-0",
        active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white",
      )}
    >
      <Icon name={active ? (it.activeIcon ?? it.icon) : it.icon} size={20} className={active ? "text-teal-mid" : ""} />
      {!collapsed && <span>{it.label}</span>}
    </Link>
  );
}
