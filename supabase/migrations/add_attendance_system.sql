-- Migration: Add Attendance System (attendance_events and event_attendance)
-- Run this in the Supabase SQL Editor if applying manually.

-- 1. Create attendance_events table
CREATE TABLE IF NOT EXISTS public.attendance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookup by code (for QR scanning)
CREATE INDEX IF NOT EXISTS idx_attendance_events_code ON public.attendance_events (code);
CREATE INDEX IF NOT EXISTS idx_attendance_events_created_at ON public.attendance_events (created_at DESC);

-- 2. Create event_attendance table
CREATE TABLE IF NOT EXISTS public.event_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.attendance_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'present',
  points_awarded integer NOT NULL DEFAULT 0,
  scanned_at timestamptz DEFAULT now(),
  verified_by text DEFAULT 'qr_scan',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_event_user UNIQUE (event_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON public.event_attendance (event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_user_id ON public.event_attendance (user_id);

-- Ensure profiles table has attendance_points column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS attendance_points integer DEFAULT 0;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

-- 4. Policies for attendance_events
-- Any authenticated member can read events
CREATE POLICY "Allow authenticated read attendance_events"
  ON public.attendance_events FOR SELECT
  TO authenticated
  USING (true);

-- Privileged roles can manage events
CREATE POLICY "Allow privileged manage attendance_events"
  ON public.attendance_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND LOWER(profiles.role) IN (
        'regent', 'vice regent', 'scribe', 'website chair', 'web chair', 'website', 'admin'
      )
    )
  );

-- 5. Policies for event_attendance
-- Members can view their own records; privileged roles can view all records
CREATE POLICY "Allow read event_attendance"
  ON public.event_attendance FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND LOWER(profiles.role) IN (
        'regent', 'vice regent', 'scribe', 'website chair', 'web chair', 'website', 'admin'
      )
    )
  );

-- Members can record their own attendance (QR check-in)
CREATE POLICY "Allow self insert event_attendance"
  ON public.event_attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Privileged roles can insert/update/delete any attendance record
CREATE POLICY "Allow privileged manage event_attendance"
  ON public.event_attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND LOWER(profiles.role) IN (
        'regent', 'vice regent', 'scribe', 'website chair', 'web chair', 'website', 'admin'
      )
    )
  );
