# ASAP Portal — Master Design Brief (All Screens)
*Every screen in the mobile pass, its regions, states, and connections. References the Design Token & Component Master for all tokens/components. Stage-1 fidelity (structure + ASAP color); breakpoint + polish passes follow.*

**Two portals, one record.** Patient app = the baseline lens (their own record + flows). Staff app = one parameterized dashboard (roster + queue + record + comms) configured by role via scope × edit-boundary. Screens below are grouped by side.

**Nav convention:** top-level screens carry `bottom-nav`; drill-downs use `top-bar-nav` (back-arrow or X) with no bottom-nav. Patient nav: Home · Logs · Scan · More (4th tab TBD; nav to become role/patient-configurable). Staff nav: Roster · Queue · Messages · More (role-configurable; tech may default to Fulfillment).

---

# PATIENT SIDE

## P1 · Patient Dashboard — Active state  `[bottom-nav: Home]`
The "how am I doing" home. Baseline lens for all staff views.
- **Header:** greeting + name, bell (unread dot red), avatar.
- **Status pills:** lifecycle (Active, teal) + wellbeing (On schedule) — friendly abstraction of the tracker.
- **Next-order card (hero):** the one `btn-primary`. States: early (Preview) / due (Start my order) / in-progress (Finish).
- **Metric row (3):** doses on hand · bleeds this month · days since infusion. Running-low → amber.
- **Quick actions (`btn-quick` ×2):** Log infusion · Log a bleed (teal icons).
- **Delivery stepper (horizontal):** shows only when in transit → becomes confirm entry on Delivered.
- **Nav list:** Message your team (badge) · My records.
- Data: pre-fill values here are the same the order form consumes.

## P2 · Patient Dashboard — Onboarding state  `[bottom-nav: Home]`
Same shell; next-order card replaced by:
- **Setup progress card:** segmented progress bar + `stepper-vertical` of human milestones (Account created ✓ · Documents ✓ · Insurance verified ✓ · Approval in progress ● · First order ○). **Abstraction of intake gates — no gate machinery shown.**
- **`notice-info` (teal):** "what's happening now… nothing needed from you."
- **Message team** row.
- Lifecycle pill = "Getting you set up" (neutral).

## P3 · Order Questionnaire — 3-stage flow  `[top-bar-nav: back; progress-bar]`
The centerpiece. Replaces the WhatsApp monthly Q&A. Assisted-By wrapper allows rep-assisted completion. Clinical answers FEED the order (causal chain).
- **Stage 1 — Check-in:** medication card (read-only, locked dose) · issues/side-effects (optional text) · **open-bleed reconciliation** (red card: still affected / resolved-close, + log another) · missed doses (pre-filled from log, teal note) · med/allergy changes (optional). → Continue.
- **Stage 2 — Order:** doses-on-hand `stepper-input` (pre-filled, "from your log"; NOTE: projects to delivery, editable — see autonomy principle) · shipping list: prophy ×N (allotment − on-hand) + **PRN replacement auto from Stage-1 bleeds** · supplies (3-tier recommender: regulars pre-checked, suggested-due amber unchecked, request-else) · quantities locked to Rx. → Review & sign.
- **Stage 3 — Review & Sign:** order summary · **this month's log** (infusions + bleeds being attested) · **one `signature-pad`** covering both ("log is accurate + I authorize this order") · Submit. Footer: "your rep reviews every order."

## P4 · Logs Page  `[bottom-nav: Logs]`
Tabbed clinical section.
- **Tabs:** All · Infusions · Bleeds. All = merged timeline; others filter.
- **Summary strip:** this month · on hand · on-track.
- **Timeline rows:** infusion entries (Prophy neutral tag / PRN red tag, PRN shows "linked to [bleed]"); one ledger.
- **Context-aware create button:** "Log infusion" (Infusions) / "Log a bleed" (Bleeds) / chooser (All).

## P5 · Infusion Entry  `[modal: X; no nav]`  → Brief 06
Manual-default dose picker + **inline `btn-scan-inline`** (scan lives here). Type `toggle-pair` (Prophylaxis / On-demand). Date/time `field-inline` (defaults now, retroactive allowed). Save / Save & add another. On-demand → link-to-bleed step. One ledger entry per save; PRN carries bleedId.

## P6 · Bleed Entry  `[modal: X; no nav]`  → Brief 07
Site picker (`site-body` + target-joint `site-quick`) · cause `field-select` + when · **linked PRN treatment** (`linked-row`s — same infusion-log entries, not copies) + "log a dose for this bleed" · Save. `notice-careteam` safety line. Wrapper over PRN entries; severity from dose tier where defined. Close-out via order reconciliation or mark-resolved (not here).

## P7 · Delivery / Confirm  `[top-bar-nav: back]`
Own-data tracker (no carrier API).
- **Big status** (icon + "Out for delivery" + ETA).
- **`stepper-vertical`:** Shipped ✓ · Out for delivery ● · Delivered ○.
- **Track live** button → taps out to carrier.
- **Confirm receipt (2 co-equal paths):** `btn-primary` "Scan delivery ticket" (auto-checks items) + `btn-secondary` "I received it — confirm manually" (check off). Confirming resets cycle timer.

---

# STAFF SIDE (one parameterized dashboard)

