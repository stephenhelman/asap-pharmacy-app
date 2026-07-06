"use client";

import { useMemo, useState } from "react";
import { useSession, ROLE_LABELS } from "@/lib/session";
import { useMutations } from "@/lib/mutations";
import {
  getStaffConversations,
  getThreadDetail,
  getPatientThreads,
  getPatient,
  TODAY,
} from "@/lib/dataProvider";
import type { MessageRow, StaffRole, UserRow } from "@/lib/types";
import {
  Avatar,
  Icon,
  BottomNav,
  TopBarNav,
  ChipFilter,
  Button,
  cn,
} from "@/components/ui";
import { STAFF_NAV } from "./nav-config";
import { MessageBubble, DayDivider, NoteCard } from "./comms/MessageThread";

const preview = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function StaffCommsHub() {
  const [openPatient, setOpenPatient] = useState<string | null>(null);
  const convos = getStaffConversations();

  if (openPatient)
    return <Conversation patientId={openPatient} onBack={() => setOpenPatient(null)} />;

  return (
    <div className="flex min-h-[100dvh] flex-col md:min-h-[844px] lg:mx-auto lg:min-h-[100dvh] lg:w-full lg:max-w-[760px] lg:border-x lg:border-border">
      <header className="border-b border-border bg-card px-4 pb-3 pt-4">
        <h1 className="text-display text-navy">Messages</h1>
        <p className="text-micro text-text-muted">{convos.length} conversations</p>
      </header>
      <main className="flex-1 overflow-y-auto">
        {convos.map((c) => (
          <button
            key={c.patient.id}
            onClick={() => setOpenPatient(c.patient.id)}
            className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors active:bg-fill-control"
          >
            <Avatar name={`${c.patient.firstName} ${c.patient.lastName}`} size={38} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="flex-1 truncate text-title-card text-text-primary">
                  {c.patient.firstName} {c.patient.lastName}
                </p>
                {c.lastAt && <span className="text-micro text-text-muted">{preview(c.lastAt)}</span>}
              </div>
              <p className="truncate text-body text-text-muted">
                {c.lastPreview ?? "No messages"}
              </p>
            </div>
            {c.unread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-pill bg-teal px-1.5 text-[10px] font-semibold text-white">
                {c.unread}
              </span>
            )}
          </button>
        ))}
      </main>
      <BottomNav items={STAFF_NAV} activeKey="messages" />
    </div>
  );
}

type Filter = "both" | "messages" | "notes";

