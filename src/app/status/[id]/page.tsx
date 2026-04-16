"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Clock, User, ArrowRight, ShieldCheck, Timer, Mic } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSecurityCheck, cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

export default function StudentStatusPage() {
  const params = useParams();
  const rawId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function fetchStatus() {
      if (!rawId) return;

      // Format: GENERATED-ID-SECURITY
      const parts = rawId.split("-");
      if (parts.length < 2) {
        setError("Invalid link format.");
        setLoading(false);
        return;
      }

      const securityProvided = parts.pop()?.toUpperCase();
      const generatedId = parts.join("-");
      const expectedSecurity = getSecurityCheck(generatedId);

      if (securityProvided !== expectedSecurity) {
        setError("Security check failed. You do not have permission to view this status.");
        setLoading(false);
        return;
      }

      // Fetch student
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("generated_id", generatedId)
        .single();

      if (studentError || !studentData) {
        setError("Student record not found.");
        setLoading(false);
        return;
      }

      // Fetch all country leads
      const { data: leadData } = await supabase
        .from("student_countries")
        .select("*")
        .eq("student_id", studentData.id);

      // Enhance leads with queue position and live counselor presence
      const enhancedLeads = await Promise.all((leadData || []).map(async (lead) => {
        // Count online counselors for this country
        const { count: onlineCount } = await supabase
          .from("profiles")
          .select("*", { count: 'exact', head: true })
          .eq("is_online", true)
          .contains("assigned_countries", [lead.country_name]);

        if (lead.status !== 'New') return { ...lead, queuePosition: 0, waitTime: 0, onlineCounselors: onlineCount || 0 };
        
        const { count } = await supabase
          .from("student_countries")
          .select("*", { count: 'exact', head: true })
          .eq("country_name", lead.country_name)
          .eq("status", "New")
          .lt("created_at", lead.created_at);
        
        const position = (count || 0) + 1;
        const activeStaff = onlineCount || 0;
        
        return {
          ...lead,
          queuePosition: position,
          onlineCounselors: activeStaff,
          waitTime: activeStaff > 0 ? Math.ceil((position * 10) / activeStaff) : position * 10 
        };
      }));

      setStudent(studentData);
      setLeads(enhancedLeads);
      setLoading(false);
    }

    fetchStatus();

    const channel = supabase
      .channel(`student_pulse_${Math.random()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_countries" }, () => fetchStatus())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () => fetchStatus())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rawId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 border-2 border-slate-100 border-t-primary rounded-full animate-spin" />
          <p className="text-slate-400 font-black text-[10px] animate-pulse tracking-widest uppercase">Getting your profile ready...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">Security Alert</h1>
          <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium tracking-tight">{error}</p>
          <button
            onClick={() => window.location.href = "/"}
            className="w-full px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const steps = ["Registered", "In Queue", "Counselling", "Completed"];

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <nav className="h-20 bg-white/80 backdrop-blur-2xl border-b border-slate-100 sticky top-0 z-50 flex items-center px-8 sm:px-12 justify-between">
        <Logo className="scale-90" />
        <div className="hidden md:flex items-center gap-4 py-2 px-5 bg-[#FBFBFD] border border-slate-100 rounded-2xl shadow-inner">
          <ShieldCheck size={14} className="text-emerald-500" strokeWidth={3} />
          <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Private Security Active</span>
        </div>
        <div className="md:hidden w-8" />
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-24">
        {/* Profile Card */}
        <section className="mb-24 px-4 sm:px-0">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-12 text-center md:text-left">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-3 px-3 py-1 bg-primary/5 text-primary rounded-full text-[9px] font-black tracking-[0.2em] uppercase mb-8 shadow-inner border border-primary/5"
              >
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                Live Status
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.9]"
              >
                Hi, <span className="text-primary">{student.name.split(" ")[0]}</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-slate-400 font-bold text-lg leading-snug max-w-lg uppercase tracking-tight opacity-80"
              >
                Check your turn and room assignments below.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Country Breakdown */}
        <section className="px-4 sm:px-0">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-[11px] font-black text-slate-400 tracking-[0.3em] uppercase">Your Waiting List</h3>
          </div>

          <div className="grid grid-cols-1 gap-12">
            {leads.length > 0 ? (
              leads.map((lead) => (
                <motion.div
                  key={lead.id}
                  layout
                  className="bg-white p-10 md:p-14 rounded-[56px] border border-slate-50 shadow-[0_32px_128px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_48px_160px_rgba(0,0,0,0.08)] group overflow-hidden relative"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 relative z-10">
                    <div className="flex items-center gap-8">
                      <div className="w-20 h-20 bg-[#FBFBFD] rounded-[32px] flex items-center justify-center text-slate-900 font-black text-3xl border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all duration-700 shadow-inner">
                        {lead.country_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">{lead.country_name}</h4>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.15em] shadow-sm",
                            lead.status === 'New' ? (lead.onlineCounselors > 0 ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-600 border border-amber-100") :
                              lead.status === 'Warm' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                lead.status === 'Hot' ? "bg-rose-50 text-rose-600 border border-rose-100" :
                                  "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          )}>
                            {lead.status === 'New' ? (lead.onlineCounselors > 0 ? `IN QUEUE` : "NOT AVAILABLE") :
                              lead.status === 'Warm' ? "MEETING NOW" :
                                lead.status === 'Hot' ? "PRIORITY TRACK" : "FINISHED"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {lead.status === 'New' && (
                      <div className="flex items-center gap-12 border-l-2 border-slate-50 pl-12 h-16">
                        <div className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Queue ID</p>
                          <p className="text-3xl font-black text-slate-900 tracking-tighter">#{lead.queuePosition}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">About...</p>
                          <div className={cn(
                            "text-3xl font-black flex items-center justify-center gap-2 tracking-tighter",
                            lead.onlineCounselors > 0 ? "text-primary" : "text-amber-500"
                          )}>
                            <Timer size={20} strokeWidth={3} className="text-slate-200" />
                            {lead.onlineCounselors > 0 ? `${lead.waitTime}m` : "---"}
                          </div>
                        </div>
                      </div>
                    )}

                    {lead.status !== 'New' && lead.status !== 'Cold' && (
                      <div className="px-8 py-4 bg-emerald-500 text-white rounded-[24px] flex items-center gap-4 shadow-2xl shadow-emerald-200 animate-bounce">
                        <User size={20} strokeWidth={3} />
                        <span className="text-xs font-black uppercase tracking-widest">Meeting in progress</span>
                      </div>
                    )}
                  </div>

                  {lead.status === 'New' && (
                    <div className="mt-12 pt-10 border-t-2 border-slate-50">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed flex items-center gap-3">
                         <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                         Proceed to the {lead.country_name} room when your ID is called.
                      </p>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="py-40 text-center bg-white rounded-[56px] border border-slate-50 shadow-inner">
                <Clock className="w-20 h-20 text-slate-100 mx-auto mb-8" />
                <p className="text-slate-900 font-black tracking-[0.2em] uppercase text-sm mb-2">Connecting to Server...</p>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto">Establishing secure connection for your profile.</p>
              </div>
            )}
          </div>
        </section>

        {/* Global Record Security */}
        <footer className="mt-40 pb-20 pt-16 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10 opacity-30 px-4 sm:px-0">
          <div className="flex items-center gap-4">
            <ShieldCheck size={20} className="text-slate-400" />
            <span className="text-[9px] font-black tracking-[0.4em] uppercase text-slate-600">Digital Entry Pass</span>
          </div>
          <div className="flex flex-wrap justify-center gap-10 text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Realtime Sync: Enabled</span>
            <span>Security Hash: {getSecurityCheck(rawId)}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
