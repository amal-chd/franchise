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
    const [rejectionReason, setRejectionReason] = useState('');
    const router = useRouter();

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (!isAdmin) {
            router.push('/admin');
            return;
        }

        fetchRequests();
    }, []);

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

    if (loading) return <div className="container section">Loading...</div>;

    return (
        <div className="container section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1>Franchise Requests</h1>
                <button
                    onClick={() => { localStorage.removeItem('isAdmin'); router.push('/admin'); }}
                    className="btn btn-secondary"
                >
                    Logout
                </button>
            </div>

            <div style={{ overflowX: 'auto', background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                {/* Desktop Table */}
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

                            {req.status === 'pending' && (
                                <div className="mobile-card-actions">
                                    <button
                                        onClick={() => handleStatusChange(req.id, 'under_review')}
                                        className="btn btn-primary"
                                        style={{ height: '36px', padding: '0 16px', fontSize: '0.875rem' }}
                                    >
                                        Verify
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(req.id, 'rejected')}
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
            {/* Rejection Modal */}
            {rejectingId && (
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
            )}
        </div>
    );
}
