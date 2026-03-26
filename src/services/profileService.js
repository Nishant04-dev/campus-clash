import { supabase } from '../lib/supabase.js';

const PROFILES_TABLE = 'profiles';

export const profileService = {
    async getAll() {
        const { data, error } = await supabase
            .from(PROFILES_TABLE)
            .select('*')
            .order('created_at', { ascending: false });
        return { data, error };
    },

    async getById(id) {
        const { data, error } = await supabase
            .from(PROFILES_TABLE)
            .select('*')
            .eq('id', id)
            .single();
        return { data, error };
    },

    async updateProfile(id, updates) {
        const { data, error } = await supabase
            .from(PROFILES_TABLE)
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    async updateRole(userId, newRole) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'Not authenticated' } };

        const { data: adminProfile } = await supabase
            .from(PROFILES_TABLE)
            .select('role')
            .eq('id', user.id)
            .single();

        if (!['admin', 'super_admin'].includes(adminProfile?.role)) {
            return { error: { message: 'Unauthorized - Admin access required' } };
        }

        return await supabase
            .from(PROFILES_TABLE)
            .update({ 
                role: newRole,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
    },

    async deleteProfile(userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'Not authenticated' } };

        const { data: adminProfile } = await supabase
            .from(PROFILES_TABLE)
            .select('role')
            .eq('id', user.id)
            .single();

        if (adminProfile?.role !== 'super_admin') {
            return { error: { message: 'Unauthorized - Super Admin access required' } };
        }

        const { error: profileError } = await supabase
            .from(PROFILES_TABLE)
            .delete()
            .eq('id', userId);

        if (!profileError) {
            await supabase.auth.admin.deleteUser(userId);
        }

        return { error: profileError };
    },

    async getStats() {
        const { data: profiles } = await supabase
            .from(PROFILES_TABLE)
            .select('role');

        const stats = {
            total: profiles?.length || 0,
            admins: profiles?.filter(p => ['admin', 'super_admin', 'manager'].includes(p.role)).length || 0,
            users: profiles?.filter(p => p.role === 'user').length || 0
        };

        return stats;
    }
};