## S1 · Roster  `[bottom-nav: Roster]`
"How is everyone." Read/triage surface (status, NOT tasks).
- **Header:** title + search + filter; scope filter pills (All / Active / Onboarding / Needs attention + counts).
- **Roster rows:** avatar 34 + name + **always-anchored intake status** (Active/Onboarding) + **single lead signal by severity** (bleed → PA expiring → assistance expiring → ready to order → no bleeds → on schedule → next delivery). Row adapts by lifecycle. Male-skewed names.
- Pills are read + doorway (tap → record or filtered queue), not workspace. Triage by 2nd-pill color.

## S2 · Work Queue  `[bottom-nav: Queue]`  → Brief 02
"What do I do." Every open work item across all rhythms (intake gates + reorders + renewals + alerts) — gates are one input, not the whole thing.
- **Header:** title + role/scope context + count.
- **Filter pills:** All + per-category; **default filter role-derived** (nurse → Clinicals; pharmacist → All).
- **Patient rows:** avatar + name + lifecycle; unresolved work as `chip-work` (triage color). Row → record; chip → that work surface.
- Desktop expansion: chips → columns, cells = check/X/status matrix.

## S3 · Patient Record (staff)  `[top-bar-nav: back; no bottom-nav]`
The destination all dashboards point into. Same record, permissioned per role.
- **Header card:** avatar + name + DOB/dx + status pills.
- **Rep reference line:** "Assigned rep: [name]" — **name only, no contact action** (action affordances render by viewer's job).
- **Tabs:** Intake · Clinical · Orders · Renewals.
- **Intake tab = `gate-status-row` list** (status surface, not work): each gate teal-check/amber-attention/neutral + outcome label. Read-only companion to the queue.
- **Renewals & Authorizations panel:** standing pipelines (PA, Assistance) with expiry clocks (amber/teal). §13 consolidation rendered; per-patient view feeding the queue's cross-patient renewal filter.
- (Clinical tab = infusion log + bleed tracker, live read-only to staff. Orders tab = history + fulfillment.)

## S4 · Gate Action (the Gate Primitive)  `[top-bar-nav: back; no bottom-nav]`
One reusable component; only the reference data + typed outcomes change per gate. Shown: **Viability (v1 decision-recorder)**.
- **Header:** gate name + "Needs decision" pill.
- **Patient context** row (→ record).
- **For-reference card:** read-only data the portal owns (product, payer, prescribed dose) + note "checked in your adjudication system." (v1.1 adds editable reimbursement/acquisition → computed margin; v2 = integration.)
- **Optional note** field.
- **Typed-outcome buttons:** navy (happy path: Mark Viable) · secondary w/ teal icon (lateral: suggest alternatives) · `btn-danger-outline` (destructive: transfer out). Audit note below.
- Gate authorization = gate.role (template-level) × session.role, or management. Bypass variants (e.g. Assistance) add an outcome.

## S5 · Fulfillment — Pharmacist Clinical Check  `[top-bar-nav: back; no bottom-nav]`
Mandatory every-order review (linear pipeline stage, not a gate).
- **Order vs. prescription card:** dose matches Rx · assay build sums (2000+500+500=3000) · within insurance allowance — each a teal "matches/valid/within" check (→ amber/red if not).
- **Supplies** requested list.
- **Bleed/adherence flag** (amber `notice`): bleeds + PRN this cycle, "review before approving."
- **Actions:** `btn-primary` Approve — send to tech · amber outline Hold — add reason. Audit note.

## S6 · Fulfillment — Tech Pack & Ship  `[top-bar-nav: back; no bottom-nav]`
- **Doses packed N of M** + inline scan-vial.
- **Dose cards:** each = target IU + assay lot lines (packed = teal check "Bagged"; current = 1.5px teal, "scan to fill"). Dose-as-assay-recipe; tech documents actual vials/lots (data capture, not inventory draw).
- **Tracking field:** paste number or URL (tech-owned).
- **Actions:** Mark shipped (disabled until all doses packed + tracking) · Hold — partial/stock. Note: ticket + digitized packing slip generate on ship.

---

# CROSS-SCREEN DATA FLOW (the causal chain)
Bleed logged (P6) → PRN infusions linked in one ledger (P5/P4) → surfaced for reconciliation in order Stage 1 (P3) → drives PRN replacement qty in Stage 2 → attested + signed in Stage 3 → rep gate → pharmacist clinical check (S5) → tech pack (S6) → delivery tracker (P7/P1) → confirm resets cycle. Staff see the same events as gate/queue/roster state (S1–S4); patient sees friendly abstractions (tracker, pills).

# SCREENS NOT YET MOCKED (remaining)
- **Comms hub** (last core surface; 3 open design Qs: per-role vs unified threads, rep visibility into pharmacy thread, management visibility). Floating message widget (patient) → role chooser → thread.
- Manager/Reports view (largely the queue + roster aggregated — same components, management scope).
- Auth/OTP entry, profile/settings, More menus, document upload.

# PASSES REMAINING
1. **This (mobile, structure + color)** — complete for the core set above.
2. **Breakpoint pass** — tablet/desktop (patient center-and-breathe; staff reflow-and-expand).
3. **Polish/production pass** — states, micro-interactions, real content, a11y, edge cases.
