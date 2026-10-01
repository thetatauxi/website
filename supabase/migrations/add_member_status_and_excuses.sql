-- Migration: Add status and excuse fields to profiles, and normalize event attendance statuses
-- Run this in your Supabase SQL Editor.

-- 1. Add status and excuse columns to public.profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status text DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS dues_excused boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS concessions_excused boolean DEFAULT false;

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);

-- 2. Normalize existing event_attendance records
-- Set any existing records that were true/present/empty to 'present'
UPDATE public.event_attendance
SET status = 'present'
WHERE status ILIKE 'true' OR status ILIKE 'present' OR status IS NULL OR status = '';

-- Delete any records that were marked false/absent so they become empty (no record)
DELETE FROM public.event_attendance
WHERE status ILIKE 'false' OR status ILIKE 'absent' OR status ILIKE 'empty' OR status = '0';
