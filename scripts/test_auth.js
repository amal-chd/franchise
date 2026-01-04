
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const email = 'test_' + Date.now() + '@example.com';
    const password = 'password123';

    console.log('Signing up:', email);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        console.error('SignUp Error:', signUpError);
        return;
    }
    console.log('SignUp Success:', signUpData.user.id);

    console.log('Signing in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (signInError) {
        console.error('SignIn Error:', signInError);
    } else {
        console.log('SignIn Success! Access Token:', signInData.session.access_token.substring(0, 20) + '...');
    }
}

main();
