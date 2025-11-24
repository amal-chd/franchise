import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

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

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${requestId}_${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        const uploadDir = path.join(process.cwd(), 'public/uploads');

        console.log('KYC Upload: Upload directory:', uploadDir);

        if (!fs.existsSync(uploadDir)) {
            console.log('KYC Upload: Creating upload directory...');
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        console.log('KYC Upload: Saving file to:', filePath);
        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${filename}`;
        console.log('KYC Upload: File saved, updating database...');

        const result = await executeQuery({
            query: 'UPDATE franchise_requests SET aadhar_url = ? WHERE id = ?',
            values: [fileUrl, requestId],
        });

        console.log('KYC Upload: Database update result:', result);

        return NextResponse.json({ message: 'KYC document uploaded successfully', fileUrl }, { status: 200 });
    } catch (error: any) {
        console.error('KYC Upload Error:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
