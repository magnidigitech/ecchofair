"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Initialize a privileged Supabase client for administrative tasks
// This REQUIRES the SUPABASE_SERVICE_ROLE_KEY in the environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function adminCreateCounselor(data: { email: string; password?: string; assigned_countries: string[] }) {
  try {
    // 1. Check if service role key is actually provided (not just anon fallback)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { 
        success: false, 
        error: "Configuration Error: SUPABASE_SERVICE_ROLE_KEY is missing. Administrative user creation is disabled for security reasons." 
      };
    }

    // 2. Create the Auth User
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email: data.email,
      password: data.password || "EcchoStaff123!", // Secure default if not provided
      email_confirm: true
    });

    if (authError || !authUser.user) {
      console.error("Auth Admin Error:", authError);
      return { success: false, error: authError?.message || "Failed to create authentication profile." };
    }

    // 3. Update the Profile in the Public table
    // Profiles are often auto-created via trigger, so we use upsert
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .upsert({
        id: authUser.user.id,
        email: data.email,
        role: "counselor",
        assigned_countries: data.assigned_countries
      });

    if (profileError) {
      console.error("Profile Update Error:", profileError);
      return { success: false, error: "Auth user created, but profile configuration failed." };
    }

    revalidatePath("/admin/settings");
    return { success: true, userId: authUser.user.id };
  } catch (err: any) {
    console.error("Admin Action Error:", err);
    return { success: false, error: err.message };
  }
}

export async function adminUpdateCounselorAssignment(userId: string, countries: string[]) {
  try {
    const { error } = await adminSupabase
      .from("profiles")
      .update({ 
        assigned_countries: countries
      })
      .eq("id", userId);

    if (error) throw error;
    
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminDeleteCounselor(userId: string) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { success: false, error: "Service Role Key required for hard deletion." };
    }

    // 1. Delete Auth User (Privileged operation)
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    // 2. Delete Profile (usually cascades, but we do it manually to be sure)
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) throw profileError;

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchAllProfiles() {
  try {
    const { data, error } = await adminSupabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
