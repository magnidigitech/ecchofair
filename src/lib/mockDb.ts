// This file now largely serves as a type definition hub 
// since we migrated to real Supabase!

export type Status = "Hot" | "Warm" | "Cold" | "New";

export interface StudentCountry {
  id: string; // UUID
  student_id: string; // UUID of parent student
  country_name: string;
  status: Status;
  is_highly_interested: boolean;
  notes: string;
  updated_at: string;
}

export interface Student {
  id: string; // Internal UUID
  generated_id: string; // e.g., ECHO-UK-1023
  name: string;
  phone: string;
  email: string;
  qualification: string;
  ielts_gre: string;
  intake: string;
  budget: string;
  preferred_countries: string[];
  course_interest: string;
  created_at: string;
  
  // Virtual field we will attach after the SQL JOIN
  country_profiles?: StudentCountry[]; 
}

// Ensure Backward compatibility if any stray imports exist 
// (though we ripped zustand out)
import { create } from "zustand";
interface LeadStore {
  students: Student[];
  updateStudent: (id: string, updates: Partial<Student>) => void;
}
export const useLeadStore = create<LeadStore>(() => ({
  students: [],
  updateStudent: () => {},
}));
