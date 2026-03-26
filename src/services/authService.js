import { supabase } from '../lib/supabase.js';

export const authService = {
    async signUp(email, password, name) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { 
                data: { name },
                emailRedirectTo: window.location.origin
            }
        });
        return { data, error };
    },

    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return { data, error };
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    async getCurrentUser() {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return null;
        
        const { data: profile, error: pError } = await supabase.from('profiles')
            .select('*').eq('id', user.id).single();
            
        if (pError && pError.code !== 'PGRST116') {
            console.error('Profile fetch error:', pError);
        }
            
        return { ...user, profile };
    },

    async updateProfile(updates) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'Not authenticated' } };
        
        return await supabase.from('profiles')
            .update(updates)
            .eq('id', user.id);
    },

    async resetPassword(email) {
        return await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });
    },

    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                await this.ensureProfile(session.user);
            }
            callback(event, session);
        });
    },

    async ensureProfile(user) {
        const { data: existing } = await supabase.from('profiles')
            .select('id').eq('id', user.id).single();
            
        if (!existing) {
            await supabase.from('profiles').insert({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || '',
                role: 'user'
            });
        }
    }
};
