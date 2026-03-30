# FlowBridge — Design Document
**Version:** 1.0  
**Last Updated:** March 2026  
**Status:** Active  
**Companion to:** FlowBridge PRD v2.0

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design System](#2-design-system)
3. [Information Architecture](#3-information-architecture)
4. [User Flows](#4-user-flows)
5. [Screen-by-Screen Specifications](#5-screen-by-screen-specifications)
6. [Component Library](#6-component-library)
7. [AI Interaction Patterns](#7-ai-interaction-patterns)
8. [Responsive & Accessibility Standards](#8-responsive--accessibility-standards)
9. [Motion & Microinteraction Guidelines](#9-motion--microinteraction-guidelines)
10. [Error States & Edge Cases](#10-error-states--edge-cases)
11. [Onboarding Flows](#11-onboarding-flows)
12. [Localization & Language Guidelines](#12-localization--language-guidelines)
13. [Design Handoff Conventions](#13-design-handoff-conventions)
14. [Open Design Questions](#14-open-design-questions)

---

## 1. Design Philosophy

### 1.1 Core Principle: Clarity Under Complexity

FlowBridge handles financially consequential workflows — invoice approvals, compliance deadlines, tax disallowances, payment decisions. Every design decision must prioritize clarity over cleverness. When something goes wrong (a missed deadline, a mismatched invoice), the user must understand the situation immediately and know exactly what to do next.

This does not mean the product should be visually plain. It means visual complexity should always carry information. Every color, badge, and icon must earn its place by reducing cognitive load, not adding to it.

### 1.2 Two Audiences, One System

FlowBridge serves two fundamentally different user types on the same platform:

**Enterprise users (AP teams, CFOs):** Process-oriented, desktop-primary, high-volume workflows, compliance-anxious. They need density — a lot of information visible at once — but organized so critical items surface immediately. They are used to tools like Tally and Excel; they are not accustomed to delightful software.

**MSME users (small business owners):** Outcome-oriented, mobile-primary, low technical literacy, high stress about payment delays. They need simplicity — one question answered clearly: "When will I get paid?" They are not used to software at all; many use WhatsApp as their primary business tool.

The design system must accommodate both without creating two separate codebases. Shared components, divergent layouts.

### 1.3 Design Principles

**1. Surface the critical, suppress the routine**
Compliance deadlines, mismatched invoices, and payment risks must be immediately visible. Routine, on-track items can be scanned but not spotlighted. Visual hierarchy is the primary tool for this.

**2. Confidence through transparency**
Users making financial decisions need to trust the system. Show your work: display why an invoice was auto-approved, what the 43B(h) exposure calculation is based on, what confidence score the OCR assigned. Opacity creates anxiety.

**3. Action over information**
Every screen should have a clear primary action. An AP dashboard showing 12 invoices in review should make it obvious what to do next. Avoid information dumps with no actionable next step.

**4. Earn complexity progressively**
New users — especially MSMEs — should not see the full complexity of the system on first login. Progressive disclosure: show the essential, reveal the advanced when the user is ready.

**5. Respect both users' time**
Enterprise AP teams process high volumes quickly. MSMEs check payment status infrequently but anxiously. The enterprise interface should optimize for speed and batch actions. The MSME interface should optimize for reassurance and single-question answers.

---

## 2. Design System

### 2.1 Color System

#### Design Intent

FlowBridge's color system is built on a warm off-white base with deep ocean/teal brand primaries — creating a palette that reads as trustworthy and stable without being cold or corporate. The glassmorphism surface treatment adds depth while keeping the interface light and legible. Dark mode pivots to high-contrast slate with bright teal accents, maintaining the same professional character.

---

#### CSS Custom Properties — Full Token Reference

```css
:root {
  /* ── Backgrounds & Surfaces ─────────────────────────── */
  --background:            #f7f4ef;   /* Main page background — warm off-white/beige */
  --brand-sand:            #f2ede3;   /* Decorative surface, layout gradients          */

  /* ── Brand Colors ───────────────────────────────────── */
  --brand-ocean:           #1b5b6a;   /* Primary — dark teal/ocean. Navbars, CTAs      */
  --brand-teal:            #1c8b85;   /* Secondary brand — teal. Accents, highlights   */
  --brand-ink:             #0f1b2d;   /* Headings, strong brand text — deep navy       */
  --brand-glow:            #e0f2f1;   /* Active/glow states — soft teal highlight      */
  --mint-light:            #d9f0ef;   /* Hover highlights, selected row backgrounds    */
  --mint-border:           #cfe8e6;   /* Borders, dividers, card outlines              */
  --hover-navy:            #142338;   /* Hover state on primary buttons                */
  --peach-highlight:       #f6ead7;   /* Warm accent — badges, special callouts        */

  /* ── Dark Gradient Elements ─────────────────────────── */
  --gradient-dark-1:       #12263c;   /* Sidebar, dark headers — deep navy             */
  --gradient-dark-2:       #0b1422;   /* Deepest dark gradient layer                  */

  /* ── Typography ─────────────────────────────────────── */
  --foreground:            #0f172a;   /* Primary text — dark slate                     */

  /* ── Status / Semantic ──────────────────────────────── */
  --status-success:        #10b981;   /* Approved, Paid, Compliant — emerald green     */
  --status-warning:        #f59e0b;   /* Pending, Action Required — amber              */
  --status-warning-2:      #f97316;   /* Escalated warning — orange                   */
  --status-danger:         #ef4444;   /* Error, Rejected, Overdue — red               */

  /* ── Chart & Data Visualization ────────────────────── */
  --chart-muted-1:         #94a3b8;   /* Axis lines, muted data lines                 */
  --chart-muted-2:         #64748b;   /* Secondary chart data, labels                 */
  --chart-muted-3:         #f1f5f9;   /* Chart backgrounds, fills                     */
}

/* ── Dark Mode ──────────────────────────────────────────── */
.dark {
  --background:            #0f172a;   /* Dark slate page background                   */
  --foreground:            #f1f5f9;   /* Light slate primary text                     */
  --brand-sand:            #1e293b;   /* Dark surface panels                          */
  --chart-muted-3:         #1e293b;   /* Dark chart backgrounds                       */
  --brand-ocean:           #38bdf8;   /* Sky blue — primary brand in dark mode        */
  --brand-teal:            #2dd4bf;   /* Bright teal — secondary brand in dark mode   */
}
```

---

#### Surface Hierarchy

The platform uses a layered glassmorphism surface system. Each layer is slightly more opaque, creating visual depth and clear content hierarchy.

| Layer | Class | Treatment | Usage |
|---|---|---|---|
| Page | — | `background: var(--background)` + decorative radial/linear gradients using `--brand-ocean`, `--brand-teal`, `--brand-sand` | Root page background |
| Glass Panel | `.portal-surface` | `background: rgba(255,255,255,0.82)` + `backdrop-filter: blur(12px)` + `border: 1px solid rgba(226,232,240,0.75)` | Cards, side panels, invoice drawers |
| Solid Panel | `.portal-surface-soft` | `background: rgba(255,255,255,0.92)` + `border: 1px solid var(--mint-border)` | Tables, forms, high-contrast content areas |
| Sub-shell | `.portal-toggle-shell` | `background: rgba(241,245,249,0.75)` | Toggle groups, tab bars, filter strips |
| Sidebar / Dark Header | — | `background: linear-gradient(180deg, var(--gradient-dark-1), var(--gradient-dark-2))` | Left navigation sidebar, dark top bars |

**Dark mode surfaces:** Replace `rgba(255,255,255,0.82)` with `rgba(30,41,59,0.85)` for `.portal-surface` and `rgba(30,41,59,0.95)` for `.portal-surface-soft`. Border stays `rgba(226,232,240,0.12)`.

---

#### Typography Colors

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--foreground` | `#0f172a` | `#f1f5f9` | Body text, labels, table content |
| `--brand-ink` | `#0f1b2d` | `#f8fafc` | Page headings, section titles, strong emphasis |
| `--chart-muted-2` | `#64748b` | `#94a3b8` | Secondary text, metadata, timestamps |
| `--chart-muted-1` | `#94a3b8` | `#64748b` | Tertiary text, placeholders, disabled labels |
| Text on dark surfaces | `#f1f5f9` | — | Text inside sidebar, dark headers |
| Text on brand-ocean | `#ffffff` | `#ffffff` | Text on primary buttons, ocean-colored elements |

---

#### Brand Element Usage Rules

| Element | Color | Hover / Active |
|---|---|---|
| Primary buttons | `--brand-ocean` (`#1b5b6a`) background, white text | `--hover-navy` (`#142338`) background |
| Secondary buttons | `--mint-light` (`#d9f0ef`) background, `--brand-ocean` text | `--brand-glow` (`#e0f2f1`) background |
| Navigation sidebar | `--gradient-dark-1` → `--gradient-dark-2` | Active item: `--brand-teal` left border + `--mint-light` background at 15% opacity |
| Active nav item | `--brand-teal` (`#1c8b85`) left border (3px) | — |
| Links | `--brand-ocean` (`#1b5b6a`) | `--brand-teal` (`#1c8b85`) |
| Focus ring | `--brand-teal` at 30% opacity, 3px outline | — |
| Badges / callout highlights | `--peach-highlight` (`#f6ead7`) background, `--brand-ink` text | — |
| Card borders | `--mint-border` (`#cfe8e6`) | — |

---

#### Status & Invoice Badge Colors

Derived from the status token set, with light tinted backgrounds for use inside glass panels.

| Status | Background | Text | Border | Token |
|---|---|---|---|---|
| Submitted | `#e0f2f1` | `#1b5b6a` | `--mint-border` | Brand teal family |
| Processing | `#fef3c7` | `#92400e` | `#fde68a` | `--status-warning` family |
| Review Required | `#fff7ed` | `#9a3412` | `#fed7aa` | `--status-warning-2` family |
| Approved | `#d1fae5` | `#065f46` | `#6ee7b7` | `--status-success` family |
| Paid | `#d1fae5` | `#065f46` | `#a7f3d0` | `--status-success` family |
| Disputed | `#fee2e2` | `#991b1b` | `#fca5a5` | `--status-danger` family |
| Overdue | `#fee2e2` | `#7f1d1d` | `#f87171` | `--status-danger` family |
| Special Callout | `--peach-highlight` `#f6ead7` | `--brand-ink` `#0f1b2d` | `#e8d5b5` | Warm accent |

---

#### Chart & Data Visualization Colors

| Role | Token | Value | Usage |
|---|---|---|---|
| Primary data series | `--brand-teal` | `#1c8b85` | Main line/bar in charts |
| Secondary data series | `--brand-ocean` | `#1b5b6a` | Comparison line/bar |
| Axis lines & grid | `--chart-muted-1` | `#94a3b8` | X/Y axis, gridlines |
| Data labels | `--chart-muted-2` | `#64748b` | Tick labels, legend text |
| Chart area fill | `--chart-muted-3` | `#f1f5f9` | Area chart fills, chart backgrounds |
| Success data | `--status-success` | `#10b981` | Paid invoices, compliant count |
| Warning data | `--status-warning` | `#f59e0b` | At-risk invoices, pending count |
| Danger data | `--status-danger` | `#ef4444` | Overdue, breached, rejected |
| Warm highlight | `--peach-highlight` | `#f6ead7` | Callout annotations, highlight bands |

### 2.2 Typography

#### Font Stack

```css
--font-display: 'DM Sans', 'Satoshi', system-ui, sans-serif;
--font-body: 'DM Sans', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
--font-numeric: 'DM Mono', 'Tabular Numbers', monospace;
```

Use `--font-numeric` for all financial figures, invoice amounts, penalty calculations, and dates to ensure tabular alignment.

#### Type Scale

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `--text-xs` | 11px | 16px | 400 | Metadata, timestamps, fine print |
| `--text-sm` | 13px | 20px | 400 | Table cells, secondary labels, captions |
| `--text-base` | 15px | 24px | 400 | Body text, form labels, descriptions |
| `--text-lg` | 17px | 26px | 500 | Section headings, card titles |
| `--text-xl` | 20px | 28px | 600 | Page titles, modal headers |
| `--text-2xl` | 24px | 32px | 600 | Dashboard stat cards |
| `--text-3xl` | 30px | 38px | 700 | Hero numbers (total exposure, ARR) |

#### Numeric Formatting Rules

- All rupee amounts: `₹X,XX,XXX` (Indian number format with Devanagari ₹ symbol)
- Amounts in lakhs: `₹12.4L` (abbreviated above ₹1 lakh in dashboard cards)
- Amounts in crores: `₹2.3 Cr` (abbreviated above ₹1 crore)
- Percentages: `1.25%` (2 decimal places for rates)
- Days: `14 days` (never abbreviate in compliance contexts)
- Dates: `15 Mar 2026` (DD Mon YYYY — no ambiguity between Indian and US date formats)

### 2.3 Spacing System

Base unit: `4px`

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Icon-to-label gaps, tight inline spacing |
| `--space-2` | 8px | Inner padding for small components (badges, chips) |
| `--space-3` | 12px | Component internal padding |
| `--space-4` | 16px | Standard card padding, form field gaps |
| `--space-5` | 20px | Section internal spacing |
| `--space-6` | 24px | Card-to-card gaps, section margins |
| `--space-8` | 32px | Major section separators |
| `--space-10` | 40px | Page-level vertical rhythm |
| `--space-12` | 48px | Hero section padding |

### 2.4 Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Badges, status pills, small chips |
| `--radius-md` | 8px | Buttons, inputs, small cards |
| `--radius-lg` | 12px | Standard cards, panels |
| `--radius-xl` | 16px | Modal dialogs, large cards |
| `--radius-full` | 9999px | Avatars, toggle switches, circular elements |

### 2.5 Elevation & Shadow

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.06)` | Subtle card lift |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Standard card shadow |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.12)` | Modals, elevated panels |
| `--shadow-focus` | `0 0 0 3px rgba(28,139,133,0.3)` | Focus ring for interactive elements (brand-teal at 30% opacity) |

### 2.6 Iconography

**Icon library:** Lucide Icons (consistent, open source, well-maintained)

**Sizing rules:**
- Inline with text (labels, buttons): 16×16px
- List row icons: 18×18px
- Navigation icons: 20×20px
- Feature/section icons: 24×24px
- Illustrative/empty state icons: 48×48px

**Color rules:**
- Icons inherit the text color of their context by default
- Status icons use their semantic token: danger icon uses `var(--status-danger)`, warning uses `var(--status-warning)`, success uses `var(--status-success)`
- Brand icons (nav, CTAs) use `var(--brand-ocean)` or white when on dark surfaces
- Never use decorative icons that don't carry meaning

**Specific icon assignments (for consistency across the platform):**

| Concept | Icon Name |
|---|---|
| Invoice | `file-text` |
| Payment / Money | `indian-rupee` |
| Compliance / Law | `shield-check` |
| Alert / Warning | `alert-triangle` |
| Deadline / Clock | `clock` |
| Dispute | `message-square-warning` |
| Yield / Treasury | `trending-up` |
| Vendor / Supplier | `building-2` |
| Match / Reconcile | `git-merge` |
| Approved | `check-circle-2` |
| Rejected | `x-circle` |
| Pending / Review | `circle-dot` |
| Settings | `settings-2` |
| Export / Download | `download` |

---

## 3. Information Architecture

### 3.1 Enterprise Portal — Navigation Structure

```
Enterprise Portal
│
├── Dashboard                    (default landing)
│   ├── AP Overview
│   ├── Compliance Status (43B(h) + MSMED)
│   └── Quick Actions
│
├── Invoices
│   ├── All Invoices             (full queue with filters)
│   ├── Pending Review           (needs human action)
│   ├── Approved                 (ready for payment)
│   └── Disputed                 (active disputes)
│
├── Compliance
│   ├── 43B(h) Radar             (tax disallowance dashboard)
│   ├── MSMED Deadlines          (per-invoice countdown)
│   ├── Penalty Calculator       (live penalty accumulation)
│   └── Audit Log                (immutable compliance history)
│
├── Yield Engine
│   ├── Configure Offers         (discount rate rules)
│   ├── Active Offers            (offers sent, pending acceptance)
│   └── Settled                  (completed early payments)
│
├── Vendors
│   ├── Vendor Directory         (all MSME suppliers)
│   ├── Onboarding Status        (invited, active, dormant)
│   └── Risk Scores              (Supplier Risk Score per vendor)
│
├── Reports
│   ├── AP Aging Report
│   ├── Compliance Report (43B(h) FY summary)
│   ├── Vendor Payment History
│   └── Yield Engine Performance
│
└── Settings
    ├── Company Profile
    ├── ERP Integration
    ├── User Management
    ├── Notification Preferences
    └── Yield Engine Rules
```

### 3.2 MSME Portal — Navigation Structure

```
MSME Portal
│
├── Home                         (default landing — "When will I get paid?")
│   ├── Pending Payments Summary
│   ├── Latest Invoice Status
│   └── Early Payment Offers
│
├── Invoices
│   ├── Submit Invoice           (upload or fill form)
│   ├── All Invoices             (status tracker per invoice)
│   └── Disputes                 (open disputes with buyers)
│
├── Payments
│   ├── Expected Payments        (predicted payment dates)
│   ├── Received                 (payment history)
│   └── Early Payment Offers     (Yield Engine inbox)
│
├── My Rights                    (MSMED Act dashboard — free tier)
│   ├── Per-Buyer Deadlines
│   ├── Penalties Owed to Me
│   └── How to Raise a Dispute
│
└── Account
    ├── Business Profile
    ├── Bank Details
    ├── Linked Buyers
    └── Notifications
```

*(MSME Pro tier adds: AR Ledger, Cashflow Forecast, Multi-Buyer Analytics)*

### 3.3 Navigation Behavior

**Enterprise portal:** Persistent left sidebar (collapsed on smaller screens to icon-only). Top bar with company name, notification bell, and user avatar. Sidebar highlights active section.

**MSME portal:** Bottom tab navigation on mobile (4 primary tabs: Home, Invoices, Payments, Account). Top navigation on desktop. Mobile-first layout for all screens.

---

## 4. User Flows

### 4.1 Enterprise: Invoice Approval Flow

```
Invoice Submitted by MSME
         │
         ▼
AI OCR Extraction + Confidence Scoring
         │
    ┌────┴────┐
    │         │
High        Low
Confidence  Confidence (<0.75)
    │         │
    │         ▼
    │    Human Review Queue
    │    (AP team corrects fields)
    │         │
    └────┬────┘
         │
         ▼
3-Way Match: PO × GRN × Invoice
         │
    ┌────┴──────────┐
    │               │
All Fields       Mismatch
Match            Detected
    │               │
    ▼               ▼
Auto-Approved    Review Flagged
    │            (AP team resolves)
    ▼               │
Payment Queue       │
    │            ┌──┴──┐
    │            │     │
    │         Resolved  Dispute
    │            │     Opened
    │            ▼       │
    └──────── Payment     ▼
             Scheduled  Dispute
                        Workspace
```

**Compliance thread (runs in parallel throughout):**
- Compliance engine timestamps invoice acceptance
- Countdown timer starts toward MSMED deadline
- Alerts fire at 7 days, 3 days, 1 day before breach
- 43B(h) exposure updates in real time on dashboard

### 4.2 Enterprise: Yield Engine Flow

```
Enterprise configures Yield Engine rules
(discount rate range, eligible vendor tiers, min invoice size)
         │
         ▼
Qualifying invoices auto-identified (Approved status + rule match)
         │
         ▼
Early payment offer generated per invoice
(shows: original due date, early date, discount %, net amount to MSME)
         │
         ▼
Offer sent to MSME portal (in-app + WhatsApp notification)
         │
    ┌────┴────┐
    │         │
  MSME      MSME
 Accepts    Declines
    │         │
    ▼         ▼
Payment    Invoice remains
initiated   on original
(T+2 days)  schedule
    │
    ▼
Enterprise treasury yield recorded
Discount captured in Yield Engine analytics
```

### 4.3 MSME: Invoice Submission Flow

```
MSME opens Submit Invoice screen
         │
    ┌────┴────┐
    │         │
Upload PDF   Fill Form
    │         │
    ▼         │
OCR extracts │
fields       │
    │         │
    └────┬────┘
         │
         ▼
Review extracted / entered fields
(OCR-flagged fields highlighted in yellow)
         │
         ▼
Select Buyer (dropdown of linked enterprise buyers)
         │
         ▼
Confirm submission
         │
         ▼
Invoice ID generated, status: "Submitted"
MSME sees payment tracker immediately
```

### 4.4 Enterprise: 43B(h) Compliance Review Flow

```
CFO / AP Head opens Compliance → 43B(h) Radar
         │
         ▼
Dashboard shows:
- Total FY disallowance exposure (₹ amount)
- Invoices at risk (count + vendor names)
- Days remaining per at-risk invoice
         │
         ▼
CFO selects invoice approaching breach
         │
         ▼
Options presented:
1. Pay now (immediate payment instruction)
2. Offer early payment via Yield Engine
3. Mark as disputed (pauses statutory clock if legitimate dispute)
4. Export for CA review
         │
         ▼
Action taken → compliance status updates in real time
Audit log entry created with timestamp and user
```

### 4.5 MSME: Onboarding Flow

```
MSME receives WhatsApp / SMS / email invitation from Enterprise
(Sent by FlowBridge on behalf of buyer)
         │
         ▼
Opens link → Mobile-optimized onboarding
         │
         ▼
Step 1: Enter mobile number → OTP verification
         │
         ▼
Step 2: Business details
- Business name
- Udyam registration number (optional but recommended)
- GSTIN
         │
         ▼
Step 3: Bank account details for payment receipt
         │
         ▼
Step 4: Review linked buyer (pre-filled from invitation)
         │
         ▼
Home screen: shows pending invoices from buyer (if any already submitted)
Or: prompted to submit first invoice
```

---

## 5. Screen-by-Screen Specifications

### 5.1 Enterprise Dashboard

**Purpose:** Single-screen overview of AP health, compliance status, and priority actions.

**Layout:** 3-column grid on desktop. Left sidebar (navigation) + main content area.

**Top section — Stat Cards (horizontal row of 4):**

| Card | Metric | Color Signal |
|---|---|---|
| Invoices Pending Review | Count | Warning if >10 |
| 43B(h) Exposure This FY | ₹ amount | Danger if >₹0 |
| Invoices Due in 7 Days | Count | Warning if >0 |
| Early Payments Available | Count | Neutral |

**Middle section — Priority Action Queue:**

A focused list of invoices requiring immediate attention, sorted by urgency. Each row shows:
- Vendor name
- Invoice number and amount
- Days until MSMED deadline (color-coded: green >14 days, amber 7–14 days, red <7 days)
- Status badge
- Primary action button (Approve / Review / Pay Now)

Maximum 8 rows visible without scrolling. "View all" link to full invoice queue.

**Right section — Compliance Snapshot:**

- Mini 43B(h) radar: list of invoices approaching breach with countdown
- Current FY disallowance exposure (large number, danger color if >₹0)
- Link to full compliance dashboard

**Bottom section — Yield Engine Summary (if configured):**

- Active early payment offers: count and total value
- Offers accepted this month: count and treasury yield generated
- Link to Yield Engine

### 5.2 Enterprise Invoice Queue

**Purpose:** Full list of all invoices with filtering, sorting, and batch actions.

**Layout:** Full-width table with filter bar above.

**Filter bar:**
- Status filter (multi-select: All, Pending Review, Approved, Disputed, Paid, Overdue)
- Vendor filter (searchable dropdown)
- Date range picker
- Amount range
- MSMED deadline filter (toggle: "At risk only")

**Table columns:**

| Column | Width | Notes |
|---|---|---|
| Invoice # | 120px | Monospace font, clickable to detail view |
| Vendor | 180px | Truncate with tooltip if long |
| Invoice Date | 100px | DD Mon YYYY |
| Amount | 120px | Right-aligned, Indian number format |
| Status | 140px | Status badge (see color system) |
| MSMED Deadline | 120px | Days remaining, color-coded |
| 3-Way Match | 100px | Matched / Review / Failed badge |
| Action | 100px | Context-sensitive primary action button |

**Row interactions:**
- Click row → opens invoice detail drawer (right-side slide-in, not full navigation)
- Hover row → shows quick action buttons (Approve, Dispute, Pay Now)
- Checkbox select → enables batch approve/pay

**Batch actions bar (appears when rows selected):**
- Approve selected
- Mark for payment
- Export selected

### 5.3 Enterprise Invoice Detail View

**Layout:** Right-side drawer, 480px wide, overlays the invoice queue.

**Sections:**

**Header:**
- Invoice number, vendor name, submission date
- Status badge (large, prominent)
- Primary action button (context-sensitive)

**Invoice Summary:**
- Amount, GST breakdown, total
- PO reference number
- GRN reference number
- Invoice date, due date, MSMED deadline

**3-Way Match Results:**
- Visual match table: PO vs GRN vs Invoice, per line item
- Matched fields: green check
- Mismatched fields: amber highlight with discrepancy tooltip
- Overall match status and confidence score

**Compliance Status:**
- Days remaining to MSMED deadline (countdown)
- Penalty amount accruing per day (if past deadline)
- 43B(h) exposure contribution (₹ amount this invoice adds to FY disallowance risk)

**OCR Confidence (collapsible):**
- Per-field confidence scores
- Fields below 0.75 threshold highlighted with human-corrected value shown

**Activity Log:**
- Timestamped list of all actions: submitted, OCR processed, matched, reviewed, approved, payment initiated

**Dispute Workspace (if disputed):**
- Threaded comments between AP team and MSME
- Document attachments
- Resolution status

### 5.4 Enterprise 43B(h) Radar

**Purpose:** Give the CFO complete visibility into current tax disallowance risk and clear actions to reduce it.

**Layout:** Full-page view with summary header and detailed table below.

**Header section:**

- **Total FY Exposure** — large number in danger color: estimated total amount that could be disallowed if no action taken
- **Invoices Breached** — count of invoices already past MSMED deadline (red)
- **Invoices At Risk** — count approaching deadline within 7 days (amber)
- **Compliant Invoices** — count within deadline (green)
- Context line: "Based on ₹X Cr in outstanding MSME payables. FY ends DD Mar YYYY."

**Exposure breakdown chart:**
- Horizontal bar showing: Safe (green) | At Risk (amber) | Breached (red)
- Values and percentages labeled

**Invoice risk table:**

| Column | Notes |
|---|---|
| Vendor | MSME name, Udyam status indicator |
| Invoice # | Link to invoice detail |
| Invoice Amount | |
| Acceptance Date | When invoice was accepted (statutory clock start) |
| Deadline Date | 15 or 45 day limit |
| Days Remaining | Color-coded. Negative = breached |
| Penalty Accruing | ₹/day if past deadline |
| Total Penalty | Compound penalty to date |
| Disallowance Risk | ₹ amount at risk for 43B(h) |
| Action | Pay Now / Offer Early Payment / Mark Disputed |

**Export button:** Generate PDF report for CA — includes all at-risk invoices, penalty calculations, statutory references. Dated and timestamped.

### 5.5 Enterprise Yield Engine

**Purpose:** Configure and monitor early payment offers to MSME suppliers.

**Layout:** Two-panel. Left: configuration and rules. Right: active offers and performance.

**Configuration panel:**

- Discount rate range: minimum % and maximum % (slider)
- Early payment advance window: 15 / 30 / 45 / 60 days before original due date
- Eligible vendor tiers: All / High-risk score vendors only / Custom segment
- Minimum invoice amount for offer eligibility
- Auto-offer toggle: automatically generate offers for all qualifying invoices

**Active Offers table:**
- Vendor, invoice amount, early payment date, discount rate, net payment to MSME, MSME response (pending/accepted/declined), expiry date

**Performance metrics:**
- Total early payment volume this month
- Average discount rate accepted
- Treasury yield generated (₹ amount saved vs. holding to original due date)
- MSME acceptance rate (%)

### 5.6 MSME Home Screen

**Purpose:** Answer the one question every MSME has when they open the app: "When will I get paid?"

**Layout:** Mobile-first. Single column. Cards stacked vertically.

**Top section — Payment Summary:**
- Large, prominent: "₹X,XX,XXX expected this month"
- Sub-line: "From [N] invoices across [M] buyers"
- Visual timeline: horizontal bar showing next expected payment date

**Next Payment Card (most prominent card on screen):**
- Buyer name
- Invoice number and amount
- Status badge (Approved / Processing / Review)
- Expected payment date (large, clear)
- "Track this invoice" link

**Early Payment Offers (if any):**
- Offer card: "Get paid ₹X today instead of [date]. Discount: 1.2%"
- Accept / Decline buttons
- Offer expiry countdown

**Recent Activity (last 3 items):**
- Invoice submitted, matched, approved, paid — most recent 3 actions

**Quick action button:** "Submit new invoice" — floating action button (FAB), bottom right

### 5.7 MSME Invoice Status Tracker

**Purpose:** Show exactly where an invoice is in the approval process, with honest expected payment date.

**Layout:** Single invoice view. Vertical status timeline.

**Header:**
- Invoice number, buyer name, amount (large)
- Current status badge

**Status Timeline (vertical, step-by-step):**

```
● Submitted          15 Mar 2026, 10:42 AM
  ↓
● Processing         AI matching in progress...
  ↓
○ Approved           Expected by 16 Mar 2026
  ↓
○ Payment Initiated  —
  ↓
○ Paid               —
```

Completed steps: filled circle, timestamp shown
Current step: animated pulse circle
Future steps: empty circle, expected date shown

**Compliance section:**
- "Your buyer must pay by [date] under MSMED Act"
- If approaching: amber banner "X days remain — your buyer has been notified"
- If breached: red banner "Your buyer is X days overdue. Penalty of ₹X has accrued. [Learn how to claim this]"

**Invoice details (collapsible):**
- Full invoice amount breakdown, GST, PO reference

### 5.8 MSME "My Rights" Dashboard

**Purpose:** Make MSME users aware of their legal rights under the MSMED Act, without requiring legal literacy.

**Design approach:** Plain language. No legal jargon. Reassuring rather than alarming tone.

**Per-buyer section (one card per linked enterprise buyer):**
- Buyer name
- Outstanding invoices: count and total amount
- MSMED deadline status: "All on track" (green) / "X invoices at risk" (amber) / "Buyer is overdue on X invoices" (red)
- Penalty owed to you (if any): ₹ amount, with "What does this mean?" tooltip
- "How to raise a dispute" link

**Explainer section (static, always visible):**

> **Your rights under the MSMED Act**
>
> If you are a registered MSME, your buyers must pay you within:
> - **15 days** if you agreed to a shorter payment term in writing
> - **45 days** maximum, regardless of any agreement
>
> If they pay late, they owe you compound interest at **3× the RBI bank rate**.
>
> This is a legal right. You do not need to negotiate for it.

---

## 6. Component Library

### 6.1 Status Badge

Used consistently everywhere an invoice or compliance status is displayed.

```
Properties:
- status: 'submitted' | 'processing' | 'review' | 'approved' | 'paid' | 'disputed' | 'overdue'
- size: 'sm' | 'md' (default: md)
- showIcon: boolean (default: true)

Visual spec:
- Pill shape (border-radius: full)
- 6px vertical padding, 10px horizontal padding (md)
- 4px vertical padding, 8px horizontal padding (sm)
- Icon: 14px, 4px gap to text (md) / 12px, 3px gap (sm)
- Font: --text-sm, weight 500
- Colors: per Invoice Status Colors table in section 2.1
```

### 6.2 Compliance Countdown

Used on invoice rows and detail views to show MSMED deadline urgency.

```
Properties:
- daysRemaining: number (negative = overdue)
- size: 'sm' | 'md'

Visual spec:
- daysRemaining > 14: green text, "14 days"
- daysRemaining 8–14: amber text, "X days"
- daysRemaining 1–7: orange text, bold, "X days"
- daysRemaining 0: red text, bold, "Due today"
- daysRemaining < 0: red text, bold, "X days overdue"
- Never show a colored background — text color only to avoid visual noise in tables
```

### 6.3 Invoice Amount Display

```
Properties:
- amount: number (in paise or rupees, specified by amountUnit prop)
- showCurrency: boolean (default: true)
- size: 'sm' | 'md' | 'lg' | 'xl'

Formatting:
- Always use Indian number format: ₹X,XX,XXX.XX
- Always use --font-numeric for tabular alignment
- In tables: right-align
- In cards: left-align with currency symbol in --text-secondary, amount in --text-primary
- Abbreviated form (for stat cards): ₹12.4L or ₹2.3 Cr
```

### 6.4 3-Way Match Indicator

Compact visual used in invoice table rows to show match result.

```
States:
- 'matched': green icon + "Matched" text
- 'review': amber icon + "Review" text
- 'failed': red icon + "Failed" text
- 'processing': spinner + "Matching..." text

In table row: icon only (18px), tooltip on hover shows full match result
In invoice detail: full match table (section 5.3)
```

### 6.5 Stat Card

Used in dashboard header rows.

```
Properties:
- label: string
- value: string | number
- subLabel: string (optional)
- trend: { value: number, direction: 'up' | 'down', positive: boolean } (optional)
- alertLevel: 'normal' | 'warning' | 'danger' (default: normal)

Visual spec:
- Background: .portal-surface-soft (rgba(255,255,255,0.92))
- Border: 1px solid var(--mint-border)
- Border-radius: --radius-lg
- Padding: 20px
- Label: --text-sm, color: var(--chart-muted-2)
- Value: --text-2xl or --text-3xl, color: var(--brand-ink), --font-numeric
- alertLevel 'warning': left border 3px var(--status-warning)
- alertLevel 'danger': left border 3px var(--status-danger), value in var(--status-danger)
```

### 6.6 Invoice Timeline (MSME)

Vertical status timeline for MSME invoice detail view.

```
Steps: Submitted → Processing → Approved → Payment Initiated → Paid

Per step:
- Completed: filled circle (var(--brand-teal)), solid connector line, timestamp shown
- Current: animated pulse circle (var(--brand-teal) with opacity pulse), "In progress" or status text
- Pending: empty circle (var(--mint-border)), dashed connector line, expected date shown
- Skipped/Error: X circle (var(--status-danger))

Circle size: 12px
Connector line: 2px, left-aligned to circle center
Step text: 15px, left-padded 20px from circle
Timestamp: 13px, color: var(--chart-muted-2), same row as step name
```

### 6.7 Empty States

Every list and table needs a well-designed empty state.

```
Structure:
- Illustrative icon: 48px, color: var(--chart-muted-1)
- Primary message: --text-lg, color: var(--brand-ink), centered
- Secondary message: --text-base, color: var(--chart-muted-2), centered, max-width 320px
- Action button (optional): primary button with relevant CTA

Specific empty states:
- No invoices pending: "All caught up — no invoices need your attention"
- No compliance alerts: "No 43B(h) risk this FY — your MSME payments are on track"
- No vendors onboarded: "Invite your MSME vendors to get started" [Invite Vendors button]
- MSME — no invoices: "Submit your first invoice to [Buyer Name]" [Submit Invoice button]
```

### 6.8 Notification / Alert Banner

In-page alert for time-sensitive compliance information.

```
Types:
- Info (teal): background var(--brand-glow) #e0f2f1, border var(--mint-border), icon var(--brand-teal)
- Warning (amber): background #fef3c7, border #fde68a, icon var(--status-warning) #f59e0b
- Danger (red): background #fee2e2, border #fca5a5, icon var(--status-danger) #ef4444

Structure:
- Left: colored icon (16px) matching type color above
- Center: message text (15px, var(--foreground)) + optional sub-text (13px, var(--chart-muted-2))
- Right: action button (text button in brand-ocean) + dismiss X (var(--chart-muted-1))

Placement: top of main content area, below page header. Stacks if multiple alerts.
Auto-dismiss: never for danger alerts. Info alerts auto-dismiss after 8 seconds.
```

---

## 7. AI Interaction Patterns

### 7.1 OCR Review Interface

When AI confidence on a field is below 0.75, the field enters human review mode.

**Visual treatment:**
- Field has amber left border
- Field label shows: "Review needed — AI confidence: 67%"
- Original extracted value shown as placeholder (greyed out)
- Input is pre-focused for immediate correction
- Tooltip on hover shows the bounding box region on the original invoice image

**Invoice image panel:**
- Shown side-by-side with the review form on desktop
- Tappable on mobile to expand
- Low-confidence field regions highlighted with amber overlay
- Clicking a highlighted region focuses the corresponding form field

**Correction submission:**
- User edits field value and clicks "Confirm"
- Correction is logged as training data with the original extracted value
- Once all low-confidence fields confirmed, invoice moves to matching queue

### 7.2 3-Way Match Discrepancy Display

When matching finds a discrepancy, the UI must make the specific issue immediately clear.

**Match results table:**

```
Field          | PO            | GRN           | Invoice       | Status
─────────────────────────────────────────────────────────────────────────
Item Code      | AUTO-COMP-42  | AUTO-COMP-42  | AUTO-COMP-42  | ✓ Match
Description    | Auto Component| Auto Component| Auto Parts    | ~ Fuzzy
Quantity       | 500 units     | 480 units     | 500 units     | ✗ Mismatch
Unit Price     | ₹450.00       | —             | ₹455.00       | ✗ Mismatch
HSN Code       | 8708          | —             | 8708          | ✓ Match
```

- ✓ Match: green, --color-success
- ~ Fuzzy match (above 85% similarity): amber, with similarity score tooltip
- ✗ Mismatch: red, with specific discrepancy in tooltip ("GRN shows 480, invoice shows 500")
- — (not applicable for this document type): grey dash

**Recommended action** (shown below the table):
- Auto-generated plain language: "Quantity mismatch of 20 units (4%) between GRN and Invoice. Confirm with vendor or adjust GRN before approving."

### 7.3 AI Cashflow Advisor Notifications

Cashflow Advisor insights are surfaced as non-intrusive inline suggestions, not modal interruptions.

**Placement:** Right-side panel on MSME Home screen (Pro tier) or notification inbox

**Card format:**
- Icon: relevant (e.g., `alert-triangle` for gap, `trending-up` for opportunity)
- Headline: concise, plain language (e.g., "Cash gap likely in 3 weeks")
- Body: 1–2 sentences explaining the insight
- Action (optional): "Accept early payment" or "View details"
- Confidence indicator: subtle "Based on your last 6 months with [Buyer]"

**Tone guidelines for AI suggestions:**
- Never alarmist ("You will run out of cash!") — use "You may have a shortfall"
- Never vague ("There could be issues") — always specific ("₹45,000 shortfall possible between 28 Mar–5 Apr")
- Always explain the basis: "because [Buyer] typically pays 8 days later than stated terms"

### 7.4 Risk Score Display

Buyer Payment Reliability Score and Supplier Risk Score are sensitive — displayed with context to prevent misinterpretation.

**Visual treatment:**
- Score: large number (0–100) in --font-numeric
- Color: green (75–100), amber (50–74), red (0–49)
- Gauge: simple arc from 0–100, filled to score value
- Label: "Good" / "Fair" / "Needs Attention" (never "Bad" or "Poor")

**Score explanation (always shown below score):**
- 2–3 sentence plain language explanation
- Example: "This buyer has paid 94% of invoices on time over the last 12 months. Average payment is 3 days before due date. 2 disputes raised, both resolved."

**Sensitivity note:**
- MSME-facing: Buyer score is shown to help MSMEs make decisions, not to shame buyers
- Enterprise-facing: Supplier score is shown to inform Yield Engine eligibility, not to exclude vendors without cause
- Score explanations always focus on behavior, not judgment

---

## 8. Responsive & Accessibility Standards

### 8.1 Breakpoints

| Breakpoint | Width | Target device |
|---|---|---|
| `xs` | <480px | Small mobile |
| `sm` | 480–767px | Mobile |
| `md` | 768–1023px | Tablet |
| `lg` | 1024–1279px | Small desktop / laptop |
| `xl` | 1280–1535px | Standard desktop |
| `2xl` | ≥1536px | Large desktop |

**Portal-specific breakpoint priorities:**

*Enterprise portal:* Design for `lg` and `xl` first. Tables must be usable at `md` (horizontal scroll acceptable for full table, but key columns must remain visible). No mobile-first requirement for enterprise portal.

*MSME portal:* Design for `sm` first. Every screen must be fully functional and well-laid-out at `sm`. Desktop (`lg`) is a secondary consideration.

### 8.2 Responsive Behavior

**Navigation:**
- Enterprise: left sidebar collapses to icon-only at `md`, hidden behind hamburger at `sm`
- MSME: bottom tab bar at `sm` and `md`, top navigation at `lg`+

**Tables (Enterprise portal):**
- At `xl`: all columns visible
- At `lg`: hide "Invoice Date" and "3-Way Match" columns; show in row detail
- At `md`: show only Vendor, Amount, Status, and Action. Full table accessible via horizontal scroll or row expansion.

**Cards and stat rows:**
- 4-column at `xl`, 2-column at `md`, 1-column at `sm`

**Invoice detail view:**
- At `xl`: side-by-side drawer (480px) with main table visible
- At `md` and below: full-screen overlay

### 8.3 Accessibility Standards

FlowBridge targets WCAG 2.1 AA compliance across all screens.

**Color contrast:**
- All text on white/light backgrounds: minimum 4.5:1 contrast ratio (7:1 for small text)
- Status badges: verify contrast ratio for each color combination (especially amber on amber-light)
- Never use color alone to convey meaning — always pair with icon or text label

**Keyboard navigation:**
- All interactive elements reachable via Tab
- Focus ring: `--shadow-focus` — `0 0 0 3px rgba(28,139,133,0.3)` (brand-teal at 30% opacity)
- Skip-to-content link at top of each page
- Modal dialogs trap focus and return focus on close

**Screen readers:**
- All status badges have `aria-label` with full status text
- Invoice tables have proper `<thead>` with `scope="col"`
- Compliance countdown: `aria-live="polite"` for dynamic updates
- Icons: `aria-hidden="true"` for decorative icons; `aria-label` for functional icons

**Forms:**
- All inputs have associated `<label>` (never placeholder-only)
- Error messages linked to input via `aria-describedby`
- Required fields marked with asterisk AND `aria-required="true"`

**Financial amounts:**
- Use `lang` attribute or screen reader-friendly formatting: "₹12,40,000" should read as "12 lakh 40 thousand rupees" — provide `aria-label` with spelled-out version for large amounts

---

## 9. Motion & Microinteraction Guidelines

### 9.1 Principles

- Motion should communicate state changes, not decorate
- Duration: short (100–200ms for micro-interactions, 250–350ms for transitions)
- Easing: `ease-out` for elements entering the screen, `ease-in` for elements leaving
- Reduce motion: respect `prefers-reduced-motion` — remove all non-essential animations, keep only functional transitions (opacity fade for modals)

### 9.2 Specific Animation Patterns

**Invoice status change (Pending → Approved):**
- Status badge: cross-fade old badge to new badge (200ms)
- Row: brief green flash (`background: var(--color-success-light)`, fade to transparent, 400ms)
- No bouncing, scaling, or confetti for financial state changes

**Compliance countdown (crossing into danger zone):**
- When days remaining crosses to red: badge color transition (300ms)
- If countdown reaches 0 while user is viewing: pulse animation on badge (2 pulses, then static)

**Invoice drawer open/close:**
- Slide in from right: 250ms, `cubic-bezier(0.16, 1, 0.3, 1)` (snappy entrance)
- Slide out to right: 200ms, `ease-in`
- Backdrop: fade 200ms

**OCR confidence highlighting:**
- On document image load: amber overlay fades in on low-confidence regions (300ms)
- When user focuses a flagged field: corresponding image region pulses once

**3-Way match reveal:**
- Match results table rows appear sequentially (50ms stagger per row)
- Match icons (✓/✗) scale in: `scale(0) → scale(1)`, 150ms per icon

**MSME payment timeline:**
- Current step pulse: `opacity: 0.4 → 1.0`, 1.2s ease-in-out, infinite loop
- Step completion: circle fills with color transition (300ms)

**Page transitions (navigation):**
- Content area: fade (150ms) — no slide transitions between pages
- Sidebar active indicator: slide to new position (200ms)

### 9.3 Loading States

**Invoice table loading:** Skeleton rows — animated shimmer of the row shape, matching the actual column layout.

**OCR processing:** Inline progress indicator in invoice form: "Extracting fields from your invoice... (usually takes 5–8 seconds)" — use a determinate progress bar if backend provides progress events, otherwise indeterminate.

**3-Way matching in progress:** Inline loading state in invoice detail with "Matching against PO #XXXXX and GRN #XXXXX..." — names the specific documents being matched for transparency.

**Dashboard stat cards on first load:** Number counts up from 0 to actual value (600ms, ease-out) — signals data has loaded and draws attention to key figures.

---

## 10. Error States & Edge Cases

### 10.1 Error Design Principles

- Be specific: "Invoice #INV-2024-0042 could not be matched — PO #PO-2024-0017 not found in the system" is better than "Matching failed"
- Give a next step: every error state should tell the user what to do, not just what went wrong
- Financial errors especially: be accurate — never round, estimate, or hedge when displaying penalty amounts or compliance deadlines

### 10.2 Error Taxonomy

**User errors (recoverable, user's action needed):**
- OCR low confidence fields → show review interface (section 7.1)
- Missing PO reference on invoice → prompt user to add PO number
- GSTIN mismatch → flag field, link to GST portal to verify

**System errors (FlowBridge-side issue):**
- OCR service unavailable → "We couldn't process this invoice automatically. Please fill in the fields manually."
- Matching engine timeout → "This invoice is taking longer than usual to match. We'll notify you when it's done." — never show a spinner indefinitely
- Integration sync failure (Tally connector) → banner in dashboard "Tally sync last updated 4 hours ago. [Reconnect]"

**Data errors (data quality issues):**
- Duplicate invoice detected → "Invoice #INV-2024-0042 was already submitted on 14 Mar 2026. [View existing invoice]"
- Invoice amount exceeds PO value by >10% → flag as exception, route to review
- Invoice date in future → warn, do not block submission

### 10.3 Compliance-Specific Edge Cases

**Disputed invoice + MSMED deadline:**
- If a legitimate dispute is raised (documented in dispute workspace), the MSMED Act allows the statutory clock to pause
- UI must clearly indicate: "Statutory clock paused — dispute raised on [date]. Clock resumes if dispute is resolved or withdrawn."
- This is a legal distinction — the UI must not allow ambiguity

**Section 43B(h) — FY year-end:**
- As March 31st approaches, urgency of at-risk invoices increases materially
- In February and March, 43B(h) radar should display a "Days to FY end" banner
- System should escalate notification frequency for at-risk invoices in the last 15 days of the FY

**MSME that is not Udyam registered:**
- MSMED Act protections apply to Udyam-registered MSMEs
- If supplier has not provided Udyam number: show warning "Your MSMED Act protections may not apply without Udyam registration. [Register on Udyam portal]"
- Do not prevent portal use — just surface the information

### 10.4 Empty / First-Use States

**Enterprise — no vendors onboarded:**
- Friendly onboarding prompt: "Invite your MSME suppliers to get started. They'll get free access and you'll get automated invoice processing."
- [Invite Vendors] button (primary)
- Link to CSV bulk upload for vendor list

**Enterprise — no invoices yet:**
- Instructional state: show the flow (vendor submits → AI processes → you approve)
- [Send invoice instructions to vendors] button

**MSME — first login, linked to buyer:**
- Warm welcome: "You're now connected to [Buyer Name]. Submit your invoices here and track every payment in one place."
- [Submit your first invoice] prominent CTA

---

## 11. Onboarding Flows

### 11.1 Enterprise Onboarding (Desktop)

**Goal:** Get the enterprise from sign-up to first invoice processed within one session.

**Step 1 — Company setup (2 minutes):**
- Company name, GSTIN, industry, state
- Financial year start (April for most Indian companies)
- Upload company logo (optional)

**Step 2 — ERP integration (optional, can skip):**
- Select ERP: Tally / Busy / Manual (CSV upload)
- For Tally: show connection instructions with screenshots
- If skipped: shown a banner "Connect Tally to auto-sync your POs and GRNs"

**Step 3 — Invite your MSME vendors (can bulk import):**
- Enter vendor emails/phone numbers, or upload CSV with vendor list
- Preview of invite message sent to vendors
- Send invitations (or skip for now)

**Step 4 — Configure Yield Engine (optional):**
- Simple toggle: "Offer early payments to suppliers?"
- If yes: quick configuration of discount range and advance window
- Can configure fully later

**Step 5 — Setup complete:**
- Summary of what's been configured
- Quick-start guide: "Here's what to do first"
- Direct link to AP Dashboard

### 11.2 MSME Onboarding (Mobile)

**Goal:** Get the MSME from invitation link to account active in under 5 minutes.

**Design principle:** No step should ask for more than the minimum required. Every step has a clear progress indicator.

**Step 1 — Verify identity:**
- Enter mobile number
- OTP sent via SMS
- Enter OTP (auto-read on Android)

**Step 2 — Business basics (3 fields only):**
- Business name
- GSTIN (with real-time validation against GST API)
- Udyam number (optional — with explanation of why it matters)

**Step 3 — Bank account:**
- Account number and IFSC
- Auto-verification via penny drop (or skip and add later)
- "This is where your payments will be received"

**Step 4 — Review linked buyer:**
- Shows buyer name and the invitation they sent
- "You've been invited to submit invoices to [Buyer Name]"
- Confirm

**Complete:**
- Home screen with a prompt to submit first invoice
- Contextual help tooltip on first visit: "Tap here to submit your first invoice"

### 11.3 Progress Persistence

Both onboarding flows save progress after each step. If the user exits mid-onboarding and returns, they resume from where they left off, not from the beginning.

---

## 12. Localization & Language Guidelines

### 12.1 Phase 1 — English Only

MVP launches in English. All UI copy, error messages, and notifications in English.

**Indian English conventions to follow:**
- "Lakh" not "100,000"
- "Crore" not "10,000,000"
- "DD Mon YYYY" date format (15 Mar 2026) not MM/DD/YYYY
- "Udyam registration" not "business registration"
- "GSTIN" not "tax ID"
- "Financial Year" or "FY" not "fiscal year"
- "Mobile number" not "phone number"

### 12.2 Phase 2 — Vernacular Languages

Priority languages for Phase 2 based on target geography (Gujarat, Maharashtra, Tamil Nadu):
1. Gujarati
2. Hindi
3. Marathi
4. Tamil

**MSME portal only** for vernacular translation first — enterprise portal stays English in Phase 2.

**Technical requirements for Phase 2:**
- All UI strings in i18n key files from Day 1 (even if only English values initially)
- No hardcoded strings in components
- RTL support not required (none of the priority languages are RTL)
- Number formatting: Indian system (lakh/crore) used in all languages

### 12.3 Financial Term Glossary (English → Layman)

Used in MSME portal to replace jargon with plain language equivalents:

| Technical Term | Plain Language (English) |
|---|---|
| Accounts Receivable | Money owed to you |
| Accounts Payable | Money you owe |
| 3-Way Match | Checking your invoice against the purchase order |
| MSMED Act | Law protecting small business payment rights |
| 43B(h) | Tax rule about paying small businesses on time |
| DPO | How long a company takes to pay invoices |
| Invoice Liquidity Score | How likely your invoice is to be paid on time |
| Dispute | A disagreement about an invoice |
| Yield Engine | Early payment program |

---

## 13. Design Handoff Conventions

### 13.1 Figma File Structure

```
FlowBridge Design
│
├── 🎨 Design System
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Icons
│   └── Shadows
│
├── 🧩 Component Library
│   ├── Atoms (badges, buttons, inputs, icons)
│   ├── Molecules (stat cards, invoice rows, status timelines)
│   └── Organisms (tables, dashboards, drawers)
│
├── 📱 MSME Portal
│   ├── Mobile (375px)
│   ├── Desktop (1280px)
│   └── Flows
│
├── 🖥️ Enterprise Portal
│   ├── Desktop (1280px)
│   ├── Tablet (768px)
│   └── Flows
│
└── 📋 Specs
    ├── Redlines
    └── Interaction notes
```

### 13.2 Naming Conventions

**Layers and components:** `ComponentName/variant/state`
Examples: `Button/primary/hover`, `StatusBadge/approved/md`, `InvoiceRow/selected`

**Frames:** `[PortalInitial]-[ScreenName]-[Breakpoint]`
Examples: `ENT-Dashboard-1280`, `MSME-Home-375`, `ENT-InvoiceDetail-Drawer`

**Colors:** Match CSS variable names exactly: `color/primary`, `surface/card`, `text/secondary`

### 13.3 Annotation Standards

Every interactive component in handoff includes:
- Default, hover, active, focus, and disabled states
- Motion spec (duration, easing, property animated)
- Responsive behavior note (what changes at breakpoints)
- Accessibility note (keyboard behavior, ARIA role)

### 13.4 Dev Token Export

Design tokens exported as:
- CSS custom properties (`tokens.css`)
- JSON for JS consumption (`tokens.json`)
- Tailwind config extension (`tailwind.tokens.js`)

---

## 14. Open Design Questions

1. **Invoice image viewer on mobile (MSME):** Should MSMEs be able to view their submitted invoice PDFs within the portal, or link out to a PDF viewer? In-app viewer is better UX but requires additional development.

2. **Dispute workspace — real-time vs. async:** Should the dispute workspace show real-time updates (WebSocket) or async (email + in-app notification)? Real-time is better UX for high-stakes disputes but adds infrastructure complexity.

3. **43B(h) Radar — CA export format:** What format does the CA export need to be in? PDF with statutory references, or Excel for further processing? Most CA workflows expect Excel. May need both.

4. **MSME portal — WhatsApp as primary channel:** For MSMEs who primarily use WhatsApp, should the MSME portal replicate key functionality via a WhatsApp Business bot (submit invoice by sending a photo, get payment status via chat)? This significantly expands MSME reach but is a separate product track.

5. **Yield Engine — MSME negotiation:** Should MSMEs be able to counter-propose a discount rate, or only accept/decline the enterprise's offer? Counter-proposal adds negotiation friction but may increase acceptance rates for large invoice amounts.

6. **Dark mode for enterprise portal:** Enterprise users work long hours. Dark mode is expected by professional software. This should be Phase 1 or Phase 2? Scoping decision needed.

7. **Dashboard customization:** Should enterprise CFOs be able to customize which metrics appear on their dashboard (drag-and-drop widgets), or is the dashboard layout fixed? Fixed is faster to ship; customization increases stickiness but is significant engineering scope.

---

*Document maintained by FlowBridge product and design team. Review alongside PRD v2.0. Update when any component specification, user flow, or design system token changes.*
