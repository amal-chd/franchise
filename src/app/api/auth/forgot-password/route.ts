import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

// Generate a temporary password
function generateTempPassword(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 character random password
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if user exists in franchise_requests (franchise users)
        const franchiseSnapshot = await firestore.collection('franchise_requests')
            .where('email', '==', email)
            .where('status', '==', 'approved')
            .limit(1)
            .get();

        // Check if user exists in admins collection (if admins are in Firestore now?)
        // Assuming admins are also in Firestore for consistency.
        const adminSnapshot = await firestore.collection('admins')
            .where('email', '==', email)
            .limit(1)
            .get();

        let userDoc = null;
        let collectionName = '';

        if (!franchiseSnapshot.empty) {
            userDoc = franchiseSnapshot.docs[0];
            collectionName = 'franchise_requests';
        } else if (!adminSnapshot.empty) {
            userDoc = adminSnapshot.docs[0];
            collectionName = 'admins';
        }

        if (!userDoc) {
            // Don't reveal if email exists or not for security
            return NextResponse.json({
                success: true,
                message: 'If this email exists, a password reset link has been sent.'
            });
        }

        const userData = userDoc.data();

        // Generate temporary password
        const tempPassword = generateTempPassword();

        // Update password in Firestore
        await firestore.collection(collectionName).doc(userDoc.id).update({
            password: tempPassword
        });

        // Send email with temporary password
        const emailResult = await sendEmail({
            to: email,
            subject: 'Password Reset - The Kada Franchise',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #0F172A; margin: 0;">The Kada Franchise</h1>
                        <p style="color: #64748B; margin-top: 5px;">Password Reset Request</p>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 30px; border-radius: 16px; color: white; margin-bottom: 30px;">
                        <h2 style="margin: 0 0 10px 0;">Hello ${userData.name || 'User'},</h2>
                        <p style="margin: 0; opacity: 0.9;">We received a password reset request for your account.</p>
                    </div>
                    
                    <div style="background: #F8FAFC; padding: 25px; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 30px;">
                        <p style="color: #475569; margin: 0 0 15px 0;">Your temporary password is:</p>
                        <div style="background: #0F172A; color: #10B981; font-family: monospace; font-size: 28px; font-weight: bold; padding: 20px; border-radius: 8px; text-align: center; letter-spacing: 4px;">
                            ${tempPassword}
                        </div>
                        <p style="color: #94A3B8; font-size: 12px; margin: 15px 0 0 0; text-align: center;">
                            Please login with this password and change it immediately.
                        </p>
                    </div>
                    
                    <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin-bottom: 30px;">
                        <p style="color: #92400E; margin: 0; font-size: 14px;">
                            <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please contact support immediately.
                        </p>
                    </div>
                    
                    <div style="text-align: center; color: #94A3B8; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} The Kada Franchise. All rights reserved.</p>
                    </div>
                </div>
            `
        });

        if (!emailResult.success) {
            console.error('Failed to send password reset email:', emailResult.error);
            return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'If this email exists, a password reset link has been sent.'
        });

    } catch (error: any) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
