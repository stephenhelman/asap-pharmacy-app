import Link from "next/link";
import { cn } from "./cn";
import { Icon, IconTile } from "./primitives";

/** A tappable list row: leading icon-tile + title + optional sub + trailing. */
export function NavRow({
  icon,
  iconTone = "neutral",
  title,
  sub,
  trailing,
  href,
  onClick,
  chevron = true,
}: {
  icon?: string;
  iconTone?: "neutral" | "teal" | "amber" | "red" | "navy";
  title: React.ReactNode;
  sub?: React.ReactNode;
  trailing?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  chevron?: boolean;
}) {
  const inner = (
    <>
      {icon && <IconTile name={icon} tone={iconTone} />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-title-card text-text-primary">{title}</p>
        {sub && <p className="truncate text-micro text-text-muted">{sub}</p>}
      </div>
      {trailing}
      {chevron && (
        <Icon name="ti-chevron-right" size={18} className="text-text-muted" />
      )}
    </>
  );

  const cls =
    "flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors active:bg-fill-control";

  if (href)
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/** A card wrapping self-padded rows with dividers. */
export function RowCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-card border border-border bg-card shadow-card [&>*+*]:border-t [&>*+*]:border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}
