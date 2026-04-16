import { ReactNode } from "react";
import Link from "next/link";
import { LogOut, User, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import LogOutButton from "@/components/auth/LogOutButton";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Counselor Dashboard",
};

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

  return (
    <div className="min-h-screen bg-secondary/10 flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 bg-background border-b border-border flex items-center px-6 justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8">
          <Link href="/counselor" className="flex items-center gap-2">
            <h2 className="text-xl font-black tracking-tight text-primary">Eccho Leads</h2>
          </Link>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full border border-border">
            <Globe size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {assignedCountries.length > 0 
                ? assignedCountries.join(" • ") 
                : "No Countries Assigned"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center text-xs font-medium bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" /> Live Sync
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
