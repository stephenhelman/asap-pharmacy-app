"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getRoster, type RosterRow } from "@/lib/dataProvider";
import { useSession, roleSummary } from "@/lib/session";
import { useIsDesktop } from "@/lib/useBreakpoint";
import {
  Avatar,
  Icon,
  StatusPill,
  ChipFilter,
  BottomNav,
} from "@/components/ui";
import { STAFF_NAV } from "./nav-config";
import { RecordPane } from "./RecordPane";
import { AddPatientModal } from "./intake/AddPatientModal";

type Filter = "all" | "active" | "onboarding" | "attention";

export function StaffRoster() {
  const { session } = useSession();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // "Add new" is a rep-only affordance (§5.1.1) — all onboarding begins here.
  const canAdd = session.roles.includes("REP");

  // Desktop (xl): slide-in pane. Below xl: full-page tabbed record.
  const openRecord = (id: string) =>
    isDesktop ? setSelected(id) : router.push(`/patients/${id}`);

  const rows = getRoster();
  const counts = {
    all: rows.length,
    active: rows.filter((r) => r.patient.lifecycle === "ACTIVE").length,
    onboarding: rows.filter((r) => r.patient.lifecycle === "ONBOARDING").length,
    attention: rows.filter(
      (r) => r.lead.tone === "danger" || r.lead.tone === "warning",
    ).length,
  };

  const visible = rows.filter((r) => {
    if (filter === "active") return r.patient.lifecycle === "ACTIVE";
    if (filter === "onboarding") return r.patient.lifecycle === "ONBOARDING";
    if (filter === "attention")
      return r.lead.tone === "danger" || r.lead.tone === "warning";
    return true;
  });

  return (
    <div className="relative flex h-full flex-col xl:h-auto">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-navy">Roster</h1>
            <p className="text-micro text-text-muted">
              {rows.length} patients · {roleSummary(session.roles) || "Staff"} view
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {canAdd && (
              <button
                onClick={() => setAddOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-control bg-accent px-3 text-label-strong text-white active:bg-navy-dark"
              >
                <Icon name="ti-plus" size={16} />
                Add new
              </button>
            )}
            <button className="flex h-9 w-9 items-center justify-center rounded-control text-navy active:bg-fill-control">
              <Icon name="ti-search" size={20} />
            </button>
          </div>
        </div>
        <div className="scroll-x -mx-4 mt-3 flex gap-1.5 px-4 pb-4">
          <ChipFilter active={filter === "all"} count={counts.all} onClick={() => setFilter("all")}>
            All
          </ChipFilter>
          <ChipFilter active={filter === "active"} count={counts.active} onClick={() => setFilter("active")}>
            Active
          </ChipFilter>
          <ChipFilter active={filter === "onboarding"} count={counts.onboarding} onClick={() => setFilter("onboarding")}>
            Onboarding
          </ChipFilter>
          <ChipFilter active={filter === "attention"} count={counts.attention} onClick={() => setFilter("attention")}>
            Needs attention
          </ChipFilter>
        </div>
      </header>

      {/* Rows — full-width list on mobile, card grid on desktop */}
      <main className="flex-1 min-h-0 overflow-y-auto lg:grid lg:grid-cols-2 lg:content-start lg:gap-3 lg:p-6 xl:grid-cols-3">
        {visible.map((r) => (
          <RosterRowItem key={r.patient.id} row={r} onOpen={() => openRecord(r.patient.id)} />
        ))}
        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center lg:col-span-full">
            <Icon name="ti-checks" size={32} className="text-teal" />
            <p className="text-title-card text-navy">You're all caught up</p>
            <p className="text-body text-text-secondary">Nobody matches this filter.</p>
          </div>
        )}
      </main>

      <BottomNav items={STAFF_NAV} activeKey="roster" />

      {isDesktop && (
        <RecordPane patientId={selected} onClose={() => setSelected(null)} />
      )}
      {addOpen && <AddPatientModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function RosterRowItem({
  row,
  onOpen,
}: {
  row: RosterRow;
  onOpen: () => void;
}) {
  const { patient, lifecycleLabel, lifecycleTone, lead } = row;
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors active:bg-fill-control lg:rounded-card lg:border lg:bg-card lg:p-3.5 lg:shadow-card lg:hover:border-border-strong"
    >
      <Avatar name={`${patient.firstName} ${patient.lastName}`} size={34} />
      <div className="min-w-0 flex-1">
        <p className="mb-1 truncate text-title-card text-text-primary">
          {patient.firstName} {patient.lastName}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill tone={lifecycleTone}>{lifecycleLabel}</StatusPill>
          <StatusPill tone={lead.tone} icon={lead.icon}>
            {lead.label}
          </StatusPill>
        </div>
      </div>
      <Icon name="ti-chevron-right" size={18} className="text-text-muted" />
    </button>
  );
}
