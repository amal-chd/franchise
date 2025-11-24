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

    const handleStatusChange = async (id: number, status: string) => {
        try {
            const res = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });

            if (res.ok) {
                fetchRequests(); // Refresh list
            }
        } catch (error) {
            console.error('Failed to update status', error);
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
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                                    {req.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleStatusChange(req.id, 'under_review')}
                                                className="btn btn-primary"
                                                style={{ height: '32px', padding: '0 12px', fontSize: '0.875rem', marginRight: '8px' }}
                                            >
                                                Verify
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(req.id, 'rejected')}
                                                className="btn btn-danger"
                                                style={{ height: '32px', padding: '0 12px', fontSize: '0.875rem' }}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {requests.length === 0 && <p className="text-center" style={{ marginTop: '24px' }}>No requests found.</p>}
            </div>
        </div>
    );
}
