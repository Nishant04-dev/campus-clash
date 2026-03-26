-- ============================================
-- CAMPUS CLASH - EXPANDED DATABASE SCHEMA
-- ============================================

-- ============================================
-- EXISTING TABLES (Add missing columns)
-- ============================================

-- Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS game_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS entry_fee TEXT DEFAULT 'Free';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 100;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS prize_breakdown JSONB DEFAULT '[]';

-- Registrations
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS team_name TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS game_id TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS rank TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS agree_rules BOOLEAN DEFAULT TRUE;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS leader_name TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS leader_email TEXT;
ALTER TABLE registrations ALTER COLUMN leader_name DROP NOT NULL;
ALTER TABLE registrations ALTER COLUMN leader_email DROP NOT NULL;

-- Site Settings
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS prize_pool TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_poster_url TEXT;

-- ============================================
-- ABOUT PAGE CONTENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS about_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_key TEXT UNIQUE NOT NULL,
    title TEXT,
    subtitle TEXT,
    content TEXT,
    image_url TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default about sections
INSERT INTO about_content (section_key, title, subtitle, content, order_index) VALUES
('hero', 'About Campus Clash', 'The Ultimate Esports Tournament', 'Campus Clash is Chandigarh University premier esports tournament, bringing together the best gamers to compete in exciting games like Valorant, BGMI, and Free Fire.', 1),
('mission', 'Our Mission', 'Building the Future of Campus Gaming', 'We aim to create a platform for gamers to showcase their skills, connect with fellow esports enthusiasts, and experience competitive gaming at its finest.', 2),
('history', 'Our Story', 'From Humble Beginnings', 'Started in 2024, Campus Clash has grown to become one of the most anticipated esports events in North India, attracting hundreds of participants.', 3)
ON CONFLICT (section_key) DO NOTHING;

-- RLS for about_content
ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "About content viewable by everyone" ON about_content FOR SELECT USING (is_active = true OR true);
CREATE POLICY "Admins can manage about content" ON about_content FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ============================================
-- CONTACT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for contact_messages
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send contact messages" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own messages" ON contact_messages FOR SELECT USING (true);
CREATE POLICY "Admins can manage all messages" ON contact_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ============================================
-- TEAM MEMBERS TABLE (Management)
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    designation TEXT,
    department TEXT,
    image_url TEXT,
    bio TEXT,
    social_links JSONB DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default team members
INSERT INTO team_members (name, role, designation, department, display_order) VALUES
('Dr. Rajesh Kumar', 'Director', 'Director of Sports', 'Sports Department', 1),
('Amit Sharma', 'Coordinator', 'Esports Coordinator', 'Esports Club', 2),
('Priya Singh', 'Event Manager', 'Event Head', 'Management', 3)
ON CONFLICT DO NOTHING;

-- RLS for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members viewable by everyone" ON team_members FOR SELECT USING (is_active = true OR true);
CREATE POLICY "Admins can manage team members" ON team_members FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ============================================
-- DEVELOPER INFO TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS developer_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    title TEXT,
    company TEXT,
    image_url TEXT,
    bio TEXT,
    skills JSONB DEFAULT '[]',
    social_links JSONB DEFAULT '{}',
    website_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default developer
INSERT INTO developer_info (name, title, company, bio, website_url) VALUES
('Nishant Chauhan', 'Full Stack Developer', 'Aurix Development', 'Passionate developer building digital experiences. Specialized in web development and esports platforms.', 'https://www.nishantdev.in')
ON CONFLICT DO NOTHING;

-- RLS for developer_info
ALTER TABLE developer_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Developer info viewable by everyone" ON developer_info FOR SELECT USING (is_active = true OR true);
CREATE POLICY "Admins can manage developer info" ON developer_info FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ============================================
-- SPONSORS/PARTNERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze')),
    logo_url TEXT,
    website_url TEXT,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for sponsors
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sponsors viewable by everyone" ON sponsors FOR SELECT USING (is_active = true OR true);
CREATE POLICY "Admins can manage sponsors" ON sponsors FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ============================================
-- FAQ TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for faqs
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FAQs viewable by everyone" ON faqs FOR SELECT USING (is_active = true OR true);
CREATE POLICY "Admins can manage FAQs" ON faqs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ============================================
-- PAGE SECTIONS TABLE (Flexible content)
-- ============================================
CREATE TABLE IF NOT EXISTS page_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_key TEXT NOT NULL,
    section_key TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    content TEXT,
    image_url TEXT,
    button_text TEXT,
    button_url TEXT,
    background_style TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(page_key, section_key)
);

-- Insert default contact page sections
INSERT INTO page_sections (page_key, section_key, title, subtitle, content, order_index) VALUES
('contact', 'info', 'Get In Touch', 'We are here to help', 'Have questions about Campus Clash? Want to partner with us? Reach out!', 1),
('contact', 'email', 'Email Us', 'Quick Response', 'support@campusclash.com', 2),
('contact', 'location', 'Visit Us', 'Chandigarh University', 'Gharuan, Mohali, Punjab 140413', 3)
ON CONFLICT (page_key, section_key) DO NOTHING;

-- RLS for page_sections
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Page sections viewable by everyone" ON page_sections FOR SELECT USING (is_active = true OR true);
CREATE POLICY "Admins can manage page sections" ON page_sections FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tournaments_updated_at ON tournaments;
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_registrations_updated_at ON registrations;
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_developer_info_updated_at ON developer_info;
CREATE TRIGGER update_developer_info_updated_at BEFORE UPDATE ON developer_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sponsors_updated_at ON sponsors;
CREATE TRIGGER update_sponsors_updated_at BEFORE UPDATE ON sponsors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_page_sections_updated_at ON page_sections;
CREATE TRIGGER update_page_sections_updated_at BEFORE UPDATE ON page_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_about_content_updated_at ON about_content;
CREATE TRIGGER update_about_content_updated_at BEFORE UPDATE ON about_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
