import { supabase } from '../lib/supabase.js';

const BUCKET_NAME = 'assets';

export const uploadService = {
    async checkBucketAccess() {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('Bucket access error:', error);
            return false;
        }
        const bucket = data?.find(b => b.name === BUCKET_NAME);
        return !!bucket;
    },

    async createBucketIfNotExists() {
        const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: 5242880
        });
        return { data, error };
    },

    async uploadFile(file, folder = 'uploads') {
        if (!file) return { error: { message: 'No file provided' } };

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return { error: { message: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP' } };
        }

        if (file.size > 5 * 1024 * 1024) {
            return { error: { message: 'File too large. Max size: 5MB' } };
        }

        const fileExt = file.name.split('.').pop().toLowerCase();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            return { error };
        }

        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return { data: { url: publicUrl, path: filePath }, error: null };
    },

    async deleteFile(filePath) {
        if (!filePath) return { error: null };
        
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([filePath]);
        
        return { error };
    },

    async getPublicUrl(filePath) {
        return supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    },

    async listFiles(folder = '') {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list(folder, {
                limit: 100,
                sortBy: { column: 'created_at', order: 'desc' }
            });
        return { data, error };
    }
};

window.uploadService = uploadService;
