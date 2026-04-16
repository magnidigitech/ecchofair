import { ReactNode } from "react";
import Link from "next/link";
import { Users, BarChart3, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import LogOutButton from "@/components/auth/LogOutButton";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
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

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r border-border hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-black tracking-tight text-primary">Eccho Leads</h2>
          <p className="text-xs text-muted-foreground mt-1">Admin Center</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/admin" className="flex items-center px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium">
            <BarChart3 size={18} className="mr-3" /> Reports
          </Link>
          <Link href="/counselor" className="flex items-center px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary transition-colors font-medium">
            <Users size={18} className="mr-3" /> Students Queue
          </Link>
          <Link href="#" className="flex items-center px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary transition-colors font-medium">
            <Settings size={18} className="mr-3" /> Settings
          </Link>
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-secondary p-4 rounded-xl flex items-center justify-between">
            <div className="flex flex-col overflow-hidden">
               <span className="text-sm font-semibold truncate uppercase">{profile?.role}</span>
               <span className="text-xs text-muted-foreground truncate">{profile?.email}</span>
            </div>
            <LogOutButton />
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-background border-b border-border flex items-center px-6 justify-between shrink-0">
          <div className="font-bold text-lg">Event Operations Overview</div>
          <div className="flex items-center ml-auto gap-4">
            <div className="flex items-center text-xs font-medium bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" /> Live Sync Active
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto bg-secondary/10">
          {children}
        </div>
      </main>
    </div>
  );
}
