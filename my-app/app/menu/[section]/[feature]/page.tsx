
"use client";

import Link from "next/link";
import { use as usePromise, useMemo, useState } from "react";

type Plan = {
  name: string;
  priceMonthly: number | null;
  description: string;
  features: string[];
  highlight: string;
};

type KPI = {
  label: string;
  value: string;
  description: string;
};

type SectionBlock = {
  title: string;
  body: string;
};

type FAQ = {
  question: string;
  answer: string;
};

type PageContent = {
  title: string;
  summary: string;
  highlights: string[];
  sections: SectionBlock[];
  checklist: string[];
  faqs: FAQ[];
  kpis: KPI[];
};

const pricingPlans: Plan[] = [
  {
    name: "Starter",
    priceMonthly: 0,
    description: "For early MSME onboarding and invoice visibility.",
    highlight: "MSME onboarding",
    features: ["Up to 50 invoices/month", "Basic OCR ingestion", "Compliance alerts", "Email support"],
  },
  {
    name: "Growth",
    priceMonthly: 24999,
    description: "For enterprise AP automation and supplier collaboration.",
    highlight: "Enterprise workflows",
    features: ["3-way match automation", "Approval workflows", "Yield engine", "GST reporting"],
  },
  {
    name: "Enterprise",
    priceMonthly: null,
    description: "For large networks and multi-ERP operations.",
    highlight: "National scale",
    features: ["Unlimited invoices", "ERP integrations", "Dedicated success", "Custom AI models"],
  },
];

const featureSummaries: Record<string, string> = {
  "platform/overview":
    "A unified finance OS that connects MSME suppliers and enterprise buyers with a shared source of truth.",
  "platform/three-way-match":
    "Automated PO-GRN-invoice matching with variance scoring to cut AP cycle time from days to seconds.",
  "platform/accounting-core":
    "Double-entry accounting with GST-ready ledgers, reports, and audit trails.",
  "platform/compliance-engine":
    "Built-in MSMED compliance logic with penalty tracking and Section 43B(h) alerts.",
  "solutions/msme-suppliers":
    "Receivables visibility, payment prediction, and compliance protection for MSMEs.",
  "solutions/enterprise-buyers":
    "AP automation, supplier governance, and treasury yield controls for enterprise buyers.",
  "solutions/admin-ops":
    "Central command for onboarding, RBAC, and audit visibility across the network.",
  "solutions/phase-2-finance":
    "Phase 1 data foundation that unlocks NBFC financing later without re-platforming.",
  "ai-suite/ocr-ingestion":
    "Infrastructure-grade OCR with confidence scoring and human correction workflows.",
  "ai-suite/matching-model":
    "AI decisions with explainable variance signals for review or auto-approval.",
  "ai-suite/cashflow-advisor":
    "Predict receipts, detect delays, and recommend early payment options.",
  "ai-suite/risk-scoring":
    "Buyer reliability and supplier risk intelligence to inform approvals and treasury.",
  "integrations/erp-connectors":
    "Sync invoices, POs, vendors, and journals with SAP, Oracle, Tally, and Zoho Books.",
  "integrations/banking-payments":
    "Execute and reconcile payments across UPI, NEFT, RTGS, and corporate APIs.",
  "integrations/government-apis":
    "GST reporting, e-invoice compatibility, and compliance reporting readiness.",
  "integrations/webhooks":
    "Event delivery for approvals, disputes, payments, and compliance alerts.",
  "security/authentication":
    "Secure access with JWT sessions, optional MFA, and role-based permissions.",
  "security/data-security":
    "Encryption at rest and in transit with tenant isolation and audit controls.",
  "security/audit-trails":
    "Immutable logs across invoice lifecycle, approvals, and compliance actions.",
  "security/compliance":
    "Governance-ready controls for enterprise security and compliance teams.",
  "company/about-nexus-three":
    "We are building national-scale financial infrastructure for MSME supply chains.",
  "company/roadmap":
    "Phase 1 delivery of the core OS, followed by Phase 2 financing activation.",
  "company/partners":
    "ERP, banking, and compliance partners powering Nexus Three deployments.",
  "company/contact":
    "Connect with Nexus Three for pilots, demos, and partnership discussions.",
  "pricing/plans":
    "Pilot free, scale as your enterprise network grows with monthly or annual billing options.",
  "pricing/compare":
    "Compare coverage across Starter, Growth, and Enterprise tiers in one view.",
  "pricing/billing":
    "Flexible billing aligned to enterprise procurement and MSME onboarding timelines.",
  "pricing/pilot":
    "Structured pilot program with onboarding, success metrics, and compliance validation.",
};

