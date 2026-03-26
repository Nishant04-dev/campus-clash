import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { config } from './config.js';

export const supabase = createClient(config.supabase.url, config.supabase.key);
console.log('Campus Clash: Supabase initialized.');
