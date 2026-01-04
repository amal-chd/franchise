
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Users from dump (including plain text passwords)
const users = [
    { id: 42, name: "Goutham Krishna", email: "krishnagoutham058@gmail.com", pass: "12345678" },
    { id: 63, name: "Vaibhav Shette", email: "vmsenterprise22@gmail.com", pass: "#Vaibhav@123!" },
    { id: 64, name: "Abdul ", email: "finalv@example.com", pass: "password123" },
    { id: 68, name: "Adam Sheez", email: "adamsheez244@gmail.com", pass: "xbxbxnx" }
];

async function main() {
    console.log(`Seeding ${users.length} users via API...`);

    for (const u of users) {
        console.log(`Creating ${u.name} (${u.email})...`);
        const { data, error } = await supabase.auth.signUp({
            email: u.email,
            password: u.pass,
            options: {
                data: {
                    username: u.name,
                    legacy_id: u.id
                }
            }
        });

        if (error) {
            console.error(`Error creating ${u.email}:`, error.message);
        } else {
            console.log(`Success! User ID: ${data.user.id}`);
            // Wait a bit to avoid rate limits
            await new Promise(r => setTimeout(r, 500));
        }
    }
}

main();
