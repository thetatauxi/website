-- Migration: Add category column to community_links table
-- Run this in your Supabase SQL Editor:

ALTER TABLE community_links
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Other';

-- Optional: Create an index on category for faster filtering if links grow large
CREATE INDEX IF NOT EXISTS idx_community_links_category ON community_links(category);
