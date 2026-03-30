# FlowBridge — Product Requirements Document
**Version:** 2.0  
**Last Updated:** March 2026  
**Status:** Active Development  
**Codename:** Nexus Three

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [Market & Opportunity](#4-market--opportunity)
5. [Target Users & ICP](#5-target-users--icp)
6. [Competitive Positioning](#6-competitive-positioning)
7. [Product Architecture](#7-product-architecture)
8. [Feature Specifications — MVP (Phase 1)](#8-feature-specifications--mvp-phase-1)
9. [AI Functionalities](#9-ai-functionalities)
10. [Revenue Model](#10-revenue-model)
11. [Go-To-Market Strategy](#11-go-to-market-strategy)
12. [Technical Requirements](#12-technical-requirements)
13. [Success Metrics & KPIs](#13-success-metrics--kpis)
14. [Phased Roadmap](#14-phased-roadmap)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Open Questions](#16-open-questions)

---

## 1. Executive Summary

FlowBridge is an AI-powered B2B financial operating system built for MSME-Enterprise supply chains in India. It unifies accounts payable (AP) automation, accounts receivable (AR) visibility, real-time compliance monitoring, and working capital optimization into a single two-sided platform.

The core wedge is regulatory: the MSMED Act payment deadline rules (15/45 days) and Section 43B(h) of the Income Tax Act — amended in Finance Act 2023 — create direct tax disallowance risk for enterprises that delay MSME payments. No existing product actively monitors and enforces this compliance in real time. FlowBridge owns this space.

**Primary customer:** Mid-market Indian enterprises (₹200–2,000 Cr revenue) with 50–500 MSME vendors, not yet on SAP/Oracle, facing 43B(h) exposure.

**Go-to-market motion:** Enterprise-first. Sell to the CFO on compliance risk. MSMEs onboard as a downstream consequence — free, frictionless, mandated by the buyer.

**Revenue model:** Annual SaaS license from enterprises + compliance add-on + Yield Engine take rate + MSME Pro subscriptions at scale.

---

## 2. Problem Statement

### 2.1 For MSME Suppliers

- **Manual invoice processing:** MSMEs rely on WhatsApp, email, and Excel to submit invoices. Verification takes days to weeks, delaying payment acknowledgment.
- **Payment timeline opacity:** MSMEs have no visibility into where their invoice stands in the buyer's AP workflow — approved, disputed, or ignored.
- **Working capital crisis:** Large corporate buyers enforce 60–90 day payment terms while MSMEs must pay their own suppliers in 30 days. This gap forces expensive short-term borrowing at 18–24% annualized interest.
- **Compliance ignorance:** Most MSMEs are unaware of their rights under the MSMED Act — that buyers are legally required to pay within 15 days (if agreed) or 45 days (maximum statutory limit), and that delayed payments attract compound interest at 3x the RBI bank rate.
- **No credit history:** MSMEs lack formal transaction records that lenders can underwrite, making working capital loans difficult to access.

### 2.2 For Large Enterprise Buyers

- **AP cycle inefficiency:** Manual invoice ingestion, three-way matching (PO–GRN–Invoice), and exception handling extend AP cycles from days to weeks. Finance teams spend significant hours on data entry and reconciliation.
- **43B(h) tax disallowance risk:** Under Section 43B(h) of the Income Tax Act (effective FY 2023–24), any outstanding MSME payment beyond the statutory deadline is disallowed as a deduction in that financial year — a direct P&L hit. Most enterprises have no system to track this in real time.
- **MSMED Act penalty exposure:** Enterprises that breach the 15/45-day rule owe compound interest at 3x RBI bank rate to MSMEs. This liability is often invisible until a dispute surfaces.
- **High dispute rates:** Discrepancies between POs, GRNs, and invoices (mismatched quantities, unit prices, HSN codes) create payment delays and strain supplier relationships.
- **Treasury inefficiency:** AP teams hold cash longer than necessary but lack a mechanism to offer dynamic early payment discounts to suppliers in exchange for treasury yield.
- **Fragmented systems:** AR and AP portals exist in isolation. Enterprises have no unified view of their MSME payment obligations, compliance status, and working capital deployment.

---

## 3. Solution Overview

FlowBridge bridges the financial workflow gap between MSME suppliers and enterprise buyers through a unified, AI-powered platform with two purpose-built portals.

### Core Value Proposition

| For Enterprises | For MSMEs |
|---|---|
| Reduce AP cycle from weeks to hours | Real-time invoice status visibility |
| Eliminate 43B(h) tax disallowance risk | Know your MSMED Act rights and deadlines |
| Automated 3-way matching — no manual reconciliation | Free AR ledger and cashflow forecasting |
| Yield Engine — earn treasury returns on early payments | Accept early payments with one click |
| Buyer Payment Reliability scoring for vendor management | Build a verified transaction history for credit access |

### What FlowBridge Is Not

- Not a replacement for full ERP systems (SAP, Oracle) — it integrates alongside them
- Not a TREDS platform — it does not involve third-party financiers in the MVP
- Not a general-purpose accounting tool for retail or B2C businesses
- Not a lending or NBFC product in any phase

---

## 4. Market & Opportunity

### 4.1 Market Context

- India has approximately 63 million MSMEs, contributing ~30% of GDP and ~45% of exports
- An estimated ₹10–15 lakh crore in MSME receivables is delayed at any given time
- Section 43B(h) amendment (Finance Act 2023) created an immediate, measurable compliance liability for every enterprise with MSME vendors — this is the demand trigger
- Mid-market Indian enterprises (₹200–2,000 Cr revenue) are underserved: too large for basic accounting software, but without the IT infrastructure or budget for SAP/Oracle AP modules

### 4.2 Addressable Market

| Segment | Size | Notes |
|---|---|---|
| Mid-market enterprises with 50–500 MSME vendors | ~45,000 firms | Primary ICP |
| Potential MSME suppliers per enterprise (avg) | ~150 | Auto-onboarded per enterprise win |
| Target ACV per enterprise (Year 1) | ₹8–25 lakh | License + compliance add-on |
| TAM (enterprise SaaS, India AP automation) | ₹4,000–6,000 Cr | Growing at ~22% CAGR |

### 4.3 Demand Trigger — 43B(h)

The Finance Act 2023 amendment to Section 43B(h) means:

- Payments to registered MSMEs outstanding beyond the MSMED Act deadline (15 or 45 days) **cannot be claimed as a business expense** in that financial year
- This is a direct tax deduction disallowance — a P&L impact, not just a penalty
- For an enterprise with ₹50 Cr in annual MSME procurement, even 10% of invoices breaching the deadline could mean ₹5 Cr+ in disallowed deductions
- No existing AP software actively monitors or alerts on this. FlowBridge does.

---

## 5. Target Users & ICP

### 5.1 Primary Buyer — Enterprise

**Ideal Customer Profile (Phase 1):**

- Indian manufacturer or distributor
- Revenue: ₹200–2,000 Cr
- MSME vendor count: 50–500
- Current AP system: Tally, Busy, or basic ERP (not SAP/Oracle)
- Pain trigger: CFO or CA recently flagged on 43B(h) exposure, or experienced an MSMED dispute
- Decision maker: CFO, VP Finance, or Head of Accounts
- Gatekeeper: Chartered Accountant firm advising the company

**Avoid in Phase 1:**
- Enterprises on SAP/Oracle (long integration cycles, internal IT teams)
- PSUs and government entities (procurement takes 12+ months)
- Enterprises above ₹5,000 Cr revenue (enterprise-grade security and compliance requirements beyond early-stage capability)

### 5.2 Secondary User — MSME Supplier

**Profile:**
- Registered MSME (Udyam registered preferred)
- Annual turnover: ₹25 lakh – ₹50 Cr
- Sells to 1–5 large enterprise buyers
- Currently manages invoices via WhatsApp, email, or basic Zoho/Tally
- Often unaware of MSMED Act rights
- Primary need: know when they'll get paid, and access working capital faster

**Onboarding model:** MSMEs do not self-acquire. They are onboarded by enterprises mandating FlowBridge to their vendor base. FlowBridge sends onboarding instructions to MSME vendors on behalf of the enterprise buyer.

### 5.3 User Personas

**Ramesh — CFO, mid-market manufacturer (Enterprise)**
Ramesh runs finance for a ₹400 Cr auto-components manufacturer with ~200 MSME vendors. His CA flagged 43B(h) exposure last quarter. He needs a system that tracks MSME payment deadlines automatically, reconciles invoices without his team spending 3 days a month on it, and gives him a clean audit trail for tax purposes.

**Sunita — Owner, small MSME supplier**
Sunita runs a ₹2 Cr textile components business supplying 3 large buyers. She submits invoices via WhatsApp and has no idea when payment will arrive. She's had two disputes in the past year that delayed payment by 45 days each. She wants to know her payment status without calling the buyer's accounts team every week.

---

## 6. Competitive Positioning

### 6.1 Landscape

| Player | Category | Strength | Gap vs. FlowBridge |
|---|---|---|---|
| Zoho Books | Accounting SaaS | GST compliance, affordability | Single-sided, no buyer-supplier link, no 43B(h) tracking |
| TallyPrime | Accounting SaaS | Deep SME penetration, offline | No AP automation, no compliance engine, no supplier portal |
| M1xchange / RXIL | TREDS (invoice discounting) | RBI-regulated, large buyer network | Requires buyer onboarding on TREDS, excludes micro businesses, no accounting layer |
| KredX | Supply chain finance | Invoice discounting, NBFC network | Financing-only, no AP workflow or compliance |
| SAP Ariba | Enterprise AP | Comprehensive, global | Priced for large enterprises, 12+ month implementation, overkill for mid-market |
| Razorpay Rize | Embedded finance | Strong distribution | Payments-focused, not AP workflow or compliance |

### 6.2 FlowBridge's Differentiation

**1. 43B(h) Compliance Engine — owned space**
No existing product actively monitors Section 43B(h) deadlines and calculates real-time disallowance exposure. This is a CFO-level conversation, not an AP clerk conversation.

**2. Two-sided ecosystem — not single-sided accounting**
Both buyer and supplier have purpose-built portals that communicate in real time. Disputes, approvals, and payment statuses are visible to both parties simultaneously.

**3. AI-native document processing**
Invoice ingestion, OCR, and 3-way matching are AI-first — not bolted on. This reduces AP verification from days to minutes.

**4. Yield Engine — treasury optimization**
Enterprises can offer dynamic early payment discounts to suppliers, optimizing treasury returns. This turns compliance software into a working capital optimization tool.

**5. Network data moat**
Every buyer-supplier transaction pair builds Buyer Payment Reliability Scores and Supplier Risk Scores. This data compounds over time and cannot be replicated by new entrants without the same network.

---

## 7. Product Architecture

### 7.1 Platform Overview

```
┌─────────────────────────────────────────────────────┐
│                   FlowBridge Platform                │
├─────────────────────┬───────────────────────────────┤
│   Enterprise Portal │        MSME Portal            │
│   (AP / Compliance) │      (AR / Visibility)        │
├─────────────────────┴───────────────────────────────┤
│              Core Shared Infrastructure              │
│  Document Engine │ Matching Engine │ Ledger Engine  │
├─────────────────────────────────────────────────────┤
│                    AI Layer                          │
│  OCR Pipeline │ 3-Way Matching │ Cashflow Advisor   │
│  Risk Scoring │ Compliance Radar │ Yield Optimizer  │
├─────────────────────────────────────────────────────┤
│              Integration Layer                       │
│     Tally Connector │ SAP Connector │ REST API      │
└─────────────────────────────────────────────────────┘
```

### 7.2 Two-Portal Architecture

**Enterprise Portal** — Optimized for AP teams and CFOs
- AP dashboard with invoice queue, status tracking, and exception management
- 43B(h) radar and MSMED compliance dashboard
- Yield Engine controls — configure early payment offers
- Vendor management — supplier onboarding, risk scores, dispute workspace
- GL, P&L, balance sheet, journal entries

**MSME Portal** — Optimized for small business owners
- Invoice submission (upload PDF or fill form)
- Real-time payment status tracker per invoice
- AR ledger and cashflow forecasting
- MSMED Act rights dashboard — deadlines, penalties owed
- Early payment acceptance (one-click via Yield Engine)
- Dispute workspace

---

## 8. Feature Specifications — MVP (Phase 1)

MVP scope is intentionally constrained to what drives the first enterprise contract. Third-party financiers, external capital marketplaces, and advanced AI features are excluded from Phase 1.

### 8.1 Unified Portals

**Enterprise Portal — must-have screens:**

| Screen | Description | Priority |
|---|---|---|
| AP Dashboard | Invoice queue with status (pending, matched, disputed, paid), filters by vendor and deadline | P0 |
| 43B(h) Radar | List of invoices approaching or breaching statutory deadline, estimated disallowance amount | P0 |
| Compliance Timeline | Per-invoice countdown to MSMED deadline with penalty accumulation calculator | P0 |
| Vendor Directory | List of MSME vendors, onboarding status, risk score | P1 |
| Yield Engine | Configure early payment discount offers by vendor tier or invoice size | P1 |
| Dispute Workspace | Shared view between buyer and supplier for flagged invoices | P1 |

**MSME Portal — must-have screens:**

| Screen | Description | Priority |
|---|---|---|
| Invoice Submission | Upload PDF invoice or fill structured form; auto-populates from OCR | P0 |
| Payment Tracker | Per-invoice status: submitted → matched → approved → paid, with expected payment date | P0 |
| AR Ledger | All invoices across all buyers, running balance | P0 |
| MSMED Rights Dashboard | Your statutory deadlines with each buyer, penalties accruing | P1 |
| Early Payment Inbox | Offers from buyers via Yield Engine; one-click accept | P1 |

### 8.2 Core Accounting Ledger

- Double-entry accounting engine
- General Ledger (GL) with chart of accounts
- P&L statement generation
- Balance sheet
- Journal entry creation and audit trail
- GST-compliant invoice format (GSTIN, HSN codes, tax breakdowns)
- Available on both Enterprise and MSME portals, with scope appropriate to each side

### 8.3 AI Document Ingestion Pipeline

**Inputs accepted:** PDF invoices (scanned or digital), image uploads (JPG/PNG)

**Pipeline steps:**
1. OCR text extraction from uploaded document
2. Intelligent field mapping — identify invoice number, date, vendor GSTIN, line items, amounts, HSN codes, PO reference
3. Confidence scoring per extracted field (0–1 scale)
4. Auto-population of invoice form with extracted values
5. Low-confidence fields flagged for human review with highlighted bounding boxes
6. Human correction captured as labeled training data for model improvement

**Acceptance criteria:**
- Field extraction accuracy >92% on clean digital PDFs
- Field extraction accuracy >80% on scanned/photographed invoices
- Processing time <10 seconds per document
- Human review interface available for any confidence score below 0.75

### 8.4 Automated 3-Way Matching Engine

Matches incoming invoices against corresponding Purchase Orders (POs) and Goods Receipt Notes (GRNs).

**Matching logic:**

| Field | Match Type | Tolerance |
|---|---|---|
| PO Number | Exact | None |
| Vendor GSTIN | Exact | None |
| Line item description | Fuzzy (NLP similarity) | >85% match score |
| Quantity | Numerical | ±0% (exact) or configurable per enterprise |
| Unit price | Numerical | ±2% (configurable) |
| Invoice date | Range check | Within PO validity window |
| HSN/SAC code | Exact | None |

**Outcomes:**
- **Auto-approved:** All fields match within tolerance → invoice moves to payment queue automatically
- **Review flagged:** One or more fields outside tolerance → routed to AP team with discrepancy highlighted
- **Auto-rejected:** Critical fields mismatch (wrong vendor, PO not found, duplicate invoice) → MSME notified immediately with reason

**Acceptance criteria:**
- Auto-approval rate >70% on clean invoice submissions
- False positive rate (incorrect auto-approval) <1%
- Review queue items include specific discrepancy callout per field

### 8.5 MSME Payment Compliance Engine

Tracks statutory payment deadlines per invoice and calculates penalties in real time.

**Rules implemented:**
- MSMED Act: payment due within 15 days if agreed in writing; maximum 45 days from date of delivery/acceptance regardless
- Penalty: compound interest at 3 times the RBI bank rate, compounded monthly
- Section 43B(h): any outstanding MSME payment beyond statutory deadline is disallowed as a tax deduction for the enterprise in that financial year

**Features:**
- Per-invoice compliance countdown timer (days remaining to statutory deadline)
- Real-time penalty accumulation calculator (amount accruing per day of delay)
- 43B(h) disallowance estimator — total amount at risk for current FY
- Automated email/in-app alerts to enterprise AP team at 7 days, 3 days, and 1 day before deadline
- Compliance audit log — timestamped record of all payment actions per invoice

**Acceptance criteria:**
- Penalty calculation matches MSMED Act formula with 100% accuracy
- Alerts fire within 1 hour of threshold trigger
- Audit log is immutable and exportable as PDF

### 8.6 Yield Engine

Enables enterprises to offer early payment to MSME suppliers in exchange for a dynamic discount, optimizing enterprise treasury returns.

**Enterprise-side flow:**
1. Configure Yield Engine: set discount rate range (e.g., 0.5–2% for 30-day advance), eligible vendor tiers, minimum invoice size
2. System automatically generates early payment offers for qualifying invoices
3. Dashboard shows projected treasury yield and early payment volume

**MSME-side flow:**
1. MSME receives early payment offer in their portal
2. Offer shows: original due date, early payment date, discount amount, net payment amount
3. MSME accepts or declines with one click
4. On acceptance: enterprise payment instruction generated, settlement within 2 business days

**Acceptance criteria:**
- Offer generation is automatic once enterprise configures Yield Engine rules
- MSME can accept/decline within the portal with no phone call or email required
- Discount calculation is transparent and shown before acceptance

### 8.7 Dispute Resolution Workspace

Shared workspace between enterprise AP and MSME supplier for flagged invoices.

**Features:**
- Threaded comment system per invoice
- Document attachment support (upload revised invoice, proof of delivery, PO amendment)
- Status tracking: Open → Under Review → Resolved
- Resolution timestamp for compliance audit trail
- Escalation flag (MSMED Act dispute) — triggers compliance deadline pause per Act rules

---

## 9. AI Functionalities

### 9.1 AI Document Ingestion Pipeline

Described in section 8.3. Key technical notes:

- OCR engine: Tesseract base with custom fine-tuning on Indian invoice formats (GST invoices, regional language support in Phase 2)
- Field mapping model: fine-tuned on labeled Indian B2B invoice dataset
- Human-in-the-loop corrections feed back into training pipeline — system improves with every correction

### 9.2 AI 3-Way Matching Model

Described in section 8.4. Key technical notes:

- Fuzzy matching uses sentence-transformer embeddings for line item description comparison
- Normalization layer handles common Indian invoice variations: "MT" vs "Metric Ton", abbreviated vs full item names, GST-inclusive vs exclusive pricing
- Discrepancy explanations are generated in plain language for AP reviewers (e.g., "Quantity mismatch: Invoice shows 500 units, GRN shows 480 units")

### 9.3 AI Cashflow Advisor

Predictive tool for both enterprise and MSME portals.

**For MSMEs:**
- Predicts expected payment date per invoice based on buyer's historical DPO and current approval status
- Alerts when predicted payment is likely to be delayed based on anomaly detection
- Working capital gap analysis: flags periods when outflows exceed predicted inflows
- Early payment recommendation: "Accepting this early payment offer at 1.2% discount saves you 23 days of cash gap"

**For enterprises:**
- Forecasts AP outflows for the next 30/60/90 days
- Identifies invoices approaching 43B(h) threshold requiring priority payment
- Yield optimization recommendations: which invoices to offer early payment on for best treasury return

### 9.4 Risk & Reliability Scoring Models

**Buyer Payment Reliability Score (0–100):**

Inputs: Days Payable Outstanding (DPO) per vendor, overdue invoice ratio, dispute frequency, dispute resolution time, 43B(h) breach history

Output: Score visible to MSMEs on their portal to assess buyer reliability before accepting new orders

**Supplier Risk Score (0–100):**

Inputs: Invoice error rate, 3-way match failure frequency, dispute initiation rate, resubmission frequency, document quality score

Output: Visible to enterprises for vendor management; informs Yield Engine eligibility rules

**Invoice Liquidity Score (0–100):**

Inputs: Buyer Payment Reliability Score, invoice approval confidence, PO match status, historical payment pattern for this buyer-supplier pair

Output: Probability of on-time payment; foundation for future NBFC API product (Phase 3)

---

## 10. Revenue Model

### 10.1 Enterprise Revenue Streams

| Stream | Model | Pricing | Phase |
|---|---|---|---|
| Platform license | Annual SaaS | ₹6–18L/yr (50–200 vendors); ₹18–40L/yr (200–500 vendors) | Phase 1 |
| Compliance module (43B(h) + MSMED radar) | Annual add-on | ₹2–5L/yr | Phase 1 |
| ERP integration setup | One-time professional services | ₹1–4L per integration | Phase 1 |
| Yield Engine take rate | Transaction % | 0.1–0.3% per invoice settled early | Phase 2 |

### 10.2 MSME Revenue Streams

| Stream | Model | Pricing | Phase |
|---|---|---|---|
| Free tier | Freemium — always free | ₹0 | Phase 1 |
| MSME Pro (full AR ledger, cashflow advisor, multi-buyer dashboard) | Monthly SaaS | ₹499–999/month | Phase 2 |
| Early payment facilitation fee | Transaction % | 0.05–0.15% per transaction | Phase 2 |
| Invoice Liquidity Score API (sold to NBFCs/lenders) | Per-query API | ₹15–50 per score query | Phase 3 |

### 10.3 Unit Economics — One Enterprise Customer

| Metric | Value |
|---|---|
| ACV (platform + compliance add-on) | ₹12L (mid-market, ~150 vendors) |
| ERP setup one-time fee | ₹2L |
| MSMEs auto-onboarded | ~150 |
| Yield Engine revenue potential (Year 2) | ₹3–8L (0.2% on ₹15–40 Cr early payment volume) |
| Estimated LTV (3-year, including Yield Engine) | ₹40–60L per enterprise |

### 10.4 Revenue Priority

**Phase 1 (0–12 months):** Enterprise platform license + compliance add-on + ERP setup fees. Target: 3 enterprise customers at ₹10L ACV each = ₹30L ARR.

**Phase 2 (12–24 months):** Add Yield Engine take rate + MSME Pro subscriptions. Target: ₹1.5–2 Cr ARR.

**Phase 3 (24–36 months):** NBFC API sales + expanded enterprise tier. Target: ₹5–8 Cr ARR.

**Principle:** Keep MSME tier free until 5+ enterprise customers are live. MSME monetization follows network density — it does not lead it.

---

## 11. Go-To-Market Strategy

### 11.1 Phase 1 GTM — Enterprise First

**Channel 1: CA firm partnerships (primary)**

Chartered Accountant practices are the de facto IT and financial advisors for mid-market Indian companies. They have existing CFO relationships, understand 43B(h) deeply, and carry more trust than any direct sales pitch.

- Identify 10–15 CA firms in target geographies (Gujarat, Maharashtra, Tamil Nadu) advising mid-market manufacturers
- Offer CAs a referral fee or co-advisory model
- Provide CAs with 43B(h) exposure calculators and FlowBridge demo materials
- Target: 2–3 enterprise introductions per active CA partner

**Channel 2: Design partner program**

- Identify 3–5 enterprises through founder network or CA introductions for design partnership
- Design partners get 6-month free access in exchange for AP workflow access, weekly feedback sessions, and reference case study rights
- Design partner insights directly shape MVP feature prioritization

**Channel 3: Industry association events**

- CII, FICCI, and MSME Ministry events targeting enterprise procurement heads
- 43B(h) compliance workshops co-hosted with CA firms

### 11.2 Sales Motion

The sales motion is consultative, CFO-level, and compliance-led.

**Opening line:** "Section 43B(h) means your MSME payables could cost you tax deductions this FY. Do you know your current exposure?"

**Sales cycle expectation:** 3–9 months for mid-market (faster than large enterprise due to simpler procurement). Budget: ₹10–25L ACV is a CFO decision, not a committee procurement.

**Pilot structure:** 60-day paid pilot at 50% of ACV. Scope: onboard 20–30 MSME vendors, run 3-way matching on live invoices, activate compliance radar. Success metric agreed upfront.

### 11.3 MSME Onboarding

- Enterprise sends FlowBridge onboarding invitation to all MSME vendors on behalf of the buyer
- MSME receives SMS/WhatsApp + email with setup link (mobile-first onboarding, under 5 minutes)
- No sales effort required from FlowBridge team
- MSME onboarding rate target: >60% within 30 days of enterprise go-live

---

## 12. Technical Requirements

### 12.1 Infrastructure

- Cloud-hosted (AWS or Azure), India region (data residency compliance)
- Multi-tenant SaaS architecture with enterprise-level data isolation
- SOC 2 Type II compliance roadmap (required for enterprise procurement in Phase 2)
- 99.9% uptime SLA

### 12.2 Integrations (Phase 1)

| System | Integration Type | Priority |
|---|---|---|
| TallyPrime | Tally ODBC connector + TDL scripting | P0 — most common ERP in ICP |
| Busy Accounting | API/export connector | P1 |
| Email (Gmail / Outlook) | Invoice ingestion via email forwarding | P0 |
| WhatsApp Business API | MSME invoice submission and status alerts | P1 |
| SAP / Oracle | REST API connector | Phase 2 |

### 12.3 Security & Compliance

- End-to-end encryption for all financial data in transit and at rest
- Role-based access control (RBAC) — enterprise AP team, CFO, auditor, vendor roles
- Immutable audit log for all invoice and payment actions
- GSTIN validation via GST API integration
- Udyam registration verification for MSME classification

### 12.4 Performance Requirements

- Invoice OCR processing: <10 seconds per document
- 3-way matching result: <30 seconds per invoice
- Dashboard load time: <2 seconds (P95)
- Compliance alert delivery: <1 hour of threshold trigger

---

## 13. Success Metrics & KPIs

### 13.1 Phase 1 Business Metrics (0–12 months)

| Metric | Target |
|---|---|
| Enterprise design partners | 3 by Month 3 |
| Enterprise paying customers | 3 by Month 9 |
| ARR | ₹30L by Month 12 |
| MSME suppliers onboarded | 300+ (across 3 enterprises) |
| MSME portal activation rate | >60% within 30 days of enterprise go-live |

### 13.2 Product Health Metrics

| Metric | Target |
|---|---|
| Invoice OCR field accuracy | >92% (digital PDFs) |
| 3-way matching auto-approval rate | >70% |
| False positive rate (incorrect auto-approval) | <1% |
| Compliance alert delivery time | <1 hour |
| AP cycle reduction (vs. baseline) | >60% reduction in days |
| Enterprise NPS | >50 |

### 13.3 Phase 2 Metrics (12–24 months)

| Metric | Target |
|---|---|
| Enterprise customers | 15 |
| ARR | ₹1.5–2 Cr |
| Yield Engine activation rate (% of enterprises using it) | >50% |
| Early payment volume facilitated | ₹50 Cr+ |
| MSME Pro conversion rate | >15% of active MSME users |

---

## 14. Phased Roadmap

### Phase 1 — Foundation (Months 0–12)

**Goal:** 3 paying enterprise customers, ₹30L ARR, prove core product-market fit.

- Enterprise portal: AP dashboard, 43B(h) radar, compliance timeline
- MSME portal: invoice submission, payment tracker, AR ledger
- AI document ingestion pipeline (OCR + field mapping)
- Automated 3-way matching engine
- MSMED compliance engine with real-time penalty calculator
- Yield Engine (basic configuration and one-click acceptance)
- Tally integration
- Dispute resolution workspace
- Design partner program with 3–5 enterprises

### Phase 2 — Scale (Months 12–24)

**Goal:** 15 enterprise customers, ₹2 Cr ARR, activate transaction revenue.

- Yield Engine full feature set with dynamic discount optimization
- AI Cashflow Advisor (predictive payment dates, working capital gap alerts)
- MSME Pro tier launch
- Buyer Payment Reliability Score and Supplier Risk Score public-facing
- SAP/Oracle integration connectors
- WhatsApp-native invoice submission for MSMEs
- Mobile app (iOS/Android) for MSME portal
- SOC 2 Type II certification

### Phase 3 — Monetize Data (Months 24–36)

**Goal:** ₹5–8 Cr ARR, activate NBFC API revenue, explore lending partnerships.

- Invoice Liquidity Score API — sell to NBFCs and lenders
- NBFC partnership for MSME working capital loans embedded in MSME portal
- Multi-language support (Hindi, Gujarati, Tamil, Marathi)
- Advanced treasury analytics for enterprise CFOs
- Expand to 50+ enterprise customers

---

## 15. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Long enterprise sales cycle drains runway before first revenue | High | High | Close design partners in Month 1–2; structure 60-day paid pilots to generate early cash; maintain 15+ month runway at all times |
| ERP integration complexity (Tally, SAP) delays product launch | Medium | High | Prioritize Tally-only for MVP; use Tally ODBC connector (well-documented); defer SAP to Phase 2 |
| Low MSME portal activation rate (suppliers don't onboard) | Medium | Medium | Make onboarding <5 minutes via WhatsApp link; enterprise mandates vendor onboarding as contract condition |
| Competitor (Zoho, M1xchange) builds 43B(h) feature | Medium | Medium | Speed-to-market advantage; build deeper compliance features (audit export, CA workflow) before they catch up |
| 43B(h) enforcement weakens or rules change | Low | High | Product value extends beyond 43B(h) — AP automation and MSMED compliance are independently valuable; diversify value proposition |
| Data breach or security incident erodes enterprise trust | Low | Critical | SOC 2 roadmap from Day 1; data isolation architecture; enterprise contracts include security audit rights |
| Pilot scope creep — enterprises demand too many customizations | High | Medium | Define pilot scope in writing; limit pilot to 20–30 vendors and core feature set; charge for customizations |

---

## 16. Open Questions

1. **Tally integration depth:** Should Phase 1 support bidirectional sync (FlowBridge → Tally) or just inbound invoice ingestion? Bidirectional sync significantly increases engineering scope.

2. **GST reconciliation:** Should the compliance engine also handle GST reconciliation (GSTR-1 vs GSTR-2B mismatches) in Phase 1, or defer to Phase 2? This is adjacent to the core problem but adds 2–3 months of development.

3. **Pilot pricing:** Should the 60-day pilot be charged (50% ACV) or free for design partners? Free pilots risk low engagement; paid pilots reduce conversion friction.

4. **MSME verification:** Should the platform verify Udyam registration for MSMEs before they can use the compliance dashboard? Mandatory verification improves data quality but adds onboarding friction.

5. **Dispute escalation:** If an MSME escalates a dispute citing MSMED Act violation, does FlowBridge take any role in facilitating that process, or does it only provide documentation? Legal exposure implications need to be assessed.

6. **Data ownership:** Who owns the Buyer Payment Reliability Score data — FlowBridge or the enterprise? This has implications for Phase 3 NBFC API monetization and needs to be addressed in enterprise contracts from Phase 1.

---

*Document maintained by FlowBridge founding team. Review and update quarterly or upon major product decision.*
