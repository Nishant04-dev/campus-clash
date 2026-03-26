import { supabase } from '../lib/supabase.js';

const REGISTRATIONS_TABLE = 'registrations';

export const registrationService = {
    async register(registrationData) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'Please login to register' } };

        const { data: existing } = await supabase
            .from(REGISTRATIONS_TABLE)
            .select('id')
            .eq('user_id', user.id)
            .eq('tournament_id', registrationData.tournament_id)
            .single();

        if (existing) {
            return { error: { message: 'You have already registered for this tournament' } };
        }

        const { data, error } = await supabase
            .from(REGISTRATIONS_TABLE)
            .insert({
                ...registrationData,
                user_id: user.id,
                verification_status: 'pending'
            })
            .select()
            .single();

        if (!error && data) {
            await supabase.rpc('increment_registrations', { t_id: registrationData.tournament_id });
        }

        return { data, error };
    },

    async getByUserId(userId = null) {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;
        
        if (!targetUserId) return { data: null, error: { message: 'Not authenticated' } };

        const { data, error } = await supabase
            .from(REGISTRATIONS_TABLE)
            .select(`
                *,
                tournaments (
                    id,
                    title,
                    game,
                    mode,
                    prize_pool,
                    banner_url,
                    registration_link
                )
            `)
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });
        
        return { data, error };
    },

    async getAllRegistrations() {
        const { data, error } = await supabase
            .from(REGISTRATIONS_TABLE)
            .select(`
                *,
                tournaments (id, title, game, mode),
                profiles (id, name, email)
            `)
            .order('created_at', { ascending: false });
        
        return { data, error };
    },

    async getByTournamentId(tournamentId) {
        const { data, error } = await supabase
            .from(REGISTRATIONS_TABLE)
            .select(`
                *,
                profiles (id, name, email)
            `)
            .eq('tournament_id', tournamentId)
            .order('created_at', { ascending: false });
        
        return { data, error };
    },

    async updateStatus(id, status) {
        const { data, error } = await supabase
            .from(REGISTRATIONS_TABLE)
            .update({ 
                verification_status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        
        return { data, error };
    },

    async cancelRegistration(id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'Not authenticated' } };

        const { data: reg } = await supabase
            .from(REGISTRATIONS_TABLE)
            .select('user_id, tournament_id')
            .eq('id', id)
            .single();

        if (reg?.user_id !== user.id) {
            return { error: { message: 'Unauthorized' } };
        }

        const { error } = await supabase
            .from(REGISTRATIONS_TABLE)
            .delete()
            .eq('id', id);

        if (!error) {
            await supabase.rpc('decrement_registrations', { t_id: reg.tournament_id });
        }

        return { error };
    }
};
