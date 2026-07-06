"use client";

import { SessionProvider } from "@/lib/session";
import { MutationProvider } from "@/lib/mutations";
import { DraftProvider } from "@/lib/draft";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MutationProvider>
        <DraftProvider>{children}</DraftProvider>
      </MutationProvider>
    </SessionProvider>
  );
}
