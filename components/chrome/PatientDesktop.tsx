"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPatient, getPatientThreads } from "@/lib/dataProvider";
import { Avatar, Icon, cn } from "@/components/ui";
import { NotificationsBell } from "@/components/screens/NotificationsBell";
import { PATIENT_NAV } from "@/components/screens/nav-config";

const ROLE_ICON: Record<string, string> = {
  NURSE: "ti-stethoscope",
  PHARMACIST: "ti-prescription",
  REP: "ti-user-star",
  SOCIAL_WORKER: "ti-heart-handshake",
};
const displayNum = (n: string | null) =>
  n ? n.replace(/^\+1/, "").replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3") : null;

/** Desktop-only slim brand bar (logo + bell + avatar). */
export function PatientBrandBar({ patientId }: { patientId: string }) {
  const p = getPatient(patientId);
  return (
    <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-border bg-card px-6 lg:flex">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-white">
          <Icon name="ti-cross" size={18} />
        </div>
        <span className="text-title-name tracking-tight text-navy">ASAP Pharmacy</span>
      </div>
      <div className="flex items-center gap-3">
        <NotificationsBell patientId={patientId} />
        <Avatar name={p ? `${p.firstName} ${p.lastName}` : "Patient"} size={32} tone="navy" />
      </div>
    </header>
  );
}

/** Desktop-only right spine: contact card (visible numbers) + unrolled nav.
 *  Replaces the floating widget + bottom nav on desktop (center-and-breathe). */
export function PatientSpine({ patientId }: { patientId: string }) {
  const pathname = usePathname();
  const threads = getPatientThreads(patientId);

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col gap-4 lg:flex">
      {/* contact card */}
      <div className="rounded-card border border-border bg-card p-4 shadow-card">
        <p className="mb-3 text-section uppercase text-text-muted">Your care team</p>
        <div className="flex flex-col gap-3">
          {threads.map((t) => (
            <div key={t.id} className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-light">
                <Icon name={ROLE_ICON[t.role] ?? "ti-user"} size={17} className="text-teal-dark" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-strong text-text-primary">{t.roleLabel}</p>
                <p className="truncate text-micro text-text-secondary">
                  {displayNum(t.roleNumber) ?? "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Link
          href="/messages"
          className="mt-3 flex h-10 items-center justify-center gap-2 rounded-control border border-border-strong text-label-strong text-navy transition-colors hover:bg-fill-control"
        >
          <Icon name="ti-messages" size={16} className="text-teal" />
          Open messages
        </Link>
      </div>

      {/* nav list */}
      <nav className="overflow-hidden rounded-card border border-border bg-card shadow-card">
        {PATIENT_NAV.map((it) => {
          const active =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.key}
              href={it.href}
              className={cn(
                "flex items-center gap-3 border-b border-border px-4 py-3 text-body-strong transition-colors last:border-b-0",
                active ? "bg-icon-tile text-navy" : "text-text-secondary hover:bg-fill-control",
              )}
            >
              <Icon
                name={active ? (it.activeIcon ?? it.icon) : it.icon}
                size={19}
                className={active ? "text-navy" : "text-text-muted"}
              />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
