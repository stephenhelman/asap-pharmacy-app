"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, roleSummary } from "@/lib/session";
import { getPatients, getStaff } from "@/lib/dataProvider";
import { Avatar, Button, Icon, cn } from "@/components/ui";

/**
 * The "log in as" switcher — prototype-only stand-in for auth. A two-step
 * chooser (type → identity → Log in) that sets `session`. The whole app
 * re-renders from the same components as the chosen identity: the portal-collapse
 * proof. In production this widget is the ONLY thing that goes away.
 */
export function LoginSwitcher() {
  const { session, loginAsPatient, loginAsStaff } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"type" | "list">("type");
  const [type, setType] = useState<"patient" | "staff" | null>(null);
  const [choice, setChoice] = useState<string | null>(null);

  const patients = getPatients();
  const staff = getStaff();

  function start() {
    setStep("type");
    setType(null);
    setChoice(null);
    setOpen(true);
  }

  function commit() {
    if (!choice || !type) return;
    if (type === "patient") loginAsPatient(choice);
    else loginAsStaff(choice);
    setOpen(false);
    router.push("/");
  }

  return (
    <>
      {/* Floating pill showing current identity */}
      <button
        onClick={start}
        className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-pill border border-navy-light/40 bg-navy-dark py-2 pl-2 pr-3.5 text-white shadow-float"
      >
        <Avatar name={session.user.name} size={26} tone="teal" />
        <span className="flex flex-col items-start leading-tight">
          <span className="text-label-strong">{session.user.name}</span>
          <span className="text-[10px] text-teal-mid">
            {session.kind === "patient"
              ? "Patient"
              : roleSummary(session.roles)}
          </span>
        </span>
        <Icon name="ti-switch-horizontal" size={16} className="ml-1 text-teal-mid" />
      </button>

      {!open ? null : (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-navy-dark/40 backdrop-blur-[2px] animate-scrim-in"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 flex max-h-[80vh] w-full max-w-[420px] flex-col rounded-t-frame bg-page shadow-float animate-sheet-up sm:rounded-frame">
            {/* header */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
              {step === "list" && (
                <button
                  onClick={() => setStep("type")}
                  className="-ml-1.5 flex h-8 w-8 items-center justify-center rounded-control text-navy active:bg-fill-control"
                >
                  <Icon name="ti-arrow-left" size={18} />
                </button>
              )}
              <div className="flex-1">
                <p className="text-title-card">Log in as…</p>
                <p className="text-micro text-text-muted">
                  Prototype identity switcher — stands in for auth
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-control text-text-muted active:bg-fill-control"
              >
                <Icon name="ti-x" size={18} />
              </button>
            </div>

            {/* body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {step === "type" ? (
                <div className="grid grid-cols-2 gap-3">
                  <TypeCard
                    icon="ti-user-heart"
                    label="Patient"
                    sub={`${patients.length} people`}
                    active={type === "patient"}
                    onClick={() => {
                      setType("patient");
                      setChoice(null);
                      setStep("list");
                    }}
                  />
                  <TypeCard
                    icon="ti-briefcase"
                    label="Staff"
                    sub={`${staff.length} people`}
                    active={type === "staff"}
                    onClick={() => {
                      setType("staff");
                      setChoice(null);
                      setStep("list");
                    }}
                  />
                </div>
              ) : type === "patient" ? (
                <ul className="flex flex-col gap-1.5">
                  {patients.map((p) => (
                    <IdentityRow
                      key={p.id}
                      name={`${p.firstName} ${p.lastName}`}
                      sub={
                        p.lifecycle === "ACTIVE"
                          ? "Active"
                          : p.lifecycle === "ONBOARDING"
                            ? "Onboarding"
                            : "Transferred out"
                      }
                      selected={choice === p.id}
                      onClick={() => setChoice(p.id)}
                    />
                  ))}
                </ul>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {staff.map((u) => (
                    <IdentityRow
                      key={u.id}
                      name={u.fullName}
                      sub={roleSummary(u.roles)}
                      badge={u.roles.length >= 4 ? "Does everything" : undefined}
                      selected={choice === u.id}
                      onClick={() => setChoice(u.id)}
                    />
                  ))}
                </ul>
              )}
            </div>

            {/* footer */}
            <div className="border-t border-border p-4">
              <Button
                variant="primary"
                block
                disabled={!choice}
                onClick={commit}
                icon="ti-login-2"
              >
                Log in
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TypeCard({
  icon,
  label,
  sub,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-card border bg-card px-4 py-6 transition-colors",
        active ? "border-[1.5px] border-navy" : "border-border-strong",
      )}
    >
      <Icon name={icon} size={26} className="text-teal" />
      <span className="text-title-card text-navy">{label}</span>
      <span className="text-micro text-text-muted">{sub}</span>
    </button>
  );
}

function IdentityRow({
  name,
  sub,
  badge,
  selected,
  onClick,
}: {
  name: string;
  sub: string;
  badge?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-3 rounded-card border bg-card px-3 py-2.5 text-left transition-colors",
          selected ? "border-[1.5px] border-navy" : "border-border",
        )}
      >
        <Avatar name={name} size={34} tone={selected ? "navy" : "neutral"} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-title-card text-text-primary">{name}</p>
          <p className="truncate text-micro text-text-muted">{sub}</p>
        </div>
        {badge && (
          <span className="rounded-pill bg-teal-light px-2 py-0.5 text-[10px] font-semibold text-teal-dark">
            {badge}
          </span>
        )}
        <Icon
          name={selected ? "ti-circle-check-filled" : "ti-circle"}
          size={20}
          className={selected ? "text-teal" : "text-border-strong"}
        />
      </button>
    </li>
  );
}
