export default function SupportPage() {
    return (
        <main className="section" style={{ paddingTop: '100px', minHeight: '80vh' }}>
            <div className="container">
                <h1 className="text-primary" style={{ marginBottom: '2rem' }}>Help Center</h1>
                <div style={{ display: 'grid', gap: '2rem', maxWidth: '800px' }}>
                    <div>
                        <h3>How do I track my order?</h3>
                        <p>You can track your order in real-time through the 'My Orders' section in the app.</p>
                    </div>
                    <div>
                        <h3>How do I become a vendor?</h3>
                        <p>Download the 'The Kada Vendor' app from the Play Store and register your business.</p>
                    </div>
                    <div>
                        <h3>Contact Support</h3>
                        <p>Need more help? Email us at support@thekada.in or call +91 98765 43210.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
