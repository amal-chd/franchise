import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-col">
                        <Link href="/" className="logo" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <img src="/logo.png" alt="The Kada Logo" style={{ height: '32px', width: 'auto' }} />
                            <span>The Kada</span>
                        </Link>
                    </div>
                    <div className="footer-col">
                        <h4>About</h4>
                        <ul className="footer-links">
                            <li><Link href="/about">Our Story</Link></li>
                            <li><Link href="/careers">Careers</Link></li>
                            <li><Link href="/press">Press</Link></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Support</h4>
                        <ul className="footer-links">
                            <li><Link href="/support">Help Center</Link></li>
                            <li><Link href="/terms">Terms of Service</Link></li>
                            <li><Link href="/privacy">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2025 The Kada Digital Ventures Pvt Ltd.</p>
                </div>
            </div>
        </footer>
    );
}
