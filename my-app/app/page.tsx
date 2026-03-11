"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type MenuItem = {
  label: string;
  slug: string;
};

const navItems = ["Features", "Solutions", "Resources", "About Us", "Help", "Pricing"];
const visitedFooterLinksMemory = new Set<string>();

const menuConfig: Record<string, MenuItem[]> = {
  Features: [
    { label: "Overview", slug: "overview" },
    { label: "Integrations", slug: "integrations" },
    { label: "Analytics", slug: "analytics" },
    { label: "Automation", slug: "automation" },
  ],
  Solutions: [
    { label: "For Startups", slug: "startups" },
    { label: "For SMBs", slug: "smbs" },
    { label: "For Enterprises", slug: "enterprises" },
    { label: "For Agencies", slug: "agencies" },
  ],
  Resources: [
    { label: "Blog", slug: "blog" },
    { label: "Guides", slug: "guides" },
    { label: "Case Studies", slug: "case-studies" },
    { label: "API Docs", slug: "api-docs" },
  ],
  "About Us": [
    { label: "Company", slug: "company" },
    { label: "Careers", slug: "careers" },
    { label: "Press", slug: "press" },
    { label: "Contact", slug: "contact" },
  ],
  Help: [
    { label: "Support Center", slug: "support-center" },
    { label: "FAQs", slug: "faqs" },
    { label: "Community", slug: "community" },
    { label: "Status", slug: "status" },
  ],
  Pricing: [
    { label: "Plans", slug: "plans" },
    { label: "Compare", slug: "compare" },
    { label: "Billing", slug: "billing" },
    { label: "Trial", slug: "trial" },
  ],
};

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
  const [animateText, setAnimateText] = useState(false);
  const [animateImage, setAnimateImage] = useState(false);
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
    const id = window.requestAnimationFrame(() => setAnimateText(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setAnimateImage(true), 120);
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
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#050607] text-white lg:h-screen lg:overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.06),transparent_35%)]" />
      <div className="absolute inset-0 opacity-20 [background:linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)]" />

      <main className="seller-dashboard-scroll relative z-10 flex min-h-screen w-full flex-col px-2 py-3 sm:px-3 lg:h-full lg:overflow-y-auto lg:px-4 2xl:px-6">
        <header className="relative z-20 rounded-2xl border border-white/10 bg-white/5 px-2.5 py-2 backdrop-blur-md sm:px-3 lg:py-1">
          <div className="grid grid-cols-[1fr_auto] items-center gap-2 lg:grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center gap-3 text-xl font-semibold tracking-tight sm:text-2xl lg:gap-2 lg:text-2xl">
              <Image
                src="/favicon-192.png"
                alt="Nexus Three logo"
                width={48}
                height={48}
                className="h-10 w-10 shrink-0 sm:h-11 sm:w-11 lg:h-12 lg:w-12 xl:h-14 xl:w-14"
              />
              <span className="leading-none">Nexus Three</span>
            </div>

            <div
              ref={navRef}
              className="order-3 col-span-2 mt-2 flex w-full flex-wrap items-center justify-center gap-2 text-sm text-zinc-300 sm:gap-3 md:gap-4 lg:order-2 lg:col-span-1 lg:mt-0 lg:w-auto lg:gap-3 xl:gap-4"
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
                      className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs transition hover:text-white sm:text-sm lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-0"
                    >
                      {item}
                      <svg
                        className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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
                      className={`absolute top-full z-50 mt-2 w-56 origin-top rounded-2xl border border-slate-200/20 bg-[#0b1d2e] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-all duration-200 ease-out sm:w-60 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 ${mobilePositionClass} ${
                        isOpen && (!enableHeaderAnimations || closingMenu !== item)
                          ? "pointer-events-auto visible translate-y-0 scale-100 opacity-100"
                          : "pointer-events-none invisible -translate-y-1 scale-95 opacity-0"
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
                          className={`block rounded-xl px-3 py-2.5 text-[15px] font-semibold leading-6 text-white transition-all duration-200 hover:bg-sky-400/20 focus:bg-sky-400/20 visited:text-white ${
                            !enableHeaderAnimations || (isOpen && closingMenu !== item) ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
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

            <div className="order-2 flex items-center justify-end gap-2 sm:gap-3 lg:order-3 lg:gap-2">
              <Link
                href="/login"
                className="rounded-xl px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/10 sm:px-4 sm:text-sm lg:px-3 lg:py-1.5"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:bg-white/15 sm:px-4 sm:text-sm lg:px-3 lg:py-1.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-6 flex-1 pt-3 sm:mt-8 sm:pt-6 lg:mt-10 lg:pt-8">
          <div className="grid items-center gap-8 px-1 text-center sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-10 lg:text-left 2xl:px-16">
            <div>
              <h1
                className={`font-serif text-[clamp(1.85rem,7vw,4.5rem)] leading-[1.06] text-white transition-all duration-700 ${
                  animateText ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
                }`}
              >
                Smart Invoice & Workflow Management
                <span className="hidden md:inline"> </span>
                <span className="block md:inline">for Modern Businesses</span>
              </h1>
              <p
                className={`mx-auto mt-2 max-w-2xl text-[clamp(0.98rem,2.4vw,1.25rem)] leading-relaxed text-zinc-300 transition-all delay-150 duration-700 sm:mt-4 lg:mx-0 lg:max-w-xl ${
                  animateText ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
                }`}
              >
                Manage invoices, automate approvals, track payments, and streamline vendor operations
                - all in one powerful B2B platform.
              </p>
            </div>

            <div
              className={`relative mx-auto mt-6 h-[240px] w-full max-w-[320px] transition-all duration-700 lg:mt-0 lg:h-[420px] lg:max-w-[520px] ${
                animateImage ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-95 opacity-0"
              }`}
            >
              <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-zinc-900/80 to-black/80 shadow-[0_30px_120px_rgba(0,0,0,0.8)]" />
              <div className="absolute left-[18%] top-[12%] h-16 w-16 rounded-2xl border border-white/15 bg-black/80 shadow-2xl lg:h-32 lg:w-32" />
              <div className="absolute right-[16%] top-[22%] h-14 w-14 rounded-2xl border border-white/15 bg-zinc-900/80 shadow-2xl lg:h-28 lg:w-28" />
              <div className="absolute left-[30%] top-[38%] h-20 w-20 rounded-3xl border border-white/15 bg-gradient-to-br from-zinc-800 to-zinc-950 shadow-2xl lg:h-36 lg:w-36" />
              <div className="absolute right-[24%] bottom-[24%] h-14 w-14 rounded-2xl border border-white/10 bg-zinc-900/80 shadow-2xl lg:h-28 lg:w-28" />
              <div className="absolute bottom-6 left-1/2 h-8 w-4/5 -translate-x-1/2 rounded-full bg-white/10 blur-2xl" />
            </div>
          </div>
        </section>

        <footer className="mt-8 border-t border-white/10 px-2 py-5 text-xs text-zinc-400 sm:mt-10 sm:px-3 sm:text-sm lg:px-4 2xl:px-6">
          <div className="mx-auto max-w-6xl space-y-5">
            <div className="grid grid-cols-3 gap-3 p-2 sm:gap-5 sm:p-3 min-[820px]:grid-cols-6">
              {navItems.map((item) => {
                const sectionSlug = toSectionSlug(item);
                const itemFeatures = menuConfig[item] ?? [];

                return (
                  <div key={`footer-${item}`} className="space-y-2 rounded-xl p-2 text-center sm:p-3 sm:text-left">
                    <h3 className="text-xs font-semibold text-white sm:text-sm">{item}</h3>
                    <div className="space-y-1.5">
                      {itemFeatures.map((feature) => {
                        const href = `/menu/${sectionSlug}/${feature.slug}`;
                        const isVisited = visitedFooterLinks.includes(normalizeMenuPath(href));

                        return (
                          <Link
                            key={`footer-${item}-${feature.slug}`}
                            href={href}
                            onMouseDown={() => markFooterLinkVisited(href)}
                            onClick={() => markFooterLinkVisited(href)}
                            className="block no-underline underline-offset-4 transition hover:underline"
                            style={{ color: isVisited ? "#2563eb" : "#a1a1aa" }}
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
            <p className=" text-center">
              (c) {new Date().getFullYear()} Nexus Three. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
