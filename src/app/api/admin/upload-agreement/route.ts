import { NextResponse } from 'next/server';
import { getStorageBucket } from '@/lib/firebase';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            return NextResponse.json({ message: 'Only PDF files are allowed' }, { status: 400 });
        }

        const bucket = getStorageBucket();
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = file.name.replace(/\s/g, '_');
        const filePath = `agreements/agreement_${Date.now()}_${safeName}`;

        const blob = bucket.file(filePath);
        await blob.save(buffer, { metadata: { contentType: file.type } });
        await blob.makePublic();

        const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        return NextResponse.json({ success: true, url: fileUrl }, { status: 200 });
    } catch (error: any) {
        console.error('Agreement Upload Error:', error);
        return NextResponse.json({ message: 'Upload failed', error: error.message }, { status: 500 });
    }
}
