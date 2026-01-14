import { createClient } from '@supabase/supabase-js';

// Using provided Supabase credentials
const supabaseUrl = 'https://atsczzxikurdzxpgdmka.supabase.co';
const supabaseAnonKey = 'sb_publishable_-PcMAK2vzLccZSOqOUUvQA_EhAEiKbK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
