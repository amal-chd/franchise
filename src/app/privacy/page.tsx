export default function PrivacyPage() {
    return (
        <main className="section" style={{ paddingTop: '100px', minHeight: '80vh' }}>
            <div className="container">
                <h1 className="text-primary" style={{ marginBottom: '2rem' }}>Privacy Policy</h1>
                <div style={{ maxWidth: '800px', lineHeight: '1.6' }}>
                    <h3>1. Information We Collect</h3>

                    <h4>1.1 Account & Identity Information</h4>
                    <p>When you register on The Kada (as a customer, vendor, or delivery partner), we collect personal information such as:</p>
                    <ul>
                        <li>Full Name</li>
                        <li>Email Address</li>
                        <li>Mobile Number</li>
                        <li>Profile Picture (optional)</li>
                        <li>Username & Password (encrypted)</li>
                        <li>Date of Birth (for verification if needed)</li>
                    </ul>

                    <h4>1.2 Vendor-Specific Information</h4>
                    <p>For vendors, we collect additional data for compliance, verification, and legal purposes:</p>
                    <ul>
                        <li>Business Name and Registration Number</li>
                        <li>GSTIN or PAN (Tax Identification)</li>
                        <li>Bank Account Details for Payments</li>
                        <li>Business Address and Proof</li>
                        <li>Uploaded documents (e.g., licenses, certificates)</li>
                    </ul>

                    <h4>1.3 Delivery Agent Information</h4>
                    <p>For logistics and safety, delivery partners must provide:</p>
                    <ul>
                        <li>Driver&apos;s License</li>
                        <li>Vehicle Registration Details</li>
                        <li>Live Location (with permission)</li>
                        <li>Emergency Contact Number</li>
                    </ul>

                    <h4>1.4 Location Data</h4>
                    <p>We collect your device’s real-time location (with consent) to enable delivery services, display nearby vendors, and improve logistics. You can enable or disable this through your device settings.</p>

                    <h4>1.5 Payment & Financial Data</h4>
                    <p>For processing payments and payouts:</p>
                    <ul>
                        <li>Credit/Debit Card Information</li>
                        <li>UPI ID / Wallet Details</li>
                        <li>Razorpay, Stripe, or Paytm transaction references</li>
                        <li>Bank Account Details for Vendor Withdrawals</li>
                    </ul>
                    <p>Note: We do not store sensitive payment credentials. All transactions are processed through secure, PCI-DSS compliant gateways.</p>

                    <h4>1.6 Technical & Usage Information</h4>
                    <ul>
                        <li>IP address and approximate location</li>
                        <li>Browser type and operating system</li>
                        <li>Device identifiers (UUID, device ID)</li>
                        <li>App version and system crash logs</li>
                        <li>Pages and products viewed, search queries, click patterns</li>
                    </ul>

                    <h4>1.7 Communication Logs</h4>
                    <p>We store emails, chat messages, service tickets, and calls (if recorded) for training and quality purposes.</p>

                    <h3>2. How We Use Your Information</h3>
                    <p>We use your information to:</p>
                    <ul>
                        <li>Create and manage your user/vendor/delivery account</li>
                        <li>Provide, personalize, and enhance our services</li>
                        <li>Process orders, payments, and vendor payouts</li>
                        <li>Ensure security and prevent fraud</li>
                        <li>Send transactional notifications (e.g., order updates)</li>
                        <li>Provide customer support and resolve disputes</li>
                        <li>Send marketing emails (only with consent)</li>
                        <li>Comply with legal obligations and resolve disputes</li>
                    </ul>

                    <h3>3. Legal Basis for Processing (For GDPR Users)</h3>
                    <p>We process personal data under the following legal grounds:</p>
                    <ul>
                        <li>Performance of a contract (e.g., delivering orders)</li>
                        <li>Legitimate interests (e.g., platform security)</li>
                        <li>Legal obligation (e.g., tax filings)</li>
                        <li>Consent (e.g., location access or newsletters)</li>
                    </ul>

                    <h3>4. Sharing and Disclosure of Data</h3>
                    <p>We do not sell your data. However, your data may be shared with:</p>
                    <ul>
                        <li>Vendors – for order fulfillment</li>
                        <li>Delivery Partners – for delivering orders</li>
                        <li>Payment Processors – for secure transactions</li>
                        <li>Analytics Providers – to monitor site usage (e.g., Google Analytics)</li>
                        <li>Law Enforcement – when required by law or court order</li>
                        <li>Technology Partners – for cloud storage, messaging, and hosting</li>
                    </ul>

                    <h3>5. Cookies and Tracking</h3>
                    <p>We use cookies and similar technologies to enhance your experience. You can manage cookie preferences in your browser or app settings.</p>
                    <ul>
                        <li>Essential Cookies: Required for site functionality.</li>
                        <li>Analytical Cookies: Understand user behavior.</li>
                        <li>Advertising Cookies: Show personalized ads.</li>
                    </ul>

                    <h3>6. Data Security</h3>
                    <p>We implement strong security measures including:</p>
                    <ul>
                        <li>SSL/TLS encryption</li>
                        <li>Encrypted passwords</li>
                        <li>Firewall and anti-malware systems</li>
                        <li>Role-based access control for internal systems</li>
                        <li>Regular security audits and compliance checks</li>
                    </ul>
                    <p>Despite our efforts, no system is 100% secure. We urge users to protect their account credentials.</p>

                    <h3>7. Your Rights and Choices</h3>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal data</li>
                        <li>Correct or update your information</li>
                        <li>Delete your account and data</li>
                        <li>Withdraw consent (where applicable)</li>
                        <li>Download your data (Data Portability)</li>
                    </ul>
                    <p>To exercise these rights, contact us at privacy@thekada.com.</p>

                    <h3>8. Retention of Data</h3>
                    <p>We retain data only as long as needed:</p>
                    <ul>
                        <li>Transactional data – for at least 7 years (for legal/tax reasons)</li>
                        <li>Account data – until you delete or deactivate your account</li>
                        <li>Location/log data – retained in aggregate, anonymized form</li>
                    </ul>

                    <h3>9. Children&apos;s Privacy</h3>
                    <p>Our services are not intended for users under the age of 13. We do not knowingly collect data from children. If we discover such data, it will be deleted immediately.</p>

                    <h3>10. International Data Transfers</h3>
                    <p>If you are accessing our platform from outside India, your information may be transferred to, stored, and processed in India or other countries. We ensure adequate protection for such transfers.</p>

                    <h3>11. Third-Party Services and Links</h3>
                    <p>Our platform may contain links to external websites. We are not responsible for the privacy policies or practices of third-party websites.</p>

                    <h3>12. Changes to This Policy</h3>
                    <p>We may revise this policy from time to time. If material changes are made, we will notify you via email or a prominent notice on the Platform.</p>
                </div>
            </div>
        </main>
    );
}
