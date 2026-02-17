import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';
// import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const snapshot = await firestore.collection('plan_change_requests')
            .orderBy('created_at', 'desc')
            .get();

        const requests = await Promise.all(snapshot.docs.map(async (doc: any) => {
            const data = doc.data();
            const franchiseId = data.franchise_id;

            // Allow manual join
            let franchiseName = 'Unknown';
            let franchiseEmail = 'N/A';
            let franchisePhone = 'N/A';

            if (franchiseId) {
                const franchiseDoc = await firestore.collection('franchise_requests').doc(String(franchiseId)).get();
                if (franchiseDoc.exists) {
                    const franchiseData = franchiseDoc.data();
                    franchiseName = franchiseData?.name || 'Unknown';
                    franchiseEmail = franchiseData?.email || 'N/A';
                    franchisePhone = franchiseData?.phone || 'N/A';
                }
            }

            return {
                id: doc.id,
                ...data,
                // created_at: data.created_at?.toDate(), // Ensure client handles serialized dates
                franchise_name: franchiseName,
                franchise_email: franchiseEmail,
                franchise_phone: franchisePhone,
            };
        }));

        return NextResponse.json(requests);
    } catch (error: any) {
        console.error('Failed to fetch plan requests:', error);
        return NextResponse.json({ error: 'Failed to fetch plan requests' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { requestId, action } = await req.json();

        if (!requestId || !action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const requestRef = firestore.collection('plan_change_requests').doc(String(requestId));
        const requestDoc = await requestRef.get();

        if (!requestDoc.exists) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        const requestData = requestDoc.data();

        if (requestData?.status !== 'pending') {
            return NextResponse.json({ error: 'Request is already processed' }, { status: 400 });
        }

        if (action === 'approve') {
            // Update franchise plan in franchise_requests collection (acting as franchises table)
            const franchiseId = requestData?.franchise_id;
            if (franchiseId) {
                await firestore.collection('franchise_requests').doc(String(franchiseId)).update({
                    plan_selected: requestData?.requested_plan
                });
            }

            // Update request status
            await requestRef.update({ status: 'approved' });

        } else {
            // Reject request
            await requestRef.update({ status: 'rejected' });
        }

        return NextResponse.json({ success: true, message: `Request ${action}ed successfully` });
    } catch (error: any) {
        console.error('Failed to process plan request:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
