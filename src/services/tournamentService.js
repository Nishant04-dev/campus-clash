import { supabase } from '../lib/supabase.js';

const TOURNAMENTS_TABLE = 'tournaments';
const REGISTRATIONS_TABLE = 'registrations';

export const tournamentService = {
    async getAll() {
        const { data, error } = await supabase
            .from(TOURNAMENTS_TABLE)
            .select('*')
            .order('created_at', { ascending: false });
        return { data, error };
    },

    async getUpcoming() {
        const { data, error } = await supabase
            .from(TOURNAMENTS_TABLE)
            .select('*')
            .eq('status', 'upcoming')
            .order('start_date', { ascending: true });
        return { data, error };
    },

    async getFeatured() {
        const { data, error } = await supabase
            .from(TOURNAMENTS_TABLE)
            .select('*')
            .eq('is_featured', true)
            .limit(1)
            .single();
        return { data, error };
    },

    async getById(id) {
        const { data, error } = await supabase
            .from(TOURNAMENTS_TABLE)
            .select('*')
            .eq('id', id)
            .single();
        return { data, error };
    },

    async create(tournament) {
        const { data, error } = await supabase
            .from(TOURNAMENTS_TABLE)
            .insert(tournament)
            .select()
            .single();
        return { data, error };
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from(TOURNAMENTS_TABLE)
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    async delete(id) {
        const { error } = await supabase
            .from(TOURNAMENTS_TABLE)
            .delete()
            .eq('id', id);
        return { error };
    },

    async getStats() {
        const { data: tournaments } = await supabase
            .from(TOURNAMENTS_TABLE)
            .select('id, views_count, registrations_count');
        
        const { data: registrations } = await supabase
            .from(REGISTRATIONS_TABLE)
            .select('id');
        
        return {
            totalTournaments: tournaments?.length || 0,
            totalViews: tournaments?.reduce((sum, t) => sum + (t.views_count || 0), 0) || 0,
            totalRegistrations: registrations?.length || 0
        };
    }
};
