"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Phone, Mail, MapPin, GraduationCap,
  Clock, Save, Globe, Loader2, Printer,
  Edit3, X, Check, User, ChevronRight, Mic,
  QrCode, ArrowRight, ShieldCheck
} from "lucide-react";
import { cn, getSecurityCheck, generateWhatsAppLink } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Student, StudentCountry, Status } from "@/lib/mockDb";

import { Logo } from "@/components/Logo";
import { triggerStatusWebhook, incrementWhatsAppShare } from "../actions";

export default function CounselorDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"queue" | "completed">("queue");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ is_online: boolean; id: string; role: string; assigned_countries: string[]; email: string } | null>(null);
  const [isPresenceLoading, setIsPresenceLoading] = useState(false);
  const supabase = createClient();

  const togglePresence = async () => {
    if (!profile) return;
    setIsPresenceLoading(true);
    const newStatus = !profile.is_online;
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .update({ is_online: newStatus, last_seen: new Date().toISOString() })
      .eq("id", profile.id)
      .select()
      .single();

    if (updatedProfile) setProfile(updatedProfile);
    setIsPresenceLoading(false);
  };

  const fetchQueue = async (assigned_countries: string[], role: string) => {
    let query = supabase
      .from("student_countries")
      .select("*, students(*)")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (role !== "admin" && assigned_countries?.length > 0) {
      query = query.in("country_name", assigned_countries);
    }

    const { data } = await query;
    if (data) setStudents(data as any);
    setLoading(false);
  };

  useEffect(() => {
    let channel: any;
    let heartbeat: any;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(profileData);
      fetchQueue(profileData.assigned_countries || [], profileData.role);

      // Heartbeat system to ensure "Online" status is fresh
      heartbeat = setInterval(async () => {
        if (profileData && profileData.is_online) {
          await supabase
            .from("profiles")
            .update({ last_seen: new Date().toISOString() })
            .eq("id", user.id);
        }
      }, 60000); // Pulse every 60s

      channel = supabase
        .channel(`counselor_realtime_${Math.random()}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "student_countries" }, () => fetchQueue(profileData.assigned_countries || [], profileData.role))
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "students" }, () => fetchQueue(profileData.assigned_countries || [], profileData.role))
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "students" }, () => fetchQueue(profileData.assigned_countries || [], profileData.role))
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (heartbeat) clearInterval(heartbeat);
    };
  }, []);

  const updateCountryProfile = async (countryId: string, updates: Partial<StudentCountry>) => {
    const { data: { user } } = await supabase.auth.getUser();
    const finalUpdates = {
      ...updates,
      handled_by: user?.id,
      ...(updates.status === 'Cold' ? { completed_at: new Date().toISOString() } : {})
    };

    setStudents((prev: any[]) => prev.map(item => item.id === countryId ? { ...item, ...finalUpdates } : item));
    await supabase.from("student_countries").update(finalUpdates).eq("id", countryId);
  };

  const updateStudentDemographics = async (studentId: string, updates: Partial<Student>) => {
    setStudents((prev: any[]) => prev.map(item => item.student_id === studentId ? { ...item, students: { ...item.students, ...updates } } : item));
    await supabase.from("students").update(updates).eq("id", studentId);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(item => {
      const s = (item as any).students;
      if (!s) return false;

      // Filter by Tab
      const isCompleted = item.status === "Cold";
      if (activeTab === "queue" && isCompleted) return false;
      if (activeTab === "completed" && !isCompleted) return false;
      // Filter by Search
      const searchLower = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(searchLower) ||
        s.generated_id.toLowerCase().includes(searchLower) ||
        s.phone.includes(searchQuery) ||
        item.country_name.toLowerCase().includes(searchLower)
      );
    });
  }, [students, searchQuery, activeTab]);

  const selectedLead = useMemo(() => students.find(item => item.id === selectedProfileId), [students, selectedProfileId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-2 border-slate-100 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#FBFBFD] text-slate-900 font-sans">
      {/* Sidebar List */}
      <div className="w-full md:w-96 shrink-0 flex flex-col h-full bg-white border-r border-slate-100/50 shadow-2xl shadow-slate-200/20 z-10 no-print">
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between p-5 bg-[#FBFBFD] rounded-[24px] border border-slate-100 shadow-inner">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">My Status</p>
              <p className={cn("text-xs font-black uppercase tracking-tight transition-colors", profile?.is_online ? "text-emerald-500" : "text-slate-400")}>
                {profile?.is_online ? "I am Online" : "I am Offline"}
              </p>
            </div>
            <button
              onClick={togglePresence}
              disabled={isPresenceLoading}
              className={cn(
                "group relative px-5 py-2.5 rounded-2xl text-[10px] font-black transition-all shadow-xl active:scale-95",
                profile?.is_online
                  ? "bg-slate-900 text-white shadow-slate-200"
                  : "bg-white text-slate-400 border border-slate-100 shadow-slate-100"
              )}
            >
              {isPresenceLoading ? "SAVING..." : (profile?.is_online ? "GO OFFLINE" : "GO ONLINE")}
            </button>
          </div>

          <div className="relative group px-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={14} strokeWidth={3} />
            <input
              type="text"
              placeholder="Filter by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-4 bg-slate-50 rounded-2xl text-xs font-bold border-transparent focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all outline-none uppercase tracking-widest placeholder:text-slate-300 shadow-inner"
            />
          </div>

          <div className="flex p-1.5 bg-slate-100 rounded-[20px] mb-2">
            <button
              onClick={() => setActiveTab("queue")}
              className={cn(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all",
                activeTab === "queue" ? "bg-white text-slate-900 shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Queue ({students.filter(s => s.status !== 'Cold').length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={cn(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all",
                activeTab === "completed" ? "bg-white text-slate-900 shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Completed ({students.filter(s => s.status === 'Cold').length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4 custom-scrollbar">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-300">
              <User size={40} className="mx-auto mb-6 opacity-10" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No candidates found</p>
            </div>
          ) : (
            filteredStudents.map((item: any) => (
              <div
                key={item.id}
                onClick={() => setSelectedProfileId(item.id)}
                className={cn(
                  "p-7 cursor-pointer rounded-[32px] transition-all flex items-center justify-between group relative overflow-hidden",
                  selectedProfileId === item.id
                    ? "bg-white text-slate-900 shadow-[0_20px_50px_-12px_rgba(22,163,74,0.12)] border border-emerald-50 translate-x-1"
                    : "bg-white border border-slate-50 hover:border-slate-100 hover:bg-slate-50/50"
                )}
              >
                {/* Active Indicator Accent */}
                <AnimatePresence>
                  {selectedProfileId === item.id && (
                    <motion.div
                      layoutId="active-bar"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "100%", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-emerald-400 z-20"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                <div className="min-w-0 flex-1 relative z-10">
                  <div className="flex items-center gap-3 mb-2.5">
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded shadow-sm tracking-tighter transition-colors",
                      selectedProfileId === item.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                    )}>{item.students?.generated_id}</span>
                    <span className={cn("text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-lg border transition-all",
                      selectedProfileId === item.id ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-slate-100 text-slate-400"
                    )}>
                      {item.country_name}
                    </span>
                  </div>
                  <h3 className={cn(
                    "font-black text-[13px] tracking-tight truncate transition-colors",
                    selectedProfileId === item.id ? "text-slate-900" : "text-slate-600"
                  )}>{item.students?.name}</h3>
                  <div className="flex items-center gap-2 mt-2.5 opacity-40">
                    <Clock size={10} strokeWidth={3} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : 'N/A'}
                    </span>
                  </div>
                </div>
                {selectedProfileId === item.id && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-y-0 right-0 w-1.5 bg-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile Drawer (Framer Motion) */}
      <AnimatePresence>
        {selectedProfileId && (
          <div className="md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProfileId(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-[110] max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto my-4 shrink-0" />
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-12">
                {selectedLead && (
                  <StudentDetailWorkspace
                    lead={selectedLead}
                    onUpdateStatus={updateCountryProfile}
                    onUpdateStudent={updateStudentDemographics}
                    isMobile={true}
                    hidePrint={true}
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Workspace (Desktop Only) */}
      <div className="hidden md:flex flex-1 bg-[#FBFBFD] h-full overflow-y-auto custom-scrollbar print:bg-white print:overflow-visible relative">
        {selectedLead ? (
          <StudentDetailWorkspace
            lead={selectedLead}
            onUpdateStatus={updateCountryProfile}
            onUpdateStudent={updateStudentDemographics}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 flex items-center justify-center mb-10 border border-slate-50 animate-pulse">
                <User size={40} className="text-slate-100" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Ready to Help</h1>
              <p className="text-slate-400 max-w-sm text-sm font-black uppercase tracking-[0.2em] leading-relaxed">
                Select a student from the list on the left to start your meeting.
              </p>
            </motion.div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
      `}</style>
    </div>
  );
}

