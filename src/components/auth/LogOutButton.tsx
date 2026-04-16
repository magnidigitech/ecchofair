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
      className="text-muted-foreground cursor-pointer hover:text-destructive transition-colors p-1"
      title="Sign Out"
    >
      <LogOut size={16} />
    </button>
  );
}
