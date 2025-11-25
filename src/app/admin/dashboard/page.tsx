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
    const [newsletter, setNewsletter] = useState<any[]>([]);

    const router = useRouter();

    const [analytics, setAnalytics] = useState({ totalRequests: 0, pendingVerification: 0, approved: 0, rejected: 0, activeFranchises: 0, pendingTickets: 0, repliedTickets: 0 });
    const [activeTab, setActiveTab] = useState('franchises');
    const [statusFilter, setStatusFilter] = useState('all');

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

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/admin/analytics');
            const data = await res.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch analytics', error);
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

    const fetchCareers = async () => {
        try {
            const res = await fetch('/api/admin/careers');
            const data = await res.json();
            setCareers(data);
        } catch (error) {
            console.error('Failed to fetch careers', error);
        }
    };

    const fetchSiteContent = async () => {
        try {
            const res = await fetch('/api/admin/cms');
            const data = await res.json();
            setSiteContent(data);
        } catch (error) {
            console.error('Failed to fetch site content', error);
        }
    };

    const fetchTestimonials = async () => {
        try {
            const res = await fetch('/api/admin/cms');
            const data = await res.json();
            if (Array.isArray(data.testimonials)) {
                setTestimonials(data.testimonials);
            } else if (data.testimonials) {
                const parsed = typeof data.testimonials === 'string' ? JSON.parse(data.testimonials) : data.testimonials;
                setTestimonials(Array.isArray(parsed) ? parsed : []);
            } else {
                setTestimonials([]);
            }
        } catch (error) {
            console.error('Failed to fetch testimonials', error);
        }
    };

    const fetchNewsletter = async () => {
        try {
            const res = await fetch('/api/admin/newsletter');
            const data = await res.json();
            setNewsletter(data);
        } catch (error) {
            console.error('Failed to fetch newsletter', error);
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
        fetchNewsletter();
    }, []);

    const handleStatusChange = async (id: number, status: string, reason?: string) => {
        try {
            const res = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, rejectionReason: reason }),
            });

            if (res.ok) {
                fetchRequests();
                fetchAnalytics();
            } else {
                const data = await res.json();
                alert(`Failed to update status: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to update status', error);
            alert('An error occurred while updating the status.');
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
                fetchAnalytics();
            } else {
                alert('Failed to send reply');
            }
        } catch (error) {
            console.error('Failed to send reply', error);
            alert('Error sending reply');
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

    if (loading) return <div className="container section">Loading...</div>;

    return (
        <div className="container section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1>Admin Dashboard</h1>
                <button
                    onClick={() => { localStorage.removeItem('isAdmin'); router.push('/admin'); }}
                    className="btn btn-secondary"
                >
                    Logout
                </button>
            </div>

            {/* Analytics Cards */}
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

            {/* Tabs */}
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
                {[
                    { id: 'franchises', label: 'Franchise Requests' },
                    { id: 'support', label: 'Support Tickets' },
                    { id: 'careers', label: 'Careers' },
                    { id: 'testimonials', label: 'Testimonials' },
                    { id: 'newsletter', label: 'Newsletter' },
                    { id: 'cms', label: 'Website Editor' },
                    { id: 'settings', label: 'Settings' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 24px)',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '2px solid var(--primary-color)' : 'none',
                            color: activeTab === tab.id ? 'var(--primary-color)' : '#64748B',
                            fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'newsletter' && (
                <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                    <h3 style={{ marginBottom: '16px' }}>Newsletter Subscribers</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #dadce0' }}>
                                    <th style={{ padding: '12px' }}>ID</th>
                                    <th style={{ padding: '12px' }}>Email</th>
                                    <th style={{ padding: '12px' }}>Subscribed At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {newsletter.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#666' }}>No subscribers yet.</td>
                                    </tr>
                                ) : (
                                    newsletter.map((sub) => (
                                        <tr key={sub.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '12px' }}>#{sub.id}</td>
                                            <td style={{ padding: '12px' }}>{sub.email}</td>
                                            <td style={{ padding: '12px' }}>{new Date(sub.subscribed_at).toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'franchises' && (
                <div style={{ overflowX: 'auto', background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                    <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontWeight: '500', color: '#666' }}>Filter by Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #ddd',
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">All Requests</option>
                            <option value="pending_verification">Pending Verification</option>
                            <option value="under_review">Under Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
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
                            {Array.isArray(requests) && requests
                                .filter(req => statusFilter === 'all' || req.status === statusFilter)
                                .map((req) => (
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

                    {/* Rejection Modal */}
                    {rejectingId && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}>
                            <div style={{
                                background: 'white',
                                padding: '24px',
                                borderRadius: '12px',
                                width: '90%',
                                maxWidth: '400px'
                            }}>
                                <h3 style={{ marginBottom: '16px' }}>Reject Application</h3>
                                <p style={{ marginBottom: '12px', color: '#666' }}>Please provide a reason for rejection:</p>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: '100px',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        marginBottom: '16px',
                                        resize: 'none'
                                    }}
                                    placeholder="Enter rejection reason..."
                                />
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => setRejectingId(null)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            border: '1px solid #ddd',
                                            background: 'white',
                                            cursor: 'pointer'
                                        }}
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
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: '#d93025',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                        disabled={!rejectionReason.trim()}
                                    >
                                        Confirm Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'support' && (
                <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                    <h3 style={{ marginBottom: '16px' }}>Support Tickets</h3>
                    {tickets.length === 0 ? (
                        <p>No tickets found.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {tickets.map((ticket) => (
                                <div key={ticket.id} style={{ padding: '16px', border: '1px solid #f0f0f0', borderRadius: '8px', background: '#f9fafb' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <h4 style={{ margin: 0 }}>{ticket.subject}</h4>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.8rem',
                                            background: ticket.status === 'open' ? '#e0f2fe' : '#dcfce7',
                                            color: ticket.status === 'open' ? '#0369a1' : '#15803d'
                                        }}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
                                        From: {ticket.name} ({ticket.email})
                                    </p>
                                    <p style={{ marginBottom: '16px' }}>{ticket.message}</p>

                                    {ticket.status === 'open' && (
                                        <button
                                            onClick={() => setReplyingTicket(ticket)}
                                            className="btn btn-primary"
                                            style={{ fontSize: '0.9rem', padding: '6px 12px' }}
                                        >
                                            Reply
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Reply Modal */}
                    {replyingTicket && (
                        <div style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1000
                        }}>
                            <div style={{
                                background: 'white',
                                padding: '24px',
                                borderRadius: '12px',
                                width: '90%',
                                maxWidth: '500px'
                            }}>
                                <h3 style={{ marginBottom: '16px' }}>Reply to {replyingTicket.name}</h3>
                                <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: '150px',
                                        padding: '12px',
                                        marginBottom: '16px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd'
                                    }}
                                    placeholder="Type your reply..."
                                />
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => setReplyingTicket(null)}
                                        style={{ padding: '8px 16px', background: 'none', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReplySubmit}
                                        className="btn btn-primary"
                                        style={{ padding: '8px 16px' }}
                                    >
                                        Send Reply
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'careers' && (
                <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                    <h3 style={{ marginBottom: '16px' }}>Manage Careers</h3>

                    {/* Add New Job Form */}
                    <div style={{ marginBottom: '32px', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
                        <h4 style={{ marginBottom: '16px' }}>Post New Job</h4>
                        <form onSubmit={handleJobSubmit} style={{ display: 'grid', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <input
                                    type="text"
                                    placeholder="Job Title"
                                    value={newJob.title}
                                    onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                                    className="form-input"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Department"
                                    value={newJob.department}
                                    onChange={e => setNewJob({ ...newJob, department: e.target.value })}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <input
                                    type="text"
                                    placeholder="Location"
                                    value={newJob.location}
                                    onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                                    className="form-input"
                                    required
                                />
                                <select
                                    value={newJob.type}
                                    onChange={e => setNewJob({ ...newJob, type: e.target.value })}
                                    className="form-input"
                                >
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Internship">Internship</option>
                                </select>
                            </div>
                            <textarea
                                placeholder="Job Description"
                                value={newJob.description}
                                onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                                className="form-input"
                                style={{ height: '100px' }}
                                required
                            />
                            <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start' }}>
                                Post Job
                            </button>
                        </form>
                    </div>

                    {/* Job List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {careers.map((job) => (
                            <div key={job.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0' }}>{job.title}</h4>
                                    <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>
                                        {job.department} • {job.location} • {job.type}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleJobDelete(job.id)}
                                    style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <i className="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'testimonials' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Testimonials List */}
                    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                        <h3 style={{ marginBottom: '16px' }}>Existing Testimonials</h3>
                        {testimonials.length === 0 ? (
                            <p>No testimonials added yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {testimonials.map((t, idx) => (
                                    <div key={t.id} style={{ padding: '16px', border: '1px solid #f0f0f0', borderRadius: '8px', background: '#f9fafb' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <div style={{ fontWeight: 'bold', color: '#333' }}>#{idx + 1}</div>
                                            <button
                                                onClick={() => {
                                                    const newArr = testimonials.filter(item => item.id !== t.id);
                                                    setTestimonials(newArr);
                                                }}
                                                style={{ color: '#d93025', background: 'none', border: 'none', cursor: 'pointer' }}
                                                title="Delete Testimonial"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Name</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    style={{ padding: '8px', fontSize: '0.9rem' }}
                                                    value={t.name}
                                                    onChange={e => {
                                                        const newArr = [...testimonials];
                                                        newArr[idx].name = e.target.value;
                                                        setTestimonials(newArr);
                                                    }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Role</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    style={{ padding: '8px', fontSize: '0.9rem' }}
                                                    value={t.role}
                                                    onChange={e => {
                                                        const newArr = [...testimonials];
                                                        newArr[idx].role = e.target.value;
                                                        setTestimonials(newArr);
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Company</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    style={{ padding: '8px', fontSize: '0.9rem' }}
                                                    value={t.company}
                                                    onChange={e => {
                                                        const newArr = [...testimonials];
                                                        newArr[idx].company = e.target.value;
                                                        setTestimonials(newArr);
                                                    }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Rating</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    className="form-input"
                                                    style={{ padding: '8px', fontSize: '0.9rem' }}
                                                    value={t.rating}
                                                    onChange={e => {
                                                        const newArr = [...testimonials];
                                                        newArr[idx].rating = Number(e.target.value);
                                                        setTestimonials(newArr);
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '12px' }}>
                                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Message</label>
                                            <textarea
                                                className="form-input"
                                                style={{ padding: '8px', fontSize: '0.9rem', height: '80px', minHeight: '80px' }}
                                                value={t.message}
                                                onChange={e => {
                                                    const newArr = [...testimonials];
                                                    newArr[idx].message = e.target.value;
                                                    setTestimonials(newArr);
                                                }}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Avatar (Optional)</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="form-input"
                                                style={{ padding: '8px', fontSize: '0.9rem' }}
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
                                            />
                                            {t.avatar && <div style={{ fontSize: '0.8rem', color: 'green', marginTop: '4px' }}>Avatar uploaded</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Save Button */}
                        <div style={{ marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                            <button
                                onClick={async () => {
                                    await fetch('/api/admin/cms', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ updates: { testimonials: testimonials } })
                                    });
                                    alert('Testimonials saved successfully!');
                                }}
                                className="btn btn-success"
                                style={{ width: '100%', background: 'var(--success-color)', color: 'white', border: 'none' }}
                            >
                                Save All Changes
                            </button>
                        </div>
                    </div>

                    {/* Add New Testimonial Form */}
                    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0', height: 'fit-content' }}>
                        <h3 style={{ marginBottom: '16px' }}>Add New Testimonial</h3>
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. John Doe"
                                value={newTestimonial.name}
                                onChange={e => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. Franchise Owner"
                                value={newTestimonial.role}
                                onChange={e => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Company / Location</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. The Kada - Kochi"
                                value={newTestimonial.company}
                                onChange={e => setNewTestimonial({ ...newTestimonial, company: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Rating (1-5)</label>
                            <input
                                type="number"
                                min="1"
                                max="5"
                                className="form-input"
                                value={newTestimonial.rating}
                                onChange={e => setNewTestimonial({ ...newTestimonial, rating: Number(e.target.value) })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Message</label>
                            <textarea
                                className="form-input"
                                style={{ height: '100px' }}
                                placeholder="Enter testimonial text..."
                                value={newTestimonial.message}
                                onChange={e => setNewTestimonial({ ...newTestimonial, message: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Avatar Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                className="form-input"
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
                            />
                            {newTestimonial.avatar && <div style={{ fontSize: '0.8rem', color: 'green', marginTop: '4px' }}>Image uploaded ready</div>}
                        </div>
                        <button
                            onClick={() => {
                                if (!newTestimonial.name || !newTestimonial.message) {
                                    alert('Name and Message are required');
                                    return;
                                }
                                const newItem = { ...newTestimonial, id: Date.now().toString() };
                                setTestimonials([...testimonials, newItem]);
                                setNewTestimonial({ name: '', role: '', company: '', message: '', rating: 5, avatar: '' });
                            }}
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '8px' }}
                        >
                            Add Testimonial
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'cms' && (
                <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                    <h3 style={{ marginBottom: '16px' }}>Website Content Editor</h3>
                    <form onSubmit={handleContentUpdate} style={{ display: 'grid', gap: '24px' }}>
                        <div className="form-group">
                            <label className="form-label">Hero Title</label>
                            <input
                                type="text"
                                className="form-input"
                                value={siteContent.heroTitle || ''}
                                onChange={e => setSiteContent({ ...siteContent, heroTitle: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Hero Subtitle</label>
                            <textarea
                                className="form-input"
                                value={siteContent.heroSubtitle || ''}
                                onChange={e => setSiteContent({ ...siteContent, heroSubtitle: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start' }}>
                            Save Changes
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'settings' && (
                <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                    <h3 style={{ marginBottom: '16px' }}>Admin Settings</h3>
                    <p>Settings configuration coming soon...</p>
                </div>
            )}
        </div>
    );
}
