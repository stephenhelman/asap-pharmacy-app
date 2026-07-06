"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSession } from "@/lib/session";
import { useMoreSheet } from "@/lib/moreSheet";
import { Icon, IconTile } from "@/components/ui";
import { PATIENT_MORE_NAV, STAFF_MORE_NAV } from "./nav-config";

/**
 * Mobile "More" as a quiet bottom sheet: lifts over the current screen with the
 * shared sheet-up + scrim motion (reduced-motion-safe from the Emil pass), so
 * the patient stays in context. Lists the same items the desktop spine/sidebar
 * unrolls. Dismiss by tapping the scrim, Escape, or choosing an item.
 */
export function MoreSheet() {
  const { isOpen, close } = useMoreSheet();
  const { session } = useSession();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const items = session.kind === "patient" ? PATIENT_MORE_NAV : STAFF_MORE_NAV;

  return createPortal(
    <div className="xl:hidden">
      {/* scrim */}
      <button
        aria-label="Close menu"
        onClick={close}
        className="fixed inset-0 z-40 h-[100dvh] w-screen bg-[rgba(15,37,64,0.42)] animate-scrim-in"
      />
      {/* sheet */}
      <div
        role="dialog"
        aria-label="More"
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-frame border-t border-border-strong bg-page shadow-float animate-sheet-up"
      >
        <div className="flex justify-center pt-2.5">
          <span className="h-1 w-9 rounded-pill bg-border-strong" />
        </div>
        <div className="px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3">
          <h2 className="mb-2 px-1 text-section uppercase text-text-muted">More</h2>
          <div className="overflow-hidden rounded-card border border-border bg-card [&>*+*]:border-t [&>*+*]:border-border">
            {items.map((it) => (
              <Link
                key={it.key}
                href={it.href}
                onClick={close}
                className="flex items-center gap-3 px-3.5 py-3 transition-colors active:bg-fill-control"
              >
                <IconTile name={it.icon} />
                <span className="flex-1 text-title-card text-text-primary">
                  {it.label}
                </span>
                <Icon name="ti-chevron-right" size={18} className="text-text-muted" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
