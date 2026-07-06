"use client";

import { SessionProvider } from "@/lib/session";
import { MutationProvider } from "@/lib/mutations";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MutationProvider>{children}</MutationProvider>
    </SessionProvider>
  );
}
