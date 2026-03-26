-- ============================================
-- CAMPUS CLASH - FIX DUPLICATE POLICIES
-- ============================================

-- Drop existing duplicate policies first
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

DROP POLICY IF EXISTS "Tournaments are viewable by everyone" ON tournaments;
DROP POLICY IF EXISTS "Managers can insert tournaments" ON tournaments;
DROP POLICY IF EXISTS "Managers can update tournaments" ON tournaments;
DROP POLICY IF EXISTS "Super admins can delete tournaments" ON tournaments;

DROP POLICY IF EXISTS "Users can view own registrations" ON registrations;
DROP POLICY IF EXISTS "Users can create registrations" ON registrations;
DROP POLICY IF EXISTS "Users can update own pending registrations" ON registrations;
DROP POLICY IF EXISTS "Managers can view all registrations" ON registrations;
DROP POLICY IF EXISTS "Managers can update registrations" ON registrations;

DROP POLICY IF EXISTS "Analytics are insertable by everyone" ON analytics_events;
DROP POLICY IF EXISTS "Managers can view analytics" ON analytics_events;

DROP POLICY IF EXISTS "Site settings are viewable by everyone" ON site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;

-- ============================================
-- PROFILES TABLE - RECREATE POLICIES
-- ============================================
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

-- ============================================
-- TOURNAMENTS TABLE - RECREATE POLICIES
-- ============================================
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
-- REGISTRATIONS TABLE - RECREATE POLICIES
-- ============================================
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
-- ANALYTICS EVENTS TABLE - RECREATE POLICIES
-- ============================================
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
-- SITE SETTINGS TABLE - RECREATE POLICIES
-- ============================================
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
-- STORAGE BUCKET - RECREATE POLICIES
-- ============================================
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
-- HELPER FUNCTIONS (RPC)
-- ============================================
DROP FUNCTION IF EXISTS increment_tournament_views(UUID);
DROP FUNCTION IF EXISTS increment_registrations(UUID);
DROP FUNCTION IF EXISTS decrement_registrations(UUID);

CREATE OR REPLACE FUNCTION increment_tournament_views(t_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE tournaments 
    SET views_count = COALESCE(views_count, 0) + 1 
    WHERE id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_registrations(t_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE tournaments 
    SET registrations_count = COALESCE(registrations_count, 0) + 1 
    WHERE id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_registrations(t_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE tournaments 
    SET registrations_count = GREATEST(COALESCE(registrations_count, 0) - 1, 0) 
    WHERE id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ENSURE DEFAULT SETTINGS EXISTS
-- ============================================
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