const defaultHighlightsBySection: Record<string, string[]> = {
  platform: [
    "Unified AP + AR truth across buyers and suppliers",
    "AI ingestion and 3-way matching to cut approval time",
    "Compliance radar for MSMED and Section 43B(h)",
  ],
  solutions: [
    "Role-specific portals with shared invoice state",
    "Actionable working capital intelligence",
    "Compliance and penalty automation baked in",
  ],
  "ai-suite": [
    "Infrastructure-grade OCR pipeline",
    "Explainable AI matching decisions",
    "Predictive cashflow and risk scoring",
  ],
  integrations: [
    "ERP and accounting sync",
    "Banking rails and payment reconciliation",
    "Government compliance readiness",
  ],
  security: [
    "RBAC and tenant isolation",
    "Immutable audit logs",
    "Enterprise-grade encryption controls",
  ],
  company: [
    "Vision to power MSME supply chains at national scale",
    "Phase 1 rollouts with enterprise buyers",
    "AI-first financial infrastructure approach",
  ],
  pricing: [
    "Pilot with zero platform fees",
    "Scale with usage-aligned pricing",
    "Enterprise contracts for large networks",
  ],
};

const featureSections: Record<string, SectionBlock[]> = {
  "platform/three-way-match": [
    {
      title: "Data Inputs",
      body: "Connect PO, GRN, and invoice data from uploads or ERP sync with standard templates.",
    },
    {
      title: "Variance Logic",
      body: "Tolerance bands on quantity, pricing, and supplier identity create fast, explainable decisions.",
    },
    {
      title: "Approval Routing",
      body: "Auto-approve low variance invoices and route exceptions to AP with full context.",
    },
  ],
  "platform/accounting-core": [
    {
      title: "Ledger Integrity",
      body: "Double-entry journal entries with immutable logs and audit exports.",
    },
    {
      title: "Financial Statements",
      body: "Trial balance, P&L, balance sheet, and cashflow views on demand.",
    },
    {
      title: "GST Readiness",
      body: "GST coding and reporting fields embedded across every transaction.",
    },
  ],
  "ai-suite/cashflow-advisor": [
    {
      title: "Prediction Engine",
      body: "Estimate payment dates using buyer behavior, invoice history, and compliance deadlines.",
    },
    {
      title: "Alerts",
      body: "Notify MSMEs of predicted delays and working capital gaps.",
    },
    {
      title: "Recommendations",
      body: "Suggest early payment options when treasury liquidity is available.",
    },
  ],
  "integrations/erp-connectors": [
    {
      title: "Sync Modes",
      body: "One-way or bi-directional sync with reconciliation summaries.",
    },
    {
      title: "Mapping Studio",
      body: "Field mapping and transformation rules for each ERP instance.",
    },
    {
      title: "Data Validation",
      body: "Pre-flight checks to prevent mismatched master data.",
    },
  ],
  "pricing/pilot": [
    {
      title: "Pilot Structure",
      body: "90-day onboarding with weekly success checkpoints and shared OKRs.",
    },
    {
      title: "Success Metrics",
      body: "Target invoice GMV, approval turnaround time, and compliance adherence.",
    },
    {
      title: "Decision Gate",
      body: "Define clear criteria to transition to paid Growth or Enterprise tiers.",
    },
  ],
};

