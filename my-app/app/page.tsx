
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type MenuItem = {
  label: string;
  slug: string;
  description?: string;
};

const navItems = ["Platform", "Solutions", "AI Suite", "Integrations", "Security", "Company", "Pricing"];
const visitedFooterLinksMemory = new Set<string>();

const menuConfig: Record<string, MenuItem[]> = {
  Platform: [
    { label: "Overview", slug: "overview" },
    { label: "3-Way Match", slug: "three-way-match" },
    { label: "Accounting Core", slug: "accounting-core" },
    { label: "Compliance Engine", slug: "compliance-engine" },
  ],
  Solutions: [
    { label: "MSME Suppliers", slug: "msme-suppliers" },
    { label: "Enterprise Buyers", slug: "enterprise-buyers" },
    { label: "Admin & Ops", slug: "admin-ops" },
    { label: "Phase 2 Finance", slug: "phase-2-finance" },
  ],
  "AI Suite": [
    { label: "OCR Ingestion", slug: "ocr-ingestion" },
    { label: "Matching Model", slug: "matching-model" },
    { label: "Cashflow Advisor", slug: "cashflow-advisor" },
    { label: "Risk Scoring", slug: "risk-scoring" },
  ],
  Integrations: [
    { label: "ERP Connectors", slug: "erp-connectors" },
    { label: "Banking & Payments", slug: "banking-payments" },
    { label: "Government APIs", slug: "government-apis" },
    { label: "Webhooks", slug: "webhooks" },
  ],
  Security: [
    { label: "Authentication", slug: "authentication" },
    { label: "Data Security", slug: "data-security" },
    { label: "Audit Trails", slug: "audit-trails" },
    { label: "Compliance", slug: "compliance" },
  ],
  Company: [
    { label: "About Nexus Three", slug: "about-nexus-three" },
    { label: "Roadmap", slug: "roadmap" },
    { label: "Partners", slug: "partners" },
    { label: "Contact", slug: "contact" },
  ],
  Pricing: [
    { label: "Plans", slug: "plans" },
    { label: "Compare", slug: "compare" },
    { label: "Billing", slug: "billing" },
    { label: "Pilot", slug: "pilot" },
  ],
};

const heroHighlights = [
  {
    title: "MSMED compliance, automated",
    description: "Track 43B(h) exposure, penalty accruals, and Samadhaan escalation from one dashboard.",
  },
  {
    title: "AI-driven 3-way matching",
    description: "OCR + PO + GRN matching with variance flags, auto-approvals, and audit trails.",
  },
  {
    title: "Unified AP & AR",
    description: "Buyer and supplier portals in sync with shared invoice truth and cashflow visibility.",
  },
];

const portalCards = [
  {
    title: "MSME Supplier Portal",
    subtitle: "Real-time receivables intelligence",
    points: [
      "Invoice status & payment predictions",
      "Penalty protection and alerts",
      "One-click invoice uploads",
    ],
  },
  {
    title: "Enterprise Buyer Portal",
    subtitle: "Automate payables operations",
    points: [
      "3-way match approvals",
      "Compliance radar & reminders",
      "Dynamic discounting controls",
    ],
  },
  {
    title: "Admin & Ops Console",
    subtitle: "Control plane for teams",
    points: [
      "Entity onboarding & KYC",
      "Audit log search",
      "Workflow configuration",
    ],
  },
];

const pipelineSteps = [
  {
    title: "Document Ingestion",
    description: "OCR invoice PDFs, validate GSTINs, and normalize line items.",
  },
  {
    title: "3-Way Matching",
    description: "Match invoices against POs and GRNs, score variances, and route approvals.",
  },
  {
    title: "Compliance & Cashflow",
    description: "Compute MSMED penalties, forecast cashflow, and trigger reminders.",
  },
];

