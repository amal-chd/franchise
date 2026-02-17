'use client';

import { useEffect, useState } from 'react';

interface Career {
    id: string;
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

    // Resume form state
    const [showForm, setShowForm] = useState(false);
    const [formJobTitle, setFormJobTitle] = useState('General Application');
    const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [uploadingCv, setUploadingCv] = useState(false);
    const [cvUrl, setCvUrl] = useState('');

    useEffect(() => {
        fetchCareers();
    }, []);

    const fetchCareers = async () => {
        try {
            const res = await fetch('/api/careers');
            const data = await res.json();
            setCareers(Array.isArray(data) ? data : Array.isArray(data?.careers) ? data.careers : []);
        } catch (error) {
            console.error('Failed to fetch careers', error);
        } finally {
            setLoading(false);
        }
    };

    const openResumeForm = (jobTitle?: string) => {
        setFormJobTitle(jobTitle || 'General Application');
        setShowForm(true);
        setSubmitStatus('idle');
        setCvFile(null);
        setCvUrl('');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowed.includes(file.type)) {
            alert('Please upload a PDF or DOC/DOCX file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be under 5MB.');
            return;
        }

        setCvFile(file);
        setUploadingCv(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/careers/upload', { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                setCvUrl(data.url);
            } else {
                alert('Failed to upload CV. Please try again.');
                setCvFile(null);
            }
        } catch {
            alert('Upload error. Please try again.');
            setCvFile(null);
        } finally {
            setUploadingCv(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitStatus('loading');
        try {
            const res = await fetch('/api/careers/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    job_title: formJobTitle,
                    resume_url: cvUrl,
                }),
            });
            if (res.ok) {
                setSubmitStatus('success');
                setForm({ name: '', email: '', phone: '', message: '' });
                setCvFile(null);
                setCvUrl('');
            } else {
                setSubmitStatus('error');
            }
        } catch {
            setSubmitStatus('error');
        }
    };

    return (
        <main>
            {/* Hero */}
            <section className="section" style={{ paddingTop: '100px', background: 'var(--bg-surface)' }}>
                <div className="container" style={{ textAlign: 'center', maxWidth: '700px' }}>
                    <h1 style={{ marginBottom: '12px' }}>Join Our Team</h1>
                    <p style={{ margin: '0 auto', maxWidth: '500px' }}>
                        Help us build the future of hyper-local commerce. We&apos;re looking for passionate people.
                    </p>
                </div>
            </section>

            {/* Job Listings Section */}
            <section className="section">
                <div className="container">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                            <div style={{
                                width: '48px', height: '48px',
                                border: '4px solid var(--border-color)',
                                borderTop: '4px solid var(--primary-color)',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto'
                            }}></div>
                            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading opportunities...</p>
                        </div>
                    ) : careers.length === 0 ? (
                        <div className="glass-card" style={{
                            textAlign: 'center', padding: '3rem 2rem',
                            maxWidth: '500px', margin: '0 auto'
                        }}>
                            <div style={{
                                width: '64px', height: '64px',
                                background: 'var(--primary-light)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.25rem'
                            }}>
                                <i className="fas fa-briefcase" style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}></i>
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Openings Right Now</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                                We don&apos;t have open positions at the moment, but we&apos;d love to hear from you.
                            </p>
                            <button onClick={() => openResumeForm()} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-envelope"></i> Send Us Your Resume
                            </button>
                        </div>
                    ) : (
                        <>

                            <div style={{ display: 'grid', gap: '12px', maxWidth: '800px', margin: '0 auto' }}>
                                {careers.map((job) => (
                                    <div key={job.id} className="glass-card" style={{ padding: '20px', transition: 'all 0.3s ease' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{job.title}</h3>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                                    <span style={{
                                                        padding: '4px 10px', borderRadius: 'var(--radius-pill)',
                                                        fontSize: '0.78rem', fontWeight: '500',
                                                        background: 'rgba(74, 144, 217, 0.1)', color: 'var(--primary-color)'
                                                    }}>
                                                        <i className="fas fa-building" style={{ marginRight: '4px', fontSize: '0.7rem' }}></i>{job.department}
                                                    </span>
                                                    <span style={{
                                                        padding: '4px 10px', borderRadius: 'var(--radius-pill)',
                                                        fontSize: '0.78rem', fontWeight: '500',
                                                        background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6'
                                                    }}>
                                                        <i className="fas fa-map-marker-alt" style={{ marginRight: '4px', fontSize: '0.7rem' }}></i>{job.location}
                                                    </span>
                                                    <span style={{
                                                        padding: '4px 10px', borderRadius: 'var(--radius-pill)',
                                                        fontSize: '0.78rem', fontWeight: '500',
                                                        background: 'rgba(16, 185, 129, 0.1)', color: '#10B981'
                                                    }}>
                                                        <i className="fas fa-clock" style={{ marginRight: '4px', fontSize: '0.7rem' }}></i>{job.type}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '12px', whiteSpace: 'pre-line' }}>
                                                    {job.description}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => openResumeForm(job.title)}
                                            className="btn btn-primary"
                                            style={{ fontSize: '0.85rem', padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <i className="fas fa-paper-plane"></i> Apply Now
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* General application CTA */}
                            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.95rem' }}>
                                    Don&apos;t see a fit? We&apos;d still love to hear from you.
                                </p>
                                <button onClick={() => openResumeForm()} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <i className="fas fa-envelope"></i> Send Us Your Resume
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Resume Submission Modal */}
            {showForm && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '16px',
                }} onClick={() => setShowForm(false)}>
                    <div style={{
                        background: '#fff', borderRadius: 'var(--radius-lg)',
                        padding: '28px', maxWidth: '480px', width: '100%',
                        boxShadow: 'var(--shadow-xl)', maxHeight: '90vh', overflowY: 'auto',
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>Apply</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    {formJobTitle}
                                </p>
                            </div>
                            <button onClick={() => setShowForm(false)} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '1.25rem', color: 'var(--text-muted)', padding: '4px',
                            }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {submitStatus === 'success' ? (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '50%',
                                    background: 'rgba(16, 185, 129, 0.1)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                                }}>
                                    <i className="fas fa-check" style={{ fontSize: '1.5rem', color: '#10B981' }}></i>
                                </div>
                                <h4 style={{ marginBottom: '8px' }}>Application Sent!</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                                    We&apos;ll review your details and get back to you soon.
                                </p>
                                <button onClick={() => setShowForm(false)} className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
                                    Close
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        required
                                        style={{
                                            width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-color)', fontSize: '0.9rem',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="john@example.com"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        required
                                        style={{
                                            width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-color)', fontSize: '0.9rem',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+91 98765 43210"
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        style={{
                                            width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-color)', fontSize: '0.9rem',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                        Tell us about yourself
                                    </label>
                                    <textarea
                                        placeholder="Your experience, skills, and why you want to join..."
                                        value={form.message}
                                        onChange={e => setForm({ ...form, message: e.target.value })}
                                        rows={4}
                                        style={{
                                            width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-color)', fontSize: '0.9rem',
                                            outline: 'none', resize: 'vertical',
                                        }}
                                    />
                                </div>
                                {/* CV Upload */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                        Upload CV/Resume
                                    </label>
                                    <div
                                        style={{
                                            border: `2px dashed ${cvFile ? (cvUrl ? '#10B981' : 'var(--primary-color)') : 'var(--border-color)'}`,
                                            borderRadius: 'var(--radius-md)',
                                            padding: '16px',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            background: cvFile ? (cvUrl ? 'rgba(16,185,129,0.05)' : 'rgba(74,144,217,0.05)') : 'transparent',
                                        }}
                                        onClick={() => document.getElementById('cv-upload')?.click()}
                                    >
                                        <input
                                            id="cv-upload"
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                        {uploadingCv ? (
                                            <div>
                                                <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.2rem', color: 'var(--primary-color)', marginBottom: '6px' }}></i>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>Uploading...</p>
                                            </div>
                                        ) : cvFile ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <i className="fas fa-file-alt" style={{ fontSize: '1rem', color: cvUrl ? '#10B981' : 'var(--primary-color)' }}></i>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{cvFile.name}</span>
                                                {cvUrl && <i className="fas fa-check-circle" style={{ color: '#10B981', fontSize: '0.85rem' }}></i>}
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setCvFile(null); setCvUrl(''); }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '2px', fontSize: '0.8rem' }}
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <i className="fas fa-cloud-upload-alt" style={{ fontSize: '1.5rem', color: 'var(--text-muted)', marginBottom: '6px' }}></i>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '6px 0 2px' }}>
                                                    Click to upload your CV
                                                </p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                                    PDF, DOC, DOCX • Max 5MB
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {submitStatus === 'error' && (
                                    <p style={{ color: '#EF4444', fontSize: '0.85rem', margin: 0 }}>
                                        Something went wrong. Please try again.
                                    </p>
                                )}
                                <button type="submit" className="btn btn-primary" disabled={submitStatus === 'loading'}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    {submitStatus === 'loading' ? (
                                        <><i className="fas fa-spinner fa-spin"></i> Submitting...</>
                                    ) : (
                                        <><i className="fas fa-paper-plane"></i> Submit Application</>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </main>
    );
}
