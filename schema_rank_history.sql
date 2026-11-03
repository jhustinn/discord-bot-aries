-- ============================================
-- Rank History Table for Supabase SQL Editor
-- Run this in Supabase Dashboard -> SQL Editor (Optional / Recommended)
-- ============================================

CREATE TABLE IF NOT EXISTS public.rank_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_user_id VARCHAR NOT NULL,
    player_id VARCHAR,
    player_name VARCHAR,
    player_level INTEGER,
    season_number INTEGER NOT NULL,
    season_name VARCHAR,
    current_rank VARCHAR,
    best_rank VARCHAR,
    rank_points INTEGER DEFAULT 0,
    clan_points INTEGER DEFAULT 0,
    permanent_image_url TEXT NOT NULL,
    extracted_text TEXT,
    raw_ocr_data JSONB,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(discord_user_id, season_number)
);

-- Enable RLS and public access policies
ALTER TABLE public.rank_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role and authenticated full access" ON public.rank_history
    FOR ALL USING (true) WITH CHECK (true);
