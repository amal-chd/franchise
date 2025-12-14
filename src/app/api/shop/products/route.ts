import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isAdmin = searchParams.get('admin') === 'true'; // Basic check, ideally use session/auth

    let query = 'SELECT * FROM products';
    const values = [];

    if (!isAdmin) {
        query += ' WHERE is_active = TRUE';
    }

    if (category) {
        query += isAdmin ? ' WHERE category = ?' : ' AND category = ?';
        values.push(category);
    }

    // Fix: Handle case where both isAdmin is true and category is present (WHERE used twice if not careful)
    // Actually, let's rewrite the logic cleaner
    // query = 'SELECT * FROM products WHERE 1=1'
    // if (!isAdmin) query += ' AND is_active = TRUE'
    // if (category) query += ' AND category = ?'

    let cleanQuery = 'SELECT * FROM products WHERE 1=1';
    const cleanValues = [];

    if (!isAdmin) {
        cleanQuery += ' AND is_active = TRUE';
    }

    if (category) {
        cleanQuery += ' AND category = ?';
        cleanValues.push(category);
    }

    cleanQuery += ' ORDER BY created_at DESC';

    try {
        const products = await executeQuery({ query: cleanQuery, values: cleanValues });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

// For Admin: Create Product
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, price, image_url, category, stock } = body;

        const result = await executeQuery({
            query: 'INSERT INTO products (name, description, price, image_url, category, stock) VALUES (?, ?, ?, ?, ?, ?)',
            values: [name, description, price, image_url, category, stock || 0]
        });

        return NextResponse.json({ success: true, result });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
