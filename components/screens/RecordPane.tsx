"use client";

import { useEffect } from "react";
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

  return (
    <div className="absolute inset-0 z-30 flex justify-end">
      {/* scrim */}
      <button
        aria-label="Close record"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(15,37,64,0.42)] backdrop-blur-[1.5px] animate-scrim-in"
      />
      {/* pane — full-width within the phone frame (mobile); a fixed-width panel
          sliding in over the table on the desktop canvas */}
      <div className="relative flex h-full w-full flex-col bg-page shadow-pane animate-pane-in lg:w-[480px] lg:border-l lg:border-border-strong">
        <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2.5">
          <span className="pl-1 text-label uppercase tracking-wide text-text-muted">
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
    </div>
  );
}
