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
        } catch (error) {
            setStatus('error');
            setMessage('Failed to subscribe. Please try again.');
        }
    };

    return (
        <footer style={{
            background: 'linear-gradient(to bottom, #0f172a, #020617)',
            color: '#e2e8f0',
            padding: '4rem 0 2rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Ambient Background Glow */}
            <div style={{
                position: 'absolute',
                top: '-50%',
                left: '20%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)',
                filter: 'blur(60px)',
                pointerEvents: 'none'
            }}></div>

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                <div className="footer-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '3rem',
                    marginBottom: '4rem'
                }}>
                    {/* Brand Column */}
                    <div className="footer-col">
                        <Link href="/" className="logo" style={{
                            marginBottom: '1.5rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '12px',
                            textDecoration: 'none'
                        }}>
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
                                <a key={social} href="#" style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    transition: 'all 0.3s ease',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }} className="social-icon">
                                    <i className={`fab fa-${social}`}></i>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-col">
                        <h4 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: '600' }}>Company</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {['About Us', 'Careers', 'Press', 'Blog'].map((item) => (
                                <li key={item} style={{ marginBottom: '0.75rem' }}>
                                    <Link href="#" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="footer-col">
                        <h4 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: '600' }}>Support</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {['Help Center', 'Terms of Service', 'Privacy Policy', 'Cookie Policy'].map((item) => (
                                <li key={item} style={{ marginBottom: '0.75rem' }}>
                                    <Link href="#" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="footer-col">
                        <h4 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: '600' }}>Stay Updated</h4>
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
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    outline: 'none'
                                }}
                            />
                            <button type="submit" disabled={status === 'loading' || status === 'success'} style={{
                                position: 'absolute',
                                right: '5px',
                                top: '5px',
                                bottom: '5px',
                                padding: '0 1rem',
                                background: status === 'success' ? '#10B981' : 'var(--primary-color)',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}>
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
                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    paddingTop: '2rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    textAlign: 'center'
                }}>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                        &copy; {new Date().getFullYear()} The Kada Digital Ventures Pvt Ltd. All rights reserved.
                    </p>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        Made with <i className="fas fa-heart" style={{ color: '#ef4444' }}></i> in Kerala
                    </p>
                </div>
            </div>

            <style jsx>{`
                .social-icon:hover {
                    background: var(--primary-color) !important;
                    transform: translateY(-3px);
                    border-color: var(--primary-color) !important;
                }
                .footer-link:hover {
                    color: white !important;
                    padding-left: 5px;
                }
                @media (max-width: 768px) {
                    .footer-grid {
                        grid-template-columns: 1fr !important;
                        gap: 2rem !important;
                        text-align: center;
                    }
                    .footer-col {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .footer-bottom {
                        flex-direction: column;
                    }
                }
            `}</style>
        </footer>
    );
}
