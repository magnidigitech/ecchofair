"use server";

import { createClient } from "@supabase/supabase-js";
import { getSecurityCheck } from "@/lib/utils";

// Initialize a server-only Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // In production, use service_role key for secure server actions
const supabase = createClient(supabaseUrl, supabaseKey);

export async function submitStudentForm(data: any) {
  try {
    // 1. Insert into Supabase core Students table
    // Removing client-side 'generated_id' so the DB sequence can handle it
    const { data: student, error: dbError } = await supabase
      .from("students")
      .insert([
        {
          name: data.name,
          phone: data.phone,
          email: data.email,
          qualification: data.qualification,
          college_name: data.college_name || "",
          grad_score: data.grad_score || "",
          backlogs: parseInt(data.backlogs || "0"),
          work_experience: data.work_experience || "",
          ielts_gre: data.ielts_gre || "",
          intake: data.intake,
          budget: data.budget,
          preferred_countries: data.preferred_countries,
          course_interest: data.course_interest,
          visa_refusal: data.visa_refusal === "Yes",
          has_passport: data.has_passport === "Yes",
        }
      ])
      .select()
      .single();

    if (dbError || !student) {
      console.error("Supabase Insert Error:", dbError);
      return { success: false, error: dbError?.message || "Failed to insert student" };
    }

    // Capture the server-generated ID for success screen
    const generated_id = student.generated_id;
    if (data.preferred_countries && data.preferred_countries.length > 0) {
      const countryProfiles = data.preferred_countries.map((country: string) => ({
        student_id: student.id,
        country_name: country,
        status: "New",
        is_highly_interested: false,
        notes: "",
      }));

      const { error: profileError } = await supabase
        .from("student_countries")
        .insert(countryProfiles);

      if (profileError) {
        console.error("Supabase Profile Insert Error:", profileError);
        // non-fatal, continue but log
      }
    }

    // 4. Trigger Webhook (Zapier/Make)
    let webhookUrl = process.env.ZAPIER_WEBHOOK_URL;
    
    // Check database settings if environment variable is not set
    if (!webhookUrl) {
      const { data: settingsData } = await supabase
        .from("settings")
        .select("webhook_url")
        .eq("id", "zapier_trigger")
        .maybeSingle();
      webhookUrl = settingsData?.webhook_url;
    }

    if (webhookUrl) {
      // Calculate secure passport URL
      const securityHash = getSecurityCheck(generated_id);
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const passportUrl = `${baseUrl}/status/${generated_id}-${securityHash}`;

      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...student,
            tracking_countries: data.preferred_countries,
            passport_url: passportUrl,
            event_type: "student_registered",
            timestamp: new Date().toISOString()
          }),
        });
        
        if (!response.ok) {
          console.error(`Webhook failed with status: ${response.status}`);
        }
      } catch (err) {
        console.error("Webhook Fetch Error:", err);
      }
    } else {
      console.warn("Webhook not triggered: No ZAPIER_WEBHOOK_URL found in Env or Settings table.");
    }

    return { success: true, generated_id };
  } catch (error: any) {
    console.error("Action Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}
