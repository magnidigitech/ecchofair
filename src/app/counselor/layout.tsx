import { ReactNode } from "react";
import Link from "next/link";
import { LogOut, User, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import LogOutButton from "@/components/auth/LogOutButton";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Counselor Dashboard",
};

import { AdminProvider } from "@/context/AdminContext";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function CounselorLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const assignedCountries = profile?.assigned_countries || [];

  if (profile?.role === 'admin') {
     return (
       <AdminProvider>
         <div className="min-h-screen bg-[#FBFBFD] flex flex-col lg:flex-row">
           <div className="no-print">
             <AdminNav profile={profile} />
           </div>
           <main className="flex-1 flex flex-col min-h-screen lg:h-screen lg:overflow-hidden pt-20 lg:pt-0">
             <div className="flex-1 flex flex-col overflow-hidden">
               {children}
             </div>
           </main>
         </div>
       </AdminProvider>
     );
  }

  return (
    <div className="min-h-screen bg-secondary/10 flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 bg-background border-b border-border flex items-center px-6 justify-between sticky top-0 z-50 shadow-sm no-print">
        <div className="flex items-center gap-8">
          <Link href="/counselor" className="flex items-center gap-2">
            <Logo className="scale-[0.85] origin-left" noLink />
          </Link>
          
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full border border-slate-100">
            <Globe size={14} className="text-slate-400" />
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              {assignedCountries.length > 0 
                ? assignedCountries.join(" • ") 
                : "Global Access"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Status Dot */}
          <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 border border-slate-100/50 rounded-2xl shadow-inner">
             <div className="relative flex h-2 w-2">
                <span className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  profile?.is_online ? "bg-emerald-400" : "bg-rose-400"
                )}></span>
                <span className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  profile?.is_online ? "bg-emerald-500" : "bg-rose-500"
                )}></span>
             </div>
             <span className={cn(
               "text-[10px] font-black uppercase tracking-[0.2em]",
               profile?.is_online ? "text-emerald-600" : "text-rose-600"
             )}>
                Live Sync
             </span>
          </div>

          <div className="h-8 w-px bg-border mx-2" />

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-bold uppercase text-primary">{profile?.role}</span>
              <span className="text-[10px] text-muted-foreground">{profile?.email}</span>
            </div>
            <div className="p-2 bg-secondary rounded-full">
              <User size={18} className="text-muted-foreground" />
            </div>
            <LogOutButton />
          </div>
        </div>
      </header>
      
      {/* Main Content Area (Sidebar-less) */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}