function StudentDetailWorkspace({
  lead,
  onUpdateStatus,
  onUpdateStudent,
  isMobile = false,
  hidePrint = false
}: {
  lead: StudentCountry & { students: Student },
  onUpdateStatus: (id: string, updates: Partial<StudentCountry>) => Promise<void>,
  onUpdateStudent: (id: string, updates: Partial<Student>) => Promise<void>,
  isMobile?: boolean,
  hidePrint?: boolean
}) {
  const student = lead.students;
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [localNotes, setLocalNotes] = useState(lead.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [editForm, setEditForm] = useState({
    name: student.name,
    email: student.email,
    phone: student.phone,
    qualification: student.qualification,
    ielts_gre: student.ielts_gre,
    course_interest: student.course_interest,
    college_name: student.college_name || "",
    grad_score: student.grad_score || "",
    backlogs: student.backlogs || 0,
    work_experience: student.work_experience || "",
    visa_refusal: !!student.visa_refusal,
    has_passport: !!student.has_passport,
    intake: student.intake,
    budget: student.budget
  });

  useEffect(() => {
    setLocalNotes(lead.notes || "");
    setEditForm({
      name: student.name, email: student.email, phone: student.phone,
      qualification: student.qualification, ielts_gre: student.ielts_gre,
      course_interest: student.course_interest, intake: student.intake, budget: student.budget,
      college_name: student.college_name || "", grad_score: student.grad_score || "",
      backlogs: student.backlogs || 0, work_experience: student.work_experience || "",
      visa_refusal: !!student.visa_refusal, has_passport: !!student.has_passport
    });
  }, [lead.id, student]);

  const handleSaveAll = async () => {
    setIsSaving(true);
    const finalData = {
      ...editForm,
      backlogs: parseInt(String(editForm.backlogs) || "0")
    };
    await onUpdateStudent(student.id, finalData as any);
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleCompleteCounselling = async () => {
    setIsSaving(true);
    const { data: { user } } = await createClient().auth.getUser();
    if (user) {
      await onUpdateStatus(lead.id, {
        status: 'Cold',
        handled_by: user.id,
        completed_at: new Date().toISOString()
      });

      // Notify Zapier that the meeting is completed
      await triggerStatusWebhook(lead.id, "meeting_completed");
    }
    setIsSaving(false);
  };

  // Secure Link Generation
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://fair.ecchouk.co.uk").replace(/\/$/, "");
  const secureHash = getSecurityCheck(student.generated_id);
  const secureUrl = `${baseUrl}/status/${student.generated_id}-${secureHash}`;

  // Voice-to-Text Logic
  const toggleSpeechRecognition = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      if (transcript) {
        setLocalNotes((prev: string) => {
          const separator = prev.length > 0 ? (prev.endsWith('.') || prev.endsWith('\n') ? ' ' : '. ') : '';
          return prev + separator + transcript.trim();
        });
      }
    };

    recognition.start();
  };

  const statusOptions: Status[] = ['New', 'Warm', 'Hot', 'Cold'];

  return (
    <div className={cn("max-w-5xl mx-auto py-8 sm:py-10 pb-32 print-area print:p-0", isMobile ? "px-0" : "px-8")}>
      {/* QR Passport Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 no-print">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-12 rounded-[48px] shadow-[0_32px_128px_rgba(0,0,0,0.1)] max-w-sm w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-blue-400 to-indigo-500" />
              <button onClick={() => setShowQR(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors"><X size={24} strokeWidth={3} /></button>

              <div className="mb-12">
                <div className="w-20 h-20 bg-primary/5 rounded-[28px] flex items-center justify-center mx-auto mb-8 text-primary shadow-inner">
                  <QrCode size={40} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Student Link</h3>
                <p className="text-slate-400 font-bold text-[10px] mt-3 uppercase tracking-[0.2em]">Live Tracking Link</p>
              </div>

              <div className="bg-[#FBFBFD] p-10 rounded-[40px] border border-slate-50 mb-10 inline-block shadow-inner group">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(secureUrl)}`}
                  alt="Student Link QR"
                  className="w-48 h-48 mix-blend-multiply transition-transform group-hover:scale-105"
                />
              </div>

              <div className="space-y-6">
                <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Private Security Key</p>
                <div className="py-4 px-6 bg-slate-900 rounded-2xl font-black text-xs text-white tracking-widest shadow-2xl shadow-slate-200">
                  {secureHash}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(secureUrl);
                    alert("Secure Link Copied!");
                  }}
                  className="w-full py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                  Copy Digital Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col space-y-8 mb-12 no-print">
        {/* Row 1: Metadata */}
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">{lead.country_name}</span>
          <div className="h-1 w-1 rounded-full bg-slate-200" />
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">ID: {student.generated_id}</span>
        </div>

        {/* Row 2: Large Single-line Name */}
        <div className="w-full">
          {isEditing ? (
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              autoFocus
              className="text-xl sm:text-3xl font-black tracking-tighter w-full bg-white px-4 py-2 sm:px-5 sm:py-3 rounded-2xl border border-slate-100 outline-none shadow-sm"
            />
          ) : (
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none md:whitespace-nowrap">{student.name}</h2>
          )}
        </div>

        {/* Row 3: Contact & Actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 pt-2">
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <div className="flex items-center gap-3 min-w-0 group">
              <Phone size={12} className="text-slate-300 group-hover:text-primary transition-colors" />
              {isEditing ? <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="bg-white rounded-xl px-3 py-1 border border-slate-100 text-[10px] sm:text-xs font-bold w-32 sm:w-40" /> : <span className="text-xs font-bold text-slate-400 tracking-tight">{student.phone}</span>}
            </div>
            <div className="flex items-center gap-3 min-w-0 group">
              <Mail size={12} className="text-slate-300 group-hover:text-primary transition-colors" />
              {isEditing ? <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="bg-white rounded-xl px-3 py-1 border border-slate-100 text-[10px] sm:text-xs font-bold w-44 sm:w-56" /> : <span className="text-xs font-bold text-slate-400 tracking-tight">{student.email}</span>}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto shrink-0">
            <div className="flex items-center bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm">
              <button
                onClick={() => setShowQR(true)}
                className="p-3 text-slate-400 hover:text-primary rounded-xl transition-all hover:bg-primary/5 group"
                title="Generate Student Pass"
              >
                <QrCode size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
              </button>
              <div className="w-[1px] h-4 bg-slate-100 mx-1" />
              <button onClick={() => window.print()} className="p-3 text-slate-400 hover:text-slate-900 rounded-xl transition-colors">
                <Printer size={18} strokeWidth={2.5} />
              </button>
            </div>

            <a
              onClick={async () => {
                await incrementWhatsAppShare(student.id);
                router.refresh();
              }}
              href={generateWhatsAppLink({
                name: student.name,
                phone: student.phone,
                course_interest: student.course_interest,
                preferred_countries: student.preferred_countries,
                intake: student.intake,
                generated_id: student.generated_id,
                passport_url: secureUrl
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-4 sm:py-3.5 bg-white border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm hover:shadow-emerald-100/20 relative group"
            >
              <Phone size={14} strokeWidth={3} className="group-hover:rotate-12 transition-transform" />
              WhatsApp Share
              {(student.whatsapp_share_count || 0) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[7px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  {student.whatsapp_share_count}
                </span>
              )}
            </a>

            {lead.status !== 'Cold' && (
              <button
                onClick={handleCompleteCounselling}
                disabled={isSaving}
                className="w-full sm:w-auto px-8 py-4 sm:py-3.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-600 hover:shadow-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-95 shrink-0"
              >
                <Check size={14} strokeWidth={3} /> Finish Meeting
              </button>
            )}

            {isEditing ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => setIsEditing(false)} className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Cancel</button>
                <button onClick={handleSaveAll} disabled={isSaving} className="sm:px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shrink-0">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={14} />} Save Record
                </button>
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)} className="w-full sm:w-auto px-6 py-4 sm:py-3.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shrink-0 active:scale-95">
                <Edit3 size={14} /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid (Screen Only) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 mb-16 flex-1 no-print">
        {/* Status Selection */}
        <div className="md:col-span-3 space-y-6">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] px-2">Lifecycle</p>
          <div className="flex flex-col gap-2">
            {statusOptions.map(s => (
              <button
                key={s}
                onClick={() => onUpdateStatus(lead.id, { status: s })}
                className={cn(
                  "flex items-center justify-between px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left",
                  lead.status === s
                    ? "bg-slate-100 text-slate-900 shadow-inner"
                    : "bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                )}
              >
                {s === 'Cold' ? 'Completed' : s}
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  lead.status === s ? "bg-primary scale-125 shadow-[0_0_10px_rgba(22,163,74,0.5)]" : "bg-slate-200"
                )} />
              </button>
            ))}
          </div>
        </div>

        {/* Academic Details */}
        <div className="md:col-span-9 bg-white p-10 rounded-[40px] border border-slate-50 shadow-xl shadow-slate-200/20 relative overflow-hidden h-fit">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10 relative z-10">
            <div className="space-y-2 min-w-0">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">Education Background</p>
              {isEditing ? <input value={editForm.qualification} onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })} className="bg-slate-50 p-3 w-full rounded-xl border-slate-100 text-xs font-bold" /> : (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{student.qualification}</p>
                  <p className="text-[10px] font-bold text-slate-400 truncate">{student.college_name || "Institution N/A"}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6 col-span-1 min-w-0">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Score / GPA</p>
                {isEditing ? <input value={editForm.grad_score} onChange={(e) => setEditForm({ ...editForm, grad_score: e.target.value })} className="bg-slate-50 p-3 w-full rounded-xl border-slate-100 text-xs font-bold" /> : <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{student.grad_score || "N/A"}</p>}
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Backlogs</p>
                {isEditing ? <input type="number" value={editForm.backlogs} onChange={(e) => setEditForm({ ...editForm, backlogs: parseInt(e.target.value) || 0 })} className="bg-slate-50 p-3 w-full rounded-xl border-slate-100 text-xs font-bold" /> : (
                  <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", (student.backlogs ?? 0) > 0 ? "bg-rose-400" : "bg-emerald-400")} />
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{student.backlogs ?? 0} Count</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 min-w-0">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Proficiency & Skill</p>
              {isEditing ? <input value={editForm.ielts_gre} onChange={(e) => setEditForm({ ...editForm, ielts_gre: e.target.value })} className="bg-slate-50 p-3 w-full rounded-xl border-slate-100 text-xs font-bold" /> : <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{student.ielts_gre || "Not Documented"}</p>}
            </div>

            <div className="space-y-2 min-w-0">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Intrested Course</p>
              {isEditing ? <input value={editForm.course_interest} onChange={(e) => setEditForm({ ...editForm, course_interest: e.target.value })} className="bg-slate-50 p-3 w-full rounded-xl border-slate-100 text-xs font-bold" /> : <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate" title={student.course_interest}>{student.course_interest || "N/A"}</p>}
            </div>

            <div className="grid grid-cols-2 gap-10 col-span-1 sm:col-span-2 py-6 border-y border-slate-50">
              <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Compliance Check</p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-1.5 h-1.5 rounded-full", student.visa_refusal ? "bg-rose-400" : "bg-emerald-400")} />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{student.visa_refusal ? "Visa Refusal" : "No Visa Refusal"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-1.5 h-1.5 rounded-full", student.has_passport ? "bg-emerald-400" : "bg-amber-400")} />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{student.has_passport ? "Have a passport" : "No Passport"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Preferred Destinations</p>
                <div className="flex flex-wrap gap-2">
                  {student.preferred_countries.map((c: string) => (
                    <span key={c} className="text-[9px] font-black bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg border border-slate-100/50 uppercase tracking-widest">{c}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 col-span-1 sm:col-span-2">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Academic Intake</p>
                {isEditing ? <input value={editForm.intake} onChange={(e) => setEditForm({ ...editForm, intake: e.target.value })} className="bg-slate-50 p-3 w-full rounded-xl border-slate-100 text-xs font-bold" /> : <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{student.intake}</p>}
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Financial Budget</p>
                {isEditing ? <input value={editForm.budget} onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })} className="bg-slate-50 p-3 w-full rounded-xl border-slate-100 text-xs font-bold" /> : <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{student.budget}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Area (Screen Only) */}
      <div className="border-t border-slate-50 pt-16 no-print">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-6">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Meeting Notes</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSpeechRecognition}
                className={cn(
                  "p-3 rounded-2xl transition-all relative group shadow-sm border",
                  isListening
                    ? "bg-rose-50 border-rose-100 text-rose-500"
                    : "bg-white border-slate-100 text-slate-300 hover:text-slate-600 hover:border-slate-200"
                )}
                title={isListening ? "Stop Listening" : "Start Voice Notes"}
              >
                <motion.div
                  animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Mic size={16} strokeWidth={2.5} />
                </motion.div>
                {isListening && (
                  <span className="absolute -inset-1 border border-rose-200 rounded-[20px] animate-ping opacity-50" />
                )}
              </button>
              {isListening && <span className="text-[9px] font-black text-rose-400 animate-pulse tracking-[0.2em] uppercase">Recording Transcription...</span>}
            </div>
          </div>

          <button
            onClick={async () => {
              setIsSaving(true);
              await onUpdateStatus(lead.id, { notes: localNotes });
              setIsSaving(false);
            }}
            disabled={isSaving || localNotes === lead.notes}
            className="text-[9px] font-black text-slate-400 hover:text-slate-900 disabled:opacity-20 uppercase tracking-[0.25em] flex items-center gap-2 transition-all group"
          >
            {isSaving ? "SYNCING..." : "Safe Save"}
            <ArrowRight size={10} strokeWidth={4} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="relative">
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            placeholder={`Document insights for ${student.name.split(" ")[0]}...`}
            className="w-full min-h-[350px] bg-white rounded-[40px] p-10 outline-none text-slate-600 leading-relaxed text-sm border border-slate-50 shadow-2xl shadow-slate-200/40 focus:border-slate-100 transition-all font-medium placeholder:text-slate-200 custom-scrollbar"
          />
        </div>
      </div>

      {/* PRINT BRIEF (HIDDEN ON SCREEN) */}
      {!hidePrint && (
        <div className="hidden print:block font-sans text-slate-900 p-12 min-h-screen relative">
          {/* Header Branding */}
          <div className="absolute top-0 left-12 right-12 h-1 bg-slate-900" />

          <div className="flex justify-between items-start mb-12 pt-8">
            <div className="flex-1">
              <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter leading-none">{student.name}</h1>
              <div className="flex items-center gap-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Counsellor Transcript</p>
                <div className="h-1 w-1 rounded-full bg-slate-200" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block border-2 border-black px-5 py-2.5 rounded-xl">
                <p className="text-[18px] font-black text-black uppercase tracking-widest leading-none">
                  ID: <span className="text-slate-500">{student.generated_id}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Primary Metadata - 2 Column Grid for breathing room */}
          <div className="grid grid-cols-2 gap-x-20 gap-y-10 mb-12">
            {/* Column 1: Identity & Contact */}
            <div className="space-y-5">
              <h2 className="text-[9px] font-black uppercase tracking-[0.3em] border-b border-slate-100 pb-2.5 text-slate-300">Candidate Meta</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">Phone Number</label>
                    <p className="text-sm font-bold">{student.phone}</p>
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">Target Intake</label>
                    <p className="text-sm font-bold">{student.intake}</p>
                  </div>
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">Email Address</label>
                  <p className="text-sm font-bold break-all">{student.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">Budget Range</label>
                    <p className="text-sm font-bold">{student.budget}</p>
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">Primary Interest</label>
                    <p className="text-sm font-bold">{lead.country_name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Academic Profile */}
            <div className="space-y-5">
              <h2 className="text-[9px] font-black uppercase tracking-[0.3em] border-b border-slate-100 pb-2.5 text-slate-300">Academic Ledger</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">Qualification & Institution</label>
                  <p className="text-sm font-bold">{student.qualification} {student.college_name ? `• ${student.college_name}` : ""}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">Grade | Backlogs</label>
                    <p className="text-sm font-bold">{student.grad_score ? `${student.grad_score} CGPA` : "N/A"} {student.backlogs !== undefined ? `| ${student.backlogs} Backlogs` : "| 0 Backlogs"}</p>
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">IELTS | GRE</label>
                    <p className="text-sm font-bold">{student.ielts_gre || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">Work Experience</label>
                  <p className="text-sm font-bold">{student.work_experience || "No Experience"}</p>
                </div>
              </div>
            </div>

            {/* Goals & Compliance - Full Width Spanning 2 columns */}
            <div className="col-span-2 space-y-5">
              <h2 className="text-[9px] font-black uppercase tracking-[0.3em] border-b border-slate-100 pb-2.5 text-slate-300">Goals & Compliance</h2>
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">Interested Course</label>
                  <p className="text-sm font-bold text-emerald-600">{student.course_interest || "TBD"}</p>
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">Passport Status</label>
                  <p className="text-sm font-bold">{student.has_passport ? "Had Passport" : "No Passport"}</p>
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">Visa Refusal</label>
                  <p className="text-sm font-bold">{student.visa_refusal ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Consultancy Insight */}
          <div className="mb-20">
            <h2 className="text-[9px] font-black uppercase tracking-[0.3em] border-b border-slate-100 pb-3 mb-6 text-slate-300">Counsellor Observations</h2>
            <div className="bg-slate-50/50 rounded-2xl p-8">
              <p className="text-[15px] whitespace-pre-wrap leading-relaxed font-medium text-slate-700 italic">
                {lead.notes || ""}
              </p>
            </div>
          </div>

          {/* Signature Verification */}
          <div className="mt-auto mb-20 flex justify-end">
            <div className="w-64 text-center">
              <div className="border-b border-slate-900 pb-2 mb-2 h-10 flex items-center justify-center">
                {/* Placeholder for counselor signature if needed */}
              </div>
              <p className="text-[8px] font-black uppercase text-slate-800 tracking-widest">Counsellor Authorization</p>
              <p className="text-[7px] text-slate-400 uppercase mt-1">Eccho Overseas</p>
            </div>
          </div>

          {/* Branding Footer */}
          <div className="fixed bottom-12 left-12 right-12 pt-10 border-t-2 border-slate-100 flex justify-between items-end print-branding-footer">
            {/* Left: Organized By */}
            <div className="flex flex-col gap-2">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300">Organized By</p>
              <Logo className="scale-75 origin-left" noLink />
            </div>

            {/* Right: Digital Tech Partner */}
            <div className="flex flex-col gap-2 items-end">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300">Digital Tech Partner</p>
              <div className="relative w-32 h-15">
                <Image
                  src="/images/magni2.png"
                  alt="Magni Digitech Logo"
                  fill
                  className="object-contain object-right"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
