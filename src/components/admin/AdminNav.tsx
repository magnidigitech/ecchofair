"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, X, BarChart3, Users, Settings, 
  Download, LogOut, ChevronRight, Globe 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import LogOutButton from "@/components/auth/LogOutButton";
import { useAdmin } from "@/context/AdminContext";
import { cn } from "@/lib/utils";

interface AdminNavProps {
  profile: any;
}

export function AdminNav({ profile }: AdminNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const { onDownload } = useAdmin();

  const navLinks = [
    { href: "/admin", label: "Reports", icon: BarChart3 },
    { href: "/counselor", label: "Students Queue", icon: Users },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  const sidebarVariants = {
    closed: { x: "100%", transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
    open: { x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isHovered ? 256 : 80 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="bg-white border-r border-slate-100 hidden lg:flex flex-col sticky top-0 h-screen z-[100] transition-shadow duration-300"
        style={{ boxShadow: isHovered ? '0 20px 25px -5px rgb(0 0 0 / 0.1)' : 'none' }}
      >
        <div className="py-8 flex items-center justify-center overflow-hidden border-b border-slate-50 mb-4">
          <AnimatePresence mode="wait">
            {isHovered ? (
              <motion.div
                key="full-logo"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center"
              >
                <Logo className="scale-75" />
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-[0.25em] mt-2 whitespace-nowrap">Admin Terminal</p>
              </motion.div>
            ) : (
              <motion.div
                key="mini-logo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-white shadow-sm border border-slate-100 p-2.5 transition-transform hover:scale-105 cursor-pointer"
              >
                <img src="/favicon.png" alt="Eccho" className="w-full h-full object-contain" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <nav className="flex-1 px-3 space-y-4 mt-8 flex flex-col items-center">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.label}
                href={link.href} 
                className={cn(
                  "flex items-center rounded-2xl transition-all duration-300 relative group",
                  isHovered ? "w-full px-4 py-4" : "w-14 h-14 justify-center",
                  isActive 
                    ? "bg-white text-slate-900 border border-slate-100 shadow-[0_10px_40px_-10px_rgba(22,163,74,0.15)]" 
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon size={isHovered ? 18 : 22} className={cn("transition-all duration-300", isActive ? "text-primary scale-110" : "group-hover:text-slate-900")} />
                <AnimatePresence>
                  {isHovered && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="ml-4 whitespace-nowrap text-[11px] font-black uppercase tracking-widest"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                
                {/* Visual Indicators */}
                {!isHovered && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[110] whitespace-nowrap shadow-xl">
                    {link.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className={cn(
            "bg-slate-50 rounded-[24px] flex items-center transition-all duration-300 border border-slate-100 shadow-inner",
            isHovered ? "p-4 justify-between" : "p-2 justify-center"
          )}>
            {isHovered ? (
              <>
                <div className="flex flex-col overflow-hidden">
                   <span className="text-[9px] font-black tracking-widest uppercase text-slate-900 truncate">{profile?.role}</span>
                   <span className="text-[8px] text-slate-400 font-bold truncate tracking-tight">{profile?.email}</span>
                </div>
                <LogOutButton />
              </>
            ) : (
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-900 font-black text-[10px] shadow-sm border border-slate-200">
                {profile?.email?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-2xl border-b border-slate-100/50 z-[60] flex items-center px-6 justify-between lg:hidden transition-all duration-300">
        <Logo className="scale-75" />
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-slate-50 rounded-2xl text-slate-900 shadow-inner active:scale-95 transition-all"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] lg:hidden"
            />
            <motion.aside
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed top-0 right-0 bottom-0 w-[80%] max-w-xs bg-white z-[80] lg:hidden flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Mobile Drawer Header */}
              <div className="p-8 border-b border-slate-50 relative">
                <div className="absolute top-0 left-0 right-0 h-1bg-primary opacity-20" />
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="absolute top-6 right-6 p-2 text-slate-300"
                >
                  <X size={20} />
                </button>
                <Logo className="scale-75 origin-left" />
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Mobile Terminal</p>
              </div>

              {/* Mobile Mobile Status/Actions (Migrated from Header) */}
              <div className="p-6 space-y-4">
                 <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                    <div className="flex items-center gap-3">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Live Sync Active</span>
                    </div>
                    <Globe size={14} className="text-emerald-300" />
                 </div>
                 
                 <button 
                    onClick={() => {
                      onDownload();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200 group active:scale-95 transition-all"
                 >
                    <div className="flex items-center gap-3">
                       <Download size={14} className="text-primary" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Download Report</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-700 group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>

              {/* Mobile Nav Links */}
              <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link 
                      key={link.label}
                      href={link.href} 
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center px-4 py-4 rounded-2xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest",
                        isActive 
                          ? "bg-slate-50 text-slate-900 border border-slate-100" 
                          : "text-slate-400 hover:text-slate-900"
                      )}
                    >
                      <Icon size={16} className={cn("mr-4", isActive ? "text-primary" : "")} />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile User Info */}
              <div className="p-6 mt-auto border-t border-slate-50 bg-slate-50/50">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black tracking-widest uppercase text-slate-900">{profile?.role}</span>
                      <span className="text-[8px] text-slate-400 font-bold">{profile?.email}</span>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black shadow-sm">
                      {profile?.email?.charAt(0).toUpperCase()}
                   </div>
                </div>
                <LogOutButton />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