const checklistBySection: Record<string, string[]> = {
  platform: [
    "Finalize invoice lifecycle and approval states",
    "Enable accounting ledger export",
    "Configure compliance rules and penalties",
    "Set up audit log retention policy",
  ],
  solutions: [
    "Define onboarding workflows for buyers and suppliers",
    "Configure role-based dashboards",
    "Enable payment visibility alerts",
    "Set working capital KPIs",
  ],
  "ai-suite": [
    "Set OCR confidence thresholds",
    "Validate matching tolerance rules",
    "Train initial risk scoring model",
    "Enable feedback loop for corrections",
  ],
  integrations: [
    "Approve ERP data mappings",
    "Configure banking API credentials",
    "Set webhook event subscriptions",
    "Schedule data sync cadence",
  ],
  security: [
    "Enable MFA for admins",
    "Define RBAC roles and permissions",
    "Configure encryption key rotation",
    "Set audit trail export cadence",
  ],
  company: [
    "Finalize pilot target list",
    "Prepare launch collateral",
    "Confirm partner support playbooks",
    "Set success metrics for Phase 1",
  ],
  pricing: [
    "Confirm pilot cohort structure",
    "Define usage thresholds for Growth",
    "Prepare enterprise pricing proposal",
    "Align billing and contract terms",
  ],
};

const faqBySection: Record<string, FAQ[]> = {
  platform: [
    {
      question: "Can the platform run alongside existing ERP systems?",
      answer: "Yes. Nexus Three syncs with ERP systems and keeps a shared invoice truth layer.",
    },
    {
      question: "How fast is invoice approval after automation?",
      answer: "Auto-approval decisions typically occur within seconds once data is ingested.",
    },
  ],
  solutions: [
    {
      question: "What does an MSME supplier see?",
      answer: "Invoice status, payment predictions, and compliance alerts in one dashboard.",
    },
    {
      question: "How do enterprises manage approvals?",
      answer: "Configurable workflows with AI matching and variance review queues.",
    },
  ],
  "ai-suite": [
    {
      question: "Do we need labeled data for OCR?",
      answer: "No. The system ships with baseline OCR and improves with correction feedback.",
    },
    {
      question: "How explainable are AI decisions?",
      answer: "Variance flags and confidence scores are displayed for every match decision.",
    },
  ],
  integrations: [
    {
      question: "How long does an ERP integration take?",
      answer: "Typical deployments complete within 2 to 4 weeks depending on ERP complexity.",
    },
    {
      question: "Can we start without integrations?",
      answer: "Yes. CSV and upload workflows are available for pilots.",
    },
  ],
  security: [
    {
      question: "How is data isolated between companies?",
      answer: "Tenant-level isolation is enforced at the application and storage layers.",
    },
    {
      question: "Is audit log export available?",
      answer: "Yes. Audit logs can be exported on a scheduled cadence.",
    },
  ],
  company: [
    {
      question: "What is the Phase 1 launch timeline?",
      answer: "Phase 1 focuses on onboarding anchor enterprises over 6 to 12 months.",
    },
    {
      question: "How do we engage as partners?",
      answer: "Contact the team and we will align on integration and go-to-market plans.",
    },
  ],
  pricing: [
    {
      question: "Is the pilot really free?",
      answer: "Yes. Pilot cohorts operate on zero platform fees with defined limits.",
    },
    {
      question: "What happens after the pilot?",
      answer: "You can upgrade to Growth or Enterprise tiers with agreed success criteria.",
    },
  ],
};

