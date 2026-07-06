"use client";

import { useSession } from "@/lib/session";
import { BottomNav, Icon } from "@/components/ui";
import { PATIENT_NAV, STAFF_NAV } from "./nav-config";

/**
 * A named section that exists but has no content yet. Unlike the generic
 * coming-soon wall, this reads as the *start of its own section*: the real
 * screen header, then a calm in-section empty state — no roadmap/milestone
 * badge. Used for every nav-surfaced destination that isn't built yet, so no
 * navigation ever dead-ends on a generic wall.
 */
export function SectionStub({
  title,
  icon,
  blurb,
  activeKey,
}: {
  title: string;
  icon: string;
  blurb: string;
  /** which bottom-nav item to highlight (own key if primary, else "more") */
  activeKey: string;
}) {
  const { session } = useSession();
  const items = session.kind === "patient" ? PATIENT_NAV : STAFF_NAV;

  return (
    <div className="flex h-full flex-col xl:h-auto">
      <header className="border-b border-border bg-card px-4 pb-3 pt-4">
        <h1 className="text-display text-navy">{title}</h1>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-icon-tile">
          <Icon name={icon} size={26} className="text-navy-light" />
        </div>
        <p className="text-title-card text-navy">{title} is coming soon</p>
        <p className="max-w-[300px] text-body text-text-secondary">{blurb}</p>
      </main>
      <BottomNav items={items} activeKey={activeKey} />
    </div>
  );
}
