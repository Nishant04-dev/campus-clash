import { supabase } from '../lib/supabase.js';

const ANALYTICS_TABLE = 'analytics_events';

export const analyticsService = {
    async trackView(tournamentId, userId = null) {
        try {
            await supabase.rpc('increment_tournament_views', { t_id: tournamentId });
        } catch (e) {
            console.warn('RPC increment failed, trying direct update');
            const { data: t } = await supabase
                .from('tournaments')
                .select('views_count')
                .eq('id', tournamentId)
                .single();
            
            await supabase
                .from('tournaments')
                .update({ views_count: (t?.views_count || 0) + 1 })
                .eq('id', tournamentId);
        }

        return await supabase
            .from(ANALYTICS_TABLE)
            .insert({
                event_type: 'view',
                tournament_id: tournamentId,
                user_id: userId,
                metadata: {
                    user_agent: navigator.userAgent,
                    referrer: document.referrer
                }
            });
    },

    async trackClick(tournamentId, userId = null, metadata = {}) {
        return await supabase
            .from(ANALYTICS_TABLE)
            .insert({
                event_type: 'click',
                tournament_id: tournamentId,
                user_id: userId,
                metadata: {
                    ...metadata,
                    timestamp: new Date().toISOString()
                }
            });
    },

    async trackRegistration(tournamentId, userId, metadata = {}) {
        return await supabase
            .from(ANALYTICS_TABLE)
            .insert({
                event_type: 'registration',
                tournament_id: tournamentId,
                user_id: userId,
                metadata
            });
    },

    async getStats() {
        const { data: events } = await supabase
            .from(ANALYTICS_TABLE)
            .select('event_type, created_at');

        if (!events) return { views: 0, clicks: 0, registrations: 0 };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return {
            totalViews: events.filter(e => e.event_type === 'view').length,
            totalClicks: events.filter(e => e.event_type === 'click').length,
            totalRegistrations: events.filter(e => e.event_type === 'registration').length,
            viewsToday: events.filter(e => 
                e.event_type === 'view' && 
                new Date(e.created_at) >= today
            ).length,
            clicksToday: events.filter(e => 
                e.event_type === 'click' && 
                new Date(e.created_at) >= today
            ).length
        };
    },

    async getRecentEvents(limit = 50) {
        const { data, error } = await supabase
            .from(ANALYTICS_TABLE)
            .select(`
                *,
                tournaments (title)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        return { data, error };
    },

    async getTournamentAnalytics(tournamentId) {
        const { data: events } = await supabase
            .from(ANALYTICS_TABLE)
            .select('event_type, created_at')
            .eq('tournament_id', tournamentId);

        if (!events) return { views: 0, clicks: 0, registrations: 0 };

        return {
            views: events.filter(e => e.event_type === 'view').length,
            clicks: events.filter(e => e.event_type === 'click').length,
            registrations: events.filter(e => e.event_type === 'registration').length
        };
    }
};
