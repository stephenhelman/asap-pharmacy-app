"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useDraft } from "@/lib/draft";
import {
  otpService,
  patientService,
  referralService,
  DEMO_OTP,
  type ReferralResult,
} from "@/lib/services";
import type {
  HemophiliaType,
  Severity,
  PreferredChannel,
} from "@/lib/types";
import {
  Button,
  Icon,
  TopBarNav,
  ProgressBar,
  SectionLabel,
  Card,
  FieldText,
  SignaturePad,
  NoticeInfo,
  NoticeCareteam,
  StatusPill,
  cn,
} from "@/components/ui";
import { DocumentSlots } from "./intake/DocumentSlots";

// The per-on-ramp step sequences. Both converge on the patient-authenticated
// tail (confirm → otp → … → docs → hipaa → done).
const STEPS = {
  rep_led: [
    "primer",
    "rep_data",
    "send",
    "confirm",
    "otp",
    "docs",
    "hipaa",
    "done",
  ],
  patient_led: [
    "send",
    "patient_entry",
    "confirm",
    "otp",
    "info",
    "docs",
    "hipaa",
    "done",
  ],
} as const;

type Step = (typeof STEPS)[keyof typeof STEPS][number];

export function IntakeFlow() {
  const router = useRouter();
  const { draft } = useDraft();

  // No active draft (stray deep-link / refresh) → nothing to build; go home.
  useEffect(() => {
    if (!draft) router.replace("/");
  }, [draft, router]);

  const steps = useMemo<readonly Step[]>(
    () => (draft ? STEPS[draft.onRamp] : STEPS.patient_led),
    [draft],
  );
  const [idx, setIdx] = useState(0);

  if (!draft) return null;

  const step = steps[idx];
  const next = () => setIdx((i) => Math.min(steps.length - 1, i + 1));
  const back = () => (idx > 0 ? setIdx((i) => i - 1) : router.push("/"));

  // Progress excludes the terminal "done" confirmation.
  const totalProgress = steps.length - 1;

  return (
    <div className="flex h-full flex-col xl:h-auto md:mx-auto md:w-full md:max-w-[600px]">
      <TopBarNav
        title={draft.onRamp === "rep_led" ? "New patient · rep-led" : "New patient"}
        mode={idx === 0 ? "close" : "back"}
        onDismiss={back}
      />
      {step !== "done" && (
        <div className="border-b border-border bg-card px-4 py-2.5">
          <ProgressBar total={totalProgress} done={idx + 1} showCount={false} />
        </div>
      )}

      <main className="flex-1 min-h-0 overflow-y-auto p-4">
        {step === "primer" && <PrimerStep onContinue={next} />}
        {step === "rep_data" && <RepDataStep onContinue={next} />}
        {step === "send" && <SendStep onOpenAsPatient={next} />}
        {step === "patient_entry" && <PatientEntryStep onContinue={next} />}
        {step === "confirm" && <ConfirmInfoStep onContinue={next} />}
        {step === "otp" && <OtpStep onContinue={next} />}
        {step === "info" && <IntakeDataStep onContinue={next} />}
        {step === "docs" && <DocsStep onContinue={next} />}
        {step === "hipaa" && <HipaaStep onContinue={next} />}
        {step === "done" && <DoneStep />}
      </main>
    </div>
  );
}

// ── Prompt helpers (shared with the questionnaire idiom) ────────────────────
function Prompt({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-body-strong text-text-primary">{children}</p>;
}
function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-label text-text-muted">{label}</label>
      <FieldText value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

// ── Step 1 (rep-led) — primer / rules ───────────────────────────────────────
function PrimerStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col">
      <div className="mb-4 flex flex-col items-center gap-2 py-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-icon-tile">
          <Icon name="ti-clipboard-heart" size={28} className="text-navy" />
        </div>
        <p className="text-h2 text-navy">Before you start</p>
        <p className="max-w-[320px] text-body text-text-secondary">
          You&apos;ll enter the patient&apos;s information, then hand off for the
          parts only they can complete.
        </p>
      </div>

      <RuleCard
        icon="ti-user-check"
        title="You complete data — never a consent"
        body="Enter their details on their behalf. HIPAA and SMS consent can only be given by the patient themselves."
      />
      <RuleCard
        icon="ti-photo-up"
        title="The patient uploads their own documents"
        body="ID, insurance card, and prescription photo are captured after you send the link — the patient must be available for that."
      />
      <RuleCard
        icon="ti-shield-lock"
        title="Contact stays on Do-Not-Disturb until they consent"
        body="The system can never text a not-yet-consented number. DND lifts only when the patient opts in."
      />

      <div className="mt-4">
        <Button variant="primary" block icon="ti-arrow-right" onClick={onContinue}>
          I understand — start
        </Button>
      </div>
    </div>
  );
}

