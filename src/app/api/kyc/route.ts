import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
    try {
        console.log('KYC Upload: Starting...');
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const requestId = formData.get('requestId') as string;

        console.log('KYC Upload: File:', file?.name, 'RequestID:', requestId);

        if (!file || !requestId) {
            console.log('KYC Upload: Missing file or requestId');
            return NextResponse.json({ message: 'File and Request ID are required' }, { status: 400 });
        }

        const filename = `${requestId}_${Date.now()}_${file.name.replace(/\s/g, '_')}`;

        console.log('KYC Upload: Uploading to Vercel Blob...');

        const blob = await put(filename, file, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN || process.env.thekada_READ_WRITE_TOKEN || process.env.READ_WRITE_TOKEN,
        });

        console.log('KYC Upload: File uploaded to Blob:', blob.url);

        const result = await executeQuery({
            query: 'UPDATE franchise_requests SET aadhar_url = ? WHERE id = ?',
            values: [blob.url, requestId],
        });

        console.log('KYC Upload: Database update result:', result);

        return NextResponse.json({ message: 'KYC document uploaded successfully', fileUrl: blob.url }, { status: 200 });
    } catch (error: any) {
        console.error('KYC Upload Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
