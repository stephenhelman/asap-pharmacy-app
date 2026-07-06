import { cn } from "./cn";
import { Icon } from "./primitives";

type Variant =
  | "primary"
  | "secondary"
  | "quick"
  | "scan-inline"
  | "dashed-add"
  | "danger-outline";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: string;
  block?: boolean;
  label?: string; // for quick tile (label under icon)
}

/**
 * The button system. RULE: exactly one `primary` per screen (the CTA);
 * everything else is secondary / quick / outline.
 */
export function Button({
  variant = "secondary",
  icon,
  block = false,
  label,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  if (variant === "quick") {
    return (
      <button
        disabled={disabled}
        className={cn(
          "flex h-[60px] flex-col items-center justify-center gap-1 rounded-control border border-border-strong bg-card text-label-strong text-navy transition-[transform,background-color,border-color] duration-150 ease-out active:bg-fill-control active:scale-[0.98] disabled:active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
          block && "w-full",
          className,
        )}
        {...rest}
      >
        {icon && <Icon name={icon} size={20} className="text-teal" />}
        <span>{label ?? children}</span>
      </button>
    );
  }

  if (variant === "scan-inline") {
    return (
      <button
        disabled={disabled}
        className={cn(
          "inline-flex h-[30px] items-center gap-1 rounded-control bg-teal-light px-2.5 text-label-strong text-teal-dark transition-[transform,background-color] duration-150 ease-out active:bg-teal-mid active:scale-[0.97] disabled:opacity-60 outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-dark",
          className,
        )}
        {...rest}
      >
        <Icon name="ti-scan" size={15} />
        {children}
      </button>
    );
  }

  const base =
    "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-[transform,color,background-color,border-color] duration-150 ease-out active:scale-[0.98] disabled:active:scale-100 disabled:cursor-not-allowed select-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

  const variants: Record<Exclude<Variant, "quick" | "scan-inline">, string> = {
    primary:
      "h-12 bg-accent text-white text-title-card active:bg-navy-dark disabled:bg-border-strong disabled:text-white",
    secondary:
      "h-11 border border-border-strong bg-card text-text-primary text-title-card active:bg-fill-control disabled:opacity-60",
    "dashed-add":
      "h-10 border border-dashed border-border-strong bg-card text-text-secondary text-body-strong active:bg-fill-control",
    "danger-outline":
      "h-11 border border-border-danger bg-card text-red text-title-card active:bg-red-light",
  };

  const iconTone =
    variant === "primary"
      ? "text-white"
      : variant === "danger-outline"
        ? "text-red"
        : "text-teal";

  return (
    <button
      disabled={disabled}
      className={cn(base, variants[variant], block && "w-full", className)}
      {...rest}
    >
      {icon && <Icon name={icon} size={variant === "primary" ? 20 : 18} className={iconTone} />}
      {children}
    </button>
  );
}
