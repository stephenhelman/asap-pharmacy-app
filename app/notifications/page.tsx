"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { getNotifications } from "@/lib/dataProvider";
import { useMutations } from "@/lib/mutations";
import type { NotificationRow } from "@/lib/types";
import { TopBarNav, Icon } from "@/components/ui";
import { NotifRow, normalizeDeepLink } from "@/components/screens/NotificationsBell";

export default function NotificationsPage() {
  const router = useRouter();
  const { session } = useSession();
  const { seenNotifications, seeNotification } = useMutations();
  const patientId = session.patientId ?? "pat_marcos";
  const notifs = getNotifications(patientId);

  const isUnread = (n: NotificationRow) =>
    !seenNotifications[n.id] &&
    (n.flavor === "ACTIONABLE" ? !n.resolvedAt : !n.seenAt);

  function activate(n: NotificationRow) {
    seeNotification(n.id);
    router.push(normalizeDeepLink(n.deepLink));
  }

  const actionable = notifs.filter((n) => n.flavor === "ACTIONABLE");
  const informational = notifs.filter((n) => n.flavor === "INFORMATIONAL");

  return (
    <div className="flex h-full flex-col xl:h-auto">
      <TopBarNav title="Notifications" onDismiss={() => router.push("/")} />
      <main className="flex-1 min-h-0 overflow-y-auto">
        {notifs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <Icon name="ti-bell-check" size={34} className="text-teal" />
            <p className="text-title-card text-navy">You're all caught up</p>
            <p className="max-w-[240px] text-body text-text-secondary">
              Nothing needs your attention right now.
            </p>
          </div>
        ) : (
          <>
            {actionable.length > 0 && (
              <Section title="Needs your attention">
                {actionable.map((n) => (
                  <NotifRow key={n.id} n={n} unread={isUnread(n)} onClick={() => activate(n)} />
                ))}
              </Section>
            )}
            {informational.length > 0 && (
              <Section title="Updates">
                {informational.map((n) => (
                  <NotifRow key={n.id} n={n} unread={isUnread(n)} onClick={() => activate(n)} />
                ))}
              </Section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="bg-page px-4 py-2 text-section uppercase text-text-muted">{title}</p>
      {children}
    </section>
  );
}
