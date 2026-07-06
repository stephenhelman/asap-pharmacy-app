# ASAP Portal — Design Token & Component Master
*The complete design system. Build these as Figma variables + styles + components first; every screen assembles from them. Grayscale is retired — everything is ASAP brand color.*

---

## 1. Color (Figma color variables)

### Brand palette (from ASAP June visual suite — authoritative)
| Name | Hex |
|---|---|
| navy | #1B3A5C |
| navy-dark | #0F2540 |
| navy-light | #2D5282 |
| teal | #3D9E7C |
| teal-dark | #2E7A5F |
| teal-light | #E8F5F1 |
| teal-mid | #A8D8C8 |
| off-white | #F8FAFB |
| white | #FFFFFF |
| amber | #D97706 |
| amber-light | #FEF3C7 |
| red | #C53030 |
| red-light | #FFF5F5 |
| green | #276749 |

### Semantic roles (map components to THESE, not raw hex)
| Role | Hex | Meaning |
|---|---|---|
| `page` | #F8FAFB | screen background |
| `desk` | #EBF0F8 | canvas behind phone frame (presentation only) |
| `card` | #FFFFFF | surfaces / cards |
| `border` | #E2E8F0 | hairlines (1px) |
| `border-strong` | #CBD5E0 | dividers, secondary-button + chip borders |
| `text-primary` | #1B3A5C | headings, names, key values, primary text |
| `text-secondary` | #4A5568 | body, labels |
| `text-muted` | #A0AEC0 | hints, micro labels, placeholders |
| `fill-control` | #EDF2F7 | avatars, neutral chips, icon tiles |
| `accent` | #1B3A5C (navy) | primary brand — filled CTA, active nav, active tab |
| `accent-2` | #3D9E7C (teal) | positive/progress, action-icon accents |
| `icon-tile` | #EBF0F8 | small rounded icon backgrounds |

### Status semantics (fill = tint bg, on = text/icon)
| State | On | Fill |
|---|---|---|
| success / active / on-track | teal #3D9E7C (text often teal-dark #2E7A5F) | teal-light #E8F5F1 |
| warning / due / expiring / decision | amber #D97706 | amber-light #FEF3C7 |
| danger / incomplete / bleed / overdue | red #C53030 | red-light #FFF5F5 |
| neutral / pending / in-flight | text-secondary #4A5568 | fill-control #EDF2F7 |

**Color logic (every screen):** navy = structure + the single primary action; teal = positive/progress + icon accents; semantic colors ONLY at status. Everything else navy/slate neutral.

---

## 2. Typography (Figma text styles)
Weights: 400 regular, 500 medium, 600 semibold. Navy headings/values use 600 (500 reads light on navy). Line-height as Figma %, letter-spacing 0%.
| Style | Size | Weight | LH % | LH px | Use |
|---|---|---|---|---|---|
| `display` | 20 | 600 | 120% | 24 | page titles (My logs, Patients) |
| `h2` | 18 | 600 | 120% | 22 | screen titles, big status |
| `title-name` | 17 | 600 | 130% | 22 | patient name, welcome |
| `num-hero` | 22 | 600 | 120% | 26 | metric numbers, "Due in 6 days" |
| `title-card` | 14 | 600 | 140% | 20 | card headers, row names |
| `body` | 13 | 400 | 150% | 20 | body, secondary lines, field values |
| `body-strong` | 13 | 600 | 150% | 20 | emphasized body |
| `label-strong` | 12 | 600 | 140% | 17 | emphasized pills/badges |
| `label` | 12 | 400 | 140% | 17 | metric labels, neutral pills |
| `nav` | 10 | 400 (active 600) | 130% | 13 | bottom-nav labels |
| `micro` | 10–11 | 400 | 130% | 13 | stepper/section/hint labels |
| `section-label` | 11–12 | 600 | 140% | — | UPPERCASE section headers, letter-spacing 0.04em, text-muted |

---

## 3. Spacing, radius, layout
- **Spacing scale (4px base):** 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24.
- **Radius:** `r-control` 8 · `r-card` 10–12 · `r-frame` 20 · `r-pill` 999 · icon-tile 8–9.
- **Artboard:** mobile 390 × 844 (iPhone 14/15). Fold ~750px (844 − 59 status − 34 home indicator). Fixed-nav scroll ~730px. Taller screens extend frame height, keep 390 width.
- **Content width:** 390 with 16 side padding → 358 usable.
- **Touch targets:** ≥ 44 × 44.
- **Borders:** 1px standard; 1.5px for selected/active emphasis; 2px for stepper nodes.

## 4. Icons
Tabler Icons (`ti ti-*`) throughout. Sizes: 20 (nav, header actions, primary-button leading), 18 (list-row leading), 16 (inline/field leading), 14–15 (chip/pill leading), 11–13 (stepper checks, micro). Filled variants for active/selected (ti-home-filled, ti-circle-check-filled, ti-droplet-filled).

---

## 5. Components (build as Figma components with variants)

### Buttons
| Component | Fill | Border | Text/Icon | Height | Notes |
|---|---|---|---|---|---|
| `btn-primary` | accent navy | none | white 600 | 46–48 | ONE per screen (the CTA) |
| `btn-secondary` | card | 1px border-strong | text-primary; icon teal | 44 | default action |
| `btn-quick` | card | 1px border-strong | label navy; icon 20 teal | 60 | stacked icon-over-label tile |
| `btn-scan-inline` | teal-light | none | teal-dark 600 + ti-scan | ~30 | inline accelerator beside a field |
| `btn-dashed-add` | card | 1px dashed border-strong | text-secondary 500; icon teal | 40 | "add another / log another" |
| `btn-danger-outline` | card | 1px #F3C6C6 | red 600 | 46 | destructive typed outcome |
Disabled: fill border-strong #CBD5E0, white text, not-allowed.
**Rule:** exactly one `btn-primary` per screen; everything else secondary/quick/outline.

