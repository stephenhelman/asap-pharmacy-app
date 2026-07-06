"use client";

import { useEffect } from "react";
import { Icon } from "./primitives";

/**
 * Full-cover modal sheet (P5/P6 entry flows): X + title, no bottom nav. Renders
 * absolutely within the phone frame and slides up. Drill-down convention.
 */
export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-page animate-sheet-up md:rounded-frame md:overflow-hidden">
      <header className="flex items-center gap-2 border-b border-border bg-card px-4 py-3.5">
        <button
          onClick={onClose}
          className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-control text-navy active:bg-fill-control"
          aria-label="Close"
        >
          <Icon name="ti-x" size={20} />
        </button>
        <h1 className="flex-1 text-h2">{title}</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      {footer && (
        <div className="border-t border-border bg-card p-4">{footer}</div>
      )}
    </div>
  );
}
