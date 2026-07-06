"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui";
import { useSession } from "@/lib/session";
import { PatientRecordContent } from "./PatientRecordContent";

/**
 * Desktop slide-in record pane (S3 responsive note). Overlays the roster/queue
 * from the right at higher z-index, behind a scrim; the table stays full-width
 * underneath. ⤢ opens the full profile in a new tab; ✕ closes.
 * On mobile the pane fills the screen (an honest collapse of the desktop grid).
 */
export function RecordPane({
  patientId,
  onClose,
}: {
  patientId: string | null;
  onClose: () => void;
}) {
  const { session } = useSession();

  function openFullProfile() {
    if (!patientId) return;
    // Encode the acting identity in the URL so the new tab boots as this staff
    // user viewing this patient. Script-opened → its Close can window.close().
    const as = session.staffId ? `?as=${session.staffId}` : "";
    window.open(`/patients/${patientId}${as}`, "_blank");
  }

  useEffect(() => {
    if (!patientId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [patientId, onClose]);

  if (!patientId) return null;

  // Portal to <body> so the scrim + pane escape the app-shell's shorter,
  // content-height container (which was clipping them mid-viewport) and size to
  // the real viewport (100dvh) instead.
  return createPortal(
    <>
      {/* scrim — full viewport, click-to-close */}
      <button
        aria-label="Close record"
        onClick={onClose}
        className="fixed inset-0 z-40 h-[100dvh] w-screen bg-[rgba(15,37,64,0.42)] backdrop-blur-[1.5px] animate-scrim-in"
      />
      {/* pane — pinned right, full viewport height, above the scrim. Internally a
          flex column: fixed header + internally-scrolling body (app-shell pattern) */}
      <div className="fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-[480px] flex-col bg-page shadow-pane animate-pane-in xl:border-l xl:border-border-strong">
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-3 py-2.5">
          <span className="pl-1 text-section uppercase text-text-muted">
            Patient record
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={openFullProfile}
              className="flex h-9 w-9 items-center justify-center rounded-control text-navy active:bg-fill-control"
              title="Open full profile in new tab"
            >
              <Icon name="ti-arrows-diagonal" size={18} />
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-control text-navy active:bg-fill-control"
              title="Close"
            >
              <Icon name="ti-x" size={18} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PatientRecordContent patientId={patientId} />
        </div>
      </div>
    </>,
    document.body,
  );
}
