"use client";

import { useState, useEffect } from "react";
import {
  Users, Settings, Plus, Trash2, ShieldCheck,
  Globe, Mail, Key, X, Check, Search, AlertCircle,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  adminCreateCounselor,
  adminUpdateCounselorAssignment,
  adminDeleteCounselor,
  fetchAllProfiles
} from "../adminActions";
import { COUNTRIES, EUROPE_COUNTRIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CORE_COUNTRIES = ["USA", "UK", "Australia", "Canada", "Ireland", "New Zealand"];

export default function AdminSettings() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<any | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const res = await fetchAllProfiles();
    if (res.success) setProfiles(res.data || []);
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingProfile(null);
    setEmail("");
    setPassword("");
    setSelectedCountries([]);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (profile: any) => {
    setEditingProfile(profile);
    setEmail(profile.email);
    setPassword(""); // Can't see password, only reset if needed
    setSelectedCountries(profile.assigned_countries || []);
    setError(null);
    setIsModalOpen(true);
  };

  const openDeleteModal = (profile: any) => {
    setProfileToDelete(profile);
    setDeleteConfirmEmail("");
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (editingProfile) {
      const res = await adminUpdateCounselorAssignment(editingProfile.id, selectedCountries);
      if (res.success) {
        setIsModalOpen(false);
        await loadProfiles();
      } else {
        setError(res.error || "Failed to update profile.");
      }
    } else {
      const res = await adminCreateCounselor({
        email,
        password,
        assigned_countries: selectedCountries
      });

      if (res.success) {
        setIsModalOpen(false);
        setEmail("");
        setPassword("");
        setSelectedCountries([]);
        await loadProfiles();
      } else {
        setError(res.error || "Failed to create counselor.");
      }
    }
    setIsSubmitting(false);
  };

  const handleFinalDelete = async () => {
    if (!profileToDelete || deleteConfirmEmail !== profileToDelete.email) return;

    setIsDeleting(profileToDelete.id);
    const res = await adminDeleteCounselor(profileToDelete.id);
    if (res.success) {
      await loadProfiles();
      setIsDeleteModalOpen(false);
      setProfileToDelete(null);
    } else {
      alert("Delete failed: " + res.error);
    }
    setIsDeleting(null);
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev =>
      prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  const toggleEurope = () => {
    const allEU = EUROPE_COUNTRIES;
    const currentEU = selectedCountries.filter(c => allEU.includes(c));
    if (currentEU.length === allEU.length) {
      setSelectedCountries(prev => prev.filter(c => !allEU.includes(c)));
    } else {
      setSelectedCountries(prev => Array.from(new Set([...prev, ...allEU])));
    }
  };

  const filteredProfiles = profiles.filter(p =>
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAllEuropeSelected = selectedCountries.filter(c => EUROPE_COUNTRIES.includes(c)).length === EUROPE_COUNTRIES.length;

  return (
    <div className="p-8 sm:p-12 max-w-7xl mx-auto space-y-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-100 pb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Settings</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" /> Admin Terminal / User Management
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 active:scale-95 transition-all"
        >
          <Plus size={16} strokeWidth={3} />
          Add New Counselor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Statistics or Context */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-50 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Staff Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Total Personnel</span>
                <span className="text-lg font-black">{profiles.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Counselors</span>
                <span className="text-lg font-black">{profiles.filter(p => p.role === 'counselor').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Administrators</span>
                <span className="text-lg font-black">{profiles.filter(p => p.role === 'admin').length}</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/50 p-8 rounded-[32px] border border-emerald-100/50">
            <div className="flex items-center gap-3 mb-4 text-emerald-600">
              <Globe size={18} />
              <h4 className="text-[10px] font-black uppercase tracking-widest">Global Jurisdictions</h4>
            </div>
            <p className="text-xs font-medium text-emerald-800/60 leading-relaxed mb-6">
              Counselors assigned to specific countries will only see students interested in those destinations.
            </p>
            <div className="flex flex-wrap gap-2">
              {[...CORE_COUNTRIES, "Europe"].map(c => (
                <span key={c} className="px-3 py-1 bg-white rounded-lg text-[9px] font-black uppercase text-emerald-600 border border-emerald-100">{c}</span>
              ))}
            </div>
          </div>
        </div>

        {/* User Management Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={18} strokeWidth={3} />
            <input
              type="text"
              placeholder="SEARCH STAFF BY EMAIL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white rounded-[24px] text-xs font-bold border-transparent focus:ring-4 focus:ring-slate-100 transition-all outline-none uppercase tracking-widest placeholder:text-slate-200 shadow-sm"
            />
          </div>

          <div className="bg-white rounded-[32px] overflow-hidden border border-slate-50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Counselor Info</th>
                    <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Countries Assigned</th>
                    <th className="px-8 py-6 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="py-20 text-center">
                        <div className="w-6 h-6 border-2 border-slate-200 border-t-primary rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredProfiles.map((p) => (
                    <tr key={p.id} className="group hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-xs text-slate-600 border border-slate-100">
                            {p.email?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 tracking-tight">{p.email?.split('@')[0]}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{p.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-1.5">
                          {p.assigned_countries?.map((c: string) => (
                            <span key={c} className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-600">
                              {c}
                            </span>
                          ))}
                          {(!p.assigned_countries || p.assigned_countries.length === 0) && (
                            <span className="text-[9px] font-bold text-slate-300 uppercase underline italic">Open Jurisdiction</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                          >
                            <Settings size={16} strokeWidth={3} />
                          </button>
                          {p.role !== 'admin' && (
                            <button
                              onClick={() => openDeleteModal(p)}
                              disabled={isDeleting === p.id}
                              className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-30"
                            >
                              <Trash2 size={16} strokeWidth={3} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full sm:max-w-xl h-full sm:h-auto sm:rounded-[40px] shadow-2xl relative overflow-y-auto sm:overflow-hidden"
            >
              <div className="p-8 sm:p-12">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                      {editingProfile ? "Update Staff Profile" : "Create Staff Profile"}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {editingProfile ? "Modify Account & Jurisdiction" : "Account & Jurisdiction Setup"}
                    </p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                    <X size={24} strokeWidth={3} />
                  </button>
                </div>

                {error && (
                  <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-xs font-bold text-rose-600 leading-relaxed uppercase tracking-tight">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="space-y-6">
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={16} />
                      <input
                        type="email"
                        required
                        disabled={!!editingProfile}
                        placeholder="COUNSELOR EMAIL ADDRESS"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-[20px] text-xs font-bold border-transparent focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all outline-none uppercase tracking-widest placeholder:text-slate-200 disabled:opacity-50"
                      />
                    </div>
                    {!editingProfile && (
                      <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={16} />
                        <input
                          type="text"
                          placeholder="PASSWORD (LEAVE BLANK FOR DEFAULT)"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-[20px] text-xs font-bold border-transparent focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all outline-none uppercase tracking-widest placeholder:text-slate-200"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block px-1">Assign Jurisdictions</label>
                    <div className="grid grid-cols-2 gap-3">
                      {CORE_COUNTRIES.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCountry(c)}
                          className={cn(
                            "flex items-center justify-between px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            selectedCountries.includes(c)
                              ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200"
                              : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                          )}
                        >
                          {c}
                          {selectedCountries.includes(c) && <Check size={14} />}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={toggleEurope}
                        className={cn(
                          "flex items-center justify-between px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border col-span-2",
                          isAllEuropeSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-100"
                            : selectedCountries.some(c => EUROPE_COUNTRIES.includes(c))
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Globe size={14} />
                          Europe {isAllEuropeSelected ? "(All)" : selectedCountries.some(c => EUROPE_COUNTRIES.includes(c)) ? "(Partial)" : "(Select All)"}
                        </div>
                        {isAllEuropeSelected ? <Check size={14} /> : selectedCountries.filter(c => EUROPE_COUNTRIES.includes(c)).length > 0 && (
                          <span className="text-[9px] font-black underline">{selectedCountries.filter(c => EUROPE_COUNTRIES.includes(c)).length} Select</span>
                        )}
                      </button>
                    </div>

                    {/* Collapsible Specific Europe Selection */}
                    <div className="pt-4 space-y-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          const btn = e.currentTarget;
                          const panel = btn.nextElementSibling as HTMLElement;
                          panel.classList.toggle('hidden');
                        }}
                        className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2 hover:text-slate-900 transition-colors"
                      >
                        Specific Jurisdictions (EU/ASIA) <ChevronRight size={10} className="rotate-90" />
                      </button>
                      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar hidden">
                        {EUROPE_COUNTRIES.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => toggleCountry(c)}
                            className={cn(
                              "flex items-center justify-center px-1 py-3 rounded-lg text-[8px] font-black uppercase tracking-tight transition-all border",
                              selectedCountries.includes(c)
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-slate-50 border-slate-100 text-slate-300 hover:border-slate-200"
                            )}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="w-full py-5 bg-slate-900 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-200 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "SYNCING..." : "ACTIVATE ACCOUNT"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full sm:max-w-md rounded-[40px] shadow-2xl relative overflow-hidden p-10 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <AlertCircle size={32} strokeWidth={3} />
              </div>

              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4">Critical Action</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-10">
                Are you sure you want to revoke access for <span className="text-slate-900">{profileToDelete?.email}</span>? This action is permanent.
              </p>

              <div className="space-y-6">
                 <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1">Confirm Identity</label>
                    <input
                      type="text"
                      placeholder="ENTER COUNSELOR EMAIL TO PROCEED"
                      value={deleteConfirmEmail}
                      onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:bg-white transition-all outline-none"
                    />
                 </div>

                 <div className="flex flex-col gap-3">
                   <button
                     onClick={handleFinalDelete}
                     disabled={!!isDeleting || deleteConfirmEmail !== profileToDelete?.email}
                     className="w-full py-4 bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-100 transition-all hover:bg-rose-600 disabled:opacity-30 active:scale-95"
                   >
                     {isDeleting ? "REVOKING..." : "CONFIRM DELETION"}
                   </button>
                   <button
                     onClick={() => setIsDeleteModalOpen(false)}
                     className="w-full py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-colors"
                   >
                     Abort Action
                   </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
