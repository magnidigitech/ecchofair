"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Fetch profile to determine redirect
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .single();

      if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/counselor");
      }
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight text-primary">Eccho Leads</h1>
          <p className="text-muted-foreground mt-2">Study Abroad Education Fair Portal</p>
        </div>

        <div className="bg-background rounded-2xl shadow-xl border border-border p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Welcome Back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary rounded-xl text-sm border-transparent focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary rounded-xl text-sm border-transparent focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : (
                <><LogIn size={18} className="mr-2" /> Sign In</>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-border text-center">
             <p className="text-xs text-muted-foreground">
               Forgot your password? Please contact the administrator.
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
