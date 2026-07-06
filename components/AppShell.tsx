"use client";

import { useSession } from "@/lib/session";
import { LoginSwitcher } from "./LoginSwitcher";
import { PatientContactWidget } from "./PatientContactWidget";
import { StaffSidebar } from "./chrome/StaffSidebar";
import { PatientBrandBar, PatientSpine } from "./chrome/PatientDesktop";

/**
 * Presentation shell with the two responsive destinies:
 *  - mobile: an honest full-bleed screen (the collapsed case).
 *  - md (tablet): a centered framed "device".
 *  - lg (desktop): the destinies diverge —
 *      · STAFF reflow-and-expand → navy collapsible sidebar + full app canvas.
 *      · PATIENT center-and-breathe → slim brand bar + centered column + right spine.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { session } = useSession();

  return (
    <div className="min-h-[100dvh] bg-desk">
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
    <div className="lg:flex lg:min-h-[100dvh]">
      <StaffSidebar className="hidden lg:flex" />
      <div className="flex min-h-[100dvh] justify-center md:py-6 lg:min-h-[100dvh] lg:flex-1 lg:justify-stretch lg:py-0">
        <div className="relative flex w-full flex-col bg-page md:min-h-[844px] md:max-w-phone md:overflow-hidden md:rounded-frame md:border md:border-border-strong md:shadow-[0_20px_60px_rgba(15,37,64,0.12)] lg:min-h-[100dvh] lg:max-w-none lg:overflow-visible lg:rounded-none lg:border-0 lg:shadow-none">
          {children}
        </div>
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
    <div className="lg:min-h-[100dvh]">
      {/* Center-and-breathe: the header lives in the SAME centered container as
          the content (column + spine), so it aligns to the content width rather
          than stretching edge-to-edge. */}
      <div className="lg:mx-auto lg:max-w-[840px] lg:px-4">
        {patientId && <PatientBrandBar patientId={patientId} />}
        <div className="flex justify-center md:py-6 lg:items-start lg:gap-6 lg:pb-8 lg:pt-6">
          <div className="relative flex w-full flex-col bg-page md:min-h-[844px] md:max-w-phone md:overflow-hidden md:rounded-frame md:border md:border-border-strong md:shadow-[0_20px_60px_rgba(15,37,64,0.12)] lg:min-h-0 lg:max-w-[500px] lg:overflow-visible lg:rounded-card lg:shadow-card">
            {children}
            <PatientContactWidget />
          </div>
          {patientId && <PatientSpine patientId={patientId} />}
        </div>
      </div>
    </div>
  );
}
