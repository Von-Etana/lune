const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.rpc('execute_sql', {
        sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS user_preferences JSONB DEFAULT '{}'::jsonb;`
    });

    if (error) {
        console.error('RPC Error (Anon key might not have privileges):', error);
    } else {
        console.log('Success:', data);
    }
}

run();
