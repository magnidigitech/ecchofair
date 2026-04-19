"use server";

import { createClient } from "@supabase/supabase-js";
import { getSecurityCheck, formatPhoneNumber } from "@/lib/utils";

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
    
    if (!webhookUrl) {
      const { data: settingsData } = await supabase
        .from("settings")
        .select("webhook_url")
        .eq("id", "zapier_trigger")
        .maybeSingle();
      webhookUrl = settingsData?.webhook_url;
    }

    if (webhookUrl) {
      const securityHash = getSecurityCheck(generated_id);
      // Sanitize baseUrl (remove trailing slash)
      let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fair.ecchouk.co.uk";
      baseUrl = baseUrl.replace(/\/$/, ""); 
      const passportUrl = `${baseUrl}/status/${generated_id}-${securityHash}`;

      try {
        console.log(`Triggering Webhook: ${webhookUrl}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...student,
            phone: formatPhoneNumber(student.phone),
            tracking_countries: data.preferred_countries,
            passport_url: passportUrl,
            site_url: baseUrl,
            event_type: "student_registered",
            timestamp: new Date().toISOString()
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error(`Webhook failed with status: ${response.status}`);
        } else {
          console.log("Webhook triggered successfully!");
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.error("Webhook Error: Request timed out");
        } else {
          console.error("Webhook Fetch Error:", err);
        }
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

export async function triggerStatusWebhook(leadId: string, eventType: string = "status_updated") {
  try {
    // 1. Fetch the full student and country lead info
    const { data: lead, error: leadError } = await supabase
      .from("student_countries")
      .select(`
        *,
        students (*)
      `)
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      console.error("Webhook Lead Fetch Error:", leadError);
      return { success: false, error: "Lead not found" };
    }

    // 2. Resolve Webhook URL
    let webhookUrl = process.env.ZAPIER_WEBHOOK_URL;
    if (!webhookUrl) {
      const { data: settingsData } = await supabase
        .from("settings")
        .select("webhook_url")
        .eq("id", "zapier_trigger")
        .maybeSingle();
      webhookUrl = settingsData?.webhook_url;
    }

    if (!webhookUrl) return { success: false, error: "No webhook URL configured" };

    // 3. Prepare Payload
    const student = lead.students;
    const securityHash = getSecurityCheck(student.generated_id);
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fair.ecchouk.co.uk";
    baseUrl = baseUrl.replace(/\/$/, ""); 
    const passportUrl = `${baseUrl}/status/${student.generated_id}-${securityHash}`;

    // 4. Fire Webhook
    console.log(`Triggering Status Webhook [${eventType}]: ${webhookUrl}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...student,
        phone: formatPhoneNumber(student.phone),
        lead_id: lead.id,
        country_name: lead.country_name,
        current_status: lead.status,
        handled_by: lead.handled_by,
        completed_at: lead.completed_at,
        passport_url: passportUrl,
        site_url: baseUrl,
        event_type: eventType,
        timestamp: new Date().toISOString()
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`Status Webhook [${eventType}] triggered successfully!`);
      return { success: true };
    } else {
      console.error(`Status Webhook failed: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (err: any) {
    console.error("Status Webhook Error:", err);
    return { success: false, error: err.message };
  }
}
