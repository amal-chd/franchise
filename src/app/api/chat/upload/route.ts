import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'File is required' }, { status: 400 });
        }

        const filename = `chat_${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        let fileUrl = '';

        const token = process.env.BLOB_READ_WRITE_TOKEN;

        if (token) {
            const blob = await put(filename, file, { access: 'public', token });
            fileUrl = blob.url;
        } else {
            // Local storage fallback
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat');
            await mkdir(uploadDir, { recursive: true });

            const filePath = path.join(uploadDir, filename);
            await writeFile(filePath, buffer);

            fileUrl = `/uploads/chat/${filename}`;
        }

        return NextResponse.json({ success: true, fileUrl }, { status: 200 });
    } catch (error: any) {
        console.error('Chat Upload Error:', error);
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}
