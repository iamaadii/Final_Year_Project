"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Brain, Sparkles, AlertTriangle, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api/client";

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: { message?: string } | null;
};

type CashflowData = {
  upcoming14Days?: number;
  upcoming30Days?: number;
};

type ComplianceItem = {
  type?: string;
  date?: string;
};

type CompliancePayload = {
  items?: ComplianceItem[];
};

type SummaryData = {
  matchEfficiency?: number;
};

type Props = {
  insightsHref: string;
};

function unwrapPayload<T>(payload: T | ApiEnvelope<T> | null): T | null {
  if (!payload || typeof payload !== "object") return payload as T | null;
  if ("data" in payload) {
    return ((payload as ApiEnvelope<T>).data || null) as T | null;
  }
  return payload as T;
}

function formatInr(value: number) {
  return `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function AIInsightsSidebar({ insightsHref }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cashflow, setCashflow] = useState<CashflowData>({});
  const [atRiskCount, setAtRiskCount] = useState(0);
  const [matchEfficiency, setMatchEfficiency] = useState(0);
  const [streamedInsight, setStreamedInsight] = useState("");

  const loadInsights = async () => {
    setLoading(true);

    Promise.allSettled([
      apiFetch<CashflowData | ApiEnvelope<CashflowData>>("/api/ai/cashflow"),
      apiFetch<CompliancePayload | ApiEnvelope<CompliancePayload>>("/api/compliance/calendar?days=7"),
      apiFetch<SummaryData | ApiEnvelope<SummaryData>>("/api/accounting/summary"),
    ])
      .then(([cashflowRes, complianceRes, summaryRes]) => {
        const cashflowRaw = cashflowRes.status === "fulfilled" ? cashflowRes.value : null;
        const complianceRaw = complianceRes.status === "fulfilled" ? complianceRes.value : null;
        const summaryRaw = summaryRes.status === "fulfilled" ? summaryRes.value : null;

        const normalizedCashflow = unwrapPayload(cashflowRaw) || {};
        const normalizedCompliance = unwrapPayload(complianceRaw) || {};
        const normalizedSummary = unwrapPayload(summaryRaw) || {};

        setCashflow({
          upcoming14Days: Number(normalizedCashflow.upcoming14Days || 0),
          upcoming30Days: Number(normalizedCashflow.upcoming30Days || 0),
        });

        const now = new Date();
        const riskInvoices = (normalizedCompliance.items || []).filter((item) => {
          if ((item.type || "") !== "invoice_due") return false;
          const date = item.date ? new Date(item.date) : null;
          if (!date || Number.isNaN(date.getTime())) return false;
          const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return days <= 7;
        });
        setAtRiskCount(riskInvoices.length);

        setMatchEfficiency(Number(normalizedSummary.matchEfficiency || 0));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const streamInsight = async () => {
      const prompt = "Summarize near-term cashflow actions for the next 30 days in under 40 words.";
      setStreamedInsight("");
      try {
        const res = await fetch(`/api/ai/insights?stream=true&prompt=${encodeURIComponent(prompt)}`);
        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;
          setStreamedInsight((prev) => prev + chunk);
        }
      } catch {
        // no-op fallback
      }
    };

    void streamInsight();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const cards = useMemo(
    () => [
      {
        id: "cashflow",
        icon: <Sparkles className="h-4 w-4 text-[var(--brand-ocean)]" />,
        label: "Cashflow Forecast",
        value: `14d ${formatInr(cashflow.upcoming14Days || 0)} | 30d ${formatInr(cashflow.upcoming30Days || 0)}`,
        body: streamedInsight?.trim() || "Streaming AI summary...",
      },
      {
        id: "compliance",
        icon: <AlertTriangle className="h-4 w-4 text-[var(--status-warning)]" />,
        label: "Compliance Alert",
        value: `${atRiskCount} invoice(s) at risk in 7 days`,
        body: atRiskCount > 0 ? "Prioritize payments to avoid MSMED deadline breaches." : "No urgent invoice breaches detected this week.",
      },
      {
        id: "match",
        icon: <BarChart3 className="h-4 w-4 text-[var(--brand-teal)]" />,
        label: "Match Performance",
        value: `${matchEfficiency}% auto-match efficiency`,
        body: matchEfficiency >= 80 ? "Efficiency is healthy. Focus manual review on edge exceptions." : "Efficiency is below target. Review exception patterns and vendor data quality.",
      },
    ],
    [atRiskCount, cashflow.upcoming14Days, cashflow.upcoming30Days, matchEfficiency, streamedInsight],
  );

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen((prev) => {
            const next = !prev;
            if (next) {
              void loadInsights();
            }
            return next;
          })
        }
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-xl border border-r-0 border-[var(--mint-border)] bg-[var(--brand-glow)] px-3 py-3 text-[var(--brand-ocean)] shadow-sm transition-colors hover:bg-[var(--mint-light)]"
        aria-label={open ? "Close AI insights" : "Open AI insights"}
      >
        {open ? <ChevronRight className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
      </button>

      <aside
        className={`fixed right-0 top-0 z-40 h-full w-full max-w-sm border-l border-[var(--mint-border)] bg-[var(--background)] p-4 shadow-xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!open}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--brand-ink)]">
            <Brain className="h-4 w-4 text-[var(--brand-ocean)]" /> AI Insights
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-[var(--mint-border)] bg-[var(--brand-sand)] px-2 py-1 text-xs font-bold text-[var(--brand-ocean)] hover:bg-[var(--brand-glow)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {cards.map((card) => (
            <div key={card.id} className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4 shadow-sm">
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--brand-ocean)]">
                {card.icon}
                {card.label}
              </p>
              <p className="text-sm font-bold text-[var(--brand-ink)]">{card.value}</p>
              <p className="mt-1 text-xs text-slate-600">
                {loading && card.id !== "cashflow" ? "Loading insight..." : card.body}
              </p>
              <Link href={insightsHref} className="mt-3 inline-flex text-xs font-bold text-[var(--brand-ocean)] hover:text-[var(--hover-navy)]">
                Tell me more &rarr;
              </Link>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