function RuleCard({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <Card padding="14" className="mb-2">
      <div className="flex gap-3">
        <Icon name={icon} size={20} className="mt-0.5 shrink-0 text-teal" />
        <div>
          <p className="text-title-card text-navy">{title}</p>
          <p className="mt-0.5 text-micro text-text-muted">{body}</p>
        </div>
      </div>
    </Card>
  );
}

// ── Step 2 (rep-led) — rep fills the intake data ────────────────────────────
function RepDataStep({ onContinue }: { onContinue: () => void }) {
  const { draft, updatePatient } = useDraft();
  const p = draft!.patient;
  const canContinue = p.firstName && p.lastName && p.phone;

  return (
    <div className="flex flex-col">
      <NoticeInfo icon="ti-user-edit">
        You&apos;re entering this on the patient&apos;s behalf (Assisted-By). Consents
        and documents come later, from the patient.
      </NoticeInfo>
      <div className="h-4" />

      <SectionLabel className="mb-2">Identity</SectionLabel>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="First name" value={p.firstName} onChange={(v) => updatePatient({ firstName: v })} placeholder="Jane" />
        <Field label="Last name" value={p.lastName} onChange={(v) => updatePatient({ lastName: v })} placeholder="Doe" />
      </div>
      <Field label="Phone" value={p.phone} onChange={(v) => updatePatient({ phone: v })} placeholder="+1 915 555 0100" />
      <Field label="Email" value={p.email ?? ""} onChange={(v) => updatePatient({ email: v })} placeholder="jane@example.com" />

      <div className="h-2" />
      <SectionLabel className="mb-2">Address</SectionLabel>
      <Field label="Street" value={p.addressLine1 ?? ""} onChange={(v) => updatePatient({ addressLine1: v })} placeholder="123 Main St" />
      <div className="grid grid-cols-3 gap-x-3">
        <div className="col-span-1"><Field label="City" value={p.city ?? ""} onChange={(v) => updatePatient({ city: v })} /></div>
        <div className="col-span-1"><Field label="State" value={p.state ?? ""} onChange={(v) => updatePatient({ state: v })} /></div>
        <div className="col-span-1"><Field label="ZIP" value={p.zip ?? ""} onChange={(v) => updatePatient({ zip: v })} /></div>
      </div>
      <DobField />

      <DisorderFields />
      <PrescriberFields />

      <div className="mt-4">
        <Button variant="primary" block icon="ti-arrow-right" disabled={!canContinue} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}

// Disorder (type / severity) — shared by rep-led data + patient-led info steps.
function DisorderFields() {
  const { draft, updatePatient } = useDraft();
  const p = draft!.patient;
  return (
    <>
      <div className="h-2" />
      <SectionLabel className="mb-2">Bleeding disorder</SectionLabel>
      <Prompt>Type</Prompt>
      <div className="relative">
        <select
          value={p.hemophiliaType === "OTHER" ? "A" : p.hemophiliaType}
          onChange={(e) =>
            updatePatient({ hemophiliaType: e.target.value as HemophiliaType })
          }
          className="w-full appearance-none rounded-control border border-border bg-card px-3 py-3 pr-9 text-body text-text-primary focus:border-navy focus:outline-none"
        >
          <option value="A">Hemophilia A</option>
          <option value="B">Hemophilia B</option>
        </select>
        <Icon
          name="ti-chevron-down"
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-micro text-text-muted">
        <Icon name="ti-info-circle" size={13} />
        More bleeding disorders coming soon.
      </p>
      <div className="h-3" />
      <Prompt>Severity</Prompt>
      <div className="grid grid-cols-3 gap-2">
        {(["MILD", "MODERATE", "SEVERE"] as Severity[]).map((s) => (
          <button
            key={s}
            onClick={() => updatePatient({ severity: s })}
            className={cn(
              "h-10 rounded-control text-label-strong capitalize transition-colors",
              p.severity === s
                ? "border-[1.5px] border-navy bg-icon-tile text-navy"
                : "border border-border-strong bg-card text-text-secondary",
            )}
          >
            {s.toLowerCase()}
          </button>
        ))}
      </div>
    </>
  );
}

function PrescriberFields() {
  const { draft, updatePatient } = useDraft();
  const p = draft!.patient;
  return (
    <>
      <div className="h-2" />
      <SectionLabel className="mb-2">
        Prescriber <span className="lowercase text-text-muted">(optional now)</span>
      </SectionLabel>
      <Field label="Prescriber name" value={p.prescriberName ?? ""} onChange={(v) => updatePatient({ prescriberName: v })} placeholder="Dr. …" />
      <Field label="Practice" value={p.prescriberPractice ?? ""} onChange={(v) => updatePatient({ prescriberPractice: v })} />
      <Field label="Prescriber phone" value={p.prescriberPhone ?? ""} onChange={(v) => updatePatient({ prescriberPhone: v })} />
    </>
  );
}

// ── Step (both) — "Send to Patient" ─────────────────────────────────────────
function SendStep({ onOpenAsPatient }: { onOpenAsPatient: () => void }) {
  const { session } = useSession();
  const { draft } = useDraft();
  const [result, setResult] = useState<ReferralResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    const res = await referralService.send({
      referringRepId: session.staffId ?? "usr_jennifer",
      draftId: draft!.patient.id,
      patientName:
        `${draft!.patient.firstName} ${draft!.patient.lastName}`.trim() ||
        undefined,
    });
    setResult(res);
    setSending(false);
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex flex-col items-center gap-2 py-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-icon-tile">
          <Icon name="ti-send" size={26} className="text-navy" />
        </div>
        <p className="text-h2 text-navy">Send to patient</p>
        <p className="max-w-[320px] text-body text-text-secondary">
          Generate a secure, single-use link. Send it from your work phone or
          email — the patient completes their consents and documents.
        </p>
      </div>

      {!result ? (
        <Button variant="primary" block icon="ti-link" disabled={sending} onClick={send}>
          {sending ? "Generating…" : "Generate patient link"}
        </Button>
      ) : (
        <>
          <NoticeInfo icon="ti-circle-check">
            Sent to patient. The link expires in 24 hours and can be opened once.
          </NoticeInfo>
          <div className="my-2.5" />
          <SectionLabel className="mb-2">Patient link</SectionLabel>
          <div className="flex items-center gap-2 rounded-control border border-border bg-card px-3 py-2.5">
            <Icon name="ti-link" size={15} className="shrink-0 text-text-muted" />
            <span className="min-w-0 flex-1 truncate text-body text-text-secondary">
              {result.link}
            </span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(result.link).catch(() => {});
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              }}
              className="inline-flex h-7 items-center gap-1 rounded-control bg-fill-control px-2 text-label-strong text-navy"
            >
              <Icon name={copied ? "ti-check" : "ti-copy"} size={14} />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-4 rounded-card border border-dashed border-border-strong bg-page p-3.5">
            <p className="mb-1 flex items-center gap-1.5 text-label-strong text-navy">
              <Icon name="ti-device-mobile" size={15} className="text-teal" />
              Demo
            </p>
            <p className="mb-3 text-micro text-text-muted">
              In production the patient opens this on their own device. Here,
              continue the flow as the patient:
            </p>
            <Button variant="secondary" block icon="ti-external-link" onClick={onOpenAsPatient}>
              Open as patient
            </Button>
          </div>

          <p className="mt-4 text-center text-micro text-text-muted">
            Your part is done — the contact was created with Do-Not-Disturb on.
          </p>
        </>
      )}
    </div>
  );
}

