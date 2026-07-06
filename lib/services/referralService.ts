/**
 * REFERRAL — "Send to Patient" (§5.1.1). In production the rep generates a
 * signed, encrypted-key, single-use 24h link and sends it from their approved
 * channel (work-phone SMS or email) via GHL. Here it returns the link + token
 * (false "Sent to patient" success) plus the demo "Open as patient" affordance
 * that continues the flow on the patient side.
 */
export interface ReferralResult {
  ok: true;
  token: string;
  link: string;
  expiresAt: string;
}

export const referralService = {
  async send(opts: {
    referringRepId: string;
    draftId: string;
    patientName?: string;
  }): Promise<ReferralResult> {
    const slug =
      (opts.patientName ?? "patient")
        .toLowerCase()
        .replace(/[^a-z]+/g, "-")
        .replace(/(^-|-$)/g, "") || "patient";
    const token = `asap-intake-${slug}-${Date.now().toString(36).slice(-4)}`;
    // 24h expiry (single-use in production; modeled but not enforced here)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return {
      ok: true,
      token,
      link: `https://portal.asappharmacy.com/intake/${token}`,
      expiresAt,
    };
  },
};
