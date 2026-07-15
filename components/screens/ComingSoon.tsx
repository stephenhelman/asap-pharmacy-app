"use client";

import { useSession } from "@/lib/session";
import { BottomNav, Icon } from "@/components/ui";
import { PATIENT_NAV, STAFF_NAV } from "./nav-config";

/**
 * Graceful stub for surfaces slated for later milestones, so every nav item is
 * navigable now. Keeps the chrome (bottom nav) consistent with the identity.
 */
export function ComingSoon({
  title,
  icon,
  milestone,
  activeKey,
  note,
}: {
  title: string;
  icon: string;
  milestone: string;
  activeKey: string;
  note?: string;
}) {
  const { session } = useSession();
  const items = session.kind === "patient" ? PATIENT_NAV : STAFF_NAV;

  return (
    <div className="flex h-full flex-col xl:h-auto">
      <header className="border-b border-border bg-card px-4 pb-3 pt-4">
        <h1 className="text-display text-navy">{title}</h1>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-icon-tile">
          <Icon name={icon} size={30} className="text-navy-light" />
        </div>
        <p className="text-title-name text-navy">{title}</p>
        <p className="max-w-[280px] text-body text-text-secondary">
          {note ?? `${milestone} is coming soon.`}
        </p>
        <span className="rounded-pill bg-teal-light px-3 py-1 text-label-strong text-teal-dark">
          {milestone}
        </span>
      </main>
      <BottomNav items={items} activeKey={activeKey} />
    </div>
  );
}