// ── Step (patient-led) — patient enters name / phone / email ────────────────
function PatientEntryStep({ onContinue }: { onContinue: () => void }) {
  const { draft, updatePatient } = useDraft();
  const p = draft!.patient;
  const canContinue = p.firstName && p.lastName && p.phone;
  return (
    <div className="flex flex-col">
      <div className="mb-3 flex flex-col items-center gap-1.5 py-1 text-center">
        <p className="text-h2 text-navy">Welcome to ASAP</p>
        <p className="max-w-[300px] text-body text-text-secondary">
          Let&apos;s get you set up. First, how do we reach you?
        </p>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="First name" value={p.firstName} onChange={(v) => updatePatient({ firstName: v })} placeholder="Jane" />
        <Field label="Last name" value={p.lastName} onChange={(v) => updatePatient({ lastName: v })} placeholder="Doe" />
      </div>
      <Field label="Phone" value={p.phone} onChange={(v) => updatePatient({ phone: v })} placeholder="+1 915 555 0100" />
      <Field label="Email" value={p.email ?? ""} onChange={(v) => updatePatient({ email: v })} placeholder="jane@example.com" />
      <div className="mt-3">
        <Button variant="primary" block icon="ti-arrow-right" disabled={!canContinue} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}

// ── Step (both) — confirm-your-info (triple duty) ───────────────────────────
function ConfirmInfoStep({ onContinue }: { onContinue: () => void }) {
  const { draft, updatePatient } = useDraft();
  const p = draft!.patient;

  function continueOn() {
    // Channel routing resolves at consent: DND lifts iff SMS-consented.
    updatePatient({ dndEnabled: !p.smsConsent });
    onContinue();
  }

  const preferOptions: { key: PreferredChannel; label: string; icon: string; enabled: boolean }[] = [
    { key: "SMS", label: "Text", icon: "ti-message", enabled: p.smsConsent },
    { key: "EMAIL", label: "Email", icon: "ti-mail", enabled: p.emailConsent },
    { key: "CALL", label: "Call", icon: "ti-phone", enabled: true },
  ];

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex flex-col items-center gap-1.5 py-1 text-center">
        <p className="text-h2 text-navy">Confirm your details</p>
        <p className="max-w-[300px] text-body text-text-secondary">
          Make sure this is right — you can edit anything here.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-3">
        <Field label="First name" value={p.firstName} onChange={(v) => updatePatient({ firstName: v })} />
        <Field label="Last name" value={p.lastName} onChange={(v) => updatePatient({ lastName: v })} />
      </div>
      <Field label="Phone" value={p.phone} onChange={(v) => updatePatient({ phone: v })} />
      <Field label="Email" value={p.email ?? ""} onChange={(v) => updatePatient({ email: v })} />

      <div className="h-2" />
      <SectionLabel className="mb-2">How can we reach you?</SectionLabel>
      <ConsentToggle
        label="Text messages (SMS)"
        sub="Order reminders, delivery updates & your rep"
        on={p.smsConsent}
        onChange={(v) => updatePatient({ smsConsent: v })}
      />
      <ConsentToggle
        label="Email"
        sub="Confirmations and documents"
        on={p.emailConsent}
        onChange={(v) => updatePatient({ emailConsent: v })}
      />

      <div className="h-3" />
      <Prompt>Preferred method</Prompt>
      <div className="grid grid-cols-3 gap-2">
        {preferOptions.map((o) => (
          <button
            key={o.key}
            disabled={!o.enabled}
            onClick={() => updatePatient({ preferredChannel: o.key })}
            className={cn(
              "flex h-14 flex-col items-center justify-center gap-1 rounded-control text-label-strong transition-colors disabled:opacity-40",
              p.preferredChannel === o.key
                ? "border-[1.5px] border-navy bg-icon-tile text-navy"
                : "border border-border-strong bg-card text-text-secondary",
            )}
          >
            <Icon name={o.icon} size={17} className="text-teal" />
            {o.label}
          </button>
        ))}
      </div>
      {!p.smsConsent && (
        <p className="mt-2 flex items-center gap-1.5 text-micro text-text-muted">
          <Icon name="ti-info-circle" size={13} />
          Without SMS consent we&apos;ll reach you by email only.
        </p>
      )}

      <div className="mt-5">
        <Button
          variant="primary"
          block
          icon="ti-arrow-right"
          disabled={!p.smsConsent && !p.emailConsent}
          onClick={continueOn}
        >
          Confirm &amp; continue
        </Button>
      </div>
      <div className="mt-3">
        <NoticeCareteam>
          Your consent is yours to give — no one can give it for you.
        </NoticeCareteam>
      </div>
    </div>
  );
}

