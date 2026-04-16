"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Clock, User, ArrowRight, ShieldCheck, Timer, Mic } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSecurityCheck, cn } from "@/lib/utils";

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
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
          <p className="text-slate-400 font-bold text-[10px] animate-pulse tracking-widest uppercase">Verifying Identity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.href = "/"}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const steps = ["Registered", "In Queue", "Counselling", "Completed"];

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <nav className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 flex items-center px-6 md:px-12 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xs italic">E</div>
          <span className="font-semibold tracking-tight text-slate-900">Eccho Passport</span>
        </div>
        <div className="hidden md:flex items-center gap-4 py-1.5 px-3 bg-slate-50 border border-slate-100 rounded-full">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span className="text-[11px] font-bold text-slate-500 tracking-wider">SECURE STATUS CHECK</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-24">
        {/* Profile Card */}
        <section className="mb-24">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-12">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6"
              >
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                Live Status
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6"
              >
                Hi, {student.name.split(" ")[0]}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-slate-400 font-medium text-lg leading-relaxed max-w-lg"
              >
                Your personal gateway for the education fair is active. Monitor your desk assignments in real-time.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Country Breakdown */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-slate-400 tracking-widest uppercase">Desk Assignments</h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {leads.length > 0 ? (
              leads.map((lead) => (
                <motion.div
                  key={lead.id}
                  layout
                  className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50 group overflow-hidden relative"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 font-black text-2xl border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                        {lead.country_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tight">{lead.country_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
                            lead.status === 'New' ? (lead.onlineCounselors > 0 ? "bg-slate-100 text-slate-500" : "bg-orange-50 text-orange-600") :
                              lead.status === 'Warm' ? "bg-blue-50 text-blue-600" :
                                lead.status === 'Hot' ? "bg-rose-50 text-rose-600" :
                                  "bg-emerald-50 text-emerald-600"
                          )}>
                            {lead.status === 'New' ? (lead.onlineCounselors > 0 ? `In Queue (${lead.onlineCounselors} Active staff)` : "Desk on Break") :
                              lead.status === 'Warm' ? "Counselling" :
                                lead.status === 'Hot' ? "Priority" : "Completed"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {lead.status === 'New' && (
                      <div className="flex items-center gap-8 border-l border-slate-100 pl-8 h-12">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Queue</p>
                          <p className="text-xl font-black text-slate-900">#{lead.queuePosition}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Wait</p>
                          <p className={cn(
                            "text-xl font-black flex items-center gap-1.5",
                            lead.onlineCounselors > 0 ? "text-primary" : "text-orange-500"
                          )}>
                            <Timer size={18} className="text-slate-300" />
                            {lead.onlineCounselors > 0 ? `~${lead.waitTime}m` : "Standby"}
                          </p>
                        </div>
                      </div>
                    )}

                    {lead.status !== 'New' && lead.status !== 'Cold' && (
                      <div className="px-5 py-3 bg-emerald-50 rounded-2xl flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Counsellor is Ready</span>
                      </div>
                    )}
                  </div>

                  {lead.status === 'New' && (
                    <div className="mt-8 pt-8 border-t border-slate-50">
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        Please stay within the event space. You will be called to the {lead.country_name} Desk shortly. Have your documents ready.
                      </p>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="py-32 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                <Clock className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                <p className="text-slate-400 font-bold tracking-widest uppercase text-xs animate-pulse">Assigning Desks...</p>
                <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">Please check back in 1-2 minutes.</p>
              </div>
            )}
          </div>
        </section>

        {/* Global Record Security */}
        <footer className="mt-32 pt-16 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-slate-400" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-slate-500">Secured Node PASSPORT-E</span>
          </div>
          <div className="flex gap-8 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            <span>Sync: ACTIVE</span>
            <span>ID-HASH: {getSecurityCheck(rawId)}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
