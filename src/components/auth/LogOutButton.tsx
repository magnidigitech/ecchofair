"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth/login");
  };

  return (
    <button 
      onClick={handleSignOut}
      className="text-slate-400 hover:text-rose-500 transition-all p-2 rounded-xl hover:bg-rose-50 group"
      title="De-authenticate Session"
    >
      <LogOut size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
    </button>
  );
}
