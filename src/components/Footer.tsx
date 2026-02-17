'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Footer() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleNewsletter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setStatus('loading');
        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                setStatus('success');
                setEmail('');
                setTimeout(() => setStatus('idle'), 4000);
            } else {
                setStatus('error');
                setTimeout(() => setStatus('idle'), 3000);
            }
        } catch {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <footer className="footer">
            <div className="footer-ambient-glow"></div>
            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                <div className="footer-grid">

                    {/* Brand */}
                    <div className="footer-col">
                        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '16px' }}>
                            <img src="/logo.png" alt="The Kada" style={{ height: '36px', width: 'auto' }} />
                            <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#FFFFFF' }}>The Kada</span>
                        </Link>
                        <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '20px', fontSize: '0.9rem' }}>
                            Empowering local commerce through hyper-local delivery. Join the revolution today.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {['facebook', 'twitter', 'instagram', 'linkedin'].map((social) => (
                                <a key={social} href="#" className="social-icon">
                                    <i className={`fab fa-${social}`}></i>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-col">
                        <h4>Quick Links</h4>
                        <ul className="footer-links">
                            <li><Link href="/about" className="footer-link">About Us</Link></li>
                            <li><Link href="/benefits" className="footer-link">Benefits</Link></li>
                            <li><Link href="/careers" className="footer-link">Careers</Link></li>
                            <li><Link href="/training" className="footer-link">Training</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="footer-col">
                        <h4>Support</h4>
                        <ul className="footer-links">
                            <li><Link href="/support" className="footer-link">Help Center</Link></li>
                            <li><Link href="/press" className="footer-link">Press</Link></li>
                            <li><Link href="/privacy" className="footer-link">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="footer-link">Terms of Service</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="footer-col">
                        <h4>Stay Updated</h4>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '14px' }}>
                            Get the latest franchise news and updates.
                        </p>
                        <form onSubmit={handleNewsletter} style={{ position: 'relative' }}>
                            <input
                                type="email"
                                className="footer-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button type="submit" className="footer-btn" disabled={status === 'loading'}>
                                {status === 'loading' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-arrow-right"></i>}
                            </button>
                        </form>
                        {status === 'success' && <p style={{ color: '#10B981', fontSize: '0.8rem', marginTop: '8px', marginBottom: 0 }}>Subscribed!</p>}
                        {status === 'error' && <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '8px', marginBottom: 0 }}>Failed. Try again.</p>}
                    </div>
                </div>

                {/* Bottom */}
                <div className="footer-bottom">
                    <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} The Kada Digital Ventures Pvt Ltd. All rights reserved.</p>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
                        Made with <i className="fas fa-heart" style={{ color: '#ef4444' }}></i> in India
                    </p>
                </div>
            </div>
        </footer>
    );
}
