"use client";

import { SessionProvider } from "@/lib/session";
import { MutationProvider } from "@/lib/mutations";
import { DraftProvider } from "@/lib/draft";
import { MoreSheetProvider } from "@/lib/moreSheet";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MutationProvider>
        <DraftProvider>
          <MoreSheetProvider>{children}</MoreSheetProvider>
        </DraftProvider>
      </MutationProvider>
    </SessionProvider>
  );
}
