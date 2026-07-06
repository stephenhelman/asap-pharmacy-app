"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import { getPatientThreads } from "@/lib/dataProvider";
import { Icon } from "@/components/ui";

const ROLE_ICON: Record<string, string> = {
  NURSE: "ti-stethoscope",
  PHARMACIST: "ti-prescription",
  REP: "ti-user-star",
  SOCIAL_WORKER: "ti-heart-handshake",
};

const displayNum = (n: string | null) =>
  n ? n.replace(/^\+1/, "").replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3") : null;

/**
 * The comms hub miniaturized — a floating "contact your team" launcher on
 * patient screens. On desktop this would become the right-spine contact card;
 * mobile-first, it's the floating widget. Hidden on the full messages hub.
 */
export function PatientContactWidget() {
  const { session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (session.kind !== "patient" || !session.patientId) return null;
  if (pathname === "/messages") return null;

  const threads = getPatientThreads(session.patientId);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[84px] right-3 z-30 flex items-center justify-center rounded-full bg-teal text-white shadow-float active:bg-teal-dark xl:hidden"
        style={{ height: 52, width: 52 }}
        aria-label="Contact your team"
      >
        <Icon name="ti-message-2" size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center">
          <button className="absolute inset-0 bg-navy-dark/40 animate-scrim-in" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full rounded-t-frame bg-page p-4 pb-6 animate-sheet-up md:mb-4 md:max-w-[360px] md:rounded-frame">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-title-card text-navy">Contact your team</p>
              <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-control text-text-muted active:bg-fill-control">
                <Icon name="ti-x" size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {threads.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-card border border-border bg-card px-3 py-2.5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-light">
                    <Icon name={ROLE_ICON[t.role] ?? "ti-user"} size={18} className="text-teal-dark" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-title-card text-text-primary">{t.roleLabel}</p>
                    {/* desktop shows the number; mobile launches */}
                    <p className="text-micro text-text-muted sm:hidden">Tap to call or text</p>
                    <p className="hidden text-micro text-text-secondary sm:block">
                      {displayNum(t.roleNumber)}
                    </p>
                  </div>
                  {t.roleNumber && (
                    <div className="flex items-center gap-1 sm:hidden">
                      <a href={`sms:${t.roleNumber}`} className="flex h-9 w-9 items-center justify-center rounded-control border border-border-strong text-teal active:bg-fill-control">
                        <Icon name="ti-message-2" size={17} />
                      </a>
                      <a href={`tel:${t.roleNumber}`} className="flex h-9 w-9 items-center justify-center rounded-control bg-accent text-white active:bg-navy-dark">
                        <Icon name="ti-phone" size={17} />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Link
              href="/messages"
              onClick={() => setOpen(false)}
              className="mt-3 flex h-11 items-center justify-center gap-2 rounded-control border border-border-strong bg-card text-title-card text-navy active:bg-fill-control"
            >
              <Icon name="ti-messages" size={18} className="text-teal" />
              Open all messages
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
