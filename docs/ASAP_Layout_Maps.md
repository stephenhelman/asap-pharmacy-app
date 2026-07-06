# ASAP Portal — Layout Maps
*Per-page vertical stacks with real spacing values, for rebuilding in Figma. Spacing = token (px). All screens: 390 × 844 frame, `r-frame` 20, 1px border-strong.*

---

## GLOBAL LAYOUT RULES (hold everywhere unless a page overrides)

**Screen**
- Side padding: **16** both sides → 358 usable.
- Frame corner radius: 20. Background: `page` #F8FAFB.

**Header bar (top of every screen)**
- Padding: **16 top, 16 sides, 12 bottom**.
- Background: `card` white. Bottom border: 1px `border`.

**Section blocks (the vertical body)**
- Body padding: **16 sides**, **12–16 top** (below header), **20 bottom**.
- Gap **section → section**: **18** (loose) or **14** (tight, related sections).
- Section label (UPPERCASE) → its content: **8** below the label.

**Cards**
- Inner padding: **16** (feature/hero cards) or **14** (standard) or **4 sides / list-rows self-pad** (list cards).
- Corner radius: 12 (feature) / 10 (standard). Border 1px `border`.
- Gap **card → card** (stacked): **8**.
- Gap **card → helper text** below it: **6**; helper text → next section: **18**.

**Rows (inside list cards)**
- Row padding: **10–14 vertical, 14 horizontal**.
- Divider between rows: 1px `border` (last row none).

**Form fields**
- Field height: 42–46. Inner padding: 11 vert / 12 horiz.
- Prompt label → field: **8**. Field → helper text: **6**. Field group → next: **18**.
- Gap between side-by-side fields: **10**.

**Buttons**
- Primary CTA height 48; secondary 44; stacked-tile (`btn-quick`) 60.
- Gap **button → button** (stacked): **8–10**.
- Gap **content → primary CTA**: **22–24**. CTA → footer note: **12**.

**Pills / chips**
- Gap between pills in a row: **6**.
- Pill row → next content: **14**.

**Bottom nav (top-level screens)**
- Padding: **10 top, 12 bottom**. Top border 1px. Items space-around.

**Standard vertical rhythm reference**
`4` hairline gaps · `6` label-to-helper, pill gaps · `8` card gaps, label-to-content · `10` side-by-side, button gaps · `12` header bottom, tight internal · `14` tight sections · `16` screen padding, card interior · `18` section gaps · `20` body bottom · `22–24` content-to-CTA.

---

# PATIENT SIDE

## P1 · Patient Dashboard (active) — bottom-nav
Stack (top → bottom):
1. **Header** — 16/16/12. Left: greeting (13) + name (17), gap 2. Right: bell + avatar 32, gap 10.
2. **Body start** — 12 top, 16 sides.
3. **Status pills row** — gap 6 between pills. → margin-bottom **14**.
4. **Next-order card (hero)** — card pad 16, radius 12. Internal: label row → number (mb 4) → subline (mt 2 / mb 12) → CTA 40h full-width. → margin-bottom **12**.
5. **Metric row** — 3-col grid, gap **8**. Tile pad 12/10, centered. → margin-bottom **14**.
6. **Quick actions** — 2-col grid, gap 8. `btn-quick` 60h. → margin-bottom **14**.
7. **Delivery stepper card** — pad 14/16. Header row (mb 16) → horizontal stepper. → margin-bottom **12**.
8. **Nav list card** — rows self-pad 13/14, 1px divider between. (2 rows)
9. **Bottom nav** — 10/12.

## P2 · Patient Dashboard (onboarding) — bottom-nav
1. **Header** — same as P1.
2. **Body** — 12 top, 16 sides.
3. **Status pill** — single pill. → mb **14**.
4. **Setup progress card** — pad 16, radius 12. Internal: title row (mb 12) → progress bar 5px seg gap 5 (mb 16) → step rows 7 vert each (20px node + label, gap 11). → mb **12**.
5. **`notice-info` card (teal)** — pad 14, gap 11 icon-to-text. → mb **12**.
6. **Message card** — single row 13/14.
7. **Bottom nav**.

## P3 · Order Questionnaire (3 stages) — top-bar back + progress
Header: 14/16, back + title stack. **Progress bar strip:** own row, pad 10/16, bottom border; segments gap 6 + "n/3".
Body: 16 all.
**Stage 1 – Check-in:** intro line (mb 14) → med card pad 12/14 (mb 18) → [prompt 8 → text field (mb 18)] → [bleed prompt 8 → red reconcile card pad 12/14 (mb 8) → dashed "log another" 40h (mb 18)] → [missed-dose prompt 8 → toggle-pair 40h (mb 4) → helper (mb 18)] → [changes prompt 8 → text field (mb 22)] → CTA 48h.
**Stage 2 – Order:** [doses prompt 8 → stepper-input + chip (mb 6) → helper (mb 18)] → section-label 8 → shipping cards ×2 (gap 8, mb 6) → helper (mb 18) → section-label 8 → supplies list card (mb 8) → dashed request 40h (mb 22) → CTA 48h.
**Stage 3 – Review & sign:** section-label 8 → summary card pad 4/14 rows 9 vert (mb 18) → section-label 8 → log card pad 12/14 (mb 6) → "view full log" 36h (mb 18) → section-label 8 → sign intro (mb 10) → signature-pad 84h (mb 6) → lock note (mb 22) → CTA 48h → footer note (mt 12).