const kpiBySection: Record<string, KPI[]> = {
  platform: [
    { label: "Approval Time", value: "< 5 min", description: "AI-driven approvals" },
    { label: "Auto-Match Rate", value: "> 70%", description: "Target for Phase 1" },
    { label: "Compliance Coverage", value: "100%", description: "MSMED + 43B(h)" },
  ],
  solutions: [
    { label: "MSME Visibility", value: "Real-time", description: "Invoice tracking" },
    { label: "Buyer SLA", value: "45 days", description: "MSMED compliance" },
    { label: "Working Capital", value: "Forecasted", description: "30/60/90 days" },
  ],
  "ai-suite": [
    { label: "OCR Accuracy", value: "> 92%", description: "With feedback loop" },
    { label: "Match Confidence", value: "0.85+", description: "Auto-approval" },
    { label: "Risk Signals", value: "Daily", description: "Score refresh" },
  ],
  integrations: [
    { label: "ERP Sync", value: "Daily", description: "Configurable" },
    { label: "Payment Rails", value: "UPI/NEFT", description: "Phase 1" },
    { label: "Data Mapping", value: "Template", description: "Repeatable" },
  ],
  security: [
    { label: "MFA Coverage", value: "Admins", description: "Recommended" },
    { label: "Audit Logs", value: "Immutable", description: "Exportable" },
    { label: "Encryption", value: "AES-256", description: "At rest" },
  ],
  company: [
    { label: "Pilot Cohort", value: "8-10", description: "Enterprise buyers" },
    { label: "Supplier Network", value: "1,000+", description: "Active MSMEs" },
    { label: "Invoice GMV", value: "INR 150 Cr", description: "Monthly target" },
  ],
  pricing: [
    { label: "Pilot", value: "INR 0", description: "Structured onboarding" },
    { label: "Growth", value: "INR 24,999", description: "Monthly" },
    { label: "Enterprise", value: "Custom", description: "Annual" },
  ],
};

const integrationCatalog = [
  { name: "SAP", type: "ERP" },
  { name: "Oracle", type: "ERP" },
  { name: "Tally", type: "ERP" },
  { name: "Zoho Books", type: "ERP" },
  { name: "UPI", type: "Payments" },
  { name: "NEFT", type: "Payments" },
  { name: "RTGS", type: "Payments" },
  { name: "GSTN", type: "Government" },
  { name: "E-Invoice", type: "Government" },
  { name: "E-Way Bill", type: "Government" },
  { name: "Slack", type: "Workflow" },
  { name: "Teams", type: "Workflow" },
];

const securityControls = [
  "Role-based access control",
  "Multi-factor authentication",
  "Encryption at rest",
  "Encryption in transit",
  "Audit log exports",
  "IP allowlisting",
  "Session anomaly alerts",
];

const roadmapPhases = [
  {
    title: "Phase 1: Core OS",
    focus: "Invoice automation, compliance, and accounting backbone.",
  },
  {
    title: "Phase 2: Financing Activation",
    focus: "NBFC marketplace and invoice liquidity offers.",
  },
  {
    title: "Phase 3: National Scale",
    focus: "Industry-wide supply chain intelligence and AI optimization.",
  },
];

const comparisonRows = [
  { feature: "Invoices / Month", starter: "50", growth: "5,000", enterprise: "Unlimited" },
  { feature: "3-Way Match", starter: "Limited", growth: "Full", enterprise: "Full + Custom" },
  { feature: "ERP Integrations", starter: "None", growth: "1", enterprise: "Unlimited" },
  { feature: "Compliance Radar", starter: "Standard", growth: "Advanced", enterprise: "Advanced" },
  { feature: "Support", starter: "Email", growth: "Priority", enterprise: "Dedicated" },
];

