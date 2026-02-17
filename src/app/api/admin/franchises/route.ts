import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';
import { logActivity } from '@/lib/activityLogger';

// POST: Create a new franchise request
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name, email, phone, city,
            plan_selected, status,
            upi_id, bank_account_number, ifsc_code, bank_name
        } = body;

        const newFranchise = {
            name,
            email,
            phone,
            city,
            source: 'admin_manual',
            plan_selected: plan_selected || 'standard',
            status: status || 'pending_verification',
            upi_id: upi_id || '',
            bank_account_number: bank_account_number || '',
            ifsc_code: ifsc_code || '',
            bank_name: bank_name || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const docRef = await firestore.collection('franchise_requests').add(newFranchise);

        // Log Activity
        await logActivity({
            actor_id: 'admin', // standardizing actor_id
            actor_type: 'admin',
            action: 'FRANCHISE_CREATED',
            entity_type: 'franchise_request',
            entity_id: docRef.id,
            details: { name, email, city }
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error: any) {
        console.error('Create Franchise Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}

// PUT: Update franchise request details
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ message: 'ID required' }, { status: 400 });
        }

        const updatedFranchise = {
            ...updateData,
            updated_at: new Date().toISOString()
        };

        await firestore.collection('franchise_requests').doc(id).update(updatedFranchise);

        // Log Activity
        await logActivity({
            actor_id: 'admin',
            actor_type: 'admin',
            action: 'FRANCHISE_UPDATED',
            entity_type: 'franchise_request',
            entity_id: id,
            details: { ...updateData }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Update Franchise Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}

// DELETE: Delete a franchise request
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'ID required' }, { status: 400 });
        }

        await firestore.collection('franchise_requests').doc(id).delete();

        // Log Activity
        await logActivity({
            actor_id: 'admin',
            actor_type: 'admin',
            action: 'FRANCHISE_DELETED',
            entity_type: 'franchise_request',
            entity_id: id,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete Franchise Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