function ConsentToggle({
  label,
  sub,
  on,
  onChange,
}: {
  label: string;
  sub: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="mb-2 flex w-full items-center gap-3 rounded-control border border-border bg-card p-3 text-left"
    >
      <Icon
        name={on ? "ti-square-check" : "ti-square"}
        size={22}
        className={on ? "text-teal" : "text-border-strong"}
      />
      <div className="flex-1">
        <p className="text-title-card text-text-primary">{label}</p>
        <p className="text-micro text-text-muted">{sub}</p>
      </div>
    </button>
  );
}

// ── Step (both) — OTP ───────────────────────────────────────────────────────
function OtpStep({ onContinue }: { onContinue: () => void }) {
  const { draft, markAccountCreated } = useDraft();
  const p = draft!.patient;
  const channel = p.preferredChannel === "EMAIL" ? "EMAIL" : "SMS";
  const target = channel === "EMAIL" ? p.email ?? "your email" : p.phone;

  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [created, setCreated] = useState(false);

  // "Send" the code on mount (no-op success).
  useEffect(() => {
    otpService.send({ channel, to: target }).catch(() => {});
  }, [channel, target]);

  async function verify() {
    setVerifying(true);
    const res = await otpService.verify(code);
    setVerifying(false);
    if (!res.ok) {
      setError(true);
      return;
    }
    // account created (false success); DND already resolved on the confirm step.
    await patientService.create();
    markAccountCreated();
    setCreated(true);
  }

  if (created) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-light">
          <Icon name="ti-user-check" size={34} className="text-teal" />
        </div>
        <div>
          <p className="text-h2 text-navy">Account created</p>
          <p className="mt-1 max-w-[280px] text-body text-text-secondary">
            You&apos;re verified. Just a few more details and you&apos;re done.
          </p>
        </div>
        <Button variant="primary" block icon="ti-arrow-right" onClick={onContinue}>
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex flex-col items-center gap-1.5 py-1 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-icon-tile">
          <Icon name={channel === "EMAIL" ? "ti-mail" : "ti-message"} size={26} className="text-navy" />
        </div>
        <p className="text-h2 text-navy">Verify it&apos;s you</p>
        <p className="max-w-[300px] text-body text-text-secondary">
          We sent a code to <span className="text-text-primary">{target}</span>.
          Enter it below.
        </p>
      </div>

      <input
        inputMode="numeric"
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          setError(false);
        }}
        placeholder="000-000"
        className={cn(
          "w-full rounded-control border bg-card px-3 py-3.5 text-center text-h2 tracking-[0.3em] text-navy placeholder:text-border-strong focus:outline-none",
          error ? "border-red" : "border-border focus:border-navy",
        )}
      />
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-micro text-red">
          <Icon name="ti-alert-circle" size={13} /> That code didn&apos;t match. Try
          {" "}
          {DEMO_OTP}.
        </p>
      )}

      <div className="mt-3 rounded-card bg-teal-light px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-micro text-teal-dark">
          <Icon name="ti-bulb" size={14} /> Demo: enter{" "}
          <span className="font-semibold">{DEMO_OTP}</span>
        </p>
      </div>

      <div className="mt-5">
        <Button
          variant="primary"
          block
          icon="ti-circle-check"
          disabled={verifying || code.replace(/\D/g, "").length < 6}
          onClick={verify}
        >
          {verifying ? "Verifying…" : "Verify"}
        </Button>
      </div>
    </div>
  );
}

