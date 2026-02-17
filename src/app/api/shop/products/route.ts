import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isAdmin = searchParams.get('admin') === 'true';

    try {
        let query: any = firestore.collection('products');

        if (!isAdmin) {
            query = query.where('status', '==', true);
        }

        if (category) {
            query = query.where('category', '==', category);
        }

        // Apply ordering (requires index for compound queries)
        // For now, sorting by created_at desc manually or if index exists
        // query = query.orderBy('created_at', 'desc'); 

        const snapshot = await query.get();
        let products = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        }));

        // Manual sort if index check fails often
        products = products.sort((a: any, b: any) => {
            const tA = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at).getTime();
            const tB = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at).getTime();
            return tB - tA;
        });

        return NextResponse.json(products);
    } catch (error: any) {
        console.error("Products API Error:", error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

// Enable CRUD for Admin
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, price, image_url, category, category_id, stock } = body;

        // Validation
        if (!name || !price) {
            return NextResponse.json({ error: 'Name and Price are required' }, { status: 400 });
        }

        const newProduct = {
            name,
            description,
            price: Number(price),
            image_url,
            stock: Number(stock) || 0,
            status: true,
            category: category || null,
            category_id: category_id || null, // Keeping for compatibility
            created_at: new Date()
        };

        const docRef = await firestore.collection('products').add(newProduct);

        return NextResponse.json({ id: docRef.id, ...newProduct });
    } catch (error: any) {
        console.error("Product POST exception:", error);
        return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        // Filter valid updates
        const validUpdates: any = {};
        if (updates.name !== undefined) validUpdates.name = updates.name;
        if (updates.description !== undefined) validUpdates.description = updates.description;
        if (updates.price !== undefined) validUpdates.price = Number(updates.price);
        if (updates.image_url !== undefined) validUpdates.image_url = updates.image_url;
        if (updates.category !== undefined) validUpdates.category = updates.category;
        if (updates.stock !== undefined) validUpdates.stock = Number(updates.stock);
        if (updates.status !== undefined) validUpdates.status = updates.status;

        // Add updated_at
        validUpdates.updated_at = new Date();

        await firestore.collection('products').doc(id).update(validUpdates);

        // Fetch updated doc to return
        const updatedDoc = await firestore.collection('products').doc(id).get();

        return NextResponse.json({ id, ...updatedDoc.data() });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await firestore.collection('products').doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
