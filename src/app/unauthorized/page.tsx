"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center p-6 selection:bg-blue-100">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="flex justify-center mb-12">
          <Logo className="scale-110 grayscale opacity-30" />
        </div>

        <div className="bg-white rounded-[48px] shadow-[0_32px_128px_rgba(0,0,0,0.06)] border border-slate-50 p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500 no-print" />
          
          <div className="mx-auto w-20 h-20 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center mb-10 shadow-inner">
            <ShieldAlert size={40} strokeWidth={2.5} />
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">Security Firewall</h1>
          <p className="text-slate-400 font-bold text-[10px] mb-10 uppercase tracking-[0.2em] leading-relaxed">
            Access restricted to unauthorized nodes. Please contact System Ops if you believe your clearance is valid.
          </p>

          <div className="space-y-4">
            <Link 
              href="/"
              className="w-full bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center active:scale-95"
            >
              <ArrowLeft size={18} className="mr-3" strokeWidth={3} /> Return to Home
            </Link>
            
            <button 
              onClick={handleSignOut}
              className="w-full bg-white border-2 border-slate-100 text-slate-900 font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center active:scale-95"
            >
              <LogOut size={18} className="mr-3" strokeWidth={3} /> Re-Authenticate
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-50 text-center">
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
               Secure sync enabled • Magni Digitech V3.0<br/>
               Access Log: {new Date().toISOString().split('T')[1].split('.')[0]}
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
