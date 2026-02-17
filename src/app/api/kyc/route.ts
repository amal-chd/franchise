import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';
// import executeQuery from '@/lib/db';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        console.log('KYC Upload: Starting...');
        const formData = await request.formData();
        const file = formData.get('file') as any; // Cast to any to handle different implementations
        const requestId = formData.get('requestId') as string;

        console.log('KYC Upload: File:', file?.name, 'Type:', file?.type, 'Size:', file?.size, 'RequestID:', requestId);

        if (!file || !requestId) {
            console.error('KYC Upload Error: Missing file or requestId');
            return NextResponse.json({ message: 'File and Request ID are required' }, { status: 400 });
        }

        const filename = `${requestId}_${Date.now()}_${(file.name || 'document').replace(/\s/g, '_')}`;
        let fileUrl = '';

        const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.thekada_READ_WRITE_TOKEN || process.env.READ_WRITE_TOKEN;

        if (token) {
            console.log('KYC Upload: Uploading to Vercel Blob...');
            const blob = await put(filename, file, {
                access: 'public',
                token: token,
            });
            fileUrl = blob.url;
            console.log('KYC Upload: File uploaded to Blob:', fileUrl);
        } else {
            if (process.env.NODE_ENV === 'production') {
                console.error('KYC Upload Error: Missing Blob token in production');
                return NextResponse.json({
                    message: 'Upload configuration error: Blob storage token is missing in production.'
                }, { status: 500 });
            }
            console.log('KYC Upload: Falling back to local storage...');

            try {
                // Local storage fallback
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);

                // Ensure directory exists
                const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'kyc');
                await mkdir(uploadDir, { recursive: true });

                const filePath = path.join(uploadDir, filename);
                await writeFile(filePath, buffer);

                fileUrl = `/uploads/kyc/${filename}`;
                console.log('KYC Upload: File saved locally at:', fileUrl);
            } catch (storageError: any) {
                console.error('KYC Upload: Local storage error:', storageError);
                return NextResponse.json({
                    message: 'Failed to save file locally',
                    details: storageError.message
                }, { status: 500 });
            }
        }

        // Update Firestore
        const docRef = firestore.collection('franchise_requests').doc(String(requestId));
        await docRef.update({
            aadhar_url: fileUrl
        });

        console.log('KYC Upload: Success');
        return NextResponse.json({
            message: 'KYC document uploaded successfully',
            fileUrl: fileUrl
        }, { status: 200 });
    } catch (error: any) {
        console.error('KYC Upload Catch Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
