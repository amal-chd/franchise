import { NextResponse } from 'next/server';
import { firestore, getStorageBucket } from '@/lib/firebase';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const requestId = formData.get('requestId') as string;

        if (!file || !requestId) {
            return NextResponse.json({ message: 'File and Request ID are required' }, { status: 400 });
        }

        const bucket = getStorageBucket();
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = (file.name || 'document').replace(/\s/g, '_');
        const filePath = `kyc/${requestId}_${Date.now()}_${safeName}`;

        const blob = bucket.file(filePath);
        await blob.save(buffer, { metadata: { contentType: file.type } });
        await blob.makePublic();

        const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        // Update Firestore
        const docRef = firestore.collection('franchise_requests').doc(String(requestId));
        await docRef.update({ aadhar_url: fileUrl });

        return NextResponse.json({
            message: 'KYC document uploaded successfully',
            fileUrl: fileUrl
        }, { status: 200 });
    } catch (error: any) {
        console.error('KYC Upload Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
