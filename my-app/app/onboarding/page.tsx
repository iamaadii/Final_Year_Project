"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    gstNumber: "",
    panNumber: "",
    udhyamNumber: "", // MSME only
    billingAddress: "",
  });
  
  // This would ideally pull from the user's fetched session, assuming Buyer for now
  const [userRole] = useState<"Buyer" | "Seller">("Buyer"); 

  const handleNext = () => setStep(s => Math.min(3, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/users/me/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push(userRole === "Buyer" ? "/buyer/dashboard" : "/seller/dashboard");
      } else {
        alert("Failed to save onboarding details.");
      }
    } catch {
      alert("Error saving onboarding details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header elements */}
        <div className="bg-[#0f1b2d] p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,#1b5b6a,transparent_70%)]" />
          <h1 className="text-3xl font-bold relative z-10">Welcome to Nexus Three</h1>
          <p className="mt-2 text-[#d9ECEA] opacity-90 relative z-10">Let&apos;s set up your {userRole} profile.</p>
          
          <div className="flex justify-center gap-2 mt-6 relative z-10">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 w-12 rounded-full transition-all ${step >= i ? "bg-[#d9ECEA]" : "bg-white/20"}`} />
            ))}
          </div>
        </div>

        <div className="p-8 sm:p-12">
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Company Fundamentals</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Company Name</label>
                    <input autoFocus required type="text" value={formData.companyName} onChange={e => setFormData(f => ({...f, companyName: e.target.value}))} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]" placeholder="Acme Corp Pvt Ltd" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Billing Address</label>
                    <textarea required rows={3} value={formData.billingAddress} onChange={e => setFormData(f => ({...f, billingAddress: e.target.value}))} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]" placeholder="123 Business Park, Mumbai, MH" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Tax & Compliance Identities</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">GSTIN (15 Digits)</label>
                    <input required type="text" maxLength={15} value={formData.gstNumber} onChange={e => setFormData(f => ({...f, gstNumber: e.target.value.toUpperCase()}))} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]" placeholder="27AAAAA0000A1Z5" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">PAN Number</label>
                    <input required type="text" maxLength={10} value={formData.panNumber} onChange={e => setFormData(f => ({...f, panNumber: e.target.value.toUpperCase()}))} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]" placeholder="ABCDE1234F" />
                  </div>
                  {userRole === "Seller" && (
                     <div>
                       <label className="text-sm font-semibold text-slate-700">Udyam Registration (Optional)</label>
                       <p className="text-xs text-slate-500 mb-1">Provides MSMED Act 43B(h) protection.</p>
                       <input type="text" value={formData.udhyamNumber} onChange={e => setFormData(f => ({...f, udhyamNumber: e.target.value.toUpperCase()}))} className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]" placeholder="UDYAM-MH-00-1234567" />
                     </div>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-200">
                  <span className="text-3xl">🎉</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">You&apos;re all set!</h2>
                <p className="text-slate-600 mb-8 max-w-sm mx-auto">Your identity has been captured. We will use this information to auto-populate invoices and manage compliance.</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left mb-6 text-sm">
                  <p><strong>Company:</strong> {formData.companyName}</p>
                  <p><strong>GSTIN:</strong> {formData.gstNumber}</p>
                  <p><strong>PAN:</strong> {formData.panNumber}</p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100">
              {step > 1 ? (
                <button type="button" onClick={handlePrev} className="px-6 py-2.5 rounded-full font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 transition">Back</button>
              ) : (
                <div /> // spacer
              )}
              
              <button type="submit" disabled={loading} className="px-8 py-2.5 rounded-full bg-[#1b5b6a] text-white font-bold hover:bg-[#12424d] transition disabled:opacity-70 shadow-md">
                {loading ? "Saving..." : (step === 3 ? "Complete Setup" : "Continue")}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
