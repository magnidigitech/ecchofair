"use client";

import { useState, useEffect, useMemo } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Student, StudentCountry } from "@/lib/mockDb";
import { cn } from "@/lib/utils";

import { useAdmin } from "@/context/AdminContext";
import { Mail, Phone, GraduationCap, MapPin, Clock, User, ChevronRight } from "lucide-react";

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

  const { setOnDownload } = useAdmin();
  useEffect(() => {
    setOnDownload(() => handleExport);
  }, [students, counselors]);

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
        <div className="w-10 h-10 border-2 border-slate-100 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-slate-900 font-sans">

      <main className="max-w-[1400px] mx-auto p-8 sm:p-12 space-y-24">
        {/* Simple Stat Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-12">
            <SimpleStat label="Total Registered" value={metrics.total} />
            <SimpleStat label="Highly Interested" value={metrics.hotCount} />
            <SimpleStat label="Ongoing Meetings" value={students.filter(s => s.student_countries && s.student_countries.length > 0).length} />
            <SimpleStat label="Completed Cycle" value={students.filter(s => s.student_countries && s.student_countries.every((p: any) => p.status === 'Cold')).length} />
        </section>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          {/* Destination Chart */}
          <section>
            <div className="mb-12">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Top Countries</h2>
              <div className="h-[1px] w-8 bg-slate-200" />
            </div>
            <div className="space-y-8">
              {Object.entries(metrics.countryStats).sort((a,b) => b[1]-a[1]).map(([country, count]) => {
                const percentage = Math.round((count / (metrics.total || 1)) * 100);
                return (
                  <div key={country} className="space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="text-slate-500 font-bold">{country}</span>
                      <span className="text-slate-900">{count} Candidates</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
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
            <div className="mb-12">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Traffic Per Hour</h2>
              <div className="h-[1px] w-8 bg-slate-200" />
            </div>
            <div className="h-44 flex items-end justify-between gap-6 mb-24">
              {metrics.hourlyVelocity.map((h, i) => {
                const maxVal = Math.max(...metrics.hourlyVelocity.map(v => v.count), 1);
                const height = (h.count / maxVal) * 100;
                return (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-6 group">
                    <div className="w-full relative flex-1 flex flex-col justify-end">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        className="w-full bg-slate-100 group-hover:bg-slate-900 rounded-sm transition-all duration-500 shadow-sm"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{h.hour}:00</span>
                  </div>
                )
              })}
            </div>

            {/* Added Staff Efficiency Under Traffic */}
            <div>
              <div className="mb-10">
                <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Staff Performance</h2>
                <div className="h-[1px] w-8 bg-slate-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(metrics.staffEfficiency).length > 0 ? (
                  Object.entries(metrics.staffEfficiency).sort((a,b) => b[1]-a[1]).map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between p-5 bg-white rounded-[24px] border border-slate-50 shadow-sm shadow-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#FBFBFD] text-slate-900 rounded-full flex items-center justify-center font-black text-xs uppercase shadow-inner border border-slate-100">{name.charAt(0)}</div>
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">{name}</span>
                      </div>
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black border border-emerald-100">+{count}</div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-12 text-center bg-[#FBFBFD] border border-dashed border-slate-200 rounded-[32px]">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No production data available</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Clean Data Table */}
        <section className="pt-24">
          <div className="mb-16 flex justify-between items-end border-b border-slate-100 pb-10">
             <div>
                <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-4">Master Student List</h2>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">All Student Details</h3>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 tracking-[0.2em] uppercase">Ready for Sync</span>
             </div>
          </div>
          
          <div className="hidden lg:block overflow-x-auto -mx-12 px-12 pb-12">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-8 pr-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Candidate</th>
                  <th className="py-8 px-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Passport ID</th>
                  <th className="py-8 px-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Engagement</th>
                  <th className="py-8 px-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="py-8 px-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Counsellors</th>
                  <th className="py-8 pl-12 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-all duration-500 group">
                    <td className="py-10 pr-12">
                       <p className="text-sm font-black text-slate-900 tracking-tight">{s.name}</p>
                       <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-tight uppercase">{s.email}</p>
                    </td>
                    <td className="py-10 px-12">
                      <span className="font-black text-[11px] bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-lg shadow-slate-200 tracking-wider transition-all group-hover:-translate-y-0.5 inline-block">{s.generated_id}</span>
                    </td>
                    <td className="py-10 px-12">
                      <div className="flex flex-wrap gap-1.5">
                        {(s.student_countries || []).map((p: any) => (
                           <span key={p.id} className="text-[10px] font-bold border border-slate-100 px-2.5 py-1 rounded-full bg-white text-slate-500 uppercase tracking-tighter shadow-sm">{p.country_name}</span>
                        ))}
                        {(s.student_countries || []).length === 0 && <span className="text-[10px] font-bold text-slate-300 italic uppercase">Pending Entry</span>}
                      </div>
                    </td>
                    <td className="py-10 px-12">
                       {(() => {
                         const profiles = s.student_countries || [];
                         const allDone = profiles.length > 0 && profiles.every((p: any) => p.status === 'Cold');
                         return (
                           <div className="flex items-center gap-3">
                             <div className={`w-2 h-2 rounded-full ${allDone ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-orange-400 animate-pulse'}`} />
                             <span className={`text-[10px] font-black uppercase tracking-widest ${allDone ? 'text-emerald-600' : 'text-orange-500'}`}>{allDone ? 'Finalized' : 'Processing'}</span>
                           </div>
                         )
                       })()}
                    </td>
                    <td className="py-10 px-12">
                       <div className="flex flex-col gap-2">
                          {(s.student_countries || []).map((p: any) => {
                             const c = counselors.find(can => can.id === p.handled_by);
                             return c ? (
                               <div key={p.id} className="flex items-center gap-2 group/avatar">
                                 <div className="w-6 h-6 bg-slate-100 text-slate-900 rounded-lg flex items-center justify-center text-[9px] font-black underline decoration-primary/40 shadow-sm">{c.email?.charAt(0).toUpperCase()}</div>
                                 <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{c.email?.split('@')[0]}</span>
                               </div>
                             ) : null;
                          })}
                          {(s.student_countries || []).every((p: any) => !p.handled_by) && <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">Unassigned</span>}
                       </div>
                    </td>
                    <td className="py-10 pl-12 text-right text-[10px] text-slate-400 font-black uppercase tracking-tighter whitespace-nowrap">
                      {s.created_at ? new Date(s.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }).replace(',', '') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-6">
            {students.map(s => (
              <StudentCard key={s.id} student={s} counselors={counselors} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function SimpleStat({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="space-y-4 p-8 bg-white border border-slate-50 rounded-[32px] shadow-sm shadow-slate-100/50 hover:shadow-2xl hover:shadow-slate-200/40 transition-all duration-500 group">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">{label}</p>
      <h3 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter group-hover:scale-105 transition-transform origin-left">{value}</h3>
    </div>
  );
}

function StudentCard({ student, counselors }: { student: Student, counselors: any[] }) {
  const profiles = student.student_countries || [];
  const allDone = profiles.length > 0 && profiles.every((p: any) => p.status === 'Cold');

  return (
    <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-slate-50 shadow-sm shadow-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden relative">
      {/* Top Header Row */}
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-base font-black text-slate-900 tracking-tight truncate mr-4">{student.name}</h4>
        <span className="shrink-0 text-[10px] bg-slate-900 text-white px-3 py-1.5 rounded-xl font-black tracking-widest shadow-lg shadow-slate-200">
          {student.generated_id}
        </span>
      </div>

      {/* Secondary Info Row */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Mail size={10} className="text-slate-300" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[120px] sm:max-w-none">{student.email}</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-50/50 px-2.5 py-1.25 rounded-lg border border-slate-100/50">
          <div className={`w-1.5 h-1.5 rounded-full ${allDone ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-orange-400 animate-pulse shadow-[0_0_8px_rgba(251,146,60,0.3)]'}`} />
          <span className={`text-[8px] font-black uppercase tracking-widest ${allDone ? 'text-emerald-600' : 'text-orange-500'}`}>
            {allDone ? 'Finalized' : 'Processing'}
          </span>
        </div>
      </div>

      <div className="space-y-4 pt-5 border-t border-slate-50">
        {/* Destination Tags */}
        <div className="flex flex-wrap gap-1.5">
          {profiles.map(p => (
            <span key={p.id} className="bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-tight">
              <MapPin size={9} className="text-primary" /> {p.country_name}
            </span>
          ))}
          {profiles.length === 0 && <span className="bg-orange-50/50 text-orange-400 px-3 py-1.5 rounded-xl border border-orange-100/50 text-[9px] font-bold lowercase italic">Pending Entry</span>}
        </div>

        {/* Footer Info */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-inner">
              <Clock size={12} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em]">Logged</span>
              <span className="text-[10px] font-black text-slate-900 tracking-tight">
                {student.created_at ? new Date(student.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }) : 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex -space-x-1.5">
              {profiles.filter(p => p.handled_by).length > 0 ? (
                profiles.filter(p => p.handled_by).map(p => {
                  const c = counselors.find(can => can.id === p.handled_by);
                  return (
                    <div key={p.id} className="w-7 h-7 bg-white border-2 border-slate-50 rounded-lg flex items-center justify-center text-[9px] font-black shadow-sm text-slate-900" title={c?.email}>
                      {c?.email?.charAt(0).toUpperCase()}
                    </div>
                  );
                })
              ) : (
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest bg-slate-50/50 px-2 py-1 rounded-md">Unassigned</span>
              )}
            </div>
            <ChevronRight size={14} className="text-slate-200 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}

