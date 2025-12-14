'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { useConfirmation } from '@/context/ConfirmationContext';

export default function PlanRequestsTab() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const { confirm } = useConfirmation();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/admin/plan-requests');
            const data = await res.json();
            setRequests(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch plan requests:', error);
            showToast('Failed to load plan requests', 'error');
            setLoading(false);
        }
    };

    const handleAction = async (requestId: number, action: 'approve' | 'reject') => {
        const isConfirmed = await confirm({
            title: action === 'approve' ? 'Approve Plan Change' : 'Reject Plan Change',
            message: `Are you sure you want to ${action} this request?`,
            confirmText: action === 'approve' ? 'Approve' : 'Reject',
            cancelText: 'Cancel',
            type: action === 'approve' ? 'info' : 'danger'
        });

        if (!isConfirmed) return;

        try {
            const res = await fetch('/api/admin/plan-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, action })
            });

            const data = await res.json();
            if (res.ok) {
                showToast(data.message, 'success');
                fetchRequests();
            } else {
                showToast(data.error || 'Failed to process request', 'error');
            }
        } catch (error) {
            console.error('Error processing request:', error);
            showToast('An error occurred', 'error');
        }
    };

    return (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #dadce0' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.2rem', fontWeight: 'bold' }}>Plan Change Requests</h3>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            <th style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>Franchise</th>
                            <th style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>Current Plan</th>
                            <th style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>Requested Plan</th>
                            <th style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>Date</th>
                            <th style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>Status</th>
                            <th style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                                    No plan change requests found.
                                </td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '16px 12px' }}>
                                        <div style={{ fontWeight: '500' }}>{req.franchise_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{req.franchise_email}</div>
                                    </td>
                                    <td style={{ padding: '16px 12px', textTransform: 'capitalize' }}>
                                        <span style={{
                                            background: '#f1f5f9', color: '#475569',
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem'
                                        }}>
                                            {req.current_plan || 'Standard'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 12px', textTransform: 'capitalize' }}>
                                        <span style={{
                                            background: '#eff6ff', color: '#2563eb',
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '500'
                                        }}>
                                            {req.requested_plan}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 12px', color: '#64748b', fontSize: '0.9rem' }}>
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
                                            background: req.status === 'approved' ? '#dcfce7' : req.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                                            color: req.status === 'approved' ? '#166534' : req.status === 'rejected' ? '#991b1b' : '#854d0e'
                                        }}>
                                            {req.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                        {req.status === 'pending' && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleAction(req.id, 'approve')}
                                                    style={{
                                                        padding: '6px 12px', borderRadius: '6px', border: 'none',
                                                        background: '#16a34a', color: 'white', cursor: 'pointer', fontSize: '0.85rem'
                                                    }}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleAction(req.id, 'reject')}
                                                    style={{
                                                        padding: '6px 12px', borderRadius: '6px', border: 'none',
                                                        background: '#dc2626', color: 'white', cursor: 'pointer', fontSize: '0.85rem'
                                                    }}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
