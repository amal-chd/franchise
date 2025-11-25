'use client';

import { useEffect, useState } from 'react';

interface Career {
    id: number;
    title: string;
    department: string;
    location: string;
    type: string;
    description: string;
    created_at: string;
}

export default function CareersPage() {
    const [careers, setCareers] = useState<Career[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCareers();
    }, []);

    const fetchCareers = async () => {
        try {
            const res = await fetch('/api/careers');
            const data = await res.json();
            setCareers(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch careers', error);
            setLoading(false);
        }
    };

    return (
        <main>
            {/* Job Listings Section */}
            <section className="section" style={{ background: 'var(--bg-secondary)', paddingTop: '7rem' }}>
                <div className="container">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                border: '4px solid rgba(37, 99, 235, 0.1)',
                                borderTop: '4px solid var(--primary-color)',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto'
                            }}></div>
                            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading opportunities...</p>
                        </div>
                    ) : careers.length === 0 ? (
                        <div className="glass-card" style={{
                            textAlign: 'center',
                            padding: '4rem 2rem',
                            maxWidth: '600px',
                            margin: '0 auto'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(139, 92, 246, 0.1))',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                border: '1px solid rgba(37, 99, 235, 0.2)'
                            }}>
                                <i className="fas fa-briefcase" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>No Openings Currently</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                We don't have any open positions at the moment, but we're always looking for talented people.
                            </p>
                            <a
                                href="mailto:careers@thekada.com"
                                className="btn btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <i className="fas fa-envelope"></i>
                                Send Us Your Resume
                            </a>
                        </div>
                    ) : (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                                <h2 className="text-primary" style={{ marginBottom: '0.5rem' }}>Open Positions</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
                                    {careers.length} {careers.length === 1 ? 'opportunity' : 'opportunities'} available
                                </p>
                            </div>
                            <div style={{ display: 'grid', gap: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
                                {careers.map((job) => (
                                    <div
                                        key={job.id}
                                        className="glass-card"
                                        style={{
                                            padding: 'clamp(1rem, 3vw, 1.5rem)',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '';
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.75rem, 2vw, 1.25rem)' }}>
                                            {/* Header */}
                                            <div>
                                                <h3 style={{
                                                    fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                                                    fontWeight: '700',
                                                    marginBottom: '0.5rem',
                                                    color: 'var(--text-primary)'
                                                }}>
                                                    {job.title}
                                                </h3>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.35rem',
                                                        padding: '0.35rem 0.75rem',
                                                        background: 'rgba(37, 99, 235, 0.08)',
                                                        borderRadius: 'var(--radius-full)',
                                                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                                                        fontWeight: '500',
                                                        color: 'var(--primary-color)',
                                                        border: '1px solid rgba(37, 99, 235, 0.15)'
                                                    }}>
                                                        <i className="fas fa-building" style={{ fontSize: '0.75rem' }}></i>
                                                        {job.department}
                                                    </span>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.35rem',
                                                        padding: '0.35rem 0.75rem',
                                                        background: 'rgba(139, 92, 246, 0.08)',
                                                        borderRadius: 'var(--radius-full)',
                                                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                                                        fontWeight: '500',
                                                        color: '#8B5CF6',
                                                        border: '1px solid rgba(139, 92, 246, 0.15)'
                                                    }}>
                                                        <i className="fas fa-map-marker-alt" style={{ fontSize: '0.75rem' }}></i>
                                                        {job.location}
                                                    </span>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.35rem',
                                                        padding: '0.35rem 0.75rem',
                                                        background: 'rgba(16, 185, 129, 0.08)',
                                                        borderRadius: 'var(--radius-full)',
                                                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                                                        fontWeight: '500',
                                                        color: '#10B981',
                                                        border: '1px solid rgba(16, 185, 129, 0.15)'
                                                    }}>
                                                        <i className="fas fa-clock" style={{ fontSize: '0.75rem' }}></i>
                                                        {job.type}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div style={{
                                                padding: 'clamp(0.75rem, 2vw, 1rem)',
                                                background: 'var(--bg-secondary)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <p style={{
                                                    color: 'var(--text-secondary)',
                                                    lineHeight: '1.6',
                                                    whiteSpace: 'pre-line',
                                                    margin: 0,
                                                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                                                }}>
                                                    {job.description}
                                                </p>
                                            </div>

                                            {/* Footer */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                paddingTop: '0.5rem',
                                                borderTop: '1px solid var(--border-color)',
                                                flexWrap: 'wrap'
                                            }}>
                                                <span style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: 'var(--text-secondary)' }}>
                                                    <i className="fas fa-calendar" style={{ marginRight: '0.35rem' }}></i>
                                                    {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <a
                                                    href={`mailto:careers@thekada.com?subject=Application for ${job.title}`}
                                                    className="btn btn-primary"
                                                    style={{
                                                        whiteSpace: 'nowrap',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
                                                        fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                                                    }}
                                                >
                                                    <i className="fas fa-paper-plane"></i>
                                                    Apply Now
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="section" style={{ background: 'linear-gradient(135deg, var(--primary-color), #8B5CF6)', color: 'white' }}>
                <div className="container" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', color: 'white' }}>
                        Don't See a Perfect Fit?
                    </h2>
                    <p style={{ fontSize: '1.125rem', marginBottom: '2rem', color: 'white', opacity: 0.95 }}>
                        We're always interested in meeting talented people. Send us your resume and we'll keep you in mind for future opportunities.
                    </p>
                    <a
                        href="mailto:careers@thekada.com"
                        className="btn btn-secondary"
                        style={{
                            background: 'white',
                            color: 'var(--primary-color)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '1.125rem',
                            padding: '1rem 2rem'
                        }}
                    >
                        <i className="fas fa-envelope"></i>
                        Get In Touch
                    </a>
                </div>
            </section>

            <style jsx>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </main>
    );
}
