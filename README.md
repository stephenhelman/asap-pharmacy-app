# ASAP Pharmacy — Prototype

A clickable, demo-ware prototype of the ASAP patient-management platform. **No
electricity**: no backend, no auth, no persistence. Dummy data + an identity
switcher stand in for the two things production will replace. Everything else —
every component — is production-seed, built DRY.

```
npm install      # also runs `prisma generate` (types only — no DB)
npm run dev      # http://localhost:3000
npm run build    # production build
```

## The two seams (the whole point)

Production swaps exactly two things without touching a single component.

### Seam 1 — data source · [`lib/dataProvider.ts`](lib/dataProvider.ts)
Components **never** import `docs/dummy-data.json`. They call typed methods
(`getPatient`, `getWorkQueue`, `getOrder`, …) that return **schema-shaped**
objects — the same nested shapes Prisma `include` returns. The fixtures impl
reads the flat JSON and follows foreign keys in JS. To go live, replace this
file's body with `prisma.*` calls; every caller and return type is unchanged.
Only [`lib/fixtures.ts`](lib/fixtures.ts) touches the JSON.

### Seam 2 — identity · [`lib/session.tsx`](lib/session.tsx)
There is no auth, so a React context holds `session` (`user`, `roles`,
`patientId`). Every screen renders data-driven from it. The floating
[**login-as switcher**](components/LoginSwitcher.tsx) (prototype-only) is the
only thing that sets it. In production NextAuth writes the same object shape and
the switcher goes away. Components read `session`; they never know how it was set.

Types derive from `prisma/schema.prisma` via the generated client
([`lib/types.ts`](lib/types.ts)) — DateTime → ISO string is the only transform,
so field names and enums are compiler-verified against the contract.

## Making it feel alive
[`lib/mutations.tsx`](lib/mutations.tsx) layers **in-memory, session-only**
overrides over the fixtures (submit an order, confirm a delivery, record a gate).
Nothing persists — a refresh resets to the fixtures' initial state.

## What's built (Milestones 1–3 — all core surfaces)
Design system ([`components/ui`](components/ui)) · both seams.

**Patient:** dashboard (P1 active / P2 onboarding / inactive) · order
questionnaire (P3, 3-stage) · logs (P4, tabbed one-ledger + floating create) ·
infusion entry (P5, modal — scan, type toggle, link-to-bleed) · bleed entry
(P6, modal — body-map site picker, linked PRN dose) · delivery/confirm (P7,
tracker + scan/manual receipt) · comms hub (read-only, SMS/Call launchers on
mobile / phone numbers on desktop) · floating "contact your team" widget ·
notifications bell (dropdown → view-all, actionable vs informational).

**Staff:** roster (S1) · work queue (S2, role-scoped, chips deep-link to work
surfaces) · patient record (S3, desktop slide-in pane) · gate action (S4,
reusable primitive — Viability v1 recorder) · clinical check (S5, order-vs-Rx +
bleed flag → approve/hold) · tech pack (S6, dose-as-assay-recipe, scan vials,
lot capture, ship) · comms hub (full composer + internal notes with tag routing
+ seen-by receipts, messages/notes/both filter).

**Responsive — two destinies** (mobile-first; `lg:` is additive so the phone/tablet
views are unchanged):
- **Staff — reflow-and-expand:** desktop gets a navy collapsible sidebar (icons+
  labels → icons, "More" unrolled), the work queue reflows chips → a patients ×
  work-types **matrix table**, roster → card grid, and the record opens as a
  480px **slide-in pane** over the table behind a scrim.
- **Patient — center-and-breathe:** desktop gets a slim brand bar (logo + bell +
  avatar), a centered ~500px column, and a **right spine** (contact card with
  visible phone numbers + unrolled nav). Bottom nav + floating widget hide.

Breakpoints: `<md` full-bleed mobile · `md–lg` centered framed device (tablet) ·
`lg+` the destinies. Remaining surfaces (More menu, Scan landing, reports) render
a graceful stub so every nav item is navigable.

Try it: open the switcher (bottom center) and log in as…
- **Sofia (Multi-Role)** vs **Priya (Nurse)** → same queue, different scope.
- **David** → "Start my order" (P3). **Marcos** → Logs (log an infusion/bleed),
  the delivery tracker → confirm receipt (P7), the notifications bell, or the
  floating contact widget.
- **James / Elton** → onboarding dashboard; open their record → tap an intake
  gate → **Elton's Viability** decision (S4).
- **Nadia (Pharmacist)** → queue → **Theo's clinical check** (S5).
  **Daniel (Tech)** → queue → **Ruben's pack & ship** (S6).
- **Sofia** → Messages → **Marcos** → toggle Notes: her internal note is tagged
  Rep + Social Worker, "seen by Jennifer, awaiting others." Post a message or a
  new tagged note.

Every action (submit, approve, ship, confirm, log) mutates in-memory and
persists across navigation; a hard refresh resets to the fixtures.

## Not built (electricity stays off)
No database/queries/migrations · no NextAuth · no data-source UI toggle · no GHL/
SMS/webhooks · no cron/notifications sending · no persistence · no upload/R2.