const architectureCards = [
  {
    title: "Core Services",
    description: "Auth, invoice, matching, accounting, compliance, notification, and reporting microservices.",
  },
  {
    title: "Data Layer",
    description: "MongoDB for operational data, PostgreSQL for ledger integrity, Redis for queues.",
  },
  {
    title: "AI Stack",
    description: "FastAPI services for OCR, matching, cashflow prediction, and risk scoring.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "INR 0",
    cadence: "for pilots",
    highlight: "MSME onboarding",
    features: ["Up to 50 invoices/month", "Basic OCR", "Compliance alerts", "Email support"],
  },
  {
    name: "Growth",
    price: "INR 24,999",
    cadence: "per month",
    highlight: "Enterprise workflows",
    features: ["3-way match automation", "Approval workflows", "Yield engine", "GST reporting"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "annual contract",
    highlight: "National scale",
    features: ["Unlimited invoices", "ERP integrations", "Dedicated success", "Custom AI models"],
  },
];

const quickAccessLinks = [
  {
    label: "Seller Dashboard",
    href: "/seller/dashboard",
    description: "Track receivables, reminders, and match queue in one place.",
  },
  {
    label: "Buyer AP Hub",
    href: "/buyer/ap-hub",
    description: "Approve invoices with maker-checker controls and due-date guardrails.",
  },
  {
    label: "Compliance Hub",
    href: "/buyer/compliance",
    description: "Monitor 43B(h) exposure and review upcoming penalty risk.",
  },
  {
    label: "Verification Center",
    href: "/verification",
    description: "Complete account verification and unlock role-based workflows.",
  },
];

function toSectionSlug(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function normalizeMenuPath(value: string) {
  const withoutQuery = value.split("?")[0].split("#")[0];
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
}

export default function Home() {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [closingMenu, setClosingMenu] = useState<string | null>(null);
  const [enableHeaderAnimations, setEnableHeaderAnimations] = useState(false);
  const [mobileMenuAlign, setMobileMenuAlign] = useState<"left" | "center" | "right">("center");
  const [animateHero, setAnimateHero] = useState(false);
  const [animatePanels, setAnimatePanels] = useState(false);
  const [visitedFooterLinks, setVisitedFooterLinks] = useState<string[]>(() => Array.from(visitedFooterLinksMemory));
  const navRef = useRef<HTMLDivElement>(null);
  const menuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MENU_TRANSITION_MS = 180;

  function clearMenuTimer() {
    if (menuTimerRef.current) {
      clearTimeout(menuTimerRef.current);
      menuTimerRef.current = null;
    }
  }

  function clearNavTimer() {
    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
  }

  function closeMenuWithAnimation(item: string, callback?: () => void) {
    clearMenuTimer();
    setClosingMenu(item);
    menuTimerRef.current = setTimeout(() => {
      setOpenMenu((current) => (current === item ? null : current));
      setClosingMenu((current) => (current === item ? null : current));
      menuTimerRef.current = null;
      callback?.();
    }, MENU_TRANSITION_MS);
  }

  function shouldAnimateNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
    return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncViewport = () => {
      const shouldAnimate = window.innerWidth >= 1024;
      setEnableHeaderAnimations(shouldAnimate);
      if (!shouldAnimate) {
        setClosingMenu(null);
        clearMenuTimer();
        clearNavTimer();
      }
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent | TouchEvent) {
      if (!navRef.current) return;
      if (!navRef.current.contains(event.target as Node)) {
        if (openMenu && enableHeaderAnimations) {
          clearMenuTimer();
          setClosingMenu(openMenu);
          menuTimerRef.current = setTimeout(() => {
            setOpenMenu((current) => (current === openMenu ? null : current));
            setClosingMenu((current) => (current === openMenu ? null : current));
            menuTimerRef.current = null;
          }, MENU_TRANSITION_MS);
        } else {
          setOpenMenu(null);
        }
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [openMenu, enableHeaderAnimations]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setAnimateHero(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setAnimatePanels(true), 120);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => () => {
    clearMenuTimer();
    clearNavTimer();
  }, []);

  function markFooterLinkVisited(href: string) {
    const normalizedHref = normalizeMenuPath(href);
    if (visitedFooterLinksMemory.has(normalizedHref)) return;
    visitedFooterLinksMemory.add(normalizedHref);
    setVisitedFooterLinks(Array.from(visitedFooterLinksMemory));
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f7f4ef] text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#e0f2f1,transparent_52%),radial-gradient(circle_at_bottom,#f2e8da,transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,27,45,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,27,45,0.06)_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-60" />
      <div className="absolute left-6 top-24 h-40 w-40 rounded-full bg-[#d9f0ef] blur-3xl" />
      <div className="absolute right-10 top-16 h-56 w-56 rounded-full bg-[#f6ead7] blur-3xl" />

      <main className="relative z-10 flex min-h-screen w-full flex-col px-4 py-4 sm:px-6 lg:px-8 2xl:px-12">
        <header className="mx-auto w-full max-w-7xl rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-md sm:px-6 lg:py-4 relative z-[70]">
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center gap-3 text-xl font-semibold tracking-tight text-[#0f1b2d] sm:text-2xl">
              <Image
                src="/favicon-192.png"
                alt="Nexus Three logo"
                width={48}
                height={48}
                className="h-11 w-11 rounded-xl bg-white/80 p-1 shadow-sm"
              />
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[#6b7280]">Nexus Three</p>
                <p className="font-display text-lg text-[#0f1b2d] sm:text-xl">Finance OS</p>
              </div>
            </div>
            <div
              ref={navRef}
              className="order-3 col-span-2 mt-3 flex w-full flex-wrap items-center justify-center gap-1 text-sm text-slate-600 sm:gap-2 lg:order-2 lg:col-span-1 lg:mt-0 lg:w-auto"
            >
              {navItems.map((item) => {
                const isOpen = openMenu === item;
                const itemFeatures = menuConfig[item] ?? [];
                const sectionSlug = toSectionSlug(item);
                const mobilePositionClass =
                  mobileMenuAlign === "left"
                    ? "left-0"
                    : mobileMenuAlign === "right"
                      ? "right-0"
                      : "left-1/2 -translate-x-1/2";

                return (
                  <div key={item} className="relative">
                    <button
                      type="button"
                      onClick={(event) => {
                        if (!enableHeaderAnimations) {
                          if (isOpen) {
                            setOpenMenu(null);
                            return;
                          }
                        } else if (isOpen && !closingMenu) {
                          closeMenuWithAnimation(item);
                          return;
                        }

                        const rect = event.currentTarget.getBoundingClientRect();
                        const viewportWidth = window.innerWidth;
                        const dropdownWidth = viewportWidth < 640 ? 224 : 240;
                        const gutter = 10;

                        if (rect.left + dropdownWidth > viewportWidth - gutter) {
                          setMobileMenuAlign("right");
                        } else if (rect.right - dropdownWidth < gutter) {
                          setMobileMenuAlign("left");
                        } else {
                          setMobileMenuAlign("center");
                        }
                        if (enableHeaderAnimations && openMenu && openMenu !== item) {
                          closeMenuWithAnimation(openMenu, () => setOpenMenu(item));
                          return;
                        }
                        if (enableHeaderAnimations) {
                          setClosingMenu(null);
                        }
                        setOpenMenu(item);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-[#d9e4e2] hover:bg-white/80 hover:text-[#0f1b2d]"
                    >
                      {item}
                      <svg
                        className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#0f1b2d]" : "text-slate-400"}`}
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 7.5L10 12.5L15 7.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    <div
                      className={`absolute top-full z-[90] mt-2 w-56 origin-top rounded-2xl border border-slate-200/70 bg-white p-2 shadow-xl transition-all duration-200 ease-out sm:w-60 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 ${mobilePositionClass} ${
                        isOpen && (!enableHeaderAnimations || closingMenu !== item)
                          ? "pointer-events-auto visible translate-y-0 scale-100 opacity-100"
                          : "pointer-events-none invisible -translate-y-2 scale-95 opacity-0"
                      }`}
                    >
                      {itemFeatures.map((feature, featureIndex) => (
                        <Link
                          key={`${item}-${feature.slug}`}
                          href={`/menu/${sectionSlug}/${feature.slug}`}
                          onClick={(event) => {
                            if (!enableHeaderAnimations) {
                              setOpenMenu(null);
                              return;
                            }
                            if (!shouldAnimateNavigation(event)) {
                              setOpenMenu(null);
                              return;
                            }
                            event.preventDefault();
                            clearNavTimer();
                            setClosingMenu(item);
                            navTimerRef.current = setTimeout(() => {
                              setOpenMenu(null);
                              setClosingMenu(null);
                              navTimerRef.current = null;
                              router.push(`/menu/${sectionSlug}/${feature.slug}`);
                            }, MENU_TRANSITION_MS);
                          }}
                          className={`block rounded-xl px-3 py-2.5 text-[15px] font-medium leading-6 text-slate-700 transition-colors duration-150 hover:bg-[#f7f4ef] hover:text-[#0f1b2d] ${
                            !enableHeaderAnimations || (isOpen && closingMenu !== item)
                              ? "translate-y-0 opacity-100"
                              : "translate-y-1 opacity-0"
                          }`}
                          style={{
                            transitionDelay:
                              enableHeaderAnimations && isOpen && closingMenu !== item
                                ? `${featureIndex * 35}ms`
                                : "0ms",
                          }}
                        >
                          {feature.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="order-2 flex items-center justify-end gap-3 lg:order-3">
              <Link
                href="/login"
                className="rounded-full border border-[#d9e4e2] px-4 py-2 text-sm font-semibold text-[#0f1b2d] transition-colors hover:bg-white"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#0f1b2d] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#142338]"
              >
                Request Pilot
              </Link>
            </div>
          </div>
        </header>

        <section className="mx-auto mt-16 w-full max-w-7xl relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div
                className={`inline-flex items-center gap-2 rounded-full border border-[#cfe8e6] bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#1b5b6a] transition-all duration-700 ${
                  animateHero ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
              >
                Phase 1 blueprint
                <span className="h-1.5 w-1.5 rounded-full bg-[#1c8b85]" />
              </div>
              <h1
                className={`font-display mt-6 text-[clamp(2.6rem,6vw,4.6rem)] leading-[1.05] text-[#0f1b2d] transition-all duration-700 ${
                  animateHero ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
                }`}
              >
                Nexus Three unifies MSME suppliers and enterprise buyers on a single AI-powered finance OS.
              </h1>
              <p
                className={`mt-6 max-w-2xl text-[clamp(1.05rem,2vw,1.2rem)] leading-relaxed text-slate-600 transition-all delay-150 duration-700 ${
                  animateHero ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
                }`}
              >
                Automate invoice ingestion, 3-way matching, compliance, and cashflow intelligence without breaking your existing ERP. Phase 1 locks in verified invoice flow before financing activates.
              </p>

              <div
                className={`mt-9 flex flex-wrap items-center gap-4 transition-all delay-300 duration-700 ${
                  animateHero ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
                }`}
              >
                <Link
                  href="/register"
                  className="rounded-full bg-[#0f1b2d] px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#142338]"
                >
                  Start onboarding
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-[#d9e4e2] bg-white/70 px-6 py-3 text-base font-semibold text-[#0f1b2d] transition-all hover:-translate-y-0.5"
                >
                  Explore portals
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {heroHighlights.map((highlight) => (
                  <div key={highlight.title} className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-[#0f1b2d]">{highlight.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{highlight.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#0f1b2d]">Quick Access</h3>
                  <Link href="/login" className="text-xs font-semibold text-[#1b5b6a] hover:text-[#0f1b2d]">Open workspace</Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {quickAccessLinks.map((item) => (
                    <Link key={item.label} href={item.href} className="rounded-xl border border-[#e7eceb] bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-[#cfe8e6]">
                      <p className="text-sm font-semibold text-[#0f1b2d]">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-600">{item.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div
              className={`relative mx-auto h-[360px] w-full max-w-[520px] transition-all duration-700 lg:h-[520px] ${
                animatePanels ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-95 opacity-0"
              }`}
            >
              <div className="absolute inset-0 rounded-[28px] border border-white/80 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.15)]">
                <div className="flex h-12 items-center justify-between border-b border-slate-100 px-5">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#0f1b2d]" />
                    <span className="text-sm font-semibold text-slate-700">Live Control Center</span>
                  </div>
                  <span className="text-xs text-slate-400">Enterprise + MSME</span>
                </div>
                <div className="p-6">
                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-slate-100 bg-[#f7f4ef] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Today</p>
                      <p className="mt-2 text-lg font-semibold text-[#0f1b2d]">INR 16.8 Cr invoices processed</p>
                      <p className="mt-1 text-sm text-slate-500">84% auto-approved via 3-way match</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Compliance</p>
                        <p className="mt-2 text-base font-semibold text-[#0f1b2d]">43B(h) exposure</p>
                        <p className="mt-1 text-sm text-slate-500">7 invoices approaching deadline</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cashflow AI</p>
                        <p className="mt-2 text-base font-semibold text-[#0f1b2d]">Next 30 days</p>
                        <p className="mt-1 text-sm text-slate-500">Projected receipts: INR 42.4 Cr</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#0f1b2d]">Match queue</p>
                        <span className="rounded-full bg-[#e0f2f1] px-3 py-1 text-xs font-semibold text-[#1b5b6a]">2 in review</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {[
                          "PO-1042 vs INV-2839",
                          "PO-992 vs INV-2814",
                          "PO-1112 vs INV-2844",
                        ].map((item) => (
                          <div key={item} className="flex items-center justify-between text-sm text-slate-600">
                            <span>{item}</span>
                            <span className="text-xs text-[#1c8b85]">Review</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto mt-16 w-full max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.4fr_0.6fr]">
            <div className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-[#1b5b6a]">Phase 1 target</p>
              <h2 className="font-display mt-4 text-3xl text-[#0f1b2d]">Build the network before financing.</h2>
              <p className="mt-4 text-sm text-slate-600">
                The platform focuses on onboarding enterprise buyers and their MSME suppliers to create verified invoice flow and compliance data.
              </p>
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Enterprise buyers onboarded</span>
                  <span className="font-semibold text-[#0f1b2d]">8-10 target</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Monthly invoice GMV</span>
                  <span className="font-semibold text-[#0f1b2d]">INR 150 Cr+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Auto-approval rate</span>
                  <span className="font-semibold text-[#0f1b2d]">70%+</span>
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {portalCards.map((card) => (
                <div key={card.title} className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#0f1b2d]">{card.title}</h3>
                  <p className="mt-1 text-sm text-[#1b5b6a]">{card.subtitle}</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    {card.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-[#1c8b85]" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 w-full max-w-7xl">
          <div className="rounded-[32px] border border-white/80 bg-white/80 p-8 shadow-sm">
            <div className="grid gap-10 lg:grid-cols-[0.45fr_0.55fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#1b5b6a]">AI pipeline</p>
                <h2 className="font-display mt-4 text-3xl text-[#0f1b2d]">From OCR to compliance in minutes.</h2>
                <p className="mt-4 text-sm text-slate-600">
                  Nexus Three orchestrates document ingestion, matching, and compliance workflows with continuous audit trails across every invoice lifecycle.
                </p>
                <div className="mt-6 space-y-4">
                  {pipelineSteps.map((step, index) => (
                    <div key={step.title} className="flex items-start gap-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9e4e2] bg-white text-sm font-semibold text-[#0f1b2d]">
                        0{index + 1}
                      </span>
                      <div>
                        <h3 className="text-base font-semibold text-[#0f1b2d]">{step.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {architectureCards.map((card) => (
                  <div key={card.title} className="rounded-2xl border border-[#e7eceb] bg-[#f7f4ef] p-5">
                    <h3 className="text-base font-semibold text-[#0f1b2d]">{card.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{card.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 w-full max-w-7xl">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-[#1b5b6a]">Compliance Engine</p>
              <h2 className="font-display mt-4 text-3xl text-[#0f1b2d]">MSMED protection baked in.</h2>
              <p className="mt-4 text-sm text-slate-600">
                Built-in 43B(h) radar, penalty interest calculation, and Samadhaan escalation drafts keep enterprises compliant and MSMEs protected.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b5b6a]">
                <span className="rounded-full border border-[#cfe8e6] bg-[#e0f2f1] px-3 py-2">Penalty alerts</span>
                <span className="rounded-full border border-[#cfe8e6] bg-[#e0f2f1] px-3 py-2">Auto reminders</span>
                <span className="rounded-full border border-[#cfe8e6] bg-[#e0f2f1] px-3 py-2">Audit trail</span>
              </div>
            </div>
            <div className="rounded-[28px] border border-[#0f1b2d] bg-[#0f1b2d] p-6 text-white shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-[#d9f0ef]">Phase 2 readiness</p>
              <h2 className="font-display mt-4 text-3xl">When the data is verified, financing unlocks.</h2>
              <ul className="mt-6 space-y-3 text-sm text-[#d9f0ef]">
                <li>Monthly approved invoice GMV reaches INR 150 Cr+</li>
                <li>8+ active enterprise buyers with weekly usage</li>
                <li>1,000+ MSME suppliers active in 30 days</li>
                <li>3-way match auto-approval rate above 70%</li>
                <li>2+ NBFC or bank partner agreements signed</li>
              </ul>
              <div className="mt-6">
                <Link
                  href="/register"
                  className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0f1b2d] transition hover:-translate-y-0.5"
                >
                  Join the rollout
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 w-full max-w-7xl">
          <div className="rounded-[32px] border border-white/80 bg-white/80 p-8 shadow-sm">
            <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#1b5b6a]">Pricing</p>
                <h2 className="font-display mt-3 text-3xl text-[#0f1b2d]">Choose a plan built for supply-chain scale.</h2>
                <p className="mt-3 text-sm text-slate-600">
                  Pilot free, upgrade when the enterprise network is ready.
                </p>
              </div>
              <Link
                href="/menu/pricing/plans"
                className="rounded-full border border-[#d9e4e2] bg-white px-5 py-2 text-sm font-semibold text-[#0f1b2d]"
              >
                View full pricing
              </Link>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {pricingPlans.map((plan) => (
                <div key={plan.name} className="rounded-2xl border border-[#e7eceb] bg-[#f7f4ef] p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{plan.highlight}</p>
                  <h3 className="mt-2 text-lg font-semibold text-[#0f1b2d]">{plan.name}</h3>
                  <p className="mt-2 text-2xl font-semibold text-[#0f1b2d]">
                    {plan.price}
                    <span className="text-sm font-medium text-slate-500"> {plan.cadence}</span>
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-[#1c8b85]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="mx-auto mt-16 w-full max-w-7xl border-t border-white/70 px-4 py-10 text-sm text-slate-500">
          <div className="grid grid-cols-2 gap-8 min-[900px]:grid-cols-7">
            {navItems.map((item) => {
              const sectionSlug = toSectionSlug(item);
              const itemFeatures = menuConfig[item] ?? [];

              return (
                <div key={`footer-${item}`} className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#0f1b2d]">{item}</h3>
                  <div className="space-y-3">
                    {itemFeatures.map((feature) => {
                      const href = `/menu/${sectionSlug}/${feature.slug}`;
                      const isVisited = visitedFooterLinks.includes(normalizeMenuPath(href));

                      return (
                        <Link
                          key={`footer-${item}-${feature.slug}`}
                          href={href}
                          onMouseDown={() => markFooterLinkVisited(href)}
                          onClick={() => markFooterLinkVisited(href)}
                          className="block text-slate-600 no-underline transition-colors hover:text-[#0f1b2d]"
                          style={{ color: isVisited ? "#0f1b2d" : undefined }}
                        >
                          {feature.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/70 pt-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <Image src="/favicon-32.png" alt="Nexus Three" width={28} height={28} className="rounded-lg" />
              <span className="font-semibold text-[#0f1b2d]">Nexus Three</span>
            </div>
            <p>(c) {new Date().getFullYear()} Nexus Three. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

