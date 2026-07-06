"use client";

import { useSession } from "@/lib/session";
import { LoginSwitcher } from "./LoginSwitcher";
import { PatientContactWidget } from "./PatientContactWidget";
import { StaffSidebar } from "./chrome/StaffSidebar";
import { PatientBrandBar, PatientSpine } from "./chrome/PatientDesktop";

/**
 * Responsive app-shell + tablet ladder.
 *
 *  - **mobile / tablet (< xl):** a fixed-height (`100dvh`) app-shell — the screen
 *    inside is a flex column (fixed header · scrollable `main` · fixed nav); only
 *    the middle scrolls, the chrome never moves. Width grows by tier:
 *      · < md  full-bleed
 *      · md–lg ~680px roomy single column (portrait tablet)
 *      · lg–xl ~960px, browsing surfaces go 2-up (landscape tablet)
 *    Still bottom-nav, single structure, NO sidebar/spine/matrix/pane.
 *  - **desktop (xl = 1280px+):** the destinies — staff reflow-and-expand (sidebar
 *    + matrix + slide-in pane) and patient center-and-breathe (brand bar + column
 *    + spine), body-scrolled as before.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { session } = useSession();

  return (
    <div className="h-[100dvh] overflow-hidden bg-desk xl:h-auto xl:min-h-[100dvh] xl:overflow-visible">
      {session.kind === "staff" ? (
        <StaffShell>{children}</StaffShell>
      ) : (
        <PatientShell patientId={session.patientId}>{children}</PatientShell>
      )}
      <LoginSwitcher />
    </div>
  );
}

function StaffShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full xl:min-h-[100dvh]">
      <StaffSidebar className="hidden xl:flex" />
      <div className="mx-auto h-full w-full bg-page md:max-w-[680px] md:border-x md:border-border-strong lg:max-w-[960px] xl:h-auto xl:max-w-none xl:flex-1 xl:border-0">
        {children}
      </div>
    </div>
  );
}

function PatientShell({
  children,
  patientId,
}: {
  children: React.ReactNode;
  patientId: string | null;
}) {
  return (
    <div className="h-full xl:mx-auto xl:h-auto xl:max-w-[880px] xl:px-4">
      {patientId && <PatientBrandBar patientId={patientId} />}
      <div className="h-full xl:flex xl:items-start xl:gap-6 xl:pb-8 xl:pt-6">
        <div className="relative mx-auto h-full w-full bg-page md:max-w-[680px] md:border-x md:border-border-strong lg:max-w-[960px] xl:h-auto xl:max-w-[500px] xl:rounded-card xl:border xl:border-border xl:shadow-card">
          {children}
          <PatientContactWidget />
        </div>
        {patientId && <PatientSpine patientId={patientId} />}
      </div>
    </div>
  );
}
