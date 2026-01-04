import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // This 'category' param might be ID or name? Assuming name based on frontend.
    const isAdmin = searchParams.get('admin') === 'true';

    try {
        let query = supabase
            .from('shop_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (!isAdmin) {
            query = query.eq('status', true);
        }

        if (category) {
            // Frontend might send category string now
            query = query.eq('category', category);
        }

        // Limit
        query = query.limit(100);

        const { data: products, error } = await query;

        if (error) throw error;

        return NextResponse.json(products);
    } catch (error: any) {
        console.error("Products API Error:", error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

// Enable CRUD for Admin using supabaseAdmin (bypassing RLS)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Attempting to add product:", JSON.stringify(body));

        const { name, description, price, image_url, category, category_id, stock } = body;

        // Validation
        if (!name || !price) {
            console.error("Validation failed: Name and Price are required");
            return NextResponse.json({ error: 'Name and Price are required' }, { status: 400 });
        }

        console.log("Using Supabase Admin to insert...");
        // Use category string if provided, fallback to category_id if formatted as int (optional)
        const payload: any = {
            name,
            description,
            price,
            image_url,
            stock,
            status: true
        };

        // If the database has both columns now, we can save both if available.
        // If we only have 'category' column (text), we save to it.
        // If we have 'category_id' (int), we save to it.
        // My migration ADDED 'category' (text).
        if (category) payload.category = category;
        if (category_id) payload.category_id = category_id;

        const { data, error } = await supabaseAdmin
            .from('shop_items')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error("Supabase Insert Error:", JSON.stringify(error));
            console.error("Service Role Key present?", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
            throw error;
        }

        console.log("Product added successfully:", data.id);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Product POST exception:", error);
        return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, description, price, image_url, category, category_id, stock, status } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (price !== undefined) updates.price = price;
        if (image_url !== undefined) updates.image_url = image_url;
        if (category !== undefined) updates.category = category;
        if (category_id !== undefined) updates.category_id = category_id;
        if (stock !== undefined) updates.stock = stock;
        if (status !== undefined) updates.status = status;

        const { data, error } = await supabaseAdmin
            .from('shop_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { error } = await supabaseAdmin
            .from('shop_items')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
