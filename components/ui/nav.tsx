"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "./cn";
import { Icon } from "./primitives";

export interface NavItem {
  key: string;
  label: string;
  icon: string; // inactive icon
  activeIcon?: string; // filled variant
  href: string;
}

// ── Bottom nav (top-level mobile) ──────────────────────────────────────────
export function BottomNav({
  items,
  activeKey,
}: {
  items: NavItem[];
  activeKey: string;
}) {
  return (
    <nav className="z-40 flex shrink-0 items-stretch justify-around border-t border-border bg-card px-2 pb-3 pt-2.5 md:px-8 md:pb-4 md:pt-3 xl:hidden">
      {items.map((it) => {
        const active = it.key === activeKey;
        return (
          <Link
            key={it.key}
            href={it.href}
            className="flex min-w-[56px] flex-col items-center gap-1 py-1 md:min-w-[72px]"
          >
            <Icon
              name={active ? (it.activeIcon ?? it.icon) : it.icon}
              size={20}
              className={active ? "text-navy" : "text-text-muted"}
            />
            <span
              className={cn(
                "text-nav",
                active ? "font-semibold text-navy" : "text-text-muted",
              )}
            >
              {it.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ── Top bar (drill-downs: back / X + title) ─────────────────────────────────
export function TopBarNav({
  title,
  mode = "back",
  onDismiss,
  right,
}: {
  title: React.ReactNode;
  mode?: "back" | "close";
  onDismiss?: () => void;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  const dismiss = onDismiss ?? (() => router.back());
  return (
    <header className="flex items-center gap-2 border-b border-border bg-card px-4 py-3.5">
      <button
        onClick={dismiss}
        className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-control text-navy active:bg-fill-control"
        aria-label={mode === "back" ? "Back" : "Close"}
      >
        <Icon name={mode === "back" ? "ti-arrow-left" : "ti-x"} size={20} />
      </button>
      <h1 className="flex-1 truncate text-h2">{title}</h1>
      {right}
    </header>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────────
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-6 border-b border-border px-4">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "relative py-2.5 text-title-card transition-colors",
              on ? "text-navy" : "text-text-muted",
            )}
          >
            {t.label}
            {on && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-navy" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Segmented progress bar ──────────────────────────────────────────────────
export function ProgressBar({
  total,
  done,
  showCount = true,
}: {
  total: number;
  done: number;
  showCount?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex flex-1 gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-[5px] flex-1 rounded-full",
              i < done ? "bg-teal" : "bg-border",
            )}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-micro text-text-muted">
          {done} / {total}
        </span>
      )}
    </div>
  );
}
