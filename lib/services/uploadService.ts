/**
 * UPLOAD — document capture (§5.1.1). In production this PUTs the file to
 * Cloudflare R2 and returns the object key. Here selecting a file (or tapping
 * the slot) returns success with a fake key — the "Uploaded ✓" is a false
 * success; nothing leaves the browser.
 */
export const uploadService = {
  async put(file?: File | null): Promise<{ ok: true; ref: string }> {
    const name = file?.name ?? "document";
    const safe = name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
    return { ok: true, ref: `r2/demo/${Date.now()}-${safe}` };
  },
};
