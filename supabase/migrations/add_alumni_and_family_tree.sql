-- ============================================================================
-- Migration: Add Alumni Database, Family Tree Nodes, and Lineage Edges
-- Run this in your Supabase SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Create public.alumni table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alumni (
  id text PRIMARY KEY,                                 -- Format: 'alum_{userID}' or 'alum_{unique_id}'
  first_name text NOT NULL,                            -- Required
  last_name text NOT NULL,                             -- Required
  status text NOT NULL DEFAULT 'ALUMNI',               -- Required: 'ALUMNI', 'HONORARY', etc.
  email text,                                          -- Optional: Personal / contact email
  linkedin text,                                       -- Optional: LinkedIn URL
  grad_year integer,                                   -- Optional: Graduation Year (e.g. 2024)
  pledge_sem text,                                     -- Optional: Pledge Class/Semester (e.g. 'Fall 2021')
  address text,                                        -- Optional: Mailing address or City/State
  user_id uuid,                                        -- Optional: Reference to former auth.users id
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Search and lookup indexes for Alumni
CREATE INDEX IF NOT EXISTS idx_alumni_name ON public.alumni (last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_alumni_status ON public.alumni (status);
CREATE INDEX IF NOT EXISTS idx_alumni_grad_year ON public.alumni (grad_year);
CREATE INDEX IF NOT EXISTS idx_alumni_email ON public.alumni (email);

-- Enable Row Level Security (RLS) on alumni
ALTER TABLE public.alumni ENABLE ROW LEVEL SECURITY;

-- Read policy: Anyone authenticated (or with alumni session) can view alumni records
CREATE POLICY "Authenticated users can read alumni"
  ON public.alumni FOR SELECT
  TO authenticated, anon
  USING (true);

-- Manage policy: Officers can insert/update/delete alumni records
CREATE POLICY "Officers can manage alumni"
  ON public.alumni FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND LOWER(profiles.role) IN (
        'regent', 'vice regent', 'corresponding secretary', 'scribe', 
        'treasurer', 'marshal', 'general chair', 'admin', 'website chair', 'web chair', 'website'
      )
    )
  );

-- ----------------------------------------------------------------------------
-- 2. Create public.family_tree_nodes table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.family_tree_nodes (
  id text PRIMARY KEY,                                 -- 'user_{uuid}', 'alum_{id}', or 'node_{uuid}'
  first_name text NOT NULL,                            -- Required
  last_name text NOT NULL,                             -- Required
  username text UNIQUE NOT NULL,                       -- Unique identifier (wisc username or alumni handle)
  email text,                                          -- Optional
  is_alumni boolean NOT NULL DEFAULT false,            -- True if tagged as alumni
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  alum_id text REFERENCES public.alumni(id) ON DELETE SET NULL,
  pledge_sem text,                                     -- e.g. 'Fall 2022'
  family_name text,                                    -- e.g. 'Psi Line', 'Anchor Line'
  avatar_url text,                                     -- Optional image URL or headshot
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tree_nodes_username ON public.family_tree_nodes (username);
CREATE INDEX IF NOT EXISTS idx_tree_nodes_is_alumni ON public.family_tree_nodes (is_alumni);
CREATE INDEX IF NOT EXISTS idx_tree_nodes_family ON public.family_tree_nodes (family_name);

ALTER TABLE public.family_tree_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read family tree nodes"
  ON public.family_tree_nodes FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can insert or update family tree nodes"
  ON public.family_tree_nodes FOR ALL
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- 3. Create public.family_tree_edges table (Big-Little relationships)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.family_tree_edges (
  id bigserial PRIMARY KEY,
  little_id text NOT NULL REFERENCES public.family_tree_nodes(id) ON DELETE CASCADE,
  big_id text NOT NULL REFERENCES public.family_tree_nodes(id) ON DELETE CASCADE,
  relationship_type text DEFAULT 'big_little',         -- 'big_little' or 'co_big'
  created_at timestamptz DEFAULT now(),
  UNIQUE (little_id, big_id)
);

CREATE INDEX IF NOT EXISTS idx_tree_edges_little ON public.family_tree_edges (little_id);
CREATE INDEX IF NOT EXISTS idx_tree_edges_big ON public.family_tree_edges (big_id);

ALTER TABLE public.family_tree_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read family tree edges"
  ON public.family_tree_edges FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can manage family tree edges"
  ON public.family_tree_edges FOR ALL
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- 4. Optional helper for admin SQL restore execution
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.exec_admin_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. Grant Sequence & Table Permissions to resolve permission denied errors
-- ----------------------------------------------------------------------------
GRANT ALL ON TABLE public.alumni TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.family_tree_nodes TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.family_tree_edges TO postgres, anon, authenticated, service_role;

-- Specifically grant usage on sequence family_tree_edges_id_seq
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.family_tree_edges_id_seq TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
