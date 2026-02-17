import { NextResponse } from 'next/server';
import { storageBucket } from '@/lib/firebase';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'File is required' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = file.name.replace(/\s/g, '_');
        const filePath = `chat/chat_${Date.now()}_${safeName}`;

        const blob = storageBucket.file(filePath);
        await blob.save(buffer, { metadata: { contentType: file.type } });
        await blob.makePublic();

        const fileUrl = `https://storage.googleapis.com/${storageBucket.name}/${filePath}`;

        return NextResponse.json({ success: true, fileUrl }, { status: 200 });
    } catch (error: any) {
        console.error('Chat Upload Error:', error);
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}