// ── Step (patient-led) — intake data ────────────────────────────────────────
function IntakeDataStep({ onContinue }: { onContinue: () => void }) {
  const { draft, updatePatient } = useDraft();
  const p = draft!.patient;
  return (
    <div className="flex flex-col">
      <div className="mb-3 flex flex-col items-center gap-1.5 py-1 text-center">
        <p className="text-h2 text-navy">A little about you</p>
        <p className="max-w-[300px] text-body text-text-secondary">
          Your address and care details, so we can ship and coordinate.
        </p>
      </div>

      <SectionLabel className="mb-2">Address</SectionLabel>
      <Field label="Street" value={p.addressLine1 ?? ""} onChange={(v) => updatePatient({ addressLine1: v })} placeholder="123 Main St" />
      <div className="grid grid-cols-3 gap-x-3">
        <Field label="City" value={p.city ?? ""} onChange={(v) => updatePatient({ city: v })} />
        <Field label="State" value={p.state ?? ""} onChange={(v) => updatePatient({ state: v })} />
        <Field label="ZIP" value={p.zip ?? ""} onChange={(v) => updatePatient({ zip: v })} />
      </div>
      <DobField />

      <DisorderFields />
      <PrescriberFields />

      <div className="mt-3">
        <NoticeInfo icon="ti-cards">
          Insurance: your card photo (next step) is the record. You can add card
          details manually later — we don&apos;t auto-read the image in v1.
        </NoticeInfo>
      </div>

      <div className="mt-4">
        <Button variant="primary" block icon="ti-arrow-right" onClick={onContinue}>
          Continue to documents
        </Button>
      </div>
    </div>
  );
}

