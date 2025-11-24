import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { applicationApprovedEmail, applicationRejectedEmail, applicationUnderReviewEmail } from '@/lib/emailTemplates';

export async function POST(request: Request) {
    try {
        const { id, status } = await request.json();

        // First, get the applicant's details
        const applicantResult = await executeQuery({
            query: 'SELECT name, email, phone, city FROM franchise_requests WHERE id = ?',
            values: [id],
        });

        if (!applicantResult || (applicantResult as any[]).length === 0) {
            return NextResponse.json({ message: 'Application not found' }, { status: 404 });
        }

        const applicant = (applicantResult as any[])[0];

        // Update the status
        const result = await executeQuery({
            query: 'UPDATE franchise_requests SET status = ? WHERE id = ?',
            values: [status, id],
        });

        if ((result as any).error) {
            throw new Error((result as any).error);
        }

        // Send appropriate email based on status
        const applicationData = {
            name: applicant.name,
            email: applicant.email,
            phone: applicant.phone,
            city: applicant.city,
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
        if (emailHtml) {
            sendEmail({
                to: applicant.email,
                subject: emailSubject,
                html: emailHtml,
            }).catch(error => {
                console.error('Email notification error:', error);
                // Don't fail the request if email fails
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
