"use client";

import { useState } from "react";
import { getPatientThreads, getThreadDetail, type ThreadSummary } from "@/lib/dataProvider";
import {
  Icon,
  BottomNav,
  TopBarNav,
  BadgeCount,
  cn,
} from "@/components/ui";
import { PATIENT_NAV } from "./nav-config";
import { MessageBubble, DayDivider, computeDayDividers } from "./comms/MessageThread";

const ROLE_ICON: Record<string, string> = {
  NURSE: "ti-stethoscope",
  PHARMACIST: "ti-prescription",
  REP: "ti-user-star",
  SOCIAL_WORKER: "ti-heart-handshake",
  VERIFICATION: "ti-shield-check",
  TECH: "ti-package",
  MANAGEMENT: "ti-briefcase",
};

const preview = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** P · Patient comms hub — read-only history + SMS/Call launchers. No composer. */
export function PatientCommsHub({ patientId }: { patientId: string }) {
  const [openThread, setOpenThread] = useState<string | null>(null);
  const threads = getPatientThreads(patientId);

  if (openThread)
    return <ThreadView threadId={openThread} onBack={() => setOpenThread(null)} />;

  return (
    <div className="flex h-full flex-col xl:h-auto">
      <header className="border-b border-border bg-card px-4 pb-3 pt-4">
        <h1 className="text-display text-navy">Your care team</h1>
        <p className="text-micro text-text-muted">
          Message history — reply anytime by text or call
        </p>
      </header>
      <main className="flex-1 min-h-0 overflow-y-auto">
        {threads.length === 0 ? (
          <Empty />
        ) : (
          threads.map((t) => (
            <ThreadRow key={t.id} t={t} onOpen={() => setOpenThread(t.id)} />
          ))
        )}
      </main>
      <BottomNav items={PATIENT_NAV} activeKey="messages" />
    </div>
  );
}

function ThreadRow({ t, onOpen }: { t: ThreadSummary; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors active:bg-fill-control"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-light">
        <Icon name={ROLE_ICON[t.role] ?? "ti-user"} size={20} className="text-teal-dark" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="flex-1 truncate text-title-card text-text-primary">
            {t.roleLabel}
            {t.memberName ? ` · ${t.memberName.split(" ")[0]}` : ""}
          </p>
          {t.lastAt && <span className="text-micro text-text-muted">{preview(t.lastAt)}</span>}
        </div>
        <p className={cn("truncate text-body", t.unreadFromStaff ? "text-text-primary" : "text-text-muted")}>
          {t.lastSender === "PATIENT" ? "You: " : ""}
          {t.lastBody ?? "No messages yet"}
        </p>
      </div>
      {t.unreadFromStaff && <BadgeCount>1 new</BadgeCount>}
    </button>
  );
}

function ThreadView({ threadId, onBack }: { threadId: string; onBack: () => void }) {
  const detail = getThreadDetail(threadId);
  if (!detail) return null;
  const { messages, roleLabel, thread } = detail;
  const number = thread.roleNumber;
  const displayNumber = number
    ? number.replace(/^\+1/, "").replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")
    : null;

  const showDays = computeDayDividers(messages.map((m) => m.sentAt));

  return (
    <div className="flex h-full flex-col xl:h-auto">
      <TopBarNav
        title={roleLabel}
        onDismiss={onBack}
        right={
          displayNumber ? (
            <span className="hidden items-center gap-1.5 text-body-strong text-navy sm:flex">
              <Icon name="ti-phone" size={16} className="text-teal" />
              {displayNumber}
            </span>
          ) : undefined
        }
      />

      <main className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto bg-page px-4 py-4">
        {messages.map((m, i) => (
          <div key={m.id}>
            {showDays[i] && <DayDivider iso={m.sentAt} />}
            <MessageBubble msg={m} authorName={detail.roleLabel} />
          </div>
        ))}
      </main>

      {/* Read-only footer with launchers (mobile) / number (desktop) */}
      <footer className="shrink-0 border-t border-border bg-card p-4">
        <p className="mb-2.5 flex items-center justify-center gap-1.5 text-micro text-text-muted">
          <Icon name="ti-lock" size={13} />
          This history is read-only. Reply by text or call.
        </p>
        {number && (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:hidden">
              <a
                href={`sms:${number}`}
                className="flex h-11 items-center justify-center gap-2 rounded-control border border-border-strong bg-card text-title-card text-text-primary active:bg-fill-control"
              >
                <Icon name="ti-message-2" size={18} className="text-teal" />
                Text
              </a>
              <a
                href={`tel:${number}`}
                className="flex h-11 items-center justify-center gap-2 rounded-control bg-accent text-title-card font-semibold text-white active:bg-navy-dark"
              >
                <Icon name="ti-phone" size={18} />
                Call
              </a>
            </div>
            <p className="hidden text-center text-body text-text-secondary sm:block">
              Call or text{" "}
              <span className="font-semibold text-navy">{displayNumber}</span>
            </p>
          </>
        )}
      </footer>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <Icon name="ti-message-off" size={32} className="text-text-muted" />
      <p className="text-title-card text-navy">No messages yet</p>
      <p className="max-w-[240px] text-body text-text-secondary">
        Your care team will reach out here. You can always call or text them.
      </p>
    </div>
  );
}