## P4 · Logs Page — bottom-nav
1. **Header block (white)** — 16 top/sides: title row (mb 14) → tabs row (gap 24, 10 bottom-pad each). 1px divider.
2. **Summary strip** — 3 cells, 12 vert, 1px dividers between.
3. **Body** — 14 top, 16 sides, **90 bottom** (clears floating button).
4. **Month label** — mb 8.
5. **Entry rows** — cards gap 8, each pad 12/14, icon-tile 36 + text + tag.
6. **Floating create button** — 50h, pulled up ~78 over content, 16 sides, shadow.
7. **Bottom nav**.

## P5 · Infusion Entry — modal (X), no nav
Header 14/16 (X + title). Body 16.
- [dose prompt row 8 (prompt ↔ scan-inline) → helper (mb 10)] → selected dose card `card-selected` pad 12/14 (mb 8) → note-prefill (mb 18) → [type prompt 8 → toggle-pair 44h (mb 18)] → [when prompt 8 → date+time fields gap 8 (mb 6) → helper (mb 24)] → CTA 48h (mb 10) → secondary 44h.

## P6 · Bleed Entry — modal (X), no nav
Header 14/16. Body 16.
- [site prompt 8 → row: body-map 96w + quick buttons col gap 6 (mb 10) → helper (mb 18)] → [cause+when two-up gap 10 (mb 18)] → [linked prompt row 8 → linked card rows self-pad 10/14 (mb 8) → dashed add 40h (mb 22)] → CTA 48h (mb 10) → careteam notice centered.

## P7 · Delivery / Confirm — top-bar back
Header 14/16. Body 16.
- **Big status** centered (mb 18): icon circle 56 (mb 10) → status 18 → ETA 12.
- **Stepper card (vertical)** pad 6/16, rows 9 vert (mb 8) → "track live" button 42h (mb 20).
- **Confirm section:** section-label 8 → confirm card pad 14: intro (mb 12) → scan CTA 46h (mb 8) → manual btn 44h → (card end, mb 8) → helper note centered.

---

# STAFF SIDE

## S1 · Roster — bottom-nav
1. **Header (white)** — 16 top/sides: title row (mb 12) → filter pills scroll row (gap 6), 16 bottom.
2. **Roster rows** — each pad 13/16, 1px divider. Internal: avatar 34 + right block, gap 11; name row (mb 5) → pills row gap 5.
3. **Bottom nav**.

## S2 · Work Queue — bottom-nav
1. **Header** — 16/16/12: title row → context line (mt 5).
2. **Filter rail** — pad 12 top/bottom, 16 left, scroll; pills gap 6. 1px divider.
3. **Queue rows** — each pad 14/16, 1px divider. Line-1 (avatar 30 + name/lifecycle + chevron, mb 8) → chips row indent 40, gap 6, wrap.
4. **Bottom nav**.

## S3 · Patient Record — top-bar back, no bottom-nav
1. **Top bar** — 14/16 (back + title + overflow).
2. **Header card** — pad 16: avatar 46 + name/meta (gap 12, mb 12) → status pills gap 5.
3. **Rep reference line** — pad 11/16, single row, name right-aligned.
4. **Tabs** — pad 0/8, each tab 12/12, active underline 2px.
5. **Intake gates section** — pad 14/16/8: section-label (mb 10) → gate rows 10 vert each, 22px node + name + outcome, 1px divider.
6. **Renewals panel** — pad 6/16/16: section-label (mt 12 / mb 10) → card, rows self-pad 12/14, 1px divider.

## S4 · Gate Action (Viability v1) — top-bar back, no bottom-nav
Header 14/16 (back + name + status pill). Context row pad 12/16. Body 16.
- section-label 8 → for-reference card pad 4/14 rows 9 vert (mb 8) → info note (mb 18) → note-label 8 → note field 46min (mb 18) → decision-label 10 → 3 typed buttons 46h gap 8 → audit note (mt 16).

## S5 · Clinical Check — top-bar back, no bottom-nav
Header 14/16. Context row 12/16. Body 14/16.
- section-label 8 → order-vs-Rx card pad 4/14 rows 10 vert (mb 16) → section-label 8 → supplies card rows 8 vert (mb 8) → bleed flag notice pad 10/12 (mb 18) → Approve CTA 46h (mb 8) → Hold btn 46h → audit note (mt 16).

## S6 · Tech Pack — top-bar back, no bottom-nav
Header 14/16. Context row 12/16. Body 14/16.
- progress label row 8 (label ↔ scan) → dose cards gap 8: packed rows pad 11/12, current card 1.5px teal (mb 14) → shipment label 8 → tracking field 46 (mb 8) → generate note (mb 16) → Mark-shipped CTA 46h (mb 8) → Hold 44h → footer note (mt 14).

---

## QUICK CHECKLIST (per screen in Figma)
- [ ] 16 side padding, 390 frame
- [ ] Header 16/16/12 + bottom border
- [ ] Section→section 18 (or 14 tight)
- [ ] Label→content 8, field→helper 6
- [ ] Card gaps 8, card interior 14–16
- [ ] Content→CTA 22–24, button gaps 8–10
- [ ] Top-level = bottom nav (10/12); drill-down = back/X, no nav
