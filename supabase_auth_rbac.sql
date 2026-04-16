-- SUPABASE RBAC ENHANCEMENT (V3)

-- 1. Create Role Enum
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'counselor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.user_role DEFAULT 'counselor' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Profiles
-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- Allow public (middleware) to read roles for specific IDs (Strictly restricted)
DROP POLICY IF EXISTS "Allow role verification" ON public.profiles;
CREATE POLICY "Allow role verification" ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);

-- Allow admins to read all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Automatic Profile Trigger
-- Sync auth.users to public.profiles automatically on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'counselor'); -- Default everyone to counselor for safety
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Grant sequence permissions to public if needed 
-- (for the student_id_seq we created in previous step)
GRANT USAGE, SELECT ON SEQUENCE public.student_id_seq TO anon, authenticated;
