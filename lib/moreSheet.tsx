"use client";

import { createContext, useContext, useState } from "react";

/**
 * Shell-level open state for the mobile "More" bottom sheet, so the bottom-nav
 * "More" tab (rendered inside every screen) can lift a single sheet instance
 * over whatever screen is showing. Desktop never opens it (no bottom nav ≥xl).
 */
type MoreSheetCtx = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const Ctx = createContext<MoreSheetCtx>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function MoreSheetProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Ctx.Provider
      value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useMoreSheet = () => useContext(Ctx);
