-- ============================================
-- CAMPUS CLASH - COMPLETE DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    phone TEXT,
    game_id TEXT,
    university TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'manager', 'admin', 'super_admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TOURNAMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    game TEXT NOT NULL,
    mode TEXT DEFAULT 'squad' CHECK (mode IN ('solo', 'duo', 'squad')),
    prize_pool TEXT,
    description TEXT,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    registration_link TEXT,
    banner_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    registrations_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for tournaments
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournaments are viewable by everyone" ON tournaments
    FOR SELECT USING (true);

CREATE POLICY "Managers can insert tournaments" ON tournaments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'manager')
        )
    );

CREATE POLICY "Managers can update tournaments" ON tournaments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'manager')
        )
    );

CREATE POLICY "Super admins can delete tournaments" ON tournaments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('super_admin')
        )
    );

-- ============================================
-- REGISTRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team_name TEXT,
    game_id TEXT,
    rank TEXT,
    phone TEXT,
    agree_rules BOOLEAN DEFAULT TRUE,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tournament_id)
);

-- RLS for registrations
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own registrations" ON registrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create registrations" ON registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending registrations" ON registrations
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND verification_status = 'pending'
    );

CREATE POLICY "Managers can view all registrations" ON registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'manager')
        )
    );

CREATE POLICY "Managers can update registrations" ON registrations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'manager')
        )
    );

-- ============================================
-- ANALYTICS EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'registration')),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for analytics
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics are insertable by everyone" ON analytics_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Managers can view analytics" ON analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'manager')
        )
    );

-- ============================================
-- SITE SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    hero_text TEXT DEFAULT 'EXPERIENCE THE CLASH',
    announcement_text TEXT DEFAULT 'SEASON 1',
    prize_pool TEXT,
    logo_url TEXT,
    hero_poster_url TEXT,
    footer_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- RLS for site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings are viewable by everyone" ON site_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can update site settings" ON site_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- HELPER FUNCTIONS (RPC)
-- ============================================

-- Increment tournament views
CREATE OR REPLACE FUNCTION increment_tournament_views(t_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE tournaments 
    SET views_count = COALESCE(views_count, 0) + 1 
    WHERE id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment registrations count
CREATE OR REPLACE FUNCTION increment_registrations(t_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE tournaments 
    SET registrations_count = COALESCE(registrations_count, 0) + 1 
    WHERE id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement registrations count
CREATE OR REPLACE FUNCTION decrement_registrations(t_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE tournaments 
    SET registrations_count = GREATEST(COALESCE(registrations_count, 0) - 1, 0) 
    WHERE id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STORAGE BUCKET (Run in Storage tab)
-- ============================================
-- Go to Storage → New bucket
-- Name: assets
-- Public: true
-- File size limit: 5MB

-- Storage policies
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

CREATE POLICY "Public Upload" ON storage.objects 
    FOR INSERT TO anon, authenticated 
    WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Public Read" ON storage.objects 
    FOR SELECT TO anon, authenticated 
    USING (bucket_id = 'assets');

CREATE POLICY "Public Update" ON storage.objects 
    FOR UPDATE TO anon, authenticated 
    USING (bucket_id = 'assets');

CREATE POLICY "Public Delete" ON storage.objects 
    FOR DELETE TO anon, authenticated 
    USING (bucket_id = 'assets');

-- ============================================
-- ENABLE REALTIME (Optional)
-- ============================================
-- In Supabase Dashboard → Database → Replication
-- Enable replication for:
-- - profiles
-- - tournaments
-- - registrations
-- - analytics_events
