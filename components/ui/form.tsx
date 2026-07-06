import { cn } from "./cn";
import { Icon } from "./primitives";

// ── Inline field (leading icon + value) ─────────────────────────────────────
export function FieldInline({
  icon,
  children,
  trailing,
  className,
}: {
  icon?: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-control border border-border bg-card px-3 py-3",
        className,
      )}
    >
      {icon && <Icon name={icon} size={16} className="text-text-muted" />}
      <div className="flex-1 text-body">{children}</div>
      {trailing}
    </div>
  );
}

export function FieldSelect({
  icon,
  value,
  placeholder,
  onClick,
}: {
  icon?: string;
  value?: string;
  placeholder?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-control border border-border bg-card px-3 py-3 text-left active:bg-fill-control"
    >
      {icon && <Icon name={icon} size={16} className="text-text-muted" />}
      <span className={cn("flex-1 text-body", !value && "text-text-muted")}>
        {value ?? placeholder}
      </span>
      <Icon name="ti-chevron-down" size={16} className="text-text-muted" />
    </button>
  );
}

export function FieldText({
  placeholder,
  multiline = false,
  value,
  onChange,
}: {
  placeholder?: string;
  multiline?: boolean;
  value?: string;
  onChange?: (v: string) => void;
}) {
  const cls =
    "w-full rounded-control border border-border bg-card px-3 py-3 text-body text-text-primary placeholder:text-text-muted focus:border-navy focus:outline-none";
  if (multiline)
    return (
      <textarea
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(cls, "resize-none")}
      />
    );
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={cls}
    />
  );
}

// ── Stepper input (minus / value / plus) ────────────────────────────────────
export function StepperInput({
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-control border border-border bg-card px-2 py-1.5">
      <StepBtn
        icon="ti-minus"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      />
      <span className="min-w-[24px] text-center text-title-name">{value}</span>
      <StepBtn
        icon="ti-plus"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      />
    </div>
  );
}

function StepBtn({
  icon,
  onClick,
  disabled,
}: {
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-control text-navy active:bg-fill-control disabled:text-text-muted"
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

// ── Toggle pair ─────────────────────────────────────────────────────────────
export function TogglePair<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string; icon?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={cn(
              "flex h-11 items-center justify-center gap-1.5 rounded-control text-title-card transition-colors",
              on
                ? "border-[1.5px] border-navy bg-icon-tile text-navy"
                : "border border-border-strong bg-card text-text-secondary",
            )}
          >
            {o.icon && <Icon name={o.icon} size={16} className={on ? "text-navy" : "text-teal"} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Checkbox row ────────────────────────────────────────────────────────────
export function CheckboxRow({
  label,
  qty,
  checked,
  suggested = false,
  onToggle,
}: {
  label: string;
  qty?: string;
  checked: boolean;
  suggested?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-3 py-2.5 text-left"
    >
      <Icon
        name={checked ? "ti-square-check-filled" : "ti-square"}
        size={20}
        className={checked ? "text-teal" : suggested ? "text-amber" : "text-border-strong"}
      />
      <span className="flex-1 text-body text-text-primary">{label}</span>
      {suggested && !checked && (
        <span className="text-micro text-amber">Suggested</span>
      )}
      {qty && <span className="text-label text-text-muted">{qty}</span>}
    </button>
  );
}

// ── Prefill note ("filled from your data") ──────────────────────────────────
export function NotePrefill({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-micro text-teal-dark">
      <Icon name="ti-sparkles" size={14} className="text-teal" />
      {children}
    </p>
  );
}

// ── Info notice ("what's happening now") ────────────────────────────────────
export function NoticeInfo({
  children,
  icon = "ti-info-circle",
}: {
  children: React.ReactNode;
  icon?: string;
}) {
  return (
    <div className="flex gap-2.5 rounded-card bg-teal-light p-3.5">
      <Icon name={icon} size={18} className="mt-px shrink-0 text-teal-dark" />
      <div className="text-body text-teal-dark">{children}</div>
    </div>
  );
}

// ── Care-team safety line ───────────────────────────────────────────────────
export function NoticeCareteam({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex flex-col items-center gap-1 text-center text-micro text-text-muted">
      <Icon name="ti-shield-heart" size={16} />
      {children}
    </p>
  );
}

// ── Signature pad ───────────────────────────────────────────────────────────
export function SignaturePad({
  signed,
  signedName,
  onSign,
}: {
  signed: boolean;
  signedName?: string;
  onSign: () => void;
}) {
  return (
    <button
      onClick={onSign}
      className={cn(
        "flex h-[84px] w-full flex-col items-center justify-center rounded-card border-[1.5px] border-dashed transition-colors",
        signed
          ? "border-teal bg-teal-light"
          : "border-border-strong bg-card active:bg-fill-control",
      )}
    >
      {signed ? (
        <>
          <span className="font-[cursive] text-[22px] italic text-navy">
            {signedName}
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-micro text-teal-dark">
            <Icon name="ti-circle-check-filled" size={13} />
            Signed
          </span>
        </>
      ) : (
        <>
          <Icon name="ti-signature" size={26} className="text-text-muted" />
          <span className="mt-1 text-body text-text-secondary">Tap to sign</span>
        </>
      )}
    </button>
  );
}