function Conversation({
  patientId,
  onBack,
}: {
  patientId: string;
  onBack: () => void;
}) {
  const { session } = useSession();
  const m = useMutations();
  const threads = getPatientThreads(patientId);
  const patient = getPatient(patientId)!;

  const [threadId, setThreadId] = useState(threads[0]?.id ?? "");
  const [filter, setFilter] = useState<Filter>("both");
  const [mode, setMode] = useState<"message" | "note">("message");
  const [draft, setDraft] = useState("");
  const [tags, setTags] = useState<StaffRole[]>([]);

  const detail = getThreadDetail(threadId);
  const activeThread = threads.find((t) => t.id === threadId);

  // tag options: this patient's care team roles + management chain
  const tagOptions = useMemo(() => {
    const roles = new Set<StaffRole>(patient.careTeam.map((c) => c.role));
    roles.add("MANAGEMENT");
    return Array.from(roles);
  }, [patient]);

  const me: UserRow | null = session.staffId
    ? { id: session.staffId, fullName: session.user.name } as UserRow
    : null;

  // merged, filtered timeline
  const items = useMemo(() => {
    if (!detail) return [];
    const baseMsgs = detail.messages;
    const sentMsgs: MessageRow[] = m.sentMessages
      .filter((x) => x.threadId === threadId)
      .map((x) => ({
        id: x.id,
        threadId: x.threadId,
        sender: "STAFF",
        kind: "SMS",
        body: x.body,
        staffAuthorId: x.staffAuthorId,
        sentAt: x.sentAt,
      }));
    const msgs = [...baseMsgs, ...sentMsgs];

    const baseNotes = detail.notes;
    const addedNotes = m.addedNotes
      .filter((x) => x.threadId === threadId)
      .map((x) => ({
        id: x.id,
        threadId: x.threadId,
        authorId: x.authorId,
        body: x.body,
        createdAt: x.createdAt,
        author: me,
        tags: x.tags as StaffRole[],
        acks: [] as { user: UserRow; seenAt: string }[],
      }));
    const notes = [...baseNotes, ...addedNotes];

    type Item =
      | { t: "msg"; at: string; msg: MessageRow; author?: string }
      | { t: "note"; at: string; note: (typeof notes)[number] };
    let list: Item[] = [];
    if (filter !== "notes")
      list.push(
        ...msgs.map((msg) => ({
          t: "msg" as const,
          at: msg.sentAt,
          msg,
          author: detail.roleLabel,
        })),
      );
    if (filter !== "messages")
      list.push(...notes.map((note) => ({ t: "note" as const, at: note.createdAt, note })));
    return list.sort((a, b) => a.at.localeCompare(b.at));
  }, [detail, filter, m.sentMessages, m.addedNotes, threadId, me]);

  function send() {
    if (!draft.trim() || !session.staffId) return;
    if (mode === "message") {
      m.sendMessage({
        id: `msg_new_${Math.round(TODAY.getTime())}_${Math.random().toString(36).slice(2, 6)}`,
        threadId,
        body: draft.trim(),
        staffAuthorId: session.staffId,
        sentAt: new Date(TODAY.getTime()).toISOString(),
      });
    } else {
      m.addNote({
        id: `note_new_${Math.round(TODAY.getTime())}_${Math.random().toString(36).slice(2, 6)}`,
        threadId,
        authorId: session.staffId,
        body: draft.trim(),
        tags,
        createdAt: new Date(TODAY.getTime()).toISOString(),
      });
    }
    setDraft("");
    setTags([]);
  }

  let lastDay = "";

  return (
    <div className="flex min-h-[100dvh] flex-col md:min-h-[844px] lg:mx-auto lg:min-h-[100dvh] lg:w-full lg:max-w-[760px] lg:border-x lg:border-border">
      <TopBarNav
        title={`${patient.firstName} ${patient.lastName}`}
        onDismiss={onBack}
        right={
          <a
            href={`/patients/${patientId}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-control text-navy active:bg-fill-control"
            title="Open record"
          >
            <Icon name="ti-user-circle" size={20} />
          </a>
        }
      />

      {/* role-thread selector */}
      <div className="scroll-x flex gap-1.5 border-b border-border bg-card px-4 py-2">
        {threads.map((t) => (
          <ChipFilter
            key={t.id}
            active={threadId === t.id}
            onClick={() => setThreadId(t.id)}
          >
            {t.roleLabel}
          </ChipFilter>
        ))}
      </div>

      {/* filter toggle */}
      <div className="flex gap-1.5 border-b border-border bg-card px-4 py-2">
        {(["both", "messages", "notes"] as Filter[]).map((f) => (
          <ChipFilter key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f === "both" ? "All" : f === "messages" ? "Messages" : "Notes"}
          </ChipFilter>
        ))}
      </div>

      {/* timeline */}
      <main className="flex flex-1 flex-col gap-1 overflow-y-auto bg-page px-4 py-4">
        {items.length === 0 ? (
          <p className="py-10 text-center text-body text-text-muted">
            Nothing here yet.
          </p>
        ) : (
          items.map((it, i) => {
            const d = new Date(it.at).toISOString().slice(0, 10);
            const showDay = d !== lastDay;
            lastDay = d;
            return (
              <div key={i}>
                {showDay && <DayDivider iso={it.at} />}
                {it.t === "msg" ? (
                  <MessageBubble msg={it.msg} authorName={it.author} />
                ) : (
                  <NoteCard
                    body={it.note.body}
                    authorName={it.note.author?.fullName ?? "Staff"}
                    tags={it.note.tags}
                    acks={it.note.acks}
                    createdAt={it.note.createdAt}
                  />
                )}
              </div>
            );
          })
        )}
      </main>

      {/* composer */}
      <footer className="border-t border-border bg-card p-3">
        <div className="mb-2 flex gap-1.5">
          <ModeTab label="Message" icon="ti-message-2" active={mode === "message"} onClick={() => setMode("message")} />
          <ModeTab label="Internal note" icon="ti-notes" active={mode === "note"} onClick={() => setMode("note")} />
        </div>

        {mode === "note" && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="text-micro text-text-muted">Tag:</span>
            {tagOptions.map((r) => {
              const on = tags.includes(r);
              return (
                <button
                  key={r}
                  onClick={() =>
                    setTags((s) => (on ? s.filter((x) => x !== r) : [...s, r]))
                  }
                  className={cn(
                    "rounded-pill px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    on ? "bg-navy text-white" : "border border-border-strong bg-card text-text-secondary",
                  )}
                >
                  {ROLE_LABELS[r]}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              mode === "message"
                ? `Message as ${activeThread?.roleLabel ?? "staff"}…`
                : "Write an internal note…"
            }
            className={cn(
              "max-h-24 flex-1 resize-none rounded-control border px-3 py-2.5 text-body text-text-primary placeholder:text-text-muted focus:outline-none",
              mode === "note" ? "border-amber-light bg-amber-light/40" : "border-border bg-page",
            )}
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-accent text-white active:bg-navy-dark disabled:bg-border-strong"
          >
            <Icon name={mode === "note" ? "ti-plus" : "ti-send"} size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}

function ModeTab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-control px-2.5 py-1 text-label-strong transition-colors",
        active ? "bg-icon-tile text-navy" : "text-text-muted",
      )}
    >
      <Icon name={icon} size={15} className={active ? "text-teal" : "text-text-muted"} />
      {label}
    </button>
  );
}
