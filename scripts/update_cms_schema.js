const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Function to load env variables from .env.local
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '../.env.local');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            });
            console.log('Loaded environment variables from .env.local');
        }
    } catch (error) {
        console.error('Error loading .env.local:', error);
    }
}

loadEnv();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    ssl: {
        rejectUnauthorized: false
    }
};

async function updateCMSSchema() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected!');

        // Insert default content for new sections
        console.log('Adding new CMS content keys...');

        const newContent = [
            // Background images
            ['hero_background_url', '', 'image'],
            ['about_background_url', '', 'image'],
            ['testimonials_background_url', '', 'image'],

            // Testimonials (JSON array)
            ['testimonials', JSON.stringify([
                {
                    id: 1,
                    name: 'Rajesh Kumar',
                    role: 'Franchise Owner',
                    company: 'The Kada - Kochi',
                    message: 'Joining The Kada has transformed my business. The platform is easy to use and customer support is excellent.',
                    avatar: '',
                    rating: 5
                },
                {
                    id: 2,
                    name: 'Priya Sharma',
                    role: 'Store Manager',
                    company: 'The Kada - Thrissur',
                    message: 'Best decision for our local store. Sales have increased by 40% since we partnered with The Kada.',
                    avatar: '',
                    rating: 5
                },
                {
                    id: 3,
                    name: 'Arun Menon',
                    role: 'Entrepreneur',
                    company: 'The Kada - Kannur',
                    message: 'The technology platform is world-class. Our customers love the convenience and fast delivery.',
                    avatar: '',
                    rating: 5
                }
            ]), 'json'],

            // How It Works steps
            ['how_it_works', JSON.stringify([
                {
                    id: 1,
                    title: 'Apply Online',
                    description: 'Fill out our simple application form with your details and business information.',
                    icon: 'fa-file-alt'
                },
                {
                    id: 2,
                    title: 'Get Verified',
                    description: 'Our team reviews your application and verifies your documents within 24-48 hours.',
                    icon: 'fa-check-circle'
                },
                {
                    id: 3,
                    title: 'Setup & Training',
                    description: 'We help you set up the platform and provide comprehensive training for your team.',
                    icon: 'fa-graduation-cap'
                },
                {
                    id: 4,
                    title: 'Go Live',
                    description: 'Launch your franchise and start serving customers with our full support.',
                    icon: 'fa-rocket'
                }
            ]), 'json'],

            // Partner brands
            ['partner_brands', JSON.stringify([
                { id: 1, name: 'Partner 1', logo_url: '' },
                { id: 2, name: 'Partner 2', logo_url: '' },
                { id: 3, name: 'Partner 3', logo_url: '' }
            ]), 'json'],

            // FAQ items
            ['faq_items', JSON.stringify([
                {
                    id: 1,
                    question: 'What is the initial investment required?',
                    answer: 'The initial investment varies based on location and setup. Contact us for detailed pricing information.'
                },
                {
                    id: 2,
                    question: 'How long does it take to set up a franchise?',
                    answer: 'Typically, the entire process from application to launch takes 2-4 weeks, including verification and training.'
                },
                {
                    id: 3,
                    question: 'What kind of support do you provide?',
                    answer: 'We provide comprehensive support including technology platform, training, marketing materials, and ongoing operational assistance.'
                },
                {
                    id: 4,
                    question: 'Do I need technical knowledge to run the franchise?',
                    answer: 'No technical knowledge is required. We provide complete training and our platform is designed to be user-friendly.'
                },
                {
                    id: 5,
                    question: 'What are the revenue sharing terms?',
                    answer: 'Revenue sharing terms are discussed during the application process and vary based on location and business model.'
                }
            ]), 'json']
        ];

        for (const [key, value, type] of newContent) {
            await connection.execute(
                'INSERT INTO site_content (content_key, content_value, content_type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE content_value = ?, content_type = ?',
                [key, value, type, value, type]
            );
            console.log(`Added/Updated: ${key}`);
        }

        console.log('CMS schema update completed successfully.');

    } catch (error) {
        console.error('CMS schema update failed:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

updateCMSSchema();
