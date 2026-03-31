"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle2, AlertCircle, FileText, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { Portal } from "./Portal";

type RawVendor = {
  name: string;
  gstin: string;
  email: string;
  status?: "pending" | "valid" | "invalid" | "duplicate";
  error?: string;
};

type CSVBulkOnboarderProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
  linkType: "buyer" | "vendor";
};

export function CSVBulkOnboarder({ isOpen, onClose, onSuccess, linkType }: CSVBulkOnboarderProps) {
  const [step, setStep] = useState<"upload" | "preview" | "processing">("upload");
  const [data, setData] = useState<RawVendor[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split("\n").filter(row => row.trim() !== "");
      
      // Basic CSV parsing (comma or semicolon)
      const parsed: RawVendor[] = rows.slice(1).map(row => {
        const cols = row.split(/[;,]/).map(c => c.trim());
        return {
          name: cols[0] || "",
          gstin: (cols[1] || "").toUpperCase().replace(/[^A-Z0-9]/g, ""),
          email: cols[2] || ""
        };
      }).filter(v => v.name !== "" || v.gstin !== "");

      setData(parsed);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const startOnboarding = async () => {
    setIsProcessing(true);
    setStep("processing");
    try {
      const result = await apiFetch<{ onboardedCount: number }>("/api/counterparties/bulk-invite", {
        method: "POST",
        body: JSON.stringify({ items: data, linkType })
      });
      onSuccess(result.onboardedCount);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bulk onboarding failed");
      setStep("preview");
    } finally {
      setIsProcessing(false);
    }
  };

  const getValidation = (v: RawVendor) => {
    if (v.gstin.length !== 15) return { color: "text-rose-500", label: "Invalid GSTIN" };
    if (!v.name) return { color: "text-rose-500", label: "Missing Name" };
    return { color: "text-emerald-500", label: "Ready" };
  };

  const validCount = data.filter(v => v.gstin.length === 15 && v.name !== "").length;

  return (
    <Portal>
      <div 
        className="fixed inset-0 z-[60] flex items-start justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-500"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] mt-12 animate-in zoom-in-95 slide-in-from-top-12 duration-500">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bulk {linkType === "buyer" ? "Buyer" : "Vendor"} Onboarding</h2>
              <p className="text-sm text-slate-500 font-medium italic">Import hundreds of counterparties using a simple CSV file.</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {step === "upload" && (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-white hover:border-[#1b5b6a] transition-all cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}>
                <div className="h-20 w-20 rounded-full bg-white shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Upload className="h-10 w-10 text-[#1b5b6a]" />
                </div>
                <p className="text-lg font-bold text-slate-800">Drop your CSV file here</p>
                <p className="text-sm text-slate-400 mt-2">Column Format: <span className="font-mono bg-slate-200 px-2 py-0.5 rounded">Name, GSTIN, Email</span></p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".csv" 
                  className="hidden" 
                />
              </div>
            )}

            {step === "preview" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="text-slate-400" size={20} />
                    <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Preview: {data.length} records found</p>
                  </div>
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold ring-1 ring-emerald-200">
                    {validCount} Ready to onboard
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">GSTIN</th>
                        <th className="p-4">Finance Email</th>
                        <th className="p-4">Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-medium">
                      {data.slice(0, 100).map((v, i) => {
                        const validation = getValidation(v);
                        return (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 text-slate-900 font-bold">{v.name}</td>
                            <td className="p-4 font-mono text-[13px]">{v.gstin}</td>
                            <td className="p-4 text-slate-500">{v.email || "--"}</td>
                            <td className="p-4">
                              <div className={`flex items-center gap-1.5 ${validation.color} font-bold text-xs`}>
                                {v.gstin.length === 15 && v.name !== "" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                {validation.label}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {data.length > 100 && (
                  <p className="text-center text-xs text-slate-400 italic">Showing first 100 records only.</p>
                )}
              </div>
            )}

            {step === "processing" && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-16 w-16 text-[#1b5b6a] animate-spin mb-6" />
                <h3 className="text-2xl font-black text-slate-900">Establishing Connections...</h3>
                <p className="text-slate-500 mt-2 font-medium">Please do not refresh the page while we process your request.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/30">
            <button 
              onClick={onClose} 
              disabled={isProcessing}
              className="px-6 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            {step === "preview" && (
              <button 
                onClick={startOnboarding}
                disabled={validCount === 0 || isProcessing}
                className="px-8 py-3 rounded-2xl bg-[#0f1b2d] text-sm font-black text-white shadow-xl hover:translate-y-[-2px] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                Onboard {validCount} Counterparties
              </button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
