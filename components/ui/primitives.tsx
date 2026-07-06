import { cn } from "./cn";

// ── Icon ───────────────────────────────────────────────────────────────────
export function Icon({
  name,
  size = 18,
  className,
}: {
  name: string; // e.g. "ti-home-filled"
  size?: number;
  className?: string;
}) {
  return (
    <i
      className={cn("ti", name, className)}
      style={{ fontSize: size, width: size, height: size }}
      aria-hidden
    />
  );
}

// ── Avatar (initials) ──────────────────────────────────────────────────────
export function Avatar({
  name,
  size = 34,
  tone = "neutral",
}: {
  name: string;
  size?: number;
  tone?: "neutral" | "navy" | "teal";
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const tones = {
    neutral: "bg-fill-control text-text-primary",
    navy: "bg-navy text-white",
    teal: "bg-teal-light text-teal-dark",
  };
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        tones[tone],
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

// ── Section label (UPPERCASE) ──────────────────────────────────────────────
export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-section uppercase text-text-muted", className)}>
      {children}
    </p>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────
export function Card({
  children,
  className,
  selected = false,
  padding = "16",
  as: Comp = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
  padding?: "0" | "14" | "16";
  as?: "div" | "button";
} & React.HTMLAttributes<HTMLElement>) {
  const pad = { "0": "", "14": "p-[14px]", "16": "p-4" }[padding];
  return (
    <Comp
      className={cn(
        "rounded-card bg-card shadow-card",
        selected ? "border-[1.5px] border-navy" : "border border-border",
        pad,
        Comp === "button" && "w-full text-left transition-colors",
        className,
      )}
      {...(rest as React.HTMLAttributes<HTMLElement>)}
    >
      {children}
    </Comp>
  );
}

// ── Icon tile ──────────────────────────────────────────────────────────────
export function IconTile({
  name,
  size = 36,
  tone = "neutral",
  iconSize = 18,
}: {
  name: string;
  size?: number;
  tone?: "neutral" | "teal" | "amber" | "red" | "navy";
  iconSize?: number;
}) {
  const tones = {
    neutral: "bg-icon-tile text-navy",
    teal: "bg-teal-light text-teal-dark",
    amber: "bg-amber-light text-amber",
    red: "bg-red-light text-red",
    navy: "bg-navy text-white",
  };
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-tile",
        tones[tone],
      )}
      style={{ width: size, height: size }}
    >
      <Icon name={name} size={iconSize} />
    </div>
  );
}

// ── Status semantics shared map ────────────────────────────────────────────
export type StatusTone = "success" | "warning" | "danger" | "neutral";

const STATUS_STYLES: Record<StatusTone, string> = {
  success: "bg-teal-light text-teal-dark",
  warning: "bg-amber-light text-amber",
  danger: "bg-red-light text-red",
  neutral: "bg-fill-control text-text-secondary",
};

// ── Status pill (roster / record) ──────────────────────────────────────────
export function StatusPill({
  children,
  tone = "neutral",
  icon,
  className,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  icon?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-label-strong",
        STATUS_STYLES[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  );
}

// ── Work chip (queue) ──────────────────────────────────────────────────────
export function ChipWork({
  children,
  triage = "neutral",
  icon,
  onClick,
}: {
  children: React.ReactNode;
  triage?: "danger" | "warning" | "neutral";
  icon?: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-control px-2.5 py-1 text-label-strong",
        STATUS_STYLES[triage],
        onClick && "transition-transform active:scale-[0.97]",
      )}
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
    </Comp>
  );
}

// ── Filter chip ────────────────────────────────────────────────────────────
export function ChipFilter({
  children,
  active = false,
  count,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  count?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-label transition-colors",
        active
          ? "bg-navy text-white"
          : "border border-border-strong bg-card text-text-secondary",
      )}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            "text-label-strong",
            active ? "text-teal-mid" : "text-text-muted",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ── Count badge ────────────────────────────────────────────────────────────
export function BadgeCount({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-pill bg-teal-light px-2 py-0.5 text-label-strong text-teal-dark">
      {children}
    </span>
  );
}

// ── Type tag (Prophy / PRN) ────────────────────────────────────────────────
export function TagType({ kind }: { kind: "PROPHYLAXIS" | "PRN" | string }) {
  const isPrn = kind === "PRN";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[5px] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        isPrn ? "bg-red-light text-red" : "bg-fill-control text-text-secondary",
      )}
    >
      {isPrn ? "PRN" : "Prophy"}
    </span>
  );
}

// ── Metric tile ────────────────────────────────────────────────────────────
export function MetricTile({
  value,
  label,
  tone = "neutral",
}: {
  value: React.ReactNode;
  label: string;
  tone?: "neutral" | "amber" | "teal";
}) {
  const valueColor = {
    neutral: "text-text-primary",
    amber: "text-amber",
    teal: "text-teal-dark",
  }[tone];
  return (
    <div className="flex flex-col items-center justify-center rounded-control border border-border bg-card px-3 py-2.5 text-center">
      <span className={cn("text-num-hero", valueColor)}>{value}</span>
      <span className="mt-0.5 text-label text-text-muted">{label}</span>
    </div>
  );
}
