import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

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
            return NextResponse.json({
                message: 'File too large. Maximum size is 5MB.'
            }, { status: 400 });
        }

        // Upload to Vercel Blob
        const token = process.env.BLOB_READ_WRITE_TOKEN ||
            process.env.thekada_READ_WRITE_TOKEN ||
            process.env.READ_WRITE_TOKEN;

        if (!token) {
            return NextResponse.json({
                message: 'Blob storage not configured'
            }, { status: 500 });
        }

        const blob = await put(file.name, file, {
            access: 'public',
            token: token,
        });

        return NextResponse.json({
            message: 'Image uploaded successfully',
            url: blob.url
        }, { status: 200 });

    } catch (error: any) {
        console.error('Background Upload Error:', error);
        return NextResponse.json({
            message: 'Failed to upload image',
            error: error.message
        }, { status: 500 });
    }
}
