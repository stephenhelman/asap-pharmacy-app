"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getNotifications } from "@/lib/dataProvider";
import { useMutations } from "@/lib/mutations";
import type { NotificationRow } from "@/lib/types";
import { Icon, cn } from "@/components/ui";

const TYPE_ICON: Record<string, string> = {
  ORDER_DUE: "ti-package",
  CONFIRM_DELIVERY: "ti-truck-delivery",
  SIGNATURE_REQUESTED: "ti-signature",
  ONBOARDING_STEP_NEEDED: "ti-clipboard-list",
  ORDER_INCOMPLETE: "ti-alert-triangle",
  DOSE_REMINDER: "ti-droplet",
  NEW_MESSAGE: "ti-message-2",
  DELIVERY_STATUS: "ti-truck",
  ONBOARDING_PROGRESS: "ti-progress",
  ORDER_STATUS: "ti-package",
  DATA_CHANGED: "ti-pencil",
  RENEWAL_REMINDER: "ti-calendar-clock",
};

/** Normalize fixture deep links to actual prototype routes. */
export function normalizeDeepLink(link: string): string {
  if (link.startsWith("/logs/new")) return "/logs?new=infusion";
  if (link.startsWith("/messages/")) return "/messages";
  if (link === "/onboarding") return "/";
  return link;
}

const ago = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function NotificationsBell({ patientId }: { patientId: string }) {
  const router = useRouter();
  const { seenNotifications, seeNotification } = useMutations();
  const [open, setOpen] = useState(false);

  const notifs = getNotifications(patientId);
  const isUnread = (n: NotificationRow) =>
    !seenNotifications[n.id] &&
    (n.flavor === "ACTIONABLE" ? !n.resolvedAt : !n.seenAt);
  const unreadCount = notifs.filter(isUnread).length;

  function activate(n: NotificationRow) {
    seeNotification(n.id);
    setOpen(false);
    router.push(normalizeDeepLink(n.deepLink));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-control text-navy active:bg-fill-control"
        aria-label="Notifications"
      >
        <Icon name={open ? "ti-bell-filled" : "ti-bell"} size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-card bg-red px-1 text-[9px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-11 z-40 w-[300px] overflow-hidden rounded-card border border-border bg-card shadow-float animate-sheet-up">
            <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
              <span className="text-title-card text-navy">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-pill bg-teal-light px-2 py-0.5 text-[10px] font-semibold text-teal-dark">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
                  <Icon name="ti-bell-check" size={26} className="text-teal" />
                  <p className="text-body-strong text-navy">You're all caught up</p>
                  <p className="text-micro text-text-muted">No notifications right now.</p>
                </div>
              ) : (
                notifs.slice(0, 6).map((n) => (
                  <NotifRow key={n.id} n={n} unread={isUnread(n)} onClick={() => activate(n)} />
                ))
              )}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                router.push("/notifications");
              }}
              className="flex w-full items-center justify-center gap-1.5 border-t border-border py-2.5 text-label-strong text-navy active:bg-fill-control"
            >
              View all
              <Icon name="ti-chevron-right" size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function NotifRow({
  n,
  unread,
  onClick,
}: {
  n: NotificationRow;
  unread: boolean;
  onClick: () => void;
}) {
  const actionable = n.flavor === "ACTIONABLE";
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 border-b border-border px-3.5 py-3 text-left transition-colors last:border-b-0 active:bg-fill-control",
        unread && "bg-teal-light/30",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-tile",
          actionable ? "bg-amber-light text-amber" : "bg-icon-tile text-navy-light",
        )}
      >
        <Icon name={TYPE_ICON[n.type] ?? "ti-bell"} size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="flex-1 truncate text-title-card text-text-primary">{n.title}</p>
          {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-teal" />}
        </div>
        {n.body && <p className="line-clamp-2 text-micro text-text-secondary">{n.body}</p>}
        <div className="mt-1 flex items-center gap-2">
          {actionable && (
            <span className="rounded-pill bg-amber-light px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber">
              Action needed
            </span>
          )}
          <span className="text-[10px] text-text-muted">{ago(n.createdAt)}</span>
        </div>
      </div>
    </button>
  );
}