function toTitle(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildContent(section: string, feature: string): PageContent {
  const key = `${section}/${feature}`;
  const summary =
    featureSummaries[key] ??
    `${toTitle(feature)} capabilities built for the Phase 1 launch of Nexus Three.`;
  const highlights = defaultHighlightsBySection[section] ?? [
    "Launch-ready workflows",
    "Operational dashboards",
    "Compliance automation",
  ];
  const sections = featureSections[key] ?? [
    {
      title: "Launch Readiness",
      body: "Ensure workflows, data mappings, and KPIs are configured before go-live.",
    },
    {
      title: "Operational Impact",
      body: "Drive faster approvals, compliance coverage, and supplier confidence.",
    },
    {
      title: "Metrics to Track",
      body: "Auto-approval rate, payment cycle duration, and compliance adherence.",
    },
  ];
  const checklist = checklistBySection[section] ?? [
    "Define workflow ownership",
    "Set SLA targets",
    "Review compliance thresholds",
  ];
  const faqs = faqBySection[section] ?? [];
  const kpis = kpiBySection[section] ?? [];

  return {
    title: toTitle(feature),
    summary,
    highlights,
    sections,
    checklist,
    faqs,
    kpis,
  };
}
export default function MenuFeaturePage({
  params,
}: {
  params: Promise<{ section: string; feature: string }>;
}) {
  const { section, feature } = usePromise(params);
  const normalizedSection = section.toLowerCase();
  const normalizedFeature = feature.toLowerCase();
  const content = buildContent(normalizedSection, normalizedFeature);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [checklistState, setChecklistState] = useState(() =>
    Object.fromEntries(content.checklist.map((item) => [item, false])),
  );
  const [billingCadence, setBillingCadence] = useState<"monthly" | "annual">("monthly");
  const [integrationFilter, setIntegrationFilter] = useState("All");
  const [securityState, setSecurityState] = useState(() =>
    Object.fromEntries(securityControls.map((item) => [item, true])),
  );
  const [contactState, setContactState] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [contactSent, setContactSent] = useState(false);
  const [pilotSeats, setPilotSeats] = useState(20);

  const checklistCompletion = useMemo(() => {
    const values = Object.values(checklistState);
    const completed = values.filter(Boolean).length;
    return Math.round((completed / values.length) * 100);
  }, [checklistState]);

  const filteredIntegrations = useMemo(() => {
    if (integrationFilter === "All") return integrationCatalog;
    return integrationCatalog.filter((item) => item.type === integrationFilter);
  }, [integrationFilter]);

  const securityCompletion = useMemo(() => {
    const values = Object.values(securityState);
    const completed = values.filter(Boolean).length;
    return Math.round((completed / values.length) * 100);
  }, [securityState]);

  const showPricingPlans = normalizedSection === "pricing" && normalizedFeature === "plans";
  const showPricingCompare = normalizedSection === "pricing" && normalizedFeature === "compare";
  const showPricingBilling = normalizedSection === "pricing" && normalizedFeature === "billing";
  const showPricingPilot = normalizedSection === "pricing" && normalizedFeature === "pilot";
  const showIntegrations = normalizedSection === "integrations";
  const showSecurityControls = normalizedSection === "security";
  const showRoadmap = normalizedSection === "company" && normalizedFeature === "roadmap";
  const showContact = normalizedSection === "company" && normalizedFeature === "contact";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{toTitle(normalizedSection)}</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-3 text-slate-600">{content.summary}</p>
        </div>

        {content.kpis.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {content.kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{kpi.label}</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-900">{kpi.value}</h3>
                <p className="mt-2 text-sm text-slate-600">{kpi.description}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Launch Highlights</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {content.highlights.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#1b5b6a]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {content.sections.map((sectionItem) => (
            <div key={sectionItem.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">{sectionItem.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{sectionItem.body}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Launch Readiness Checklist</h2>
              <p className="mt-2 text-sm text-slate-600">
                Track go-live readiness for this module.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Completion</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{checklistCompletion}%</p>
            </div>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${checklistCompletion}%` }}
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {content.checklist.map((item) => (
              <label key={item} className="flex items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={Boolean(checklistState[item])}
                  onChange={() =>
                    setChecklistState((prev) => ({
                      ...prev,
                      [item]: !prev[item],
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
        {showIntegrations && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Integration Catalog</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Filter integrations by type to build launch-ready data flows.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["All", "ERP", "Payments", "Government", "Workflow"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setIntegrationFilter(item)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      integrationFilter === item
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredIntegrations.map((integration) => (
                <div key={integration.name} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{integration.type}</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{integration.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {showSecurityControls && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Security Control Matrix</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Toggle controls to simulate launch-ready security posture.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Coverage</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{securityCompletion}%</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {securityControls.map((control) => (
                <button
                  key={control}
                  type="button"
                  onClick={() =>
                    setSecurityState((prev) => ({
                      ...prev,
                      [control]: !prev[control],
                    }))
                  }
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    securityState[control]
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  <span>{control}</span>
                  <span>{securityState[control] ? "Enabled" : "Disabled"}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showPricingPlans && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Pricing Plans</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Toggle billing cadence to preview monthly vs annual pricing.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setBillingCadence("monthly")}
                  className={`rounded-full px-3 py-1 ${
                    billingCadence === "monthly" ? "bg-white text-slate-900" : "text-slate-500"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCadence("annual")}
                  className={`rounded-full px-3 py-1 ${
                    billingCadence === "annual" ? "bg-white text-slate-900" : "text-slate-500"
                  }`}
                >
                  Annual (2 months free)
                </button>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {pricingPlans.map((plan) => {
                const price =
                  plan.priceMonthly === null
                    ? "Custom"
                    : billingCadence === "annual"
                      ? `INR ${(plan.priceMonthly * 10).toLocaleString("en-IN")}`
                      : `INR ${plan.priceMonthly.toLocaleString("en-IN")}`;
                const cadence = plan.priceMonthly === null ? "" : billingCadence === "annual" ? "per year" : "per month";

                return (
                  <div key={plan.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{plan.highlight}</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{plan.name}</h3>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {price}
                      <span className="text-sm font-medium text-slate-500"> {cadence}</span>
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-600">
                      {plan.features.map((featureItem) => (
                        <li key={featureItem} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                          <span>{featureItem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showPricingCompare && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Plan Comparison</h2>
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              {comparisonRows.map((row) => (
                <div key={row.feature} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-4">
                  <span className="font-semibold text-slate-800">{row.feature}</span>
                  <span>Starter: {row.starter}</span>
                  <span>Growth: {row.growth}</span>
                  <span>Enterprise: {row.enterprise}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showPricingBilling && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Billing Estimator</h2>
            <p className="mt-2 text-sm text-slate-600">
              Estimate pilot capacity based on active suppliers.
            </p>
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Active suppliers</span>
                <span className="font-semibold text-slate-900">{pilotSeats}</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={pilotSeats}
                onChange={(event) => setPilotSeats(Number(event.target.value))}
                className="mt-3 w-full accent-slate-900"
              />
              <p className="mt-3 text-sm text-slate-600">
                Recommended Growth tier for {pilotSeats}+ suppliers with automated compliance alerts.
              </p>
            </div>
          </div>
        )}

        {showPricingPilot && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Pilot Timeline</h2>
            <div className="mt-6 space-y-4">
              {[
                "Week 1-2: Buyer onboarding and ERP sync",
                "Week 3-6: MSME supplier onboarding and OCR ingestion",
                "Week 7-10: 3-way match automation and compliance monitoring",
                "Week 11-12: KPI review and expansion decision",
              ].map((step) => (
                <div key={step} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}
        {showRoadmap && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Roadmap Timeline</h2>
            <div className="mt-6 space-y-4">
              {roadmapPhases.map((phase) => (
                <div key={phase.title} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <h3 className="text-base font-semibold text-slate-900">{phase.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{phase.focus}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {showContact && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Contact Nexus Three</h2>
            <p className="mt-2 text-sm text-slate-600">
              Share your pilot requirements and we will respond within 24 hours.
            </p>
            <form
              className="mt-6 grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                setContactSent(true);
              }}
            >
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Full name"
                value={contactState.name}
                onChange={(event) => setContactState({ ...contactState, name: event.target.value })}
                required
              />
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Work email"
                type="email"
                value={contactState.email}
                onChange={(event) => setContactState({ ...contactState, email: event.target.value })}
                required
              />
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm sm:col-span-2"
                placeholder="Company"
                value={contactState.company}
                onChange={(event) => setContactState({ ...contactState, company: event.target.value })}
              />
              <textarea
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm sm:col-span-2"
                placeholder="Describe your pilot goals"
                rows={4}
                value={contactState.message}
                onChange={(event) => setContactState({ ...contactState, message: event.target.value })}
                required
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:col-span-2"
              >
                Send request
              </button>
              {contactSent && (
                <p className="text-sm text-emerald-600 sm:col-span-2">
                  Message queued. Our team will reach out shortly.
                </p>
              )}
            </form>
          </div>
        )}

        {content.faqs.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">FAQs</h2>
            <div className="mt-4 space-y-3">
              {content.faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <button
                    key={faq.question}
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left"
                  >
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                      <span>{faq.question}</span>
                      <span>{isOpen ? "-" : "+"}</span>
                    </div>
                    {isOpen && <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Home
          </Link>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Request Pilot
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View Portals
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

