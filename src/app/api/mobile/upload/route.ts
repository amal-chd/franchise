import { NextResponse } from 'next/server';
import { getStorageBucket } from '@/lib/firebase';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as string || 'uploads';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const bucket = getStorageBucket();
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = (file.name || 'file').replace(/\s/g, '_');
        const filePath = `${folder}/${Date.now()}-${safeName}`;

        const blob = bucket.file(filePath);
        await blob.save(buffer, { metadata: { contentType: file.type } });
        await blob.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        return NextResponse.json({ success: true, url: publicUrl });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
