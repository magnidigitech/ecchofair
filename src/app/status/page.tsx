"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldCheck, ArrowRight, QrCode, User, Phone, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSecurityCheck } from "@/lib/utils";

export default function StatusSearchPage() {
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("students")
      .select("generated_id, phone")
      .eq("generated_id", id.toUpperCase())
      .single();

    if (fetchError || !data) {
      setError("Student ID not found. Please check and try again.");
      setLoading(false);
      return;
    }

    // Security Check: Verify last 4 digits of phone
    const last4 = data.phone.slice(-4);
    if (phone !== last4) {
      setError("Security check failed. The last 4 digits do not match our records.");
      setLoading(false);
      return;
    }

    // Redirect to Secure Status Page
    const security = getSecurityCheck(data.generated_id);
    window.location.href = `/status/${data.generated_id}-${security}`;
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center p-6 selection:bg-blue-100">
      <div className="w-full max-w-lg">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center mb-12">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-2xl italic mb-6 shadow-xl shadow-primary/20"
          >
            E
          </motion.div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center">Eccho Passport</h1>
          <p className="text-slate-400 font-medium text-sm mt-2 uppercase tracking-widest">Live Status Portal</p>
        </div>

        {/* Search Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50"
        >
          <form onSubmit={handleSearch} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Your ID</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="EX: UK-E26-001"
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Security Check (Last 4 digits of phone)</label>
              <div className="relative group">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-rose-500 text-xs font-semibold px-2 bg-rose-50 py-3 rounded-xl border border-rose-100 text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={loading || !id || !phone}
              className="w-full bg-primary text-white font-bold py-5 rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <> Check Journey <ArrowRight size={20} /> </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer info */}
        <div className="mt-12 text-center flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 py-2 px-4 bg-white border border-slate-100 rounded-full shadow-sm">
             <QrCode size={16} className="text-slate-400" />
             <span className="text-[11px] font-bold text-slate-500 tracking-wider">SECURE QR MODE ACTIVE</span>
          </div>
          <p className="text-slate-300 text-[10px] font-bold tracking-[0.3em] uppercase max-w-[240px] leading-relaxed">
            Your data is protected by deterministic end-to-end hashing.
          </p>
        </div>
      </div>
    </div>
  );
}
