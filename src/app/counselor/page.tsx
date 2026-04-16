"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Phone, Mail, MapPin, GraduationCap, 
  Clock, Save, Globe, Loader2, Printer, 
  Edit3, X, Check, User, ChevronRight, Mic,
  QrCode, ArrowRight, ShieldCheck
} from "lucide-react";
import { cn, getSecurityCheck } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Student, StudentCountry, Status } from "@/lib/mockDb";

import { Logo } from "@/components/Logo";

export default function CounselorDashboard() {
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
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#FBFBFD] text-slate-900 font-sans">
      {/* Sidebar List */}
      <div className="w-full md:w-96 shrink-0 flex flex-col h-full bg-white border-r border-slate-100/50 shadow-2xl shadow-slate-200/20 z-10">
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
              Archived ({students.filter(s => s.status === 'Cold').length})
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
                  "p-6 cursor-pointer rounded-[32px] transition-all flex items-center justify-between group relative overflow-hidden",
                  selectedProfileId === item.id 
                    ? "bg-slate-900 text-white shadow-2xl shadow-slate-200 translate-x-1" 
                    : "bg-white border border-slate-50 hover:border-slate-100 hover:bg-slate-50/50"
                )}
              >
                <div className="min-w-0 flex-1 relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded shadow-sm tracking-tighter",
                      selectedProfileId === item.id ? "bg-white/10 text-white" : "bg-slate-900 text-white"
                    )}>{item.students?.generated_id}</span>
                    <span className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border",
                      selectedProfileId === item.id ? "bg-white/5 border-white/10 text-white" : "bg-primary/5 border-primary/10 text-primary"
                    )}>
                      {item.country_name}
                    </span>
                  </div>
                  <h3 className="font-black text-sm tracking-tight truncate">{item.students?.name}</h3>
                  <div className="flex items-center gap-2 mt-2 opacity-60">
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
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Workspace (Desktop Only) */}
      <div className="hidden md:flex flex-1 bg-[#FBFBFD] h-full overflow-y-auto custom-scrollbar print:bg-white print:overflow-visible relative pb-24">
        {selectedLead ? (
          <StudentDetailWorkspace 
            lead={selectedLead} 
            onUpdateStatus={updateCountryProfile}
            onUpdateStudent={updateStudentDemographics} 
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 flex items-center justify-center mb-10 border border-slate-50 animate-pulse">
              <User size={40} className="text-slate-100" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tighter">Ready to Help</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-xs leading-relaxed">Select a student from the list on the left to start your meeting.</p>
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
  isMobile = false
}: { 
  lead: StudentCountry & { students: Student }, 
  onUpdateStatus: (id: string, updates: Partial<StudentCountry>) => Promise<void>, 
  onUpdateStudent: (id: string, updates: Partial<Student>) => Promise<void>,
  isMobile?: boolean
}) {
  const student = lead.students;
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
    }
    setIsSaving(false);
  };

  // Secure Link Generation
  const secureHash = getSecurityCheck(student.generated_id);
  const secureUrl = typeof window !== 'undefined' ? `${window.location.origin}/status/${student.generated_id}-${secureHash}` : '';

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
    <div className={cn("max-w-5xl mx-auto py-8 sm:py-10 print-area print:p-0", isMobile ? "px-0" : "px-8")}>
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

      <div className="flex flex-col md:flex-row justify-between items-start mb-10 no-print gap-8">
        <div className="flex-1 w-full min-w-0 space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest leading-none shrink-0">{lead.country_name}</div>
             <div className="h-3 w-[1px] bg-slate-200 shrink-0" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Student ID: {student.generated_id}</span>
          </div>

          {isEditing ? (
            <input 
              value={editForm.name}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              autoFocus
              className="text-2xl sm:text-4xl font-black tracking-tighter w-full bg-white px-4 py-2 sm:px-5 sm:py-3 rounded-2xl border-2 border-slate-100 outline-none shadow-inner"
            />
          ) : (
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-tight truncate">{student.name}</h2>
          )}

          <div className="flex flex-wrap gap-x-6 sm:gap-x-8 gap-y-3 pt-1">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0"><Phone size={10} /></div>
              {isEditing ? <input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="bg-white rounded-xl px-3 py-1 border border-slate-100 text-[10px] sm:text-xs font-bold w-32 sm:w-40" /> : <span className="text-[10px] sm:text-xs font-black text-slate-600 tracking-tight truncate">{student.phone}</span>}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0"><Mail size={10} /></div>
              {isEditing ? <input value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="bg-white rounded-xl px-3 py-1 border border-slate-100 text-[10px] sm:text-xs font-bold w-44 sm:w-56" /> : <span className="text-[10px] sm:text-xs font-black text-slate-600 tracking-tight truncate">{student.email}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
          <div className="flex bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm justify-center sm:justify-start">
            <button 
              onClick={() => setShowQR(true)} 
              className="flex-1 sm:flex-none p-2.5 text-slate-400 hover:text-primary rounded-xl transition-all hover:bg-primary/5 group"
              title="Generate Student Pass"
            >
              <QrCode className="w-5 h-5 sm:w-[18px] sm:h-[18px] mx-auto group-hover:scale-110 transition-transform" strokeWidth={2.5} />
            </button>
            <button onClick={() => window.print()} className="flex-1 sm:flex-none p-2.5 text-slate-400 hover:text-slate-900 rounded-xl transition-colors">
              <Printer className="w-5 h-5 sm:w-[18px] sm:h-[18px] mx-auto" strokeWidth={2.5} />
            </button>
          </div>
          
          {lead.status !== 'Cold' && (
            <button 
              onClick={handleCompleteCounselling}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-4 sm:py-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95 shrink-0"
            >
              <Check className="w-4 h-4" strokeWidth={3} /> Finish Meeting
            </button>
          )}

          {isEditing ? (
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => setIsEditing(false)} className="flex-1 sm:px-5 sm:py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 rounded-2xl">Cancel</button>
              <button onClick={handleSaveAll} disabled={isSaving} className="flex-[2] sm:px-6 sm:py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shrink-0">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />} Save Record
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="w-full sm:w-auto px-6 py-4 sm:py-3 border-2 border-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white hover:shadow-xl transition-all flex items-center justify-center gap-3 shrink-0 group">
              <Edit3 className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Details Grid (Screen Only) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 mb-12 flex-1 no-print">
        {/* Status Selection */}
        <div className="md:col-span-3 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Student Status</p>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-1.5">
            {statusOptions.map(s => (
              <button
                key={s}
                onClick={() => onUpdateStatus(lead.id, { status: s })}
                className={cn(
                  "flex items-center justify-between px-5 py-4 md:py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                  lead.status === s 
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-300 md:translate-x-1" 
                    : "bg-white md:bg-transparent border border-slate-50 md:border-transparent text-slate-400 hover:bg-white hover:shadow-md hover:shadow-slate-100"
                )}
              >
                {s === 'Cold' ? 'Completed' : s} 
                {lead.status === s && <Check className="w-3 h-3" strokeWidth={4} />}
              </button>
            ))}
          </div>
        </div>

        {/* Academic Details */}
        <div className="md:col-span-9 bg-white p-7 sm:p-9 rounded-[40px] border border-slate-50 shadow-xl shadow-slate-200/20 relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
            <GraduationCap size={100} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 relative z-10">
            <div className="space-y-1.5 min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1.5"><GraduationCap size={10} strokeWidth={3} /> Education</p>
              {isEditing ? <input value={editForm.qualification} onChange={(e) => setEditForm({...editForm, qualification: e.target.value})} className="bg-[#FBFBFD] p-3 w-full rounded-xl border-slate-100 text-xs font-bold" /> : <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{student.qualification}</p>}
            </div>
            <div className="space-y-1.5 min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1.5">College Name</p>
              {isEditing ? <input value={editForm.college_name} onChange={(e) => setEditForm({...editForm, college_name: e.target.value})} className="bg-[#FBFBFD] p-3 w-full rounded-xl border-slate-100 text-xs font-bold" /> : <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{student.college_name || "N/A"}</p>}
            </div>
            <div className="grid grid-cols-2 gap-6 col-span-1 sm:col-span-2 md:col-span-1">
               <div className="space-y-1.5 min-w-0">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1.5">Score / GPA</p>
                 {isEditing ? <input value={editForm.grad_score} onChange={(e) => setEditForm({...editForm, grad_score: e.target.value})} className="bg-[#FBFBFD] p-3 w-full rounded-xl border-slate-100 text-xs font-bold" /> : <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{student.grad_score || "N/A"}</p>}
               </div>
               <div className="space-y-1.5 min-w-0">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1.5">Backlogs</p>
                 {isEditing ? <input type="number" value={editForm.backlogs} onChange={(e) => setEditForm({...editForm, backlogs: parseInt(e.target.value) || 0})} className="bg-[#FBFBFD] p-3 w-full rounded-xl border-slate-100 text-xs font-bold" /> : <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{student.backlogs ?? 0}</p>}
               </div>
            </div>
            <div className="space-y-1.5 min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1.5"><Check className="w-2.5 h-2.5" strokeWidth={3} /> Proficiency Scores</p>
              {isEditing ? <input value={editForm.ielts_gre} onChange={(e) => setEditForm({...editForm, ielts_gre: e.target.value})} className="bg-[#FBFBFD] p-3 w-full rounded-xl border-slate-100 text-xs font-bold" /> : <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{student.ielts_gre || "N/A"}</p>}
            </div>
            <div className="space-y-1.5 min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1.5"><Save size={10} strokeWidth={3} /> Work Experience</p>
              {isEditing ? <input value={editForm.work_experience} onChange={(e) => setEditForm({...editForm, work_experience: e.target.value})} className="bg-[#FBFBFD] p-2.5 w-full rounded-xl border-slate-100 text-xs font-bold" /> : <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{student.work_experience || "None"}</p>}
            </div>
            <div className="space-y-1.5 min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1.5"><MapPin size={10} strokeWidth={3} /> Course Interest</p>
              {isEditing ? <input value={editForm.course_interest} onChange={(e) => setEditForm({...editForm, course_interest: e.target.value})} className="bg-[#FBFBFD] p-2.5 w-full rounded-xl border-slate-100 text-xs font-bold" /> : <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate" title={student.course_interest}>{student.course_interest || "N/A"}</p>}
            </div>
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-1.5">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Visa History</p>
                 {isEditing ? (
                   <div className="flex gap-1.5">
                     {[true, false].map(v => (
                       <button 
                         key={v ? "Yes" : "No"}
                         onClick={() => setEditForm({...editForm, visa_refusal: v})}
                         className={cn(
                           "flex-1 py-2 rounded-lg text-[9px] font-black transition-all border uppercase tracking-widest",
                           editForm.visa_refusal === v ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white text-slate-400 border-slate-100"
                         )}
                       >
                         {v ? "Yes" : "No"}
                       </button>
                     ))}
                   </div>
                 ) : (
                   <span className={cn(
                     "text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-widest inline-block h-fit",
                     student.visa_refusal ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                   )}>
                     {student.visa_refusal ? "Prior Refusal" : "Clean History"}
                   </span>
                 )}
               </div>
               <div className="space-y-1.5">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Passport Status</p>
                 {isEditing ? (
                   <div className="flex gap-1.5">
                     {[true, false].map(v => (
                       <button 
                         key={v ? "Yes" : "No"}
                         onClick={() => setEditForm({...editForm, has_passport: v})}
                         className={cn(
                           "flex-1 py-2 rounded-lg text-[9px] font-black transition-all border uppercase tracking-widest",
                           editForm.has_passport === v ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white text-slate-400 border-slate-100"
                         )}
                       >
                         {v ? "Yes" : "No"}
                       </button>
                     ))}
                   </div>
                 ) : (
                   <span className={cn(
                     "text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-widest inline-block h-fit",
                     student.has_passport ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "bg-amber-50 text-amber-600 border border-amber-100"
                   )}>
                     {student.has_passport ? "Verified" : "Missing Doc"}
                   </span>
                 )}
               </div>
            </div>
            <div className="space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1.5"><Globe size={10} strokeWidth={3} /> Top Countries</p>
              <div className="flex flex-wrap gap-1.5">
                {student.preferred_countries.map((c: string) => (
                  <span key={c} className="text-[9px] font-black bg-[#FBFBFD] text-slate-900 px-2.5 py-1 rounded-lg border border-slate-100 uppercase tracking-widest shadow-sm">{c}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5 min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Joining Intake</p>
                {isEditing ? <input value={editForm.intake} onChange={(e) => setEditForm({...editForm, intake: e.target.value})} className="bg-[#FBFBFD] p-2.5 w-full rounded-xl border-slate-100 text-xs font-bold" /> : <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{student.intake}</p>}
              </div>
              <div className="space-y-1.5 min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Budget</p>
                {isEditing ? <input value={editForm.budget} onChange={(e) => setEditForm({...editForm, budget: e.target.value})} className="bg-[#FBFBFD] p-2.5 w-full rounded-xl border-slate-100 text-xs font-bold" /> : <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{student.budget}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Area (Screen Only) */}
      <div className="border-t border-slate-100 pt-12 no-print">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-5">
             <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Meeting Notes</h3>
             <button 
               onClick={toggleSpeechRecognition}
               className={cn(
                 "p-2.5 rounded-xl transition-all relative group shadow-sm",
                 isListening ? "bg-rose-50 text-rose-600" : "bg-white border border-slate-100 text-slate-400 hover:text-slate-900"
               )}
               title={isListening ? "Stop Listening" : "Start Voice Notes"}
             >
               <motion.div
                 animate={isListening ? { scale: [1, 1.2, 1] } : {}}
                 transition={{ repeat: Infinity, duration: 1.5 }}
               >
                 <Mic size={16} strokeWidth={2.5} className={isListening ? "fill-rose-600" : ""} />
               </motion.div>
               {isListening && (
                 <span className="absolute -inset-1 border-2 border-rose-200 rounded-full animate-ping" />
               )}
             </button>
             {isListening && <span className="text-[9px] font-black text-rose-500 animate-pulse tracking-[0.2em] uppercase">Listening now...</span>}
          </div>
          <button 
            onClick={async () => {
              setIsSaving(true);
              await onUpdateStatus(lead.id, { notes: localNotes });
              setIsSaving(false);
            }} 
            disabled={isSaving || localNotes === lead.notes}
            className="text-[9px] font-black text-primary disabled:opacity-30 uppercase tracking-[0.2em] flex items-center gap-2 transition-all hover:translate-y-[-1px]"
          >
            {isSaving ? "SAVING..." : "Save Notes"}
            <ArrowRight size={10} strokeWidth={4} />
          </button>
        </div>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-[28px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <textarea 
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            placeholder={`Document insights for ${student.name.split(" ")[0]}...`}
            className="relative w-full min-h-[300px] bg-white rounded-[32px] p-8 outline-none text-slate-700 leading-relaxed text-sm border border-slate-50 shadow-xl shadow-slate-200/40 focus:ring-4 focus:ring-slate-100 transition-all font-medium placeholder:text-slate-200 custom-scrollbar"
          />
        </div>
      </div>

      {/* PRINT BRIEF (HIDDEN ON SCREEN) */}
      <div className="hidden print:block font-sans text-slate-900 p-12">
        <div className="border-b-[4px] border-black pb-10 mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter">{student.name}</h1>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Counsellor Transcript • {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-black uppercase tracking-widest bg-black text-white px-4 py-2 rounded-lg">ID: {student.generated_id}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-20 mb-16">
          <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-slate-100 pb-3 mb-6">Candidate Meta</h2>
            <p className="text-sm"><strong>Phone:</strong> {student.phone}</p>
            <p className="text-sm"><strong>Email:</strong> {student.email}</p>
            <p className="text-sm"><strong>Destination:</strong> {lead.country_name}</p>
          </div>
          <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-slate-100 pb-3 mb-6">Academic Ledger</h2>
            <p className="text-sm"><strong>Origin:</strong> {student.qualification} @ {student.college_name || "N/A"}</p>
            <p className="text-sm"><strong>GPA:</strong> {student.grad_score || "N/A"}</p>
            <p className="text-sm"><strong>Target:</strong> {student.course_interest}</p>
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-slate-100 pb-3 mb-8">Consultancy Insight</h2>
          <p className="text-base whitespace-pre-wrap leading-loose font-medium text-slate-800">{lead.notes || "No critical insights documented for this session."}</p>
        </div>

        <div className="pt-20 border-t-2 border-slate-50 flex justify-between items-center opacity-30">
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Magni Digitech • Education Fair Analytics</p>
          <Logo className="scale-75 grayscale" />
        </div>
      </div>
    </div>
  );
}

