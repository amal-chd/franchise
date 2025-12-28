import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as string || 'uploads';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.thekada_READ_WRITE_TOKEN;

        if (!token) {
            console.error('Blob token missing');
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
        }

        const filename = `${folder}/${Date.now()}-${file.name.replace(/\s/g, '_')}`;

        const blob = await put(filename, file, {
            access: 'public',
            token: token
        });

        return NextResponse.json({
            success: true,
            url: blob.url
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
