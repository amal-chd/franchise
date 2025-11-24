// Email template styles - inline CSS for email compatibility
const emailStyles = `
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #202124; margin: 0; padding: 0; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 500; }
    .content { padding: 40px 30px; }
    .content h2 { color: #202124; font-size: 24px; margin-top: 0; font-weight: 500; }
    .content p { color: #5f6368; font-size: 16px; line-height: 1.6; }
    .info-box { background-color: #EFF6FF; border-left: 4px solid #2563EB; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .info-box p { margin: 8px 0; color: #202124; }
    .info-box strong { color: #1D4ED8; }
    .button { display: inline-block; padding: 14px 32px; background-color: #2563EB; color: #ffffff; text-decoration: none; border-radius: 24px; font-weight: 500; margin: 20px 0; }
    .button:hover { background-color: #1D4ED8; }
    .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dadce0; }
    .footer p { color: #5f6368; font-size: 14px; margin: 5px 0; }
    .status-approved { color: #34a853; font-weight: 600; }
    .status-rejected { color: #ea4335; font-weight: 600; }
    .status-review { color: #fbbc04; font-weight: 600; }
`;

interface ApplicationData {
    name: string;
    email: string;
    phone: string;
    city: string;
    requestId?: number;
}

// Email to admin when new application is submitted
export function newApplicationEmail(data: ApplicationData): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${emailStyles}</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 New Franchise Application</h1>
                </div>
                <div class="content">
                    <h2>New Application Received</h2>
                    <p>A new franchise application has been submitted. Here are the details:</p>
                    
                    <div class="info-box">
                        <p><strong>Application ID:</strong> #${data.requestId || 'N/A'}</p>
                        <p><strong>Name:</strong> ${data.name}</p>
                        <p><strong>Email:</strong> ${data.email}</p>
                        <p><strong>Phone:</strong> ${data.phone}</p>
                        <p><strong>City:</strong> ${data.city}</p>
                    </div>
                    
                    <p>Please review this application in the admin panel and take appropriate action.</p>
                    
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://thekada.in'}/admin" class="button">View in Admin Panel</a>
                </div>
                <div class="footer">
                    <p><strong>The Kada Franchise</strong></p>
                    <p>Empowering Local Commerce</p>
                    <p style="font-size: 12px; color: #80868b;">This is an automated notification from The Kada Franchise system.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Email to applicant when application is approved
export function applicationApprovedEmail(data: ApplicationData): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${emailStyles}</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎊 Congratulations!</h1>
                </div>
                <div class="content">
                    <h2>Your Application Has Been Approved</h2>
                    <p>Dear ${data.name},</p>
                    
                    <p>We are thrilled to inform you that your franchise application has been <span class="status-approved">APPROVED</span>!</p>
                    
                    <div class="info-box">
                        <p><strong>Application Status:</strong> <span class="status-approved">✓ Approved</span></p>
                        <p><strong>City:</strong> ${data.city}</p>
                    </div>
                    
                    <p>Welcome to The Kada family! Our team will contact you shortly with the next steps to get your franchise up and running.</p>
                    
                    <p>If you have any questions, please don't hesitate to reach out to us.</p>
                </div>
                <div class="footer">
                    <p><strong>The Kada Franchise</strong></p>
                    <p>Empowering Local Commerce</p>
                    <p>Email: thekadaapp@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Email to applicant when application is rejected
export function applicationRejectedEmail(data: ApplicationData): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${emailStyles}</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Application Status Update</h1>
                </div>
                <div class="content">
                    <h2>Application Status Update</h2>
                    <p>Dear ${data.name},</p>
                    
                    <p>Thank you for your interest in The Kada Franchise. After careful review, we regret to inform you that we are unable to proceed with your application at this time.</p>
                    
                    <div class="info-box">
                        <p><strong>Application Status:</strong> <span class="status-rejected">Not Approved</span></p>
                        <p><strong>City:</strong> ${data.city}</p>
                    </div>
                    
                    <p>This decision may be due to various factors including current market conditions, location availability, or other business considerations.</p>
                    
                    <p>We appreciate your interest in partnering with us and encourage you to stay connected for future opportunities.</p>
                    
                    <p>If you have any questions, please feel free to contact us.</p>
                </div>
                <div class="footer">
                    <p><strong>The Kada Franchise</strong></p>
                    <p>Empowering Local Commerce</p>
                    <p>Email: thekadaapp@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Email to applicant when application is under review
export function applicationUnderReviewEmail(data: ApplicationData): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${emailStyles}</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📋 Application Update</h1>
                </div>
                <div class="content">
                    <h2>Your Application is Under Review</h2>
                    <p>Dear ${data.name},</p>
                    
                    <p>Thank you for your patience. We wanted to let you know that your franchise application is currently <span class="status-review">under review</span> by our team.</p>
                    
                    <div class="info-box">
                        <p><strong>Application Status:</strong> <span class="status-review">⏳ Under Review</span></p>
                        <p><strong>City:</strong> ${data.city}</p>
                    </div>
                    
                    <p>Our team is carefully evaluating your application. We will notify you of our decision as soon as the review process is complete.</p>
                    
                    <p>We appreciate your interest in The Kada Franchise and your patience during this process.</p>
                </div>
                <div class="footer">
                    <p><strong>The Kada Franchise</strong></p>
                    <p>Empowering Local Commerce</p>
                    <p>Email: thekadaapp@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Email to applicant when application is submitted (confirmation)
export function applicationSubmittedEmail(data: ApplicationData): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${emailStyles}</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Application Received</h1>
                </div>
                <div class="content">
                    <h2>Thank You for Your Application!</h2>
                    <p>Dear ${data.name},</p>
                    
                    <p>We have successfully received your franchise application for The Kada. Thank you for your interest in joining our network!</p>
                    
                    <div class="info-box">
                        <p><strong>Application ID:</strong> #${data.requestId || 'N/A'}</p>
                        <p><strong>Name:</strong> ${data.name}</p>
                        <p><strong>Email:</strong> ${data.email}</p>
                        <p><strong>Phone:</strong> ${data.phone}</p>
                        <p><strong>City:</strong> ${data.city}</p>
                    </div>
                    
                    <p>Our team will review your application and get back to you shortly. You will receive email updates as your application progresses.</p>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ul>
                        <li>Complete KYC verification if prompted</li>
                        <li>Review and accept the franchise agreement</li>
                        <li>Complete payment process</li>
                    </ul>
                    
                    <p>If you have any questions in the meantime, please don't hesitate to contact us.</p>
                </div>
                <div class="footer">
                    <p><strong>The Kada Franchise</strong></p>
                    <p>Empowering Local Commerce</p>
                    <p>Email: thekadaapp@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
    `;
}
