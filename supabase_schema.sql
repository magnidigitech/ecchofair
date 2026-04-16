-- 1. Create the Students Table
CREATE TABLE public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    generated_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    qualification TEXT,
    ielts_gre TEXT,
    intake TEXT,
    budget TEXT,
    preferred_countries TEXT[], -- array of text
    course_interest TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'New', -- 'New', 'Hot', 'Warm', 'Cold'
    is_highly_interested BOOLEAN DEFAULT false,
    notes TEXT DEFAULT ''
);

-- 2. Create Settings Table for Webhooks
CREATE TABLE public.settings (
    id TEXT PRIMARY KEY,
    webhook_url TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert Zapier Webhook
INSERT INTO public.settings (id, webhook_url)
VALUES ('zapier_trigger', 'https://hooks.zapier.com/hooks/catch/27234143/uj3gx2n/')
ON CONFLICT (id) DO UPDATE SET webhook_url = EXCLUDED.webhook_url;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow anyone (anon) to insert into students (for public registration form)
CREATE POLICY "Allow public inserts" ON public.students
    FOR INSERT 
    TO public
    WITH CHECK (true);

-- Allow anyone to read students (in a real production app, restrict to authenticated counselors)
CREATE POLICY "Allow public read students" ON public.students
    FOR SELECT 
    TO public 
    USING (true);

-- Allow anyone to update students 
CREATE POLICY "Allow public update students" ON public.students
    FOR UPDATE 
    TO public 
    USING (true);

-- Allow server action to read settings table securely
CREATE POLICY "Allow public read settings" ON public.settings
    FOR SELECT
    TO public
    USING (true);

-- 5. Set up Realtime
-- Drop publication if it exists (optional safety measure)
-- DROP PUBLICATION IF EXISTS supabase_realtime;
-- Ensure the tables are replicated in the default supabase_realtime publication
alter publication supabase_realtime add table public.students;
