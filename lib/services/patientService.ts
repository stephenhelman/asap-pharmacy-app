/**
 * PATIENT CREATE — in production, writes the patient record to Neon + mirrors a
 * GHL contact (DND on until consent). Here it is a no-op success ("Account
 * created"); the actual draft → session promotion is done by lib/draft.tsx
 * (commitDraft), which this stub stands in front of.
 */
export const patientService = {
  async create(): Promise<{ ok: true; message: string }> {
    return { ok: true, message: "Account created" };
  },
};
