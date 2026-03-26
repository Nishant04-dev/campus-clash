import { supabase } from '../lib/supabase.js';

const SETTINGS_TABLE = 'site_settings';

export const settingsService = {
    async getSettings() {
        const { data, error } = await supabase
            .from(SETTINGS_TABLE)
            .select('*')
            .eq('id', 1)
            .single();
        
        if (error && error.code === 'PGRST116') {
            const { data: newSettings, error: createError } = await supabase
                .from(SETTINGS_TABLE)
                .insert({ id: 1 })
                .select()
                .single();
            return { data: newSettings, error: createError };
        }
        
        return { data, error };
    },

    async updateSettings(updates) {
        const { data, error } = await supabase
            .from(SETTINGS_TABLE)
            .update({ 
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', 1)
            .select()
            .single();
        
        return { data, error };
    },

    async uploadLogo(file) {
        const user = await supabase.auth.getUser();
        if (!user) return { error: { message: 'Not authenticated' } };

        const fileExt = file.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, file);

        if (uploadError) return { error: uploadError };

        const { data: { publicUrl } } = supabase.storage
            .from('assets')
            .getPublicUrl(filePath);

        await this.updateSettings({ logo_url: publicUrl });
        
        return { data: { url: publicUrl }, error: null };
    },

    async uploadBanner(file) {
        const user = await supabase.auth.getUser();
        if (!user) return { error: { message: 'Not authenticated' } };

        const fileExt = file.name.split('.').pop();
        const fileName = `banner-${Date.now()}.${fileExt}`;
        const filePath = `banners/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, file);

        if (uploadError) return { error: uploadError };

        const { data: { publicUrl } } = supabase.storage
            .from('assets')
            .getPublicUrl(filePath);

        return { data: { url: publicUrl }, error: null };
    }
};
