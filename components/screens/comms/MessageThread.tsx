"use client";

import { Icon, cn } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/session";
import type { MessageRow, StaffRole, UserRow } from "@/lib/types";

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/** Absolute authorship (PATIENT/STAFF/SYSTEM); the UI decides alignment. */
export function MessageBubble({
  msg,
  authorName,
}: {
  msg: MessageRow;
  authorName?: string;
}) {
  if (msg.kind === "CALL_EVENT")
    return (
      <div className="my-1 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-fill-control px-3 py-1 text-micro text-text-secondary">
          <Icon name="ti-phone" size={13} className="text-teal-dark" />
          {msg.sender === "PATIENT" ? "Patient called" : "Call"} · {time(msg.sentAt)}
        </span>
      </div>
    );

  if (msg.sender === "SYSTEM")
    return (
      <div className="my-1 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-teal-light px-3 py-1 text-micro text-teal-dark">
          <Icon name="ti-info-circle" size={13} />
          {msg.body} · {time(msg.sentAt)}
        </span>
      </div>
    );

  const mine = msg.sender === "PATIENT";
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[78%]", mine ? "items-end" : "items-start")}>
        {!mine && authorName && (
          <p className="mb-0.5 pl-1 text-micro text-text-muted">{authorName}</p>
        )}
        <div
          className={cn(
            "rounded-card px-3 py-2 text-body",
            mine
              ? "rounded-br-sm bg-navy text-white"
              : "rounded-bl-sm border border-border bg-card text-text-primary",
          )}
        >
          {msg.body}
        </div>
        <p
          className={cn(
            "mt-0.5 text-[10px] text-text-muted",
            mine ? "pr-1 text-right" : "pl-1",
          )}
        >
          {time(msg.sentAt)}
        </p>
      </div>
    </div>
  );
}

export function DayDivider({ iso }: { iso: string }) {
  return (
    <div className="my-2 flex items-center justify-center">
      <span className="rounded-pill bg-page px-2.5 py-0.5 text-micro text-text-muted">
        {day(iso)}
      </span>
    </div>
  );
}

/** Internal staff note — never shown to the patient. Tags route acks; the
 *  "seen by" receipts show who has (and hasn't) acknowledged it (§14.6). */
export function NoteCard({
  body,
  authorName,
  tags,
  acks,
  createdAt,
}: {
  body: string;
  authorName: string;
  tags: StaffRole[];
  acks: { user: UserRow; seenAt: string }[];
  createdAt: string;
}) {
  const seenIds = new Set(acks.map((a) => a.user.id));
  return (
    <div className="my-1 rounded-card border border-amber-light bg-amber-light/60 p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon name="ti-notes" size={14} className="text-amber" />
        <span className="text-label-strong text-amber">Internal note</span>
        <span className="text-micro text-text-muted">· {authorName} · {time(createdAt)}</span>
      </div>
      <p className="text-body text-text-primary">{body}</p>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-micro text-text-muted">Tagged:</span>
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-pill bg-card px-2 py-0.5 text-[10px] font-semibold text-navy"
            >
              {ROLE_LABELS[t]}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-1.5 border-t border-amber/20 pt-2">
        <Icon name="ti-eye" size={13} className="text-text-muted" />
        {acks.length === 0 ? (
          <span className="text-micro text-text-muted">Not yet seen</span>
        ) : (
          <span className="text-micro text-text-secondary">
            Seen by {acks.map((a) => a.user.fullName.split(" ")[0]).join(", ")}
          </span>
        )}
        {tags.length > seenIds.size && acks.length > 0 && (
          <span className="text-micro text-amber">· awaiting others</span>
        )}
      </div>
    </div>
  );
}
