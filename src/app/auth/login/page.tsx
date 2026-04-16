"use client";

import { useState } from "react";
import { Mail, Lock, AlertCircle, Loader2, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Fetch profile to determine redirect
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .single();

      if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/counselor");
      }
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center p-6 selection:bg-blue-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="flex justify-center mb-12">
          <Logo className="scale-110" />
        </div>

        <div className="bg-white rounded-[48px] shadow-[0_32px_128px_rgba(0,0,0,0.06)] border border-slate-50 p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-blue-400 to-indigo-500 no-print" />
          
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Staff Login</h2>
            <p className="text-slate-400 font-bold text-[10px] mt-2 uppercase tracking-[0.2em]">Authorized users only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-400 px-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={16} strokeWidth={3} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold border-transparent focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all outline-none uppercase tracking-widest placeholder:text-slate-200 shadow-inner"
                  placeholder="ID@ECOFAIR.NET"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-400 px-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={16} strokeWidth={3} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl text-xs font-bold border-transparent focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all outline-none tracking-widest placeholder:text-slate-200 shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
              >
                <AlertCircle size={14} strokeWidth={3} />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center disabled:opacity-70 active:scale-95"
            >
              {loading ? (
                <Loader2 className="animate-spin mr-3" size={18} strokeWidth={3} />
              ) : (
                <><LogIn size={18} className="mr-3" strokeWidth={3} /> Login Now</>
              )}
            </button>
          </form>
          
          <div className="mt-12 pt-8 border-t border-slate-50 text-center">
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
               Secure login enabled • Magni Digitech V3.0<br/>
               Need help? Contact support.
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

