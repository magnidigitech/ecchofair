-- 1. Create a sequence that starts at 1
CREATE SEQUENCE IF NOT EXISTS student_id_seq START 1;

-- 2. Update the generated_id column to use the sequence as a default
-- Pattern: 'E26' followed by the sequence padded to 4 digits
ALTER TABLE public.students 
ALTER COLUMN generated_id SET DEFAULT ('E26' || lpad(nextval('student_id_seq')::text, 4, '0'));

-- Optional: If you have existing test data and want to reset their IDs to the new format:
-- UPDATE public.students SET generated_id = 'E26' || lpad(nextval('student_id_seq')::text, 4, '0');
