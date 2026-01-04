
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabaseAdminClient;

if (!supabaseUrl) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseServiceKey) {
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY - Admin operations will fail. Please add it to .env.local');
    // We cannot create a valid client without a key. 
    // We'll create a dummy proxy that throws meaningful errors when used, 
    // or just let createClient fail if we pass empty string but standard lib throws "supabaseKey is required"
}

// Ensure we have strings to avoid runtime crash on init, but operations will fail if key wrong
const validUrl = supabaseUrl || 'https://placeholder.supabase.co';
const validKey = supabaseServiceKey || 'placeholder_key';

export const supabaseAdmin = createClient(validUrl, validKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})