// ── Step (both) — itemized document uploads (partial-able) ──────────────────
function DocsStep({ onContinue }: { onContinue: () => void }) {
  const { draft, setDocSlot } = useDraft();
  // Diagnosis letter is a nice-to-have on the permanent Documents screen only —
  // it is not part of the intake step (still seeded in the draft so it appears
  // there post-intake).
  const slots = draft!.docSlots.filter((s) => s.type !== "DIAGNOSIS_LETTER");
  const requiredSlots = slots.filter((s) => s.required);
  const doneCount = requiredSlots.filter((s) => s.status === "UPLOADED").length;
  const allRequired = doneCount === requiredSlots.length;

  return (
    <div className="flex flex-col">
      <div className="mb-3">
        <p className="mb-1 text-h2 text-navy">Your documents</p>
        <p className="text-body text-text-secondary">
          Upload what you have now — you can add the rest later.
        </p>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-control bg-page px-3 py-2">
        <span className="text-label text-text-muted">Required documents</span>
        <StatusPill tone={allRequired ? "success" : "warning"} icon={allRequired ? "ti-circle-check" : "ti-progress"}>
          {doneCount} of {requiredSlots.length}
        </StatusPill>
      </div>

      <DocumentSlots
        slots={slots}
        mode="intake"
        onUpload={(slot, ref) => setDocSlot(slot.type, "UPLOADED", ref)}
      />

      <div className="mt-5">
        <Button variant="primary" block icon="ti-arrow-right" onClick={onContinue}>
          {allRequired ? "Continue" : "Continue — I'll add the rest later"}
        </Button>
      </div>
      {!allRequired && (
        <p className="mt-2 text-center text-micro text-text-muted">
          You can finish and upload the rest from your dashboard.
        </p>
      )}
    </div>
  );
}

