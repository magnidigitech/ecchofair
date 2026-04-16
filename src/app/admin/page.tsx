"use client";

import { useState, useEffect, useMemo } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Student, StudentCountry } from "@/lib/mockDb";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("*, student_countries(*)")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Dashboard Fetch Error:", error);
      return;
    }
    
    if (data) setStudents(data as unknown as Student[]);
  };

  const fetchCounselors = async () => {
    const { data } = await supabase.from("profiles").select("*");
    if (data) setCounselors(data);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStudents(), fetchCounselors()]);
      setLoading(false);
    };
    init();

    const channel = supabase
      .channel(`admin_apple_pulse_${Math.random()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => fetchStudents())
      .on("postgres_changes", { event: "*", schema: "public", table: "student_countries" }, () => fetchStudents())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchCounselors())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const metrics = useMemo(() => {
    const total = students.length;
    const allProfiles = students.flatMap(s => (s as any).student_countries as StudentCountry[] || []);
    
    const staffEfficiency = allProfiles.reduce((acc: Record<string, number>, curr) => {
      if (curr.status === 'Cold' && (curr as any).handled_by) {
        const c = counselors.find(can => can.id === (curr as any).handled_by);
        const name = c?.email?.split('@')[0] || "Staff";
        acc[name] = (acc[name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    const hotCount = students.filter(s => {
      const profiles = (s as any).student_countries as StudentCountry[] || [];
      return profiles.some(p => p.status === "Hot" || p.is_highly_interested);
    }).length;

    const countryStats = allProfiles.reduce((acc: Record<string, number>, curr) => {
      acc[curr.country_name] = (acc[curr.country_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const hourlyData: Record<number, number> = {};
    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const h = new Date(now.getTime() - i * 3600000).getHours();
        hourlyData[h] = 0;
    }
    students.forEach(s => {
      const regHour = new Date(s.created_at).getHours();
      if (hourlyData[regHour] !== undefined) hourlyData[regHour]++;
    });

    const hourlyVelocity = Object.entries(hourlyData)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour);

    return { total, hotCount, countryStats, hourlyVelocity, staffEfficiency };
  }, [students, counselors]);

  const handleExport = () => {
    const exportData = students.flatMap(s => {
      const profiles = (s as any).student_countries || [];
      const base = {
        ID: s.generated_id,
        Name: s.name,
        Email: s.email,
        Phone: s.phone,
        Qualification: s.qualification,
        Current_College: s.college_name || "N/A",
        GPA_Score: s.grad_score || "N/A",
        Backlogs: s.backlogs || 0,
        Work_Experience: s.work_experience || "None",
        Course: s.course_interest,
        Intake: s.intake,
        Budget: s.budget,
        Visa_Refusal: s.visa_refusal ? "Yes" : "No",
        Has_Passport: s.has_passport ? "Yes" : "No",
        Registered_Date: new Date(s.created_at).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }),
        Registered_Time: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' })
      };

      if (profiles.length === 0) return [{ ...base, Country: "None", Status: "N/A", Counsellor: "Unassigned", Notes: "" }];
      
      return profiles.map((p: any) => {
        const c = counselors.find(can => can.id === p.handled_by);
        return { 
          ...base, 
          Country: p.country_name, 
          Status: p.status,
          Counsellor: c?.email?.split('@')[0] || "Unassigned",
          Notes: p.notes || "",
          Completed_At: p.completed_at ? new Date(p.completed_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' }) : "N/A"
        };
      });
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Eccho_Full_Report");
    XLSX.writeFile(wb, `Eccho_Fair_Master_Report.xlsx`);
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-slate-900 font-sans">
      <nav className="h-16 flex items-center px-12 justify-between sticky top-0 bg-white/70 backdrop-blur-xl border-b border-slate-100/50 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-[10px] italic">E</div>
          <span className="text-sm font-semibold tracking-tight">Admin Overview</span>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-medium hover:bg-slate-800 transition-all shadow-sm">
          <Download size={14} /> Export Report
        </button>
      </nav>

      <main className="max-w-[1400px] mx-auto p-12 space-y-20">
        {/* Simple Stat Row */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <SimpleStat label="Total Registered" value={metrics.total} />
            <SimpleStat label="Hot Interest" value={metrics.hotCount} />
            <SimpleStat label="Processing" value={students.filter(s => s.student_countries && s.student_countries.length > 0).length} />
            <SimpleStat label="Completed" value={students.filter(s => s.student_countries && s.student_countries.every((p: any) => p.status === 'Cold')).length} />
        </section>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          {/* Destination Chart */}
          <section>
            <div className="mb-10">
              <h2 className="text-xl font-semibold mb-1">Destination Demand</h2>
              <p className="text-sm text-slate-400">Student interest by country</p>
            </div>
            <div className="space-y-6">
              {Object.entries(metrics.countryStats).sort((a,b) => b[1]-a[1]).map(([country, count]) => {
                const percentage = Math.round((count / (metrics.total || 1)) * 100);
                return (
                  <div key={country} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 font-medium">{country}</span>
                      <span className="text-slate-900">{count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="h-full bg-slate-900 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Activity Chart */}
          <section>
            <div className="mb-10">
              <h2 className="text-xl font-semibold mb-1">Traffic Velocity</h2>
              <p className="text-sm text-slate-400">Hourly arrival rate</p>
            </div>
            <div className="h-40 flex items-end justify-between gap-4 mb-20">
              {metrics.hourlyVelocity.map((h, i) => {
                const maxVal = Math.max(...metrics.hourlyVelocity.map(v => v.count), 1);
                const height = (h.count / maxVal) * 100;
                return (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-4">
                    <div className="w-full relative flex-1 flex flex-col justify-end">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        className="w-full bg-slate-200 group-hover:bg-slate-300 rounded-sm transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{h.hour}:00</span>
                  </div>
                )
              })}
            </div>

            {/* Added Staff Efficiency Under Traffic */}
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-1">Staff Efficiency</h2>
                <p className="text-sm text-slate-400">Sessions completed per counsellor</p>
              </div>
              <div className="space-y-4">
                {Object.entries(metrics.staffEfficiency).length > 0 ? (
                  Object.entries(metrics.staffEfficiency).sort((a,b) => b[1]-a[1]).map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-[10px] uppercase shadow-inner">{name.charAt(0)}</div>
                        <span className="text-sm font-semibold text-slate-900 capitalize">{name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Done</span>
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black border border-emerald-100">{count}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                    <p className="text-xs text-slate-400 font-medium italic">No sessions completed yet</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Clean Data Table */}
        <section className="pt-20">
          <div className="mb-10 flex justify-between items-end">
             <div>
               <h2 className="text-2xl font-semibold mb-1">Student Ledger</h2>
               <p className="text-sm text-slate-400">Complete record of every registration</p>
             </div>
             <div className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">Live Sync Active</div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-6 pr-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                  <th className="py-6 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Passport ID</th>
                  <th className="py-6 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Destinations</th>
                  <th className="py-6 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="py-6 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Counsellor</th>
                  <th className="py-6 pl-8 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/30 transition-all duration-300 group">
                    <td className="py-8 pr-8">
                       <p className="text-sm font-bold text-slate-900">{s.name}</p>
                       <p className="text-[10px] text-slate-400 mt-0.5 tracking-tight">{s.email}</p>
                    </td>
                    <td className="py-8 px-8">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold text-primary">{s.generated_id}</span>
                    </td>
                    <td className="py-8 px-8">
                      <div className="flex flex-wrap gap-1">
                        {(s.student_countries || []).map((p: any) => (
                           <span key={p.id} className="text-[9px] font-bold border border-slate-100 px-1.5 py-0.5 rounded-full bg-white text-slate-400 uppercase tracking-wider">{p.country_name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-8 px-8">
                       {(() => {
                         const profiles = s.student_countries || [];
                         const allDone = profiles.length > 0 && profiles.every((p: any) => p.status === 'Cold');
                         return (
                           <div className="flex items-center gap-1.5">
                             <div className={`w-1.5 h-1.5 rounded-full ${allDone ? 'bg-emerald-500' : 'bg-orange-400 animate-pulse'}`} />
                             <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{allDone ? 'Completed' : 'Active'}</span>
                           </div>
                         )
                       })()}
                    </td>
                    <td className="py-8 px-8">
                       <div className="flex flex-col gap-1">
                          {(s.student_countries || []).map((p: any) => {
                             const c = counselors.find(can => can.id === p.handled_by);
                             return c ? (
                               <div key={p.id} className="flex items-center gap-2">
                                 <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[8px] font-bold uppercase">{c.email?.charAt(0)}</div>
                                 <span className="text-xs font-medium text-slate-700">{c.email?.split('@')[0]}</span>
                               </div>
                             ) : null;
                          })}
                          {(s.student_countries || []).every((p: any) => !p.handled_by) && <span className="text-xs text-slate-300 italic">Unassigned</span>}
                       </div>
                    </td>
                    <td className="py-8 pl-8 text-right text-[10px] text-slate-400 font-bold uppercase tracking-tight whitespace-nowrap">
                      {s.created_at ? new Date(s.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' }).replace(',', '') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function SimpleStat({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-4xl font-semibold text-slate-900 tracking-tight">{value}</h3>
    </div>
  );
}
