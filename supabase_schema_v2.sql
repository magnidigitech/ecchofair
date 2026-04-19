-- SUPABASE INTEGRATION SCRIPT V2 (MULTI-COUNTRY SUPPORT)

-- 1. Drop existing objects if they exist
DROP POLICY IF EXISTS "Allow public inserts" ON public.students;
DROP POLICY IF EXISTS "Allow public read students" ON public.students;
DROP POLICY IF EXISTS "Allow public update students" ON public.students;
DROP TABLE IF EXISTS public.student_countries;
-- DO NOT drop students to prevent breaking things, just alter it

-- 2. Modify the students table to drop the global status/notes columns if they exist
ALTER TABLE public.students 
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS is_highly_interested,
DROP COLUMN IF EXISTS notes;

-- 3. Create the multi-country tracking table
CREATE TABLE public.student_countries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    country_name TEXT NOT NULL,
    status TEXT DEFAULT 'New', -- 'New', 'Hot', 'Warm', 'Cold'
    is_highly_interested BOOLEAN DEFAULT false,
    notes TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, country_name) -- A student can only have one profile per country
);

-- 4. Create Settings Table for Webhooks (if not exists)
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY,
    webhook_url TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert Zapier Webhook
INSERT INTO public.settings (id, webhook_url)
VALUES ('zapier_trigger', 'https://hooks.zapier.com/hooks/catch/27234143/uj3gx2n/')
ON CONFLICT (id) DO UPDATE SET webhook_url = EXCLUDED.webhook_url;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- STUDENTS: Allow anyone to insert/read/update
CREATE POLICY "Allow public inserts on students" ON public.students FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public read on students" ON public.students FOR SELECT TO public USING (true);
CREATE POLICY "Allow public update on students" ON public.students FOR UPDATE TO public USING (true);

-- STUDENT_COUNTRIES: Allow anyone to insert/read/update
CREATE POLICY "Allow public inserts on student_countries" ON public.student_countries FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public read on student_countries" ON public.student_countries FOR SELECT TO public USING (true);
CREATE POLICY "Allow public update on student_countries" ON public.student_countries FOR UPDATE TO public USING (true);

-- SETTINGS: Allow server action to read settings table securely
CREATE POLICY "Allow public read on settings" ON public.settings FOR SELECT TO public USING (true);

-- 7. Set up Realtime safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'students'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'student_countries'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.student_countries;
    END IF;
END $$;
 