"use client";

import { useSession } from "@/lib/session";
import { BottomNav, RowCard, NavRow } from "@/components/ui";
import {
  PATIENT_NAV,
  STAFF_NAV,
  PATIENT_MORE_NAV,
  STAFF_MORE_NAV,
} from "./nav-config";

/**
 * Mobile "More" is a menu, never a dead end. It lists the same items the
 * desktop spine/sidebar unrolls (single source of truth in nav-config), each
 * navigating to its own section. Renders per portal from the session.
 */
export function MoreMenu() {
  const { session } = useSession();
  const isPatient = session.kind === "patient";
  const items = isPatient ? PATIENT_MORE_NAV : STAFF_MORE_NAV;
  const navItems = isPatient ? PATIENT_NAV : STAFF_NAV;

  return (
    <div className="flex h-full flex-col xl:h-auto">
      <header className="border-b border-border bg-card px-4 pb-3 pt-4">
        <h1 className="text-display text-navy">More</h1>
      </header>
      <main className="flex-1 min-h-0 overflow-y-auto p-4">
        <RowCard>
          {items.map((it) => (
            <NavRow key={it.key} icon={it.icon} title={it.label} href={it.href} />
          ))}
        </RowCard>
      </main>
      <BottomNav items={navItems} activeKey="more" />
    </div>
  );
}
