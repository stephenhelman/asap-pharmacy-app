"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getWorkQueue, type QueueRow } from "@/lib/dataProvider";
import { useSession, roleSummary } from "@/lib/session";
import { useMutations } from "@/lib/mutations";
import type { StaffRole } from "@/lib/types";
import {
  Avatar,
  Icon,
  ChipFilter,
  ChipWork,
  BottomNav,
} from "@/components/ui";
import { STAFF_NAV } from "./nav-config";
import { RecordPane } from "./RecordPane";
import { useIsDesktop } from "@/lib/useBreakpoint";

// Role-derived default filter (§S2): nurse → Clinicals, pharmacist → All, …
const DEFAULT_CATEGORY: Partial<Record<StaffRole, string>> = {
  NURSE: "Clinicals",
  TECH: "Fulfillment",
  VERIFICATION: "Renewals",
  SOCIAL_WORKER: "Renewals",
  // Intake is rep-owned (§5.1) — a rep lands on their stalled intake tasks.
  REP: "Intake",
};

export function WorkQueue() {
  const { session } = useSession();
  const m = useMutations();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [selected, setSelected] = useState<string | null>(null);

  // Desktop (xl): open the slide-in pane over the matrix. Below xl (mobile /
  // tablet): navigate to the full-page tabbed record — no pane at this tier.
  const openRecord = (id: string) =>
    isDesktop ? setSelected(id) : router.push(`/patients/${id}`);

  // Pass the viewer + live notes/receipts so internal-note acknowledgment items
  // (§14.6) surface in the tagged person's own queue and clear once viewed.
  const rows = useMemo(
    () =>
      getWorkQueue(session.roles, {
        userId: session.staffId,
        notes: m.addedNotes,
        seenAcks: m.seenNoteAcks,
      }),
    [session.roles, session.staffId, m.addedNotes, m.seenNoteAcks],
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.items.forEach((i) => set.add(i.category)));
    return Array.from(set);
  }, [rows]);

  // A tagged person's note-ack is perishable — don't let a role-narrowed default
  // (e.g. nurse → Clinicals) hide it. If the viewer has any acknowledgment items,
  // land on "all" so the review item is visible immediately.
  const hasAcks = rows.some((r) => r.items.some((i) => i.category === "Notes"));
  const defaultFilter =
    !hasAcks && session.roles.length === 1 && DEFAULT_CATEGORY[session.roles[0]]
      ? DEFAULT_CATEGORY[session.roles[0]]!
      : "all";

  const [filter, setFilter] = useState<string>(defaultFilter);
  const activeFilter = categories.includes(filter) || filter === "all" ? filter : "all";

  const visible = rows
    .map((r) => ({
      ...r,
      items:
        activeFilter === "all"
          ? r.items
          : r.items.filter((i) => i.category === activeFilter),
    }))
    .filter((r) => r.items.length > 0);

  const totalItems = visible.reduce((s, r) => s + r.items.length, 0);

  return (
    <div className="relative flex h-full flex-col xl:h-auto">
      <header className="border-b border-border bg-card px-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-navy">Work queue</h1>
            <p className="mt-1 text-micro text-text-muted">
              {roleSummary(session.roles) || "Staff"} · {totalItems} open item
              {totalItems === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="scroll-x -mx-4 mt-3 flex gap-1.5 px-4 pb-3">
          <ChipFilter
            active={activeFilter === "all"}
            count={rows.reduce((s, r) => s + r.items.length, 0)}
            onClick={() => setFilter("all")}
          >
            All
          </ChipFilter>
          {categories.map((c) => (
            <ChipFilter
              key={c}
              active={activeFilter === c}
              count={rows.reduce(
                (s, r) => s + r.items.filter((i) => i.category === c).length,
                0,
              )}
              onClick={() => setFilter(c)}
            >
              {c}
            </ChipFilter>
          ))}
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Icon name="ti-checks" size={34} className="text-teal" />
            <p className="text-title-card text-navy">Queue clear</p>
            <p className="max-w-[240px] text-body text-text-secondary">
              No open work for this role right now. Nice.
            </p>
          </div>
        ) : (
          <>
            {/* below xl: patients-as-rows, chips indented */}
            <div className="xl:hidden lg:grid lg:grid-cols-2 lg:content-start lg:gap-3 lg:p-4">
              {visible.map((r) => (
                <QueueRowItem
                  key={r.patient.id}
                  row={r}
                  onOpen={() => openRecord(r.patient.id)}
                />
              ))}
            </div>
            {/* desktop: reflow to a patients × work-types matrix */}
            <QueueTable
              rows={visible}
              columns={
                activeFilter === "all"
                  ? categories
                  : categories.filter((c) => c === activeFilter)
              }
              onOpen={openRecord}
            />
          </>
        )}
      </main>

      <BottomNav items={STAFF_NAV} activeKey="queue" />
      {isDesktop && (
        <RecordPane patientId={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

const COLUMN_ORDER = ["Intake", "Clinicals", "Orders", "Fulfillment", "Renewals", "Notes"];

function QueueTable({
  rows,
  columns,
  onOpen,
}: {
  rows: QueueRow[];
  columns: string[];
  onOpen: (id: string) => void;
}) {
  const router = useRouter();
  const cols = COLUMN_ORDER.filter((c) => columns.includes(c));

  return (
    <div className="hidden overflow-x-auto xl:block">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border bg-page">
            <th className="sticky left-0 z-10 bg-page px-6 py-3 text-left text-section uppercase text-text-muted">
              Patient
            </th>
            {cols.map((c) => (
              <th key={c} className="px-4 py-3 text-left text-section uppercase text-text-muted">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.patient.id}
              className="group border-b border-border transition-colors hover:bg-fill-control/50"
            >
              <td className="sticky left-0 z-10 bg-card px-6 py-3 group-hover:bg-fill-control/50">
                <button
                  onClick={() => onOpen(r.patient.id)}
                  className="flex items-center gap-2.5 text-left"
                >
                  <Avatar name={`${r.patient.firstName} ${r.patient.lastName}`} size={32} />
                  <div>
                    <p className="text-title-card text-text-primary">
                      {r.patient.firstName} {r.patient.lastName}
                    </p>
                    <p className="text-micro text-text-muted">{r.lifecycleLabel}</p>
                  </div>
                </button>
              </td>
              {cols.map((c) => {
                const cell = r.items.filter((i) => i.category === c);
                return (
                  <td key={c} className="px-4 py-3 align-top">
                    {cell.length === 0 ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {cell.map((it) => (
                          <ChipWork
                            key={it.id}
                            triage={it.triage}
                            icon={
                              it.triage === "danger"
                                ? "ti-alert-triangle"
                                : it.triage === "warning"
                                  ? "ti-clock"
                                  : "ti-circle-dot"
                            }
                            onClick={() => router.push(it.href)}
                          >
                            {it.label}
                          </ChipWork>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QueueRowItem({
  row,
  onOpen,
}: {
  row: QueueRow;
  onOpen: () => void;
}) {
  const router = useRouter();
  const { patient, lifecycleLabel, items } = row;
  return (
    <div className="border-b border-border px-4 py-3.5 lg:rounded-card lg:border lg:bg-card lg:shadow-card">

      <button
        onClick={onOpen}
        className="mb-2 flex w-full items-center gap-3 text-left"
      >
        <Avatar name={`${patient.firstName} ${patient.lastName}`} size={30} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-title-card text-text-primary">
            {patient.firstName} {patient.lastName}
          </p>
          <p className="text-micro text-text-muted">{lifecycleLabel}</p>
        </div>
        <Icon name="ti-chevron-right" size={18} className="text-text-muted" />
      </button>
      <div className="ml-[42px] flex flex-wrap gap-1.5">
        {items.map((it) => (
          <ChipWork
            key={it.id}
            triage={it.triage}
            icon={
              it.triage === "danger"
                ? "ti-alert-triangle"
                : it.triage === "warning"
                  ? "ti-clock"
                  : "ti-circle-dot"
            }
            onClick={() => router.push(it.href)}
          >
            {it.label}
          </ChipWork>
        ))}
      </div>
    </div>
  );
}
