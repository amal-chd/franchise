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
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({
                message: 'Invalid file type. Only JPEG, PNG, WebP images and PDF files are allowed.'
            }, { status: 400 });
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ message: 'File too large. Maximum size is 5MB.' }, { status: 400 });
        }

        const bucket = getStorageBucket();
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = file.name.replace(/\s/g, '_');
        const filePath = `backgrounds/${Date.now()}_${safeName}`;

        const blob = bucket.file(filePath);
        await blob.save(buffer, { metadata: { contentType: file.type } });
        await blob.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        return NextResponse.json({
            message: 'Image uploaded successfully',
            url: publicUrl
        }, { status: 200 });
    } catch (error: any) {
        console.error('Background Upload Error:', error);
        return NextResponse.json({
            message: 'Failed to upload image',
            error: error.message
        }, { status: 500 });
    }
}
