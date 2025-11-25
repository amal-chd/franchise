'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Request {
    id: number;
    name: string;
    email: string;
    phone: string;
    city: string;
    status: string;
    aadhar_url?: string;
    agreement_accepted?: boolean;
    created_at: string;
}

export default function AdminDashboard() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [replyingTicket, setReplyingTicket] = useState<any | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [careers, setCareers] = useState<any[]>([]);
    const [newJob, setNewJob] = useState({ title: '', department: '', location: '', type: 'Full-time', description: '' });
    const [siteContent, setSiteContent] = useState<Record<string, string>>({});

    const [testimonials, setTestimonials] = useState<any[]>([]);
    const [newTestimonial, setNewTestimonial] = useState({ name: '', role: '', company: '', message: '', rating: 5, avatar: '' });
    const [rejectionReason, setRejectionReason] = useState('');
    const router = useRouter();

    const [analytics, setAnalytics] = useState({ totalRequests: 0, pendingVerification: 0, approved: 0, rejected: 0, activeFranchises: 0, pendingTickets: 0, repliedTickets: 0 });
    const [activeTab, setActiveTab] = useState('franchises');


    const fetchTestimonials = async () => {
        try {
            const res = await fetch('/api/admin/cms');
            const data = await res.json();
            if (Array.isArray(data.testimonials)) {
                setTestimonials(data.testimonials);
                console.log('Fetched testimonials (array)', data.testimonials.length);
            } else if (data.testimonials) {
                // In case it's stored as JSON string
                const parsed = typeof data.testimonials === 'string' ? JSON.parse(data.testimonials) : data.testimonials;
                const arr = Array.isArray(parsed) ? parsed : [];
                setTestimonials(arr);
                console.log('Fetched testimonials (parsed)', arr.length);
            } else {
                setTestimonials([]);
                console.log('No testimonials found');
            }
        } catch (error) {
            console.error('Failed to fetch testimonials', error);
        }
    };

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (!isAdmin) {
            router.push('/admin');
            return;
        }

        fetchRequests();
        fetchAnalytics();
        fetchTickets();
        fetchCareers();
        fetchSiteContent();
        fetchTestimonials();
    }, []);

    const fetchSiteContent = async () => {
        try {
            const res = await fetch('/api/admin/cms');
            const data = await res.json();
            setSiteContent(data);
        } catch (error) {
            console.error('Failed to fetch site content', error);
        }
    };

    const handleContentUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/cms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates: siteContent }),
            });
            if (res.ok) {
                alert('Site content updated successfully');
            } else {
                alert('Failed to update content');
            }
        } catch (error) {
            console.error('Error updating content', error);
        }
    };

    const fetchCareers = async () => {
        try {
            const res = await fetch('/api/admin/careers');
            const data = await res.json();
            setCareers(data);
        } catch (error) {
            console.error('Failed to fetch careers', error);
        }
    };

    const handleJobSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/careers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newJob),
            });
            if (res.ok) {
                alert('Job posted successfully');
                setNewJob({ title: '', department: '', location: '', type: 'Full-time', description: '' });
                fetchCareers();
            } else {
                alert('Failed to post job');
            }
        } catch (error) {
            console.error('Error posting job', error);
        }
    };

    const handleJobDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this job?')) return;
        try {
            const res = await fetch(`/api/admin/careers?id=${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchCareers();
            } else {
                alert('Failed to delete job');
            }
        } catch (error) {
            console.error('Error deleting job', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/admin/analytics');
            const data = await res.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch analytics', error);
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/admin/requests');
            const data = await res.json();
            setRequests(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch', error);
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: number, status: string, reason?: string) => {
        try {
            const res = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, rejectionReason: reason }),
            });

            if (res.ok) {
                fetchRequests(); // Refresh list
            } else {
                const data = await res.json();
                alert(`Failed to update status: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to update status', error);
            alert('An error occurred while updating the status.');
        }
    };

    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/admin/support/tickets');
            const data = await res.json();
            setTickets(data);
        } catch (error) {
            console.error('Failed to fetch tickets', error);
        }
    };

    const handleReplySubmit = async () => {
        if (!replyingTicket || !replyMessage) return;

        try {
            const res = await fetch('/api/admin/support/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId: replyingTicket.id,
                    message: replyMessage,
                    userEmail: replyingTicket.email,
                    userName: replyingTicket.name,
                    ticketSubject: replyingTicket.subject
                }),
            });

            if (res.ok) {
                alert('Reply sent successfully');
                setReplyingTicket(null);
                setReplyMessage('');
                fetchTickets();
            } else {
                alert('Failed to send reply');
            }
        } catch (error) {
            console.error('Failed to send reply', error);
            alert('Error sending reply');
        }
    };

    if (loading) return <div className="container section">Loading...</div>;

    return (
        <div className="container section">
            {/* ... Header and Analytics Cards ... */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1>Admin Dashboard</h1>
                <button
                    onClick={() => { localStorage.removeItem('isAdmin'); router.push('/admin'); }}
                    className="btn btn-secondary"
                >
                    Logout
                </button>
            </div>

            {/* Analytics Cards - Auto-scrolling on Mobile */}
            <div className="analytics-grid analytics-auto-scroll">
                <div className="analytics-card">
                    <h3 style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '8px' }}>Total Requests</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{analytics.totalRequests}</div>
                </div>
                <div className="analytics-card">
                    <h3 style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '8px' }}>Pending Verification</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F59E0B' }}>{analytics.pendingVerification}</div>
                </div>
                <div className="analytics-card">
                    <h3 style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '8px' }}>Approved</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>{analytics.approved}</div>
                </div>
                <div className="analytics-card">
                    <h3 style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '8px' }}>Rejected</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#EF4444' }}>{analytics.rejected}</div>
                </div>
                <div className="analytics-card">
                    <h3 style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '8px' }}>Pending Tickets</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F59E0B' }}>{analytics.pendingTickets}</div>
                </div>
                <div className="analytics-card">
                    <h3 style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '8px' }}>Replied Tickets</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>{analytics.repliedTickets}</div>
                </div>
            </div>

            {/* Tabs - Mobile Optimized with Horizontal Scroll */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '24px',
                borderBottom: '1px solid #e2e8f0',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                paddingBottom: '2px'
            }}
                className="admin-tabs-scroll">
                <button
                    onClick={() => setActiveTab('franchises')}
                    style={{
                        padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 24px)',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'franchises' ? '2px solid var(--primary-color)' : 'none',
                        color: activeTab === 'franchises' ? 'var(--primary-color)' : '#64748B',
                        fontWeight: activeTab === 'franchises' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    Franchise Requests
                </button>
                <button
                    onClick={() => setActiveTab('support')}
                    style={{
                        padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 24px)',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'support' ? '2px solid var(--primary-color)' : 'none',
                        color: activeTab === 'support' ? 'var(--primary-color)' : '#64748B',
                        fontWeight: activeTab === 'support' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    Support Tickets
                </button>
                <button
                    onClick={() => setActiveTab('careers')}
                    style={{
                        padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 24px)',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'careers' ? '2px solid var(--primary-color)' : 'none',
                        color: activeTab === 'careers' ? 'var(--primary-color)' : '#64748B',
                        fontWeight: activeTab === 'careers' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    Careers
                </button>
                {/* Add Testimonials Tab */}
                <button
                    onClick={() => setActiveTab('testimonials')}
                    style={{
                        padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 24px)',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'testimonials' ? '2px solid var(--primary-color)' : 'none',
                        color: activeTab === 'testimonials' ? 'var(--primary-color)' : '#64748B',
                        fontWeight: activeTab === 'testimonials' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    Testimonials
                </button>
                <button
                    onClick={() => setActiveTab('cms')}
                    style={{
                        padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 24px)',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'cms' ? '2px solid var(--primary-color)' : 'none',
                        color: activeTab === 'cms' ? 'var(--primary-color)' : '#64748B',
                        fontWeight: activeTab === 'cms' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    Website Editor
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'testimonials' && (
                <div className="admin-testimonials">
                    {/* List existing testimonials */}
                    <div style={{ marginBottom: '2rem' }}>
                        {testimonials.map((t, idx) => (
                            <div key={t.id} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={t.name}
                                    onChange={e => {
                                        const newArr = [...testimonials];
                                        newArr[idx].name = e.target.value;
                                        setTestimonials(newArr);
                                    }}
                                    style={{ width: '100%', marginBottom: '0.5rem' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Role"
                                    value={t.role}
                                    onChange={e => {
                                        const newArr = [...testimonials];
                                        newArr[idx].role = e.target.value;
                                        setTestimonials(newArr);
                                    }}
                                    style={{ width: '100%', marginBottom: '0.5rem' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Company"
                                    value={t.company}
                                    onChange={e => {
                                        const newArr = [...testimonials];
                                        newArr[idx].company = e.target.value;
                                        setTestimonials(newArr);
                                    }}
                                    style={{ width: '100%', marginBottom: '0.5rem' }}
                                />
                                <textarea
                                    placeholder="Message"
                                    value={t.message}
                                    onChange={e => {
                                        const newArr = [...testimonials];
                                        newArr[idx].message = e.target.value;
                                        setTestimonials(newArr);
                                    }}
                                    style={{ width: '100%', marginBottom: '0.5rem' }}
                                />
                                <input
                                    type="number"
                                    placeholder="Rating"
                                    min="1"
                                    max="5"
                                    value={t.rating}
                                    onChange={e => {
                                        const newArr = [...testimonials];
                                        newArr[idx].rating = Number(e.target.value);
                                        setTestimonials(newArr);
                                    }}
                                    style={{ width: '60px', marginBottom: '0.5rem' }}
                                />
                                {/* Avatar upload */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async e => {
                                        if (!e.target.files?.[0]) return;
                                        const formData = new FormData();
                                        formData.append('file', e.target.files[0]);
                                        const res = await fetch('/api/admin/upload-background', {
                                            method: 'POST',
                                            body: formData,
                                        });
                                        const data = await res.json();
                                        if (data.url) {
                                            const newArr = [...testimonials];
                                            newArr[idx].avatar = data.url;
                                            setTestimonials(newArr);
                                        }
                                    }}
                                    style={{ marginBottom: '0.5rem' }}
                                />
                                <button
                                    onClick={() => {
                                        const newArr = testimonials.filter(item => item.id !== t.id);
                                        setTestimonials(newArr);
                                    }}
                                    className="btn btn-danger"
                                    style={{ marginRight: '0.5rem' }}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                    {/* Add new testimonial */}
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <h4>Add New Testimonial</h4>
                        <input
                            type="text"
                            placeholder="Name"
                            value={newTestimonial.name}
                            onChange={e => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                            style={{ width: '100%', marginBottom: '0.5rem' }}
                        />
                        <input
                            type="text"
                            placeholder="Role"
                            value={newTestimonial.role}
                            onChange={e => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                            style={{ width: '100%', marginBottom: '0.5rem' }}
                        />
                        <input
                            type="text"
                            placeholder="Company"
                            value={newTestimonial.company}
                            onChange={e => setNewTestimonial({ ...newTestimonial, company: e.target.value })}
                            style={{ width: '100%', marginBottom: '0.5rem' }}
                        />
                        <textarea
                            placeholder="Message"
                            value={newTestimonial.message}
                            onChange={e => setNewTestimonial({ ...newTestimonial, message: e.target.value })}
                            style={{ width: '100%', marginBottom: '0.5rem' }}
                        />
                        <input
                            type="number"
                            placeholder="Rating"
                            min="1"
                            max="5"
                            value={newTestimonial.rating}
                            onChange={e => setNewTestimonial({ ...newTestimonial, rating: Number(e.target.value) })}
                            style={{ width: '60px', marginBottom: '0.5rem' }}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={async e => {
                                if (!e.target.files?.[0]) return;
                                const formData = new FormData();
                                formData.append('file', e.target.files[0]);
                                const res = await fetch('/api/admin/upload-background', {
                                    method: 'POST',
                                    body: formData,
                                });
                                const data = await res.json();
                                if (data.url) {
                                    setNewTestimonial({ ...newTestimonial, avatar: data.url });
                                }
                            }}
                            style={{ marginBottom: '0.5rem' }}
                        />
                        <button
                            onClick={() => {
                                const newItem = { ...newTestimonial, id: Date.now().toString() };
                                setTestimonials([...testimonials, newItem]);
                                setNewTestimonial({ name: '', role: '', company: '', message: '', rating: 5, avatar: '' });
                            }}
                            className="btn btn-primary"
                        >
                            Add Testimonial
                        </button>
                    </div>
                    {/* Save all changes */}
                    <div style={{ marginTop: '1rem' }}>
                        <button
                            onClick={async () => {
                                await fetch('/api/admin/cms', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ content_key: 'testimonials', content_value: testimonials })
                                });
                                alert('Testimonials saved');
                            }}
                            className="btn btn-success"
                        >
                            Save All
                        </button>
                    </div>
                </div>
            )}
            {activeTab === 'franchises' && (
                <div style={{ overflowX: 'auto', background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                    {/* ... Franchise Table and Mobile Cards ... */}
                    <table className="desktop-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #dadce0' }}>
                                <th style={{ padding: '12px' }}>ID</th>
                                <th style={{ padding: '12px' }}>Name</th>
                                <th style={{ padding: '12px' }}>City</th>
                                <th style={{ padding: '12px' }}>Contact</th>
                                <th style={{ padding: '12px' }}>KYC</th>
                                <th style={{ padding: '12px' }}>Agreement</th>
                                <th style={{ padding: '12px' }}>Status</th>
                                <th style={{ padding: '12px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(requests) && requests.map((req) => (
                                <tr key={req.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '12px' }}>#{req.id}</td>
                                    <td style={{ padding: '12px' }}>{req.name}</td>
                                    <td style={{ padding: '12px' }}>{req.city}</td>
                                    <td style={{ padding: '12px' }}>
                                        <div>{req.email}</div>
                                        <div style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>{req.phone}</div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {req.aadhar_url ? (
                                            <a href={req.aadhar_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>View Doc</a>
                                        ) : (
                                            <span style={{ color: '#999' }}>Pending</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {req.agreement_accepted ? (
                                            <span style={{ color: 'var(--success-color)' }}><i className="fas fa-check-circle"></i> Signed</span>
                                        ) : (
                                            <span style={{ color: '#999' }}>Pending</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            background: req.status === 'approved' ? '#e6f4ea' : req.status === 'rejected' ? '#fce8e6' : '#fff3cd',
                                            color: req.status === 'approved' ? '#1e8e3e' : req.status === 'rejected' ? '#d93025' : '#856404',
                                            fontSize: '0.875rem',
                                            fontWeight: 500
                                        }}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {(req.status === 'pending_verification' || req.status === 'under_review') && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {req.status === 'pending_verification' && (
                                                    <button
                                                        onClick={() => handleStatusChange(req.id, 'under_review')}
                                                        className="btn btn-primary"
                                                        style={{ height: '32px', padding: '0 12px', fontSize: '0.875rem' }}
                                                    >
                                                        Verify
                                                    </button>
                                                )}
                                                {req.status === 'under_review' && (
                                                    <button
                                                        onClick={() => handleStatusChange(req.id, 'approved')}
                                                        className="btn btn-success"
                                                        style={{ height: '32px', padding: '0 12px', fontSize: '0.875rem', background: 'var(--success-color)', color: 'white', border: 'none' }}
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setRejectingId(req.id);
                                                        setRejectionReason('');
                                                    }}
                                                    className="btn btn-danger"
                                                    style={{ height: '32px', padding: '0 12px', fontSize: '0.875rem', background: '#d93025', color: 'white', border: 'none' }}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Mobile Cards */}
                    <div className="mobile-cards">
                        {Array.isArray(requests) && requests.map((req) => (
                            <div key={req.id} className="mobile-card">
                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">ID</span>
                                    <span className="mobile-card-value">#{req.id}</span>
                                </div>
                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">Name</span>
                                    <span className="mobile-card-value">{req.name}</span>
                                </div>
                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">City</span>
                                    <span className="mobile-card-value">{req.city}</span>
                                </div>
                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">Contact</span>
                                    <div className="mobile-card-value">
                                        <div>{req.email}</div>
                                        <div style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>{req.phone}</div>
                                    </div>
                                </div>
                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">KYC</span>
                                    <span className="mobile-card-value">
                                        {req.aadhar_url ? (
                                            <a href={req.aadhar_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>View Doc</a>
                                        ) : (
                                            <span style={{ color: '#999' }}>Pending</span>
                                        )}
                                    </span>
                                </div>
                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">Agreement</span>
                                    <span className="mobile-card-value">
                                        {req.agreement_accepted ? (
                                            <span style={{ color: 'var(--success-color)' }}><i className="fas fa-check-circle"></i> Signed</span>
                                        ) : (
                                            <span style={{ color: '#999' }}>Pending</span>
                                        )}
                                    </span>
                                </div>
                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">Status</span>
                                    <span className="mobile-card-value">
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            background: req.status === 'approved' ? '#e6f4ea' : req.status === 'rejected' ? '#fce8e6' : '#fff3cd',
                                            color: req.status === 'approved' ? '#1e8e3e' : req.status === 'rejected' ? '#d93025' : '#856404',
                                            fontSize: '0.875rem',
                                            fontWeight: 500
                                        }}>
                                            {req.status}
                                        </span>
                                    </span>
                                </div>

                                {(req.status === 'pending_verification' || req.status === 'under_review') && (
                                    <div className="mobile-card-actions">
                                        {req.status === 'pending_verification' && (
                                            <button
                                                onClick={() => handleStatusChange(req.id, 'under_review')}
                                                className="btn btn-primary"
                                                style={{ height: '36px', padding: '0 16px', fontSize: '0.875rem' }}
                                            >
                                                Verify
                                            </button>
                                        )}
                                        {req.status === 'under_review' && (
                                            <button
                                                onClick={() => handleStatusChange(req.id, 'approved')}
                                                className="btn btn-success"
                                                style={{ height: '36px', padding: '0 16px', fontSize: '0.875rem', background: 'var(--success-color)', color: 'white', border: 'none' }}
                                            >
                                                Approve
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setRejectingId(req.id);
                                                setRejectionReason('');
                                            }}
                                            className="btn btn-danger"
                                            style={{ height: '36px', padding: '0 16px', fontSize: '0.875rem', background: '#d93025', color: 'white', border: 'none' }}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {requests.length === 0 && <p className="text-center" style={{ marginTop: '24px' }}>No requests found.</p>}
                </div>
            )} {activeTab === 'support' && (
                <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                    {/* ... Franchise Table and Mobile Cards ... */}
                    <table className="desktop-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #dadce0' }}>
                                <th style={{ padding: '12px' }}>ID</th>
                                <th style={{ padding: '12px' }}>User</th>
                                <th style={{ padding: '12px' }}>Subject</th>
                                <th style={{ padding: '12px' }}>Message</th>
                                <th style={{ padding: '12px' }}>Status</th>
                                <th style={{ padding: '12px' }}>Date</th>
                                <th style={{ padding: '12px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(tickets) && tickets.map((ticket) => (
                                <tr key={ticket.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '12px' }}>#{ticket.id}</td>
                                    <td style={{ padding: '12px' }}>
                                        <div>{ticket.name}</div>
                                        <div style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>{ticket.email}</div>
                                    </td>
                                    <td style={{ padding: '12px' }}>{ticket.subject}</td>
                                    <td style={{ padding: '12px', maxWidth: '300px' }}>
                                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.message}</div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            background: ticket.status === 'replied' ? '#e6f4ea' : '#fff3cd',
                                            color: ticket.status === 'replied' ? '#1e8e3e' : '#856404',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            textTransform: 'capitalize'
                                        }}>
                                            {ticket.status || 'Open'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>{new Date(ticket.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '12px' }}>
                                        <button
                                            onClick={() => setReplyingTicket(ticket)}
                                            className="btn btn-primary"
                                            style={{ height: '32px', padding: '0 12px', fontSize: '0.875rem' }}
                                        >
                                            Reply
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>


                    {/* Mobile Ticket Cards */}
                    <div className="mobile-cards">
                        {Array.isArray(tickets) && tickets.map((ticket) => (
                            <div key={ticket.id} className="mobile-card">
                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">ID</span>
                                    <span className="mobile-card-value">#{ticket.id}</span>
                                </div>
                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">User</span>
                                    <div className="mobile-card-value">
                                        <div>{ticket.name}</div>
                                        <div style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>{ticket.email}</div>
                                    </div>
                                </div>
                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">Subject</span>
                                    <span className="mobile-card-value">{ticket.subject}</span>
                                </div>
                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">Status</span>
                                    <span className="mobile-card-value">
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            background: ticket.status === 'replied' ? '#e6f4ea' : '#fff3cd',
                                            color: ticket.status === 'replied' ? '#1e8e3e' : '#856404',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            textTransform: 'capitalize'
                                        }}>
                                            {ticket.status || 'Open'}
                                        </span>
                                    </span>
                                </div>
                                <div className="mobile-card-row" style={{ display: 'block' }}>
                                    <div className="mobile-card-label" style={{ marginBottom: '4px' }}>Message</div>
                                    <div className="mobile-card-value" style={{ textAlign: 'left', fontSize: '0.9rem', color: '#333' }}>{ticket.message}</div>
                                </div>
                                <div className="mobile-card-actions">
                                    <button
                                        onClick={() => setReplyingTicket(ticket)}
                                        className="btn btn-primary"
                                        style={{ height: '36px', padding: '0 16px', fontSize: '0.875rem', width: '100%' }}
                                    >
                                        Reply
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {tickets.length === 0 && <p className="text-center" style={{ marginTop: '24px' }}>No tickets found.</p>}
                </div>
            )} {activeTab === 'careers' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Job List */}
                    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                        <h3 style={{ marginBottom: '16px' }}>Active Job Postings</h3>
                        {careers.length === 0 ? (
                            <p>No active jobs.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {careers.map((job) => (
                                    <div key={job.id} style={{ padding: '16px', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{job.title}</h4>
                                                <div style={{ fontSize: '0.9rem', color: '#666' }}>{job.department} • {job.location} • {job.type}</div>
                                            </div>
                                            <button onClick={() => handleJobDelete(job.id)} style={{ color: '#d93025', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', color: '#333', margin: 0 }}>{job.description.substring(0, 100)}...</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add Job Form */}
                    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0', height: 'fit-content' }}>
                        <h3 style={{ marginBottom: '16px' }}>Post a New Job</h3>
                        <form onSubmit={handleJobSubmit}>
                            <div className="form-group">
                                <label className="form-label">Job Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newJob.title}
                                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newJob.department}
                                        onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newJob.location}
                                        onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select
                                    className="form-input"
                                    value={newJob.type}
                                    onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                                >
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Internship">Internship</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    style={{ height: '120px' }}
                                    value={newJob.description}
                                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Post Job</button>
                        </form>
                    </div>
                </div>
            )} {activeTab === 'cms' && (
                <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                    <h3 style={{ marginBottom: '24px' }}>Website Content Editor</h3>
                    <form onSubmit={handleContentUpdate}>
                        <div style={{ display: 'grid', gap: '24px' }}>
                            <div className="form-group">
                                <label className="form-label">Hero Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={siteContent.hero_title || ''}
                                    onChange={(e) => setSiteContent({ ...siteContent, hero_title: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Hero Subtitle</label>
                                <textarea
                                    className="form-input"
                                    style={{ height: '80px' }}
                                    value={siteContent.hero_subtitle || ''}
                                    onChange={(e) => setSiteContent({ ...siteContent, hero_subtitle: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">About Text</label>
                                <textarea
                                    className="form-input"
                                    style={{ height: '150px' }}
                                    value={siteContent.about_text || ''}
                                    onChange={(e) => setSiteContent({ ...siteContent, about_text: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div className="form-group">
                                    <label className="form-label">Contact Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={siteContent.contact_email || ''}
                                        onChange={(e) => setSiteContent({ ...siteContent, contact_email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Phone</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={siteContent.contact_phone || ''}
                                        onChange={(e) => setSiteContent({ ...siteContent, contact_phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', padding: '12px 32px' }}>
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Rejection Modal */}
            {
                rejectingId && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
                            <h3>Reject Application</h3>
                            <p style={{ marginBottom: '16px' }}>Please provide a reason for rejection:</p>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                style={{ width: '100%', height: '100px', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '16px' }}
                                placeholder="Reason for rejection..."
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                    onClick={() => setRejectingId(null)}
                                    className="btn btn-secondary"
                                    style={{ width: 'auto', height: '36px', padding: '0 16px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (rejectingId) {
                                            handleStatusChange(rejectingId, 'rejected', rejectionReason);
                                            setRejectingId(null);
                                        }
                                    }}
                                    className="btn btn-danger"
                                    style={{ width: 'auto', height: '36px', padding: '0 16px', background: '#d93025', color: 'white', border: 'none' }}
                                >
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Reply Modal */}
            {
                replyingTicket && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
                            <h3>Reply to Ticket #{replyingTicket.id}</h3>
                            <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>Subject: {replyingTicket.subject}</p>
                            <p style={{ marginBottom: '16px', fontSize: '0.9rem', color: '#666' }}>To: {replyingTicket.email}</p>

                            <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '8px', marginBottom: '16px', maxHeight: '150px', overflowY: 'auto', fontSize: '0.9rem' }}>
                                <strong>User Message:</strong><br />
                                {replyingTicket.message}
                            </div>

                            <textarea
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                style={{ width: '100%', height: '150px', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '16px', fontFamily: 'inherit' }}
                                placeholder="Type your reply here..."
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                    onClick={() => setReplyingTicket(null)}
                                    className="btn btn-secondary"
                                    style={{ width: 'auto', height: '36px', padding: '0 16px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReplySubmit}
                                    className="btn btn-primary"
                                    style={{ width: 'auto', height: '36px', padding: '0 16px' }}
                                    disabled={!replyMessage}
                                >
                                    Send Reply
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
