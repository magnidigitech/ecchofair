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
import { Student, StudentCountry } from "@/lib/mockDb";

export default function CounselorDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"queue" | "completed">("queue");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
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
    
    setStudents(prev => prev.map(item => item.id === countryId ? { ...item, ...finalUpdates } : item));
    await supabase.from("student_countries").update(finalUpdates).eq("id", countryId);
  };

  const updateStudentDemographics = async (studentId: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(item => item.student_id === studentId ? { ...item, students: { ...item.students, ...updates } } : item));
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
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-white text-slate-900 font-sans">
      {/* Sidebar List */}
      <div className="w-full md:w-80 lg:w-96 shrink-0 border-r border-slate-100 flex flex-col h-full bg-white">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">My Status</p>
              <p className="text-[11px] font-bold text-slate-900">{profile?.is_online ? "Receiving Students" : "On Break"}</p>
            </div>
            <button 
              onClick={togglePresence}
              disabled={isPresenceLoading}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-sm",
                profile?.is_online 
                  ? "bg-emerald-500 text-white shadow-emerald-100 hover:bg-emerald-600" 
                  : "bg-white text-slate-400 border border-slate-200 hover:bg-slate-50"
              )}
            >
              <div className={cn("w-1.5 h-1.5 rounded-full", profile?.is_online ? "bg-white animate-pulse" : "bg-slate-300")} />
              {isPresenceLoading ? "..." : (profile?.is_online ? "ONLINE" : "GO ONLINE")}
            </button>
          </div>

          <div className="relative group mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm border-transparent focus:bg-white focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-all outline-none"
            />
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
            <button
              onClick={() => setActiveTab("queue")}
              className={cn(
                "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                activeTab === "queue" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Live Queue ({students.filter(s => s.status !== 'Cold').length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={cn(
                "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                activeTab === "completed" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Finished ({students.filter(s => s.status === 'Cold').length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <User size={32} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">No students in this view</p>
            </div>
          ) : (
            filteredStudents.map((item: any) => (
              <div
                key={item.id}
                onClick={() => setSelectedProfileId(item.id)}
                className={cn(
                  "p-5 cursor-pointer transition-all flex items-center justify-between group",
                  selectedProfileId === item.id ? "bg-slate-50 pr-4" : "hover:bg-slate-50/50"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{item.students?.generated_id}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-semibold text-primary uppercase">{item.country_name}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 truncate">{item.students?.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-medium">
                    <span className={cn(
                      "font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                      item.status === 'Cold' ? "bg-emerald-50 text-emerald-600" :
                      item.status === 'Hot' ? "text-orange-600" : "text-slate-400"
                    )}>
                      {item.status === 'Cold' ? "COMPLETED" : item.status}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="font-mono text-[9px] uppercase">
                      {item.created_at ? new Date(item.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' }).replace(',', '') : 'N/A'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className={cn("text-slate-200 transition-all", selectedProfileId === item.id && "text-primary translate-x-1")} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 bg-white h-full overflow-y-auto custom-scrollbar print:overflow-visible">
        {selectedLead ? (
          <StudentDetailWorkspace 
            lead={selectedLead} 
            onUpdateStatus={updateCountryProfile}
            onUpdateStudent={updateStudentDemographics} 
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
              <User size={32} className="opacity-20" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Student</h3>
            <p className="text-sm max-w-xs">Choose a profile from the left to view academic details and add counseling notes.</p>
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

function StudentDetailWorkspace({ lead, onUpdateStatus, onUpdateStudent }: { lead: any, onUpdateStatus: any, onUpdateStudent: any }) {
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
    intake: student.intake,
    budget: student.budget
  });

  useEffect(() => {
    setLocalNotes(lead.notes || "");
    setEditForm({
      name: student.name, email: student.email, phone: student.phone,
      qualification: student.qualification, ielts_gre: student.ielts_gre,
      course_interest: student.course_interest, intake: student.intake, budget: student.budget
    });
  }, [lead.id, student]);

  const handleSaveAll = async () => {
    setIsSaving(true);
    await onUpdateStudent(student.id, editForm);
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
        setLocalNotes(prev => {
          const separator = prev.length > 0 ? (prev.endsWith('.') || prev.endsWith('\n') ? ' ' : '. ') : '';
          return prev + separator + transcript.trim();
        });
      }
    };

    recognition.start();
  };

  const statusOptions = ['New', 'Warm', 'Hot', 'Cold'];

  return (
    <div className="max-w-4xl mx-auto p-12 print-area print:p-0">
      {/* QR Passport Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 no-print">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-12 rounded-[40px] shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-400 to-indigo-500" />
              <button onClick={() => setShowQR(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900"><X size={20} /></button>
              
              <div className="mb-10">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                  <QrCode size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Student Passport</h3>
                <p className="text-slate-400 font-medium text-xs mt-2 uppercase tracking-widest">Share this QR with {student.name.split(" ")[0]}</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 inline-block shadow-inner">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(secureUrl)}`}
                  alt="Student Link QR"
                  className="w-40 h-40 mix-blend-multiply"
                />
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Private Security Code</p>
                <div className="py-3 px-4 bg-slate-50 rounded-xl border border-slate-100 font-mono text-xs font-bold text-slate-600 tracking-wider">
                  S-NODE: {secureHash}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(secureUrl);
                    alert("Secure Link Copied!");
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Copy Secure Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Info (Screen Only) */}
      <div className="flex justify-between items-start mb-12 no-print">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold uppercase tracking-wider">{lead.country_name} Queue</span>
            <a 
              href={secureUrl} 
              target="_blank" 
              className="text-[10px] text-slate-400 font-bold hover:text-primary transition-colors flex items-center gap-1.5 group"
            >
              <ShieldCheck size={12} className="text-slate-300 group-hover:text-primary transition-colors" />
              PUBLIC VIEW: {student.generated_id}
              <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
            </a>
          </div>

          {isEditing ? (
            <input 
              value={editForm.name}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              className="text-4xl font-semibold tracking-tight w-full bg-slate-50 p-2 rounded-lg border-b-2 border-primary outline-none mb-4"
            />
          ) : (
            <h2 className="text-4xl font-semibold tracking-tight text-slate-900 mb-8">{student.name}</h2>
          )}

          <div className="flex flex-wrap gap-x-12 gap-y-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-slate-300 shrink-0" />
              {isEditing ? <input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="bg-slate-50 rounded px-2 py-1 border border-slate-200 w-40" /> : student.phone}
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-slate-300 shrink-0" />
              {isEditing ? <input value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="bg-slate-50 rounded px-2 py-1 border border-slate-200 w-64" /> : student.email}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-slate-300" />
              {student.created_at ? new Date(student.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' }).replace(',', '') : 'N/A'}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowQR(true)} 
            className="p-2.5 text-slate-400 hover:text-primary border border-slate-200 rounded-lg transition-all hover:bg-primary/5 hover:border-primary/20"
            title="Generate Student Pass"
          >
            <QrCode size={18} />
          </button>
          <button onClick={() => window.print()} className="p-2.5 text-slate-400 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors"><Printer size={18} /></button>
          
          {lead.status !== 'Cold' && (
            <button 
              onClick={handleCompleteCounselling}
              disabled={isSaving}
              className="px-6 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center gap-2"
            >
              <Check size={18} /> Finish Session
            </button>
          )}

          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button onClick={handleSaveAll} disabled={isSaving} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2">
              <Edit3 size={16} /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Details Grid (Screen Only) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 no-print">
        {/* Status Selection */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Current Status</p>
          <div className="flex flex-col gap-1">
            {statusOptions.map(s => (
              <button
                key={s}
                onClick={() => onUpdateStatus(lead.id, { status: s })}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all",
                  lead.status === s ? "bg-primary/5 text-primary font-semibold" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {s === 'Cold' ? 'Completed' : s} {lead.status === s && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* Academic Details */}
        <div className="md:col-span-2 grid grid-cols-2 gap-x-8 gap-y-10 border-l border-slate-100 pl-12">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><GraduationCap size={12} /> Qualification</p>
            {isEditing ? <input value={editForm.qualification} onChange={(e) => setEditForm({...editForm, qualification: e.target.value})} className="bg-slate-50 p-2 w-full rounded-lg border-slate-200" /> : <p className="font-medium text-slate-900">{student.qualification}</p>}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">Current College</p>
            {isEditing ? <input value={editForm.college_name} onChange={(e) => setEditForm({...editForm, college_name: e.target.value})} className="bg-slate-50 p-2 w-full rounded-lg border-slate-200" /> : <p className="font-medium text-slate-900">{student.college_name || "N/A"}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">GPA / Score</p>
               {isEditing ? <input value={editForm.grad_score} onChange={(e) => setEditForm({...editForm, grad_score: e.target.value})} className="bg-slate-50 p-2 w-full rounded-lg border-slate-200" /> : <p className="font-medium text-slate-900">{student.grad_score || "N/A"}</p>}
             </div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">Backlogs</p>
               {isEditing ? <input type="number" value={editForm.backlogs} onChange={(e) => setEditForm({...editForm, backlogs: e.target.value})} className="bg-slate-50 p-2 w-full rounded-lg border-slate-200" /> : <p className="font-medium text-slate-900">{student.backlogs ?? 0}</p>}
             </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Check size={12} /> Test Scores</p>
            {isEditing ? <input value={editForm.ielts_gre} onChange={(e) => setEditForm({...editForm, ielts_gre: e.target.value})} className="bg-slate-50 p-2 w-full rounded-lg border-slate-200" /> : <p className="font-medium text-slate-900">{student.ielts_gre || "N/A"}</p>}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Save size={12} /> Work Experience</p>
            {isEditing ? <input value={editForm.work_experience} onChange={(e) => setEditForm({...editForm, work_experience: e.target.value})} className="bg-slate-50 p-2 w-full rounded-lg border-slate-200" /> : <p className="font-medium text-slate-900">{student.work_experience || "None"}</p>}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><MapPin size={12} /> Intended Course</p>
            {isEditing ? <input value={editForm.course_interest} onChange={(e) => setEditForm({...editForm, course_interest: e.target.value})} className="bg-slate-50 p-2 w-full rounded-lg border-slate-200" /> : <p className="font-medium text-slate-900">{student.course_interest || "N/A"}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Visa Refusal</p>
               <span className={cn(
                 "text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter",
                 student.visa_refusal ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
               )}>
                 {student.visa_refusal ? "YES - REVIEW" : "NONE"}
               </span>
             </div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Passport</p>
               <span className={cn(
                 "text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter",
                 student.has_passport ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
               )}>
                 {student.has_passport ? "READY" : "NO PASSPORT"}
               </span>
             </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Globe size={12} /> Preferences</p>
            <div className="flex flex-wrap gap-1.5">
              {student.preferred_countries.map((c: string) => (
                <span key={c} className="text-[11px] font-medium bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100">{c}</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Intake</p>
              {isEditing ? <input value={editForm.intake} onChange={(e) => setEditForm({...editForm, intake: e.target.value})} className="bg-slate-50 p-2 w-full rounded-lg border-slate-200" /> : <p className="font-medium text-slate-900">{student.intake}</p>}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Budget</p>
              {isEditing ? <input value={editForm.budget} onChange={(e) => setEditForm({...editForm, budget: e.target.value})} className="bg-slate-50 p-2 w-full rounded-lg border-slate-200" /> : <p className="font-medium text-slate-900">{student.budget}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Notes Area (Screen Only) */}
      <div className="border-t border-slate-100 pt-12 no-print">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
             <h3 className="text-sm font-semibold text-slate-900">Counseling Notes</h3>
             <button 
               onClick={toggleSpeechRecognition}
               className={cn(
                 "p-2 rounded-full transition-all relative",
                 isListening ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400 hover:text-slate-600"
               )}
               title={isListening ? "Stop Listening" : "Start Voice-to-Text"}
             >
               <motion.div
                 animate={isListening ? { scale: [1, 1.2, 1] } : {}}
                 transition={{ repeat: Infinity, duration: 1.5 }}
               >
                 <Mic size={16} className={isListening ? "fill-rose-600" : ""} />
               </motion.div>
               {isListening && (
                 <span className="absolute -inset-1 border-2 border-rose-200 rounded-full animate-ping" />
               )}
             </button>
             {isListening && <span className="text-[10px] font-semibold text-rose-500 animate-pulse tracking-widest uppercase">Listening...</span>}
          </div>
          <button 
            onClick={async () => {
              setIsSaving(true);
              await onUpdateStatus(lead.id, { notes: localNotes });
              setIsSaving(false);
            }} 
            disabled={isSaving || localNotes === lead.notes}
            className="text-xs font-semibold text-primary disabled:opacity-30 flex items-center gap-2"
          >
            {isSaving ? "Saving..." : "Save Notes"}
          </button>
        </div>
        <textarea 
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          placeholder={`Add notes for ${student.name}...`}
          className="w-full min-h-[300px] bg-slate-50 rounded-2xl p-8 outline-none text-slate-700 leading-relaxed text-sm focus:bg-white focus:ring-1 focus:ring-slate-100 transition-all font-medium"
        />
      </div>

      {/* PRINT BRIEF (HIDDEN ON SCREEN) */}
      <div className="hidden print:block font-serif text-slate-900">
        <div className="border-b border-black pb-8 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-1">{student.name}</h1>
            <p className="text-sm text-slate-500">Student Profile Summary • {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase">ID: {student.generated_id}</p>
            <p className="text-[10px] font-bold uppercase">Assigned: {lead.country_name}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <h2 className="text-xs font-bold uppercase border-b border-slate-200 pb-1 mb-4">Contact Info</h2>
            <p className="text-sm mb-2"><strong>Phone:</strong> {student.phone}</p>
            <p className="text-sm mb-2"><strong>Email:</strong> {student.email}</p>
            <p className="text-sm"><strong>Registered:</strong> {new Date(student.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase border-b border-slate-200 pb-1 mb-4">Academic Background</h2>
            <p className="text-sm mb-2"><strong>Qualification:</strong> {student.qualification}</p>
            <p className="text-sm mb-2"><strong>Scores:</strong> {student.ielts_gre || "N/A"}</p>
            <p className="text-sm"><strong>Target:</strong> {student.course_interest}</p>
          </div>
        </div>
        <div className="mb-12">
          <h2 className="text-xs font-bold uppercase border-b border-slate-200 pb-1 mb-4">Counseling Notes</h2>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{lead.notes || "No notes documented."}</p>
        </div>
      </div>
    </div>
  );
}
