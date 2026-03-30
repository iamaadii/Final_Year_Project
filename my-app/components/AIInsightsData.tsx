"use client";

import { useState } from "react";
import { Sparkles, BrainCircuit, Activity, AlertTriangle } from "lucide-react";

type MatchResult = {
  confidence_score?: number;
  confidenceScore?: number;
  variance_flags?: { field: string; variance_pct: number }[];
  varianceFlags?: { field: string; variancePct: number }[];
};

type AIInsightsProps = {
  invoiceId: string | null;
  matchResult?: MatchResult;
  onSuggestGL?: () => void;
};

export function AIInsightsData({ invoiceId, matchResult, onSuggestGL }: AIInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const requestSuggestion = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/suggest-gl`, { method: "POST" });
      const data = await res.json();
      if (data.glCode) {
        setSuggestion(data.glCode);
        if (onSuggestGL) onSuggestGL();
      }
    } catch {
      // error handling
    } finally {
      setLoading(false);
    }
  };

  const confidenceScore = matchResult?.confidence_score ?? matchResult?.confidenceScore ?? 0;
  const isLowConfidence = confidenceScore < 0.8;

  return (
    <div className="w-80 border-l border-slate-200 bg-white shadow-[-4px_0_15px_-10px_rgba(0,0,0,0.1)] h-full overflow-y-auto hidden xl:block p-6">
      <div className="flex items-center gap-2 mb-6 text-[#1b5b6a]">
        <Sparkles className="w-5 h-5" />
        <h3 className="font-bold text-lg">AI Insights</h3>
      </div>

      <div className="space-y-6">
        {/* OCR Confidence Box */}
        {matchResult && (
          <div className={`p-4 rounded-xl border ${isLowConfidence ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
             <div className="flex justify-between items-center mb-2">
               <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Extraction Confidence</span>
               <span className={`text-sm font-bold ${isLowConfidence ? "text-amber-700" : "text-emerald-700"}`}>
                 {Math.round(confidenceScore * 100)}%
               </span>
             </div>
             
             {/* Progress Bar */}
             <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
               <div className={`h-1.5 rounded-full ${isLowConfidence ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${confidenceScore * 100}%` }}></div>
             </div>

             {isLowConfidence && (
               <div className="flex gap-2 items-start mt-3">
                 <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                 <p className="text-xs text-amber-700 leading-tight">Human review heavily recommended. Some fields may require correction.</p>
               </div>
             )}
          </div>
        )}

        {/* GL Code Automation */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit className="w-4 h-4 text-slate-500" />
            <h4 className="font-semibold text-slate-800 text-sm">GL Code Suggestion</h4>
          </div>
          <p className="text-xs text-slate-500 mb-3 leading-tight">
            Gemini will analyze the invoice line items and suggest the most appropriate Chart of Accounts mapping.
          </p>
          
          {suggestion ? (
            <div className="bg-white border text-emerald-700 border-emerald-200 p-2 rounded-lg text-sm font-mono font-bold text-center">
              {suggestion}
            </div>
          ) : (
            <button 
              onClick={requestSuggestion}
              disabled={loading}
              className="w-full py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 disabled:opacity-50 transition"
            >
              {loading ? "Analyzing..." : "Auto-Suggest Match"}
            </button>
          )}
        </div>

        {/* Real-time ML flags */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
           <div className="flex items-center gap-2 mb-2">
             <Activity className="w-4 h-4 text-slate-500" />
             <h4 className="font-semibold text-slate-800 text-sm">Anomaly Detection</h4>
           </div>
           {(matchResult?.variance_flags && matchResult.variance_flags.length > 0)
             || (matchResult?.varianceFlags && matchResult.varianceFlags.length > 0) ? (
             <ul className="space-y-2">
               {(matchResult.variance_flags || matchResult.varianceFlags || []).map((flag, idx) => (
                 <li key={idx} className="bg-white border border-rose-100 p-2 rounded text-xs text-rose-700">
                   <strong>{flag.field}</strong> variance: {"variance_pct" in flag ? flag.variance_pct : flag.variancePct}% difference from PO.
                 </li>
               ))}
             </ul>
           ) : (
             <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 p-2 rounded">
               No anomalies detected in totals or taxes.
             </p>
           )}
        </div>

      </div>
    </div>
  );
}
