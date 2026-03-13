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
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-800 lg:h-screen lg:overflow-hidden font-sans">
      {/* Very clean light grid background typical of SaaS */}
      <div className="absolute inset-0 bg-slate-50" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50" />

      <main className="seller-dashboard-scroll relative z-10 flex min-h-screen w-full flex-col px-4 py-3 sm:px-6 lg:h-full lg:overflow-y-auto lg:px-8 2xl:px-12">
        <header className="mx-auto w-full max-w-7xl relative z-20 mt-4 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md shadow-sm sm:px-6 lg:py-4 transition-all hover:shadow-md">
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center gap-3 text-xl font-bold tracking-tight text-blue-800 sm:text-2xl lg:gap-2">
              <Image
                src="/favicon-192.png"
                alt="Nexus Three logo"
                width={48}
                height={48}
                className="h-10 w-10 shrink-0 sm:h-11 sm:w-11 drop-shadow-sm"
              />
              <span className="leading-none text-slate-900">Nexus Three</span>
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
                      className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                    >
                      {item}
                      <svg
                        className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-700" : "text-slate-400"}`}
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
                      className={`absolute top-full z-50 mt-2 w-56 origin-top rounded-xl border border-slate-200 bg-white p-2 shadow-xl transition-all duration-200 ease-out sm:w-60 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 ${mobilePositionClass} ${
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
                          className={`block rounded-lg px-3 py-2.5 text-[15px] font-medium leading-6 text-slate-700 transition-colors duration-150 hover:bg-slate-50 hover:text-blue-700 ${
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

            <div className="order-2 flex items-center justify-end gap-3 lg:order-3">
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow disabled:opacity-50 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center mt-12 sm:mt-16 lg:mt-20">
          <div className="grid items-center gap-12 text-center lg:grid-cols-2 lg:gap-16 lg:text-left">
            <div>
              <div
                className={`inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 transition-all duration-700 mb-6 ${
                  animateText ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
              >
                <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse" />
                New: AI-Powered Approvals
              </div>
              <h1
                className={`font-serif text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.1] text-slate-900 tracking-tight transition-all duration-700 ${
                  animateText ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
                }`}
              >
                Modern business <br className="hidden lg:block"/>
                <span className="text-blue-600">finance & operations</span>
              </h1>
              <p
                className={`mx-auto mt-6 max-w-2xl text-[clamp(1.1rem,2vw,1.25rem)] leading-relaxed text-slate-600 transition-all delay-150 duration-700 lg:mx-0 lg:max-w-xl ${
                  animateText ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
                }`}
              >
                Manage invoices, automate approvals, track payments, and streamline vendor operations—all in one unified platform designed for growth.
              </p>
              
              <div 
                className={`mt-10 flex flex-wrap items-center justify-center gap-4 transition-all delay-300 duration-700 lg:justify-start ${
                  animateText ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
                }`}
              >
                <Link
                  href="/register"
                  className="rounded-lg bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                >
                  Start your free trial
                </Link>
                <Link
                  href="/demo"
                  className="rounded-lg bg-white border border-slate-300 px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:-translate-y-0.5 focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
                >
                  Book a demo
                </Link>
              </div>
            </div>

            <div
              className={`relative mx-auto h-[320px] w-full max-w-[480px] transition-all duration-700 lg:mt-0 lg:h-[500px] lg:max-w-[600px] ${
                animateImage ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-95 opacity-0"
              }`}
            >
              <div className="absolute inset-0 rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] overflow-hidden">
                {/* Mockup Dashboard UI */}
                <div className="flex h-12 w-full items-center border-b border-slate-100 bg-slate-50 px-4">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-slate-300" />
                    <div className="h-3 w-3 rounded-full bg-slate-300" />
                    <div className="h-3 w-3 rounded-full bg-slate-300" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-8 w-1/3 rounded bg-slate-100 mb-8" />
                  <div className="flex gap-4 mb-6">
                    <div className="h-24 w-1/3 rounded-lg border border-slate-100 bg-slate-50" />
                    <div className="h-24 w-1/3 rounded-lg border border-slate-100 bg-slate-50" />
                    <div className="h-24 w-1/3 rounded-lg border border-slate-100 bg-slate-50" />
                  </div>
                  <div className="h-40 w-full rounded-lg border border-slate-100 bg-slate-50" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-16 w-full max-w-7xl mx-auto border-t border-slate-200 px-4 py-8 text-sm text-slate-500 sm:mt-24">
          <div className="grid grid-cols-2 gap-8 min-[820px]:grid-cols-6 mb-8">
            {navItems.map((item) => {
              const sectionSlug = toSectionSlug(item);
              const itemFeatures = menuConfig[item] ?? [];

              return (
                <div key={`footer-${item}`} className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">{item}</h3>
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
                          className="block text-slate-600 no-underline transition-colors hover:text-blue-600"
                          style={{ color: isVisited ? "#2563eb" : undefined }}
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
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/favicon-32.png" alt="Logo" width={24} height={24} className="opacity-80 grayscale" />
              <span className="font-semibold text-slate-700">Nexus Three</span>
            </div>
            <p>© {new Date().getFullYear()} Nexus Three. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
