"use client";

import { useState } from "react";
import {
  getPatient,
  getIntakeChecklist,
  uploadDocumentSlot,
  clearDocumentSlot,
} from "@/lib/dataProvider";
import {
  Icon,
  BottomNav,
  StatusPill,
  NoticeInfo,
} from "@/components/ui";
import { PATIENT_NAV } from "./nav-config";
import { NotificationsBell } from "./NotificationsBell";
import { DocumentSlots } from "./intake/DocumentSlots";

/**
 * The Documents screen (§5.1.1) — the SAME itemized surface seeded during
 * intake, now the permanent doc manager. Each uploaded row gets
 * view · update · download · delete. Uploading a still-pending slot flips it in
 * the live db (and auto-resolves the intake needs-docs task).
 */
export function DocumentsScreen({ patientId }: { patientId: string }) {
  // A version tick so in-memory db mutations (upload/delete) re-render the list.
  const [, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);

  const p = getPatient(patientId);
  if (!p) return null;

  const slots = p.documentSlots;
  const checklist = getIntakeChecklist(p);
  const inIntake = p.lifecycle === "INTAKE" || p.lifecycle === "ONBOARDING";
  const requiredSlots = slots.filter((s) => s.required);
  const doneCount = requiredSlots.filter((s) => s.status === "UPLOADED").length;

  return (
    <div className="flex h-full flex-col xl:h-auto">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 pb-3 pt-4">
        <div>
          <p className="text-title-name text-navy">Documents</p>
          <p className="text-micro text-text-muted">
            {slots.length > 0
              ? `${doneCount} of ${requiredSlots.length} required uploaded`
              : "Your prescriptions, cards & letters"}
          </p>
        </div>
        <div className="xl:hidden">
          <NotificationsBell patientId={patientId} />
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 pt-3">
        {slots.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Icon name="ti-files-off" size={32} className="text-text-muted" />
            <p className="text-title-card text-navy">No documents yet</p>
            <p className="max-w-[260px] text-body text-text-secondary">
              Documents you share during setup and beyond live here.
            </p>
          </div>
        ) : (
          <>
            {inIntake && checklist.callout && (
              <div className="mb-3.5">
                <NoticeInfo icon="ti-info-circle">{checklist.callout}</NoticeInfo>
              </div>
            )}

            {requiredSlots.length > 0 && (
              <div className="mb-3 flex items-center justify-between">
                <span className="text-section uppercase text-text-muted">
                  Required
                </span>
                <StatusPill
                  tone={doneCount === requiredSlots.length ? "success" : "warning"}
                  icon={doneCount === requiredSlots.length ? "ti-circle-check" : "ti-progress"}
                >
                  {doneCount} of {requiredSlots.length}
                </StatusPill>
              </div>
            )}

            <DocumentSlots
              slots={slots}
              mode="manage"
              onUpload={(slot, ref) => {
                uploadDocumentSlot(slot.id, ref);
                bump();
              }}
              onDelete={(slot) => {
                clearDocumentSlot(slot.id);
                bump();
              }}
            />
          </>
        )}
      </main>

      <BottomNav items={PATIENT_NAV} activeKey="more" />
    </div>
  );
}
