import Link from 'next/link';
import { useState } from 'react';

export default function Footer() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(data.message || 'Subscribed successfully!');
                setEmail('');
            } else {
                setStatus('error');
                setMessage(data.error || 'Something went wrong.');
            }
        } catch (_) {
            setStatus('error');
            setMessage('Failed to subscribe. Please try again.');
        }
    };

    return (
        <footer className="footer">
            {/* Ambient Background Glow */}
            <div className="footer-ambient-glow"></div>

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                <div className="footer-grid">
                    {/* Brand Column */}
                    <div className="footer-col">
                        <Link href="/" className="logo" style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                            <img src="/logo.png" alt="The Kada Logo" style={{ height: '40px', width: 'auto' }} />
                            <span style={{
                                fontSize: '1.5rem',
                                fontWeight: '800',
                                background: 'linear-gradient(135deg, #fff, #94a3b8)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>The Kada</span>
                        </Link>
                        <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            Empowering local commerce through hyper-local delivery. Join the revolution today.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {['facebook', 'twitter', 'instagram', 'linkedin'].map((social) => (
                                <a key={social} href="#" className="social-icon">
                                    <i className={`fab fa-${social}`}></i>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-col">
                        <h4>Company</h4>
                        <ul className="footer-links">
                            {['About Us', 'Careers', 'Press', 'Blog'].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="footer-link">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="footer-col">
                        <h4>Support</h4>
                        <ul className="footer-links">
                            {['Help Center', 'Terms of Service', 'Privacy Policy', 'Cookie Policy'].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="footer-link">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="footer-col">
                        <h4>Stay Updated</h4>
                        <p style={{ color: '#94a3b8', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Subscribe to our newsletter for the latest updates.
                        </p>
                        <form onSubmit={handleSubscribe} style={{ position: 'relative' }}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={status === 'loading' || status === 'success'}
                                className="footer-input"
                            />
                            <button type="submit" disabled={status === 'loading' || status === 'success'} className="footer-btn">
                                {status === 'loading' ? <i className="fas fa-spinner fa-spin"></i> :
                                    status === 'success' ? <i className="fas fa-check"></i> :
                                        <i className="fas fa-paper-plane"></i>}
                            </button>
                        </form>
                        {message && (
                            <p style={{
                                marginTop: '0.5rem',
                                fontSize: '0.85rem',
                                color: status === 'error' ? '#EF4444' : '#10B981'
                            }}>
                                {message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="footer-bottom">
                    <p style={{ margin: 0 }}>
                        &copy; {new Date().getFullYear()} The Kada Digital Ventures Pvt Ltd. All rights reserved.
                    </p>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
                        Made with <i className="fas fa-heart" style={{ color: '#ef4444' }}></i> in Kerala
                    </p>
                </div>
            </div>
        </footer>
    );
}
