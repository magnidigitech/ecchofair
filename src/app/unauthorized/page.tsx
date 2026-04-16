"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-background rounded-2xl shadow-xl border border-border p-8 text-center"
      >
        <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
          <ShieldAlert size={32} />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-8">
          You do not have the required permissions to access this section. 
          Please contact your administrator if you believe this is an error.
        </p>

        <div className="space-y-3">
          <Link 
            href="/"
            className="w-full bg-secondary text-secondary-foreground font-medium py-3 rounded-xl hover:bg-secondary/80 transition-colors flex items-center justify-center"
          >
            <ArrowLeft size={18} className="mr-2" /> Back to Safety
          </Link>
          
          <button 
            onClick={handleSignOut}
            className="w-full border border-border text-muted-foreground font-medium py-3 rounded-xl hover:bg-secondary transition-colors flex items-center justify-center"
          >
            <LogOut size={18} className="mr-2" /> Sign Out & Switch Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
