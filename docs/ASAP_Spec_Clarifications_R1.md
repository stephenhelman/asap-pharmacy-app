# ASAP Prototype — Spec Clarifications (from testing round 1)

Three items that need precise behavior defined before fixing, so CC builds the intent rather than guessing.

---

## A. Session persistence — fixes the "open full profile in new tab" deep link

### Problem
The staff record pane's ⤢ "open full profile in new tab" opens a fresh document with no client state. Because the session lives only in React context (no persisted auth), the new tab boots with an empty session and falls back to the initial patient login. Same class of issue for any cold-load of a deep-linked route.

### Fix — persist the session (contained entirely in the session layer)
- On identity selection, the LoginSwitcher writes the session to **`localStorage`** (key e.g. `asap.session`) in addition to setting React context.
- On app load, the session provider **hydrates from `localStorage` first**; only if absent does it show the switcher (no session → land on the switcher, never crash).
- A new tab / cold load therefore reads the same stored identity and renders the deep-linked screen correctly.
- The switcher includes a **"Log out / reset"** action that clears the stored session (returns to the chooser). In-memory *mutations* still reset on refresh — only the **identity** persists, not the mutation state.

### Why this stays true to the seam
Real auth also persists (cookie/token) and survives new tabs. Adding session persistence makes the prototype behave **more** like production, not less — when NextAuth replaces the switcher, it writes the same session shape to the same consumers. The seam is unchanged; the stand-in just behaves more realistically.

> Note: works on the real Vercel deployment. (Only sandboxed iframes block storage — not a concern for the deployed link.)

---

## B. Infusion entry — manual dose is built from selectable ASSAY COMPONENTS

### Problem
The infusion entry shows the prescription as a fixed readout. It's missing the **manual dose-build**: a dose is not a single number, it's assembled from assay-component vials (dose-as-assay-recipe). Manual entry must let the patient select/confirm the vials that make up the dose. (Test case: Marcos's prophy = 3,000 IU built from 2000 + 500 + 500 — three components in the fixture.)

### Intended model (from architecture §5.3.1 — dose-as-assay-recipe)
A prescription's dose = a **recipe of assay components** (`AssayComponent` rows: iu × quantity, summing to `targetIu`). Manual entry is the default; **scan is only an accelerator** that pre-fills the same fields.

### Spec — the manual infusion-entry flow
1. **Dose selector (top).** Patient picks which prescribed dose they're logging:
   - **Type toggle** — Prophylaxis / On-demand (PRN). Selecting PRN reveals the tier if the Rx defines tiers (Marcos has MILD/MODERATE/SEVERE PRN rows).
   - This resolves to a specific `Prescription` (e.g. `rx_marcos_prophy`).
2. **Assay-component list (the recipe) — the missing piece.** Once a dose is chosen, render its `AssayComponent` rows as **confirmable/selectable line items**, each showing vial IU × quantity:
   - Marcos prophy → `2,000 IU ×1`, `500 IU ×2` (a checkbox/stepper row per component).
   - Components are **pre-checked to the recipe default** (the manual-default principle: the common case is one tap). The patient can **adjust** — uncheck a vial, change a quantity — for the real-world case where the actual vials pulled differ from the standard recipe.
   - A **running total IU** displays and should reconcile to (or intentionally differ from) the Rx `targetIu`; show the target for reference.
   - **Scan accelerator** (`btn-scan-inline`) sits beside this list — scanning a vial checks/fills the matching component instead of typing it. Manual stays the default path; scan just fills it faster.
3. **Lot / expiration capture** per the scanned or manually-entered vial(s) (optional fields in v1, present in the model).
4. **Date/time** — defaults to now, retroactive allowed.
5. **PRN → link to bleed** — if On-demand, the existing link-to-bleed step (new or existing bleed).
6. **Save / Save & add another.**

### Result
One ledger `InfusionEntry` per save, carrying the resolved product/targetIu and (for PRN) the `bleedId`. The assay-component selection is what makes the manual dose real rather than a fixed readout.

---

## C. Delivery confirmation — reconcile RECEIVED against SHIPPED

### Problem
The confirm-delivery screen has a confirm button but doesn't reconcile what was **received** against what was **shipped** (which itself derived from what was **ordered**). Confirmation should be an itemized check-off, not a single button.

### Intended model (architecture §5.2.4 — Ordered vs Shipped vs Received)
Delivery is a three-way reconciliation. The patient confirms receipt by checking off the **shipped** manifest; discrepancies (missing/damaged) flag to rep/tech.

### Spec — the confirm flow
1. **Tracker (top)** — the own-data stepper (Ordered → Shipped → Out for delivery → Delivered), as built.
2. **Confirm section — itemized against the shipped manifest:**
   - List each **shipped** line item (from the order's packed manifest / line items) as a check-off row: dose bags, supplies, quantities.
   - Two confirm paths, as designed:
     - **Scan delivery ticket** → auto-checks all items on the manifest (the happy path).
     - **Manual** → the patient checks off each item themselves.
   - Any item left **unchecked → discrepancy**: a short reason (missing / damaged) captured, which flags to rep/tech as an exception (`Delivery.exceptionNote`).
3. **Confirm receipt** button → sets `confirmedByPatientAt` + `confirmedMethod` (scan|manual); a fully-checked manifest closes the delivery cleanly and resets the cycle timer.

### Result
Confirmation is a reconciliation event (received vs shipped), not a bare acknowledgment — so a short-ship or damaged item is caught at the patient's door and routed, consistent with the SHIPPED_INCOMPLETE handling elsewhere.

---

## D. Staff comms hub — the two filter rows do different jobs and must look different

### Problem
The staff comms hub shows two pill rows that look identical but mean different things:
- **Role row** (Nurse / Pharmacy / Rep) — switches *which conversation/thread*.
- **Content row** (All / Messages / Notes) — switches *what content type within the current thread*.
They're visually indistinguishable, which reads as one confusing control. (See screenshot.)

### Clarify the model first
- The **role/thread switcher** (Nurse/Pharmacy/Rep) exists because a patient has **separate threads per role**. On the patient side it's the patient choosing who to talk to. On the **staff** side it's "which of this patient's role-threads am I viewing" — legitimate, but it's **thread navigation**, not content filtering.
- The **content toggle** (All / Messages / Notes) filters within the open thread — conversation vs. internal notes.

These are two different axes (which thread × which content), so they must be visually distinct.

### Spec — differentiate the two controls
- **Thread switcher (which role-thread):** treat as **navigation/segmentation**, not filter pills. Options (pick one, per the token master):
  - render as **tabs** (underline-active) or as a **labeled segmented selector** ("Thread:" label + segmented control), or
  - as avatar/role **chips with the role icon + role color tint** (nurse teal, pharmacy navy, rep slate) so they read as *destinations*, not filters.
- **Content toggle (All/Messages/Notes):** keep as a **segmented toggle** (the pill-group control), visually lighter/secondary, clearly subordinate to the thread selector. Label it if needed ("Show:").
- **Spatial separation:** the thread selector belongs with the **conversation header** (it's choosing the conversation); the content toggle belongs **just above the message stream** (it's filtering the stream). Don't stack two identical pill rows adjacently.
- Internal notes already have the amber treatment in-stream; the **Notes** filter should echo that (amber accent) so the toggle's meaning is legible.

### Result
At a glance: "which conversation" (role-tinted thread selector, in the header) is obviously different from "what am I seeing in it" (secondary segmented toggle above the stream). The screenshot's ambiguity resolves.
