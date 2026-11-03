-- ============================================
-- Battle Records Table for Supabase SQL Editor
-- Run this in Supabase Dashboard -> SQL Editor (Optional / Recommended)
-- ============================================

CREATE TABLE IF NOT EXISTS public.battle_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_user_id VARCHAR NOT NULL,
    player_id VARCHAR,
    player_name VARCHAR NOT NULL,
    ship_name VARCHAR NOT NULL,
    ship_class VARCHAR NOT NULL, -- 'frigates', 'destroyers', 'cruisers', etc.
    damage BIGINT NOT NULL,
    kills INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    map_name VARCHAR,
    game_mode VARCHAR DEFAULT 'Random Battle',
    screenshot_url TEXT NOT NULL,
    rewards_screenshot_url TEXT,
    extracted_ocr_text TEXT,
    raw_ocr_data JSONB,
    status VARCHAR DEFAULT 'APPROVED',
    is_ship_record BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for high score lookups
CREATE INDEX IF NOT EXISTS idx_battle_records_ship_damage ON public.battle_records(ship_name, damage DESC);
CREATE INDEX IF NOT EXISTS idx_battle_records_class ON public.battle_records(ship_class);

-- Enable RLS and public access policies
ALTER TABLE public.battle_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role and authenticated full access" ON public.battle_records
    FOR ALL USING (true) WITH CHECK (true);
