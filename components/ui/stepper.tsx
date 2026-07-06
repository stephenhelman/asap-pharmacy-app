import { cn } from "./cn";
import { Icon } from "./primitives";

export type StepState = "done" | "current" | "future";

export interface Step {
  label: string;
  state: StepState;
  sub?: string;
}

// ── Horizontal stepper (delivery on dashboard) ──────────────────────────────
export function StepperHorizontal({ steps }: { steps: Step[] }) {
  return (
    <div className="flex items-start">
      {steps.map((s, i) => (
        <div key={i} className="flex flex-1 flex-col items-center">
          <div className="flex w-full items-center">
            <Track show={i > 0} active={s.state !== "future"} />
            <Node state={s.state} />
            <Track
              show={i < steps.length - 1}
              active={steps[i + 1]?.state !== "future"}
            />
          </div>
          <span
            className={cn(
              "mt-1.5 max-w-[64px] text-center text-micro",
              s.state === "current"
                ? "font-semibold text-navy"
                : s.state === "done"
                  ? "text-text-secondary"
                  : "text-text-muted",
            )}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function Track({ show, active }: { show: boolean; active: boolean }) {
  return (
    <span
      className={cn(
        "h-0.5 flex-1",
        !show && "opacity-0",
        active ? "bg-teal" : "bg-border",
      )}
    />
  );
}

function Node({ state }: { state: StepState }) {
  if (state === "done")
    return (
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-teal text-white">
        <Icon name="ti-check" size={13} />
      </span>
    );
  if (state === "current")
    return (
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-teal bg-card">
        <span className="h-2 w-2 rounded-full bg-teal" />
      </span>
    );
  return (
    <span className="h-[22px] w-[22px] shrink-0 rounded-full border border-border-strong bg-card" />
  );
}

// ── Vertical stepper (delivery page / onboarding progress) ──────────────────
export function StepperVertical({ steps }: { steps: Step[] }) {
  return (
    <div className="flex flex-col">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <Node state={s.state} />
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "w-0.5 flex-1",
                  s.state === "done" ? "bg-teal" : "bg-border",
                )}
                style={{ minHeight: 18 }}
              />
            )}
          </div>
          <div className={cn("pb-2", i < steps.length - 1 && "pb-4")}>
            <p
              className={cn(
                "text-title-card",
                s.state === "current"
                  ? "font-semibold text-navy"
                  : s.state === "done"
                    ? "text-text-primary"
                    : "text-text-muted",
              )}
            >
              {s.label}
            </p>
            {s.sub && <p className="text-micro text-text-muted">{s.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
