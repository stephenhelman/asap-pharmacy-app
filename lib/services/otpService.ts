/**
 * OTP — one-time passcode to the confirmed channel (§3, §5.1.1). In production
 * this delivers a code via the GHL Conversations API (SMS) or email. Here it is
 * a no-op that advances to code entry, and the demo code `000-000` always passes.
 */
export const DEMO_OTP = "000-000";

export interface OtpTarget {
  channel: "SMS" | "EMAIL";
  to: string;
}

export const otpService = {
  /** "Send" the code — no real SMS/email; just resolves so the UI shows entry. */
  async send(target: OtpTarget): Promise<{ ok: true; channel: OtpTarget["channel"] }> {
    return { ok: true, channel: target.channel };
  },

  /** Verify the code. The demo code (any punctuation) `000000` always passes. */
  async verify(code: string): Promise<{ ok: boolean }> {
    return { ok: code.replace(/\D/g, "") === "000000" };
  },
};
