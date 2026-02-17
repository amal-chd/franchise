import { NextResponse } from 'next/server';
import { getStorageBucket } from '@/lib/firebase';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ message: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { message: 'Only PDF and DOC/DOCX files are allowed' },
                { status: 400 }
            );
        }

        // Max 5MB
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { message: 'File size must be under 5MB' },
                { status: 400 }
            );
        }

        const bucket = getStorageBucket();
        const buffer = Buffer.from(await file.arrayBuffer());
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `resumes/${timestamp}_${safeName}`;

        const blob = bucket.file(filePath);
        await blob.save(buffer, {
            metadata: {
                contentType: file.type,
            },
        });

        // Make the file publicly accessible
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        return NextResponse.json({ url: publicUrl });
    } catch (error: any) {
        console.error('Upload error:', error.message);
        return NextResponse.json(
            { message: 'Failed to upload file' },
            { status: 500 }
        );
    }
}
