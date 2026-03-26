import { supabase } from '../lib/supabase.js';

export const contentService = {
    // About Content
    async getAboutContent() {
        const { data, error } = await supabase
            .from('about_content')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });
        return { data, error };
    },

    async getAboutSection(sectionKey) {
        const { data, error } = await supabase
            .from('about_content')
            .select('*')
            .eq('section_key', sectionKey)
            .single();
        return { data, error };
    },

    async updateAboutSection(sectionKey, updates) {
        const { data, error } = await supabase
            .from('about_content')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('section_key', sectionKey)
            .select()
            .single();
        return { data, error };
    },

    // Team Members
    async getTeamMembers() {
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        return { data, error };
    },

    async createTeamMember(member) {
        const { data, error } = await supabase
            .from('team_members')
            .insert(member)
            .select()
            .single();
        return { data, error };
    },

    async updateTeamMember(id, updates) {
        const { data, error } = await supabase
            .from('team_members')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    async deleteTeamMember(id) {
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', id);
        return { error };
    },

    // Developer Info
    async getDeveloperInfo() {
        const { data, error } = await supabase
            .from('developer_info')
            .select('*')
            .eq('is_active', true)
            .single();
        return { data, error };
    },

    async updateDeveloperInfo(updates) {
        const { data, error } = await supabase
            .from('developer_info')
            .update(updates)
            .eq('is_active', true)
            .select()
            .single();
        return { data, error };
    },

    // Contact Messages
    async sendContactMessage(message) {
        const { data, error } = await supabase
            .from('contact_messages')
            .insert(message)
            .select()
            .single();
        return { data, error };
    },

    async getContactMessages() {
        const { data, error } = await supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });
        return { data, error };
    },

    async markMessageRead(id) {
        const { data, error } = await supabase
            .from('contact_messages')
            .update({ is_read: true, replied_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    async deleteMessage(id) {
        const { error } = await supabase
            .from('contact_messages')
            .delete()
            .eq('id', id);
        return { error };
    },

    // Sponsors
    async getSponsors() {
        const { data, error } = await supabase
            .from('sponsors')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        return { data, error };
    },

    async createSponsor(sponsor) {
        const { data, error } = await supabase
            .from('sponsors')
            .insert(sponsor)
            .select()
            .single();
        return { data, error };
    },

    async updateSponsor(id, updates) {
        const { data, error } = await supabase
            .from('sponsors')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    async deleteSponsor(id) {
        const { error } = await supabase
            .from('sponsors')
            .delete()
            .eq('id', id);
        return { error };
    },

    // FAQs
    async getFAQs(category = null) {
        let query = supabase
            .from('faqs')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        
        if (category) {
            query = query.eq('category', category);
        }
        
        const { data, error } = await query;
        return { data, error };
    },

    async createFAQ(faq) {
        const { data, error } = await supabase
            .from('faqs')
            .insert(faq)
            .select()
            .single();
        return { data, error };
    },

    async updateFAQ(id, updates) {
        const { data, error } = await supabase
            .from('faqs')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    async deleteFAQ(id) {
        const { error } = await supabase
            .from('faqs')
            .delete()
            .eq('id', id);
        return { error };
    },

    // Page Sections
    async getPageSections(pageKey) {
        const { data, error } = await supabase
            .from('page_sections')
            .select('*')
            .eq('page_key', pageKey)
            .eq('is_active', true)
            .order('order_index', { ascending: true });
        return { data, error };
    },

    async updatePageSection(pageKey, sectionKey, updates) {
        const { data, error } = await supabase
            .from('page_sections')
            .update(updates)
            .eq('page_key', pageKey)
            .eq('section_key', sectionKey)
            .select()
            .single();
        return { data, error };
    }
};