### Pills & chips
| Component | Spec | Variants |
|---|---|---|
| `status-pill` (roster/record) | `r-pill` or r-6, pad 3–4×8–11, icon 12–14 + label 11–12 | success (teal-light/teal) · warning (amber) · danger (red) · neutral (fill-control/slate) |
| `chip-work` (queue) | `r-control` 8, pad 4×9, icon 14 + label 12, filled tint | danger · warning · neutral — color = triage |
| `chip-filter` | `r-pill`, pad 6×13, label 12 + count | inactive (card + border-strong + slate) · active (navy fill + white) |
| `badge-count` | `r-pill`, pad 2×8, label-strong | e.g. "1 new" — teal-light/teal-dark |
| `tag-type` | r-5, pad 2×7, label 10/600 | Prophy (fill-control/slate) · PRN (red-light/red) |

### Cards & rows
| Component | Spec |
|---|---|
| `card` | card fill, 1px border, `r-card` 10–12, pad 14–16 |
| `card-selected` | card fill, 1.5px navy border — chosen option |
| `icon-tile` | 30–46px square, `r` 8–9, bg icon-tile #EBF0F8 (or semantic tint), centered icon |
| `list-row` | pad 12–14, optional avatar/icon-tile + title-card + sub (micro/muted) + trailing chevron/chip |
| `metric-tile` | card, `r-control`, pad 12×10, centered num-hero + label — 3-up grid |
| `roster-row` | avatar 34 + name title-card + [anchor status-pill + single lead pill by severity] + chevron |
| `queue-row` | avatar 30 + name + lifecycle micro + chevron; chips row indented 40 |
| `gate-status-row` | 22px node (done=teal+check / attention=amber-tint+icon / pending=border) + name + outcome label |

### Navigation
| Component | Spec |
|---|---|
| `bottom-nav` | card bg, top border, 4 items space-around, pad 10/12; item = icon 20 + nav label; active navy 600 + filled icon, rest muted 400 |
| `top-bar-nav` | pad 14×16, back-arrow OR ti-x + title h2/15 + optional right action |
| `tabs` | row of labels, active = navy 600 + 2px navy underline, rest muted |
| `progress-bar` | segmented, gap 5–6, 4–5px height, done = teal, remaining = border; + "n / N" micro |

**Convention:** top-level screens (dashboard, roster, queue, logs) get `bottom-nav`. Drill-downs (record, gate action, order form, fulfillment, entry flows) get `top-bar-nav` (back or X) and NO bottom-nav.

### Steppers
| Component | Spec |
|---|---|
| `stepper-horizontal` (delivery on dashboard) | 5 nodes space-between; done = teal fill + white check; current = white + 2px teal ring + teal dot; future = white + border-strong; track hairline, filled portion teal; labels micro |
| `stepper-vertical` (delivery page, onboarding progress) | same node states, stacked; current label navy 600 |

### Form elements
| Component | Spec |
|---|---|
| `field-inline` | card, 1px border, `r-control`, pad 11×12, leading icon 16 + value 13 |
| `field-select` | field-inline + trailing ti-chevron-down |
| `field-text` | card, 1px border, `r-control`, pad 11×12, placeholder text-muted (optional multiline) |
| `stepper-input` | card, 1px border, `r-control`; minus / value 17/600 / plus |
| `toggle-pair` | 2 equal buttons gap 8, h 44; selected = #EBF0F8 + 1.5px navy + navy; unselected = btn-secondary |
| `checkbox-row` | ti-square-check-filled teal (checked) / ti-square border-strong (unchecked) + label + qty |
| `note-prefill` | micro teal-dark + leading ti-sparkles teal — "filled from your data" |
| `notice-info` | teal-light bg, `r-card`, ti-info-circle + text — "what's happening now" |
| `notice-careteam` | centered ti-shield-heart muted + micro muted — safety line |

### Signature
| Component | Spec |
|---|---|
| `signature-pad` | card, 1.5px dashed border-strong, `r-card`, ~84px, centered ti-signature 26 muted + "Tap to sign"; + lock note below |

---

## 6. Global states (apply to every screen in the polish pass)
- **Empty:** invitation, not apology ("You're all caught up" / "No bleeds logged — that's good news").
- **Loading:** skeletons of the card/row shapes.
- **Error:** inline, calm, recoverable.
- **Disabled:** border-strong fill, action gated until requirements met (e.g. Save until dose+type set; Ship until all doses packed + tracking).
- **Attention ramp:** neutral → amber → red as clocks/thresholds approach (renewals, doses-on-hand, PA expiry). Thresholds pharmacist-configurable.
- **Selected/active:** 1.5px navy border + tinted fill.

## 7. Two responsive destinies (breakpoint pass)
- **Patient screens — center-and-breathe:** stay ~phone-width centered on tablet/desktop, add margin, optional light secondary rail. Never sprawl.
- **Staff screens — reflow-and-expand:** mobile is the collapsed case; desktop expands to multi-column tables (work queue chips → columns/cells) and 2–3-pane record layouts. Mobile designed as an honest collapse of the desktop grid.
