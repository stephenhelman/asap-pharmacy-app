"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "./cn";

/**
 * The single viewport-height contract for anything that must cover the app.
 *
 * Portals to <body> so it escapes the app-shell's content-height container, and
 * pins to the real, address-bar-aware viewport (`100dvh`) instead of the layout
 * viewport (`100vh` / an `absolute` mount, which leaves the mobile white-bar
 * gap at the bottom). The slide-in record pane and every modal render *inside*
 * this, so that class of bug can't recur per-component.
 *
 * Callers own their z-index (via `className`) — a modal sits at `z-40`, the
 * record pane at `z-50` — and lay out their scrim/panel as `absolute` children
 * of this full-viewport stage.
 */
export function Overlay({
  onClose,
  className,
  children,
}: {
  onClose?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={cn("fixed inset-0 h-[100dvh] w-screen", className)}>
      {children}
    </div>,
    document.body,
  );
}
