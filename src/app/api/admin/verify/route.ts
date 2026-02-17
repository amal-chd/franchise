import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';
import { sendEmail } from '@/lib/email';
import { applicationApprovedEmail, applicationRejectedEmail, applicationUnderReviewEmail } from '@/lib/emailTemplates';
import { logActivity } from '@/lib/activityLogger';

export async function POST(request: Request) {
    try {
        const { id, status, rejectionReason } = await request.json();

        if (!id || !status) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // First, get the applicant's details from Firestore
        const docRef = firestore.collection('franchise_requests').doc(String(id));
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ message: 'Application not found' }, { status: 404 });
        }

        const applicant = docSnap.data();

        // Update the status and rejection reason if provided
        const updateData: any = { status };
        if (status === 'rejected' && rejectionReason) {
            updateData.rejection_reason = rejectionReason;
        }

        await docRef.update(updateData);

        // Send appropriate email based on status
        const applicationData = {
            name: applicant?.name,
            email: applicant?.email,
            phone: applicant?.phone,
            city: applicant?.city,
            rejectionReason: rejectionReason,
        };

        let emailSubject = '';
        let emailHtml = '';

        switch (status) {
            case 'approved':
                emailSubject = 'Congratulations! Your Franchise Application is Approved';
                emailHtml = applicationApprovedEmail(applicationData);
                break;
            case 'rejected':
                emailSubject = 'Update on Your Franchise Application';
                emailHtml = applicationRejectedEmail(applicationData);
                break;
            case 'under_review':
                emailSubject = 'Your Franchise Application is Under Review';
                emailHtml = applicationUnderReviewEmail(applicationData);
                break;
            default:
                // No email for other statuses
                break;
        }

        // Send email if we have content (don't block response)
        if (emailHtml && applicant?.email) {
            sendEmail({
                to: applicant.email,
                subject: emailSubject,
                html: emailHtml,
            }).catch(error => {
                console.error('Email notification error:', error);
                // Don't fail the request if email fails
            });
        }

        // Log Activity
        await logActivity({
            actor_id: 1,
            actor_type: 'admin',
            action: status === 'approved' ? 'FRANCHISE_APPROVED' : (status === 'rejected' ? 'FRANCHISE_REJECTED' : 'FRANCHISE_UPDATED'),
            entity_type: 'franchise_request',
            entity_id: id,
            details: { name: applicant?.name, status, rejectionReason }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Update Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
