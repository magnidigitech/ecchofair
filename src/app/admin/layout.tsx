import { ReactNode } from "react";
import Link from "next/link";
import { Users, BarChart3, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import LogOutButton from "@/components/auth/LogOutButton";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Dashboard",
};

import { AdminProvider } from "@/context/AdminContext";
import { AdminNav } from "@/components/admin/AdminNav";

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
    <AdminProvider>
      <div className="min-h-screen bg-[#FBFBFD] flex flex-col lg:flex-row">
        <AdminNav profile={profile} />

        {/* Main Area */}
        <main className="flex-1 flex flex-col min-h-screen lg:h-screen lg:overflow-hidden pt-20 lg:pt-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </AdminProvider>
  );
}
