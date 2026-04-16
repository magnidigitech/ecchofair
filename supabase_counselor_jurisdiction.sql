-- COUNSELOR JURISDICTION ENHANCEMENT (V4)

-- 1. Add assigned_countries to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS assigned_countries TEXT[] DEFAULT '{}';

-- 2. Update RLS for student_countries
-- We need a policy that allows counselors to see only students in their assigned countries
-- NOTE: If assigned_countries is empty, we assume they can't see anything (or we can change to allow all)
-- For Admin, we allow all.

DROP POLICY IF EXISTS "Counselor Jurisdiction Access" ON public.student_countries;
CREATE POLICY "Counselor Jurisdiction Access" ON public.student_countries
FOR SELECT TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  OR 
  lower(country_name) = ANY(SELECT lower(unnest(assigned_countries)) FROM public.profiles WHERE id = auth.uid())
);

-- 3. Update RLS for students table
-- Allow counselors to see students who have at least one country in their jurisdiction
DROP POLICY IF EXISTS "Counselor Student Demographic Access" ON public.students;
CREATE POLICY "Counselor Student Demographic Access" ON public.students
FOR SELECT TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  OR
  EXISTS (
    SELECT 1 FROM public.student_countries sc
    WHERE sc.student_id = public.students.id
    AND lower(sc.country_name) = ANY(SELECT lower(unnest(assigned_countries)) FROM public.profiles WHERE id = auth.uid())
  )
);
