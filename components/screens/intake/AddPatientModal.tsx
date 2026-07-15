"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useDraft } from "@/lib/draft";
import { Modal, Icon, cn } from "@/components/ui";

/**
 * Origin (§5.1.1) — the rep-only "Add new" affordance. Two on-ramps that both
 * end in the same intake flow: "Complete Myself" (rep-led) and "Send to Patient"
 * (patient-led). Starting either creates the transient draft, then routes into
 * the flow.
 */
export function AddPatientModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { session } = useSession();
  const { startDraft } = useDraft();

  function begin(onRamp: "rep_led" | "patient_led") {
    startDraft(onRamp, session.staffId);
    onClose();
    router.push("/intake");
  }

  return (
    <Modal title="Add a new patient" onClose={onClose}>
      <p className="mb-4 text-body text-text-secondary">
        Every patient starts with an invite. Choose how you want to bring this one
        on.
      </p>
      <div className="flex flex-col gap-2.5">
        <OnRampCard
          icon="ti-edit"
          title="Complete myself"
          sub="You enter their information now, then send them a link for consents & documents."
          tag="Rep-led"
          onClick={() => begin("rep_led")}
        />
        <OnRampCard
          icon="ti-send"
          title="Send to patient"
          sub="Generate a link and text it from your work phone. The patient fills everything in."
          tag="Patient-led"
          onClick={() => begin("patient_led")}
        />
      </div>
    </Modal>
  );
}

function OnRampCard({
  icon,
  title,
  sub,
  tag,
  onClick,
}: {
  icon: string;
  title: string;
  sub: string;
  tag: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-card border border-border-strong bg-card p-4 text-left transition-colors active:bg-fill-control",
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-tile bg-icon-tile">
        <Icon name={icon} size={22} className="text-navy" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-title-card text-navy">{title}</p>
          <span className="rounded-pill bg-teal-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-dark">
            {tag}
          </span>
        </div>
        <p className="mt-0.5 text-micro text-text-muted">{sub}</p>
      </div>
      <Icon name="ti-chevron-right" size={18} className="mt-2 text-text-muted" />
    </button>
  );
}
