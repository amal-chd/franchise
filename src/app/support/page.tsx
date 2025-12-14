'use client';

import { useState } from 'react';

export default function SupportPage() {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [status, setStatus] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('sending');

        try {
            const res = await fetch('/api/support/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                setStatus('error');
            }
        } catch (_) {
            setStatus('error');
        }
    };

    return (
        <main className="section" style={{ paddingTop: '120px', minHeight: '100vh', background: 'linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)' }}>
            <div className="container">
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h1 className="text-primary" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>How can we help you?</h1>
                        <p style={{ fontSize: '1.1rem', color: '#64748B' }}>We&apos;re here to help and answer any question you might have.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'start' }}>
                        {/* Contact Info Card */}
                        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Get in Touch</h3>
                            <p style={{ color: '#64748B', marginBottom: '2rem' }}>Fill out the form and our team will get back to you within 24 hours.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', fontSize: '1.25rem' }}>
                                        <i className="fas fa-envelope"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: '500' }}>Email Us</div>
                                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1E293B' }}>support@thekada.in</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', fontSize: '1.25rem' }}>
                                        <i className="fas fa-phone"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: '500' }}>Call Us</div>
                                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1E293B' }}>+91 9496491654</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', fontSize: '1.25rem' }}>
                                        <i className="fas fa-map-marker-alt"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: '500' }}>Visit Us</div>
                                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1E293B' }}>KTP TOWER , KANNUR , THALAP</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Send a Message</h3>
                            {status === 'success' ? (
                                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                    <div style={{ width: '80px', height: '80px', background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                                        <i className="fas fa-check" style={{ fontSize: '2.5rem', color: '#16A34A' }}></i>
                                    </div>
                                    <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Message Sent!</h4>
                                    <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>We&apos;ve received your ticket and will get back to you shortly.</p>
                                    <button onClick={() => setStatus('')} className="btn btn-primary">Send Another Message</button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label className="form-label">Your Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Subject</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="How can we help?"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Message</label>
                                        <textarea
                                            className="form-input"
                                            style={{ height: '150px', resize: 'none' }}
                                            placeholder="Tell us more about your inquiry..."
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={status === 'sending'}>
                                        {status === 'sending' ? (
                                            <span><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Sending...</span>
                                        ) : (
                                            'Send Message'
                                        )}
                                    </button>
                                    {status === 'error' && (
                                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#FEE2E2', borderRadius: '8px', color: '#991B1B', fontSize: '0.875rem', textAlign: 'center' }}>
                                            Failed to send message. Please try again later.
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