// ── Step (both) — HIPAA consent + eSign ─────────────────────────────────────
function HipaaStep({ onContinue }: { onContinue: () => void }) {
  const { draft, updatePatient } = useDraft();
  const p = draft!.patient;
  const fullName = `${p.firstName} ${p.lastName}`.trim() || "Patient";
  const signed = !!p.hipaaConsentedAt;

  return (
    <div className="flex flex-col">
      <div className="mb-3">
        <p className="mb-1 text-h2 text-navy">Privacy consent</p>
        <p className="text-body text-text-secondary">
          One last thing — your HIPAA acknowledgment.
        </p>
      </div>

      <Card padding="14" className="mb-4">
        <p className="text-micro leading-relaxed text-text-secondary">
          I authorize ASAP Pharmacy to use and disclose my protected health
          information (PHI) for treatment, payment, and health-care operations, and
          to coordinate with my prescriber and insurer as needed to fill my
          prescriptions. I understand I may revoke this authorization in writing at
          any time. This acknowledges receipt of ASAP Pharmacy&apos;s Notice of
          Privacy Practices.
        </p>
        <p className="mt-2 text-micro text-text-muted">
          The pharmacy&apos;s full consent paragraph is swapped in here at launch.
        </p>
      </Card>

      <SectionLabel className="mb-2">Sign to consent</SectionLabel>
      <SignaturePad
        signed={signed}
        signedName={fullName}
        onSign={() =>
          updatePatient({
            hipaaConsentedAt: signed
              ? null
              : new Date().toISOString(),
            hipaaSignedBy: signed ? null : fullName,
          })
        }
      />
      <p className="mb-5 mt-1.5 flex items-center gap-1.5 text-micro text-text-muted">
        <Icon name="ti-shield-lock" size={13} />
        Only you can give this consent.
      </p>

      <Button variant="primary" block icon="ti-circle-check" disabled={!signed} onClick={onContinue}>
        Finish intake
      </Button>
    </div>
  );
}

// ── Step — finish → commit + promote to session identity → dashboard ────────
function DoneStep() {
  const router = useRouter();
  const { draft, commitDraft } = useDraft();
  const { loginAsPatient } = useSession();
  const [promoting, setPromoting] = useState(false);

  const name = draft ? draft.patient.firstName || "there" : "there";

  function finish() {
    setPromoting(true);
    const id = commitDraft();
    if (id) {
      loginAsPatient(id);
      router.push("/");
    } else {
      router.push("/");
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-light">
        <Icon name="ti-confetti" size={34} className="text-teal" />
      </div>
      <div>
        <p className="text-h2 text-navy">You&apos;re all set, {name}</p>
        <p className="mt-1 max-w-[290px] text-body text-text-secondary">
          Your account is ready. We&apos;ll take it from here and reach out if we
          need anything.
        </p>
      </div>
      <Button variant="primary" block icon="ti-home" disabled={promoting} onClick={finish}>
        Go to my dashboard
      </Button>
    </div>
  );
}

// ── DOB field — masks mm-dd-yyyy for entry/display, stores ISO underneath ────
// Local state holds the masked text so partial typing isn't clobbered by the
// ISO round-trip; the draft only receives a valid ISO date (or "" until valid).
function DobField() {
  const { draft, updatePatient } = useDraft();
  const [text, setText] = useState(() => isoToMask(draft!.patient.dob));

  function onChange(v: string) {
    const masked = maskDob(v);
    setText(masked);
    updatePatient({ dob: maskToIso(masked) });
  }

  return (
    <div className="mb-3">
      <label className="mb-1 block text-label text-text-muted">Date of birth</label>
      <FieldText value={text} onChange={onChange} placeholder="mm-dd-yyyy" />
    </div>
  );
}

/** Format free digits as mm-dd-yyyy (dashes inserted after 2 and 4 digits). */
function maskDob(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  const mm = d.slice(0, 2);
  const dd = d.slice(2, 4);
  const yyyy = d.slice(4, 8);
  let out = mm;
  if (d.length > 2) out += "-" + dd;
  if (d.length > 4) out += "-" + yyyy;
  return out;
}

/** mm-dd-yyyy → ISO (midnight UTC), or "" if not a complete/valid date. */
function maskToIso(m: string): string {
  const mt = /^(\d{2})-(\d{2})-(\d{4})$/.exec(m);
  if (!mt) return "";
  const [, mm, dd, yyyy] = mt;
  const mo = +mm;
  const da = +dd;
  if (mo < 1 || mo > 12 || da < 1 || da > 31) return "";
  return `${yyyy}-${mm}-${dd}T00:00:00Z`;
}

/** ISO (YYYY-MM-DD…) → mm-dd-yyyy for display; "" when empty. */
function isoToMask(iso: string): string {
  const mt = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return mt ? `${mt[2]}-${mt[3]}-${mt[1]}` : "";
}
