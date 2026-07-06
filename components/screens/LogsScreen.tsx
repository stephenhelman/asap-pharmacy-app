"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPatient, getPatientMetrics, TODAY } from "@/lib/dataProvider";
import { useSession } from "@/lib/session";
import { useMutations } from "@/lib/mutations";
import {
  Icon,
  BottomNav,
  Tabs,
  TagType,
  cn,
} from "@/components/ui";
import { PATIENT_NAV } from "./nav-config";
import { InfusionEntryModal } from "./InfusionEntryModal";
import { BleedEntryModal } from "./BleedEntryModal";

const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

function thisMonth(iso: string) {
  const d = new Date(iso);
  return (
    d.getUTCFullYear() === TODAY.getUTCFullYear() &&
    d.getUTCMonth() === TODAY.getUTCMonth()
  );
}

type LogRow =
  | { kind: "infusion"; id: string; at: string; product: string; iu: number; doseType: "PROPHYLAXIS" | "PRN"; bleedId: string | null }
  | { kind: "bleed"; id: string; at: string; site: string; tier: string | null; closed: boolean };

export function LogsScreen() {
  const { session } = useSession();
  const patientId = session.patientId ?? "pat_marcos";
  const search = useSearchParams();
  const m = useMutations();

  const [tab, setTab] = useState<"all" | "infusions" | "bleeds">("all");
  // auto-open from dashboard quick actions (?new=infusion|bleed) — derived from
  // the URL at mount, no setState-in-effect.
  const initialNew = search.get("new");
  const [modal, setModal] = useState<null | "infusion" | "bleed" | "choose">(
    initialNew === "infusion" ? "infusion" : initialNew === "bleed" ? "bleed" : null,
  );

  const p = getPatient(patientId)!;
  const metrics = getPatientMetrics(p);

  const infusions = useMemo(() => {
    const extra = m.loggedInfusions.filter((i) => i.patientId === patientId);
    return [...p.infusions, ...extra].sort((a, b) =>
      b.infusedAt.localeCompare(a.infusedAt),
    );
  }, [p.infusions, m.loggedInfusions, patientId]);

  const bleeds = useMemo(() => {
    const extra = m.loggedBleeds.filter((b) => b.patientId === patientId);
    return [...p.bleeds, ...extra]
      .map((b) => ({
        ...b,
        closedAt: m.closedBleeds[b.id] ?? b.closedAt,
      }))
      .sort((a, b) => b.onsetAt.localeCompare(a.onsetAt));
  }, [p.bleeds, m.loggedBleeds, m.closedBleeds, patientId]);

  const bleedSite = (id: string | null) =>
    id ? bleeds.find((b) => b.id === id)?.site : undefined;

  const rows: LogRow[] = useMemo(() => {
    const inf: LogRow[] = infusions.map((i) => ({
      kind: "infusion",
      id: i.id,
      at: i.infusedAt,
      product: i.productName,
      iu: i.targetIu,
      doseType: i.doseType,
      bleedId: i.bleedId,
    }));
    const ble: LogRow[] = bleeds.map((b) => ({
      kind: "bleed",
      id: b.id,
      at: b.onsetAt,
      site: b.site,
      tier: b.tier,
      closed: !!b.closedAt,
    }));
    let all: LogRow[];
    if (tab === "infusions") all = inf;
    else if (tab === "bleeds") all = ble;
    else all = [...inf, ...ble];
    return all.sort((a, b) => b.at.localeCompare(a.at));
  }, [infusions, bleeds, tab]);

  // group by month
  const groups = useMemo(() => {
    const map = new Map<string, LogRow[]>();
    for (const r of rows) {
      const k = monthLabel(r.at);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return Array.from(map.entries());
  }, [rows]);

  const infusionsThisMonth = infusions.filter((i) => thisMonth(i.infusedAt)).length;
  const bleedsThisMonth = bleeds.filter((b) => thisMonth(b.onsetAt)).length;

  return (
    <div className="relative flex min-h-[100dvh] flex-col md:min-h-[844px]">
      {/* Header + tabs */}
      <header className="bg-card px-4 pt-4">
        <h1 className="mb-3.5 text-display text-navy">My logs</h1>
      </header>
      <Tabs
        tabs={[
          { key: "all", label: "All" },
          { key: "infusions", label: "Infusions" },
          { key: "bleeds", label: "Bleeds" },
        ]}
        active={tab}
        onChange={(k) => setTab(k as typeof tab)}
      />

      {/* Summary strip */}
      <div className="flex border-b border-border bg-card">
        <SummaryCell value={infusionsThisMonth} label="this month" />
        <SummaryCell value={metrics.dosesOnHand} label="on hand" tone={metrics.dosesLow ? "amber" : "neutral"} />
        <SummaryCell
          value={bleedsThisMonth === 0 ? "On track" : bleedsThisMonth}
          label={bleedsThisMonth === 0 ? "no bleeds" : "bleeds"}
          tone={bleedsThisMonth === 0 ? "teal" : "amber"}
        />
      </div>

      {/* Timeline */}
      <main className="flex-1 overflow-y-auto px-4 pb-32 pt-3.5">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Icon name="ti-mood-smile" size={32} className="text-teal" />
            <p className="text-title-card text-navy">Nothing logged yet</p>
            <p className="text-body text-text-secondary">
              {tab === "bleeds"
                ? "No bleeds — that's good news."
                : "Tap the button below to add your first entry."}
            </p>
          </div>
        ) : (
          groups.map(([month, items]) => (
            <div key={month} className="mb-4">
              <p className="mb-2 text-section uppercase text-text-muted">{month}</p>
              <div className="flex flex-col gap-2">
                {items.map((r) => (
                  <LogRowItem key={r.id} row={r} bleedSite={bleedSite} />
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Floating context-aware create — fixed above the pinned nav */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[76px] z-30 mx-auto flex w-full max-w-[500px] justify-center px-4 lg:bottom-6">
        <button
          onClick={() =>
            setModal(tab === "infusions" ? "infusion" : tab === "bleeds" ? "bleed" : "choose")
          }
          className="pointer-events-auto flex h-[50px] items-center gap-2 rounded-pill bg-accent px-6 text-title-card font-semibold text-white shadow-float active:bg-navy-dark"
        >
          <Icon name="ti-plus" size={20} />
          {tab === "bleeds" ? "Log a bleed" : tab === "infusions" ? "Log infusion" : "Add entry"}
        </button>
      </div>

      <BottomNav items={PATIENT_NAV} activeKey="logs" />

      {/* Chooser */}
      {modal === "choose" && (
        <ChooseSheet
          onInfusion={() => setModal("infusion")}
          onBleed={() => setModal("bleed")}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "infusion" && (
        <InfusionEntryModal patientId={patientId} onClose={() => setModal(null)} />
      )}
      {modal === "bleed" && (
        <BleedEntryModal patientId={patientId} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function SummaryCell({
  value,
  label,
  tone = "neutral",
}: {
  value: React.ReactNode;
  label: string;
  tone?: "neutral" | "amber" | "teal";
}) {
  const c = { neutral: "text-navy", amber: "text-amber", teal: "text-teal-dark" }[tone];
  return (
    <div className="flex flex-1 flex-col items-center border-r border-border py-3 last:border-r-0">
      <span className={cn("text-num-hero", c)}>{value}</span>
      <span className="text-label text-text-muted">{label}</span>
    </div>
  );
}

function LogRowItem({
  row,
  bleedSite,
}: {
  row: LogRow;
  bleedSite: (id: string | null) => string | undefined;
}) {
  if (row.kind === "infusion") {
    const linked = row.doseType === "PRN" ? bleedSite(row.bleedId) : undefined;
    return (
      <div className="flex items-center gap-3 rounded-card border border-border bg-card p-3.5 shadow-card">
        <div className="flex h-9 w-9 items-center justify-center rounded-tile bg-teal-light">
          <Icon name="ti-droplet" size={18} className="text-teal-dark" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-title-card text-text-primary">
            {row.product} {row.iu.toLocaleString()} IU
          </p>
          <p className="truncate text-micro text-text-muted">
            {dayLabel(row.at)}
            {linked ? ` · linked to ${linked}` : ""}
          </p>
        </div>
        <TagType kind={row.doseType} />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-card p-3.5 shadow-card">
      <div className="flex h-9 w-9 items-center justify-center rounded-tile bg-red-light">
        <Icon name="ti-droplet" size={18} className="text-red" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-title-card text-text-primary">Bleed · {row.site}</p>
        <p className="truncate text-micro text-text-muted">
          {dayLabel(row.at)} · {row.closed ? "resolved" : "open"}
        </p>
      </div>
      <span
        className={cn(
          "rounded-pill px-2 py-0.5 text-label-strong",
          row.closed ? "bg-fill-control text-text-secondary" : "bg-red-light text-red",
        )}
      >
        {row.tier ? row.tier.toLowerCase() : row.closed ? "resolved" : "open"}
      </span>
    </div>
  );
}

function ChooseSheet({
  onInfusion,
  onBleed,
  onClose,
}: {
  onInfusion: () => void;
  onBleed: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center">
      <button
        className="absolute inset-0 bg-navy-dark/40 animate-scrim-in"
        onClick={onClose}
      />
      <div className="relative z-10 w-full rounded-t-frame bg-page p-4 animate-sheet-up md:rounded-frame md:mb-4 md:max-w-[360px]">
        <p className="mb-3 text-center text-title-card text-navy">What would you like to log?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onInfusion}
            className="flex flex-col items-center gap-2 rounded-card border border-border-strong bg-card px-4 py-6 active:bg-fill-control"
          >
            <Icon name="ti-droplet-plus" size={26} className="text-teal" />
            <span className="text-title-card text-navy">Infusion</span>
          </button>
          <button
            onClick={onBleed}
            className="flex flex-col items-center gap-2 rounded-card border border-border-strong bg-card px-4 py-6 active:bg-fill-control"
          >
            <Icon name="ti-first-aid-kit" size={26} className="text-red" />
            <span className="text-title-card text-navy">Bleed</span>
          </button>
        </div>
      </div>
    </div>
  );
}
