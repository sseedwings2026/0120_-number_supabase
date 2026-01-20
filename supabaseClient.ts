
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mmyrsouqnuevyoxxryso.supabase.co';
const supabaseKey = 'sb_publishable__aPsUxL63ASkPODr2GPARA_1BMEoQ4W';

export const supabase = createClient(supabaseUrl, supabaseKey);
