import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/context/ToastContext';
import { useConfirmation } from '@/context/ConfirmationContext';

interface PayoutsTabProps {
    siteSettings: any;
}

export default function PayoutsTab({ siteSettings }: PayoutsTabProps) {
    const { showToast } = useToast();
    const { confirm } = useConfirmation();

    const [payouts, setPayouts] = useState<any[]>([]);
    const [revenueInputs, setRevenueInputs] = useState<Record<number, string>>({});
    const [orderInputs, setOrderInputs] = useState<Record<number, string>>({});
    const [payoutSearch, setPayoutSearch] = useState('');
    const [payoutProcessing, setPayoutProcessing] = useState<number | null>(null);
    const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
    const [payoutView, setPayoutView] = useState<'weekly' | 'history'>('weekly');
    const [historyMonth, setHistoryMonth] = useState(new Date().getMonth() + 1);
    const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
    const [payoutConfirmModal, setPayoutConfirmModal] = useState(false);
    const [selectedPayout, setSelectedPayout] = useState<any>(null);

    const fetchPayouts = async () => {
        try {
            const res = await fetch('/api/admin/payouts');
            const data = await res.json();
            if (Array.isArray(data)) {
                setPayouts(data);
            } else {
                console.error('Payouts data is not an array:', data);
                setPayouts([]);
            }
        } catch (error) {
            console.error('Failed to fetch payouts', error);
            setPayouts([]);
        }
    };

    const fetchPayoutHistory = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/payouts/history?month=${historyMonth}&year=${historyYear}`);
            const data = await res.json();
            setPayoutHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch payout history', error);
        }
    }, [historyMonth, historyYear]);

    useEffect(() => {
        if (payoutView === 'weekly') {
            fetchPayouts();
        } else {
            fetchPayoutHistory();
        }
    }, [payoutView, fetchPayoutHistory]);

    const handleProcessPayout = (payout: any) => {
        let share = 60;
        if (payout.plan_selected === 'premium') share = 70;
        if (payout.plan_selected === 'elite') share = 80;
        if (payout.plan_selected === 'basic' && siteSettings.pricing_basic_share) share = parseInt(siteSettings.pricing_basic_share);
        if (payout.plan_selected === 'premium' && siteSettings.pricing_premium_share) share = parseInt(siteSettings.pricing_premium_share);
        if (payout.plan_selected === 'elite' && siteSettings.pricing_elite_share) share = parseInt(siteSettings.pricing_elite_share);

        const platformFeePerOrder = parseInt(siteSettings.payout_platform_charge || '0');
        const revenue = parseFloat(revenueInputs[payout.id] || '0');
        const orders = parseInt(orderInputs[payout.id] || '0');

        const totalShare = (revenue * share) / 100;
        const feeDeduction = orders * platformFeePerOrder;
        const netPayout = Math.max(0, totalShare - feeDeduction);

        setSelectedPayout({
            ...payout,
            revenue,
            orders,
            share,
            platformFeePerOrder,
            feeDeduction,
            netPayout
        });
        setPayoutConfirmModal(true);
    };

    const confirmPayout = async () => {
        if (!selectedPayout) return;
        setPayoutProcessing(selectedPayout.id);

        try {
            const res = await fetch('/api/admin/payouts/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    franchise_id: selectedPayout.id,
                    amount: selectedPayout.netPayout,
                    revenue_reported: selectedPayout.revenue,
                    orders_count: selectedPayout.orders,
                    share_percentage: selectedPayout.share,
                    platform_fee_per_order: selectedPayout.platformFeePerOrder,
                    total_fee_deducted: selectedPayout.feeDeduction
                })
            });

            if (res.ok) {
                showToast(`Payout of ₹${selectedPayout.netPayout} processed and logged successfully!`, 'success');
                const newRevenue = { ...revenueInputs };
                const newOrders = { ...orderInputs };
                delete newRevenue[selectedPayout.id];
                delete newOrders[selectedPayout.id];
                setRevenueInputs(newRevenue);
                setOrderInputs(newOrders);
                setPayoutConfirmModal(false);
                setSelectedPayout(null);
                fetchPayouts(); // Refresh list
            } else {
                showToast('Failed to process payout.', 'error');
            }
        } catch (error) {
            console.error('Error processing payout:', error);
            showToast('Error processing payout.', 'error');
        } finally {
            setPayoutProcessing(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* View Toggle */}
            <div style={{ display: 'flex', gap: '8px', padding: '4px', background: 'white', borderRadius: '12px', width: 'fit-content', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <button
                    onClick={() => setPayoutView('weekly')}
                    style={{
                        padding: '8px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        background: payoutView === 'weekly' ? '#2563eb' : 'transparent',
                        color: payoutView === 'weekly' ? 'white' : '#64748b',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <i className="fas fa-calculator" style={{ marginRight: '8px' }}></i>
                    Weekly Processing
                </button>
                <button
                    onClick={() => setPayoutView('history')}
                    style={{
                        padding: '8px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        background: payoutView === 'history' ? '#2563eb' : 'transparent',
                        color: payoutView === 'history' ? 'white' : '#64748b',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <i className="fas fa-history" style={{ marginRight: '8px' }}></i>
                    History & Calendar
                </button>
            </div>

            {payoutView === 'weekly' ? (
                <>
                    {/* Stats Dashboard */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #eef2f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>Active Franchises</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b' }}>{payouts.length}</div>
                        </div>
                        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #eef2f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>Total Weekly Revenue</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#3b82f6' }}>
                                ₹{Object.values(revenueInputs).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #eef2f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>Total Pending Payout</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981' }}>
                                ₹{payouts.reduce((acc, payout) => {
                                    let share = 60;
                                    if (payout.plan_selected === 'premium') share = 70;
                                    if (payout.plan_selected === 'elite') share = 80;
                                    if (payout.plan_selected === 'basic' && siteSettings.pricing_basic_share) share = parseInt(siteSettings.pricing_basic_share);
                                    if (payout.plan_selected === 'premium' && siteSettings.pricing_premium_share) share = parseInt(siteSettings.pricing_premium_share);
                                    if (payout.plan_selected === 'elite' && siteSettings.pricing_elite_share) share = parseInt(siteSettings.pricing_elite_share);

                                    const platformFeePerOrder = parseInt(siteSettings.payout_platform_charge || '0');
                                    const revenue = parseFloat(revenueInputs[payout.id] || '0');
                                    const orders = parseInt(orderInputs[payout.id] || '0');

                                    const totalShare = (revenue * share) / 100;
                                    const deduction = orders * platformFeePerOrder;
                                    return acc + Math.max(0, totalShare - deduction);
                                }, 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Card */}
                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        {/* Header & Search */}
                        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', margin: 0 }}>Weekly Payout Management</h3>
                            <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
                                <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                                <input
                                    type="text"
                                    placeholder="Search franchise or city..."
                                    value={payoutSearch}
                                    onChange={(e) => setPayoutSearch(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Franchise Partner</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Plan Info</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Total Revenue (₹)</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Total Orders</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Calculation</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payouts
                                        .filter(p => !payoutSearch || (p.full_name && p.full_name.toLowerCase().includes(payoutSearch.toLowerCase())) || (p.city && p.city.toLowerCase().includes(payoutSearch.toLowerCase())))
                                        .map(payout => {
                                            // Calculation Logic for Display
                                            let share = 60;
                                            if (payout.plan_selected === 'premium') share = 70;
                                            if (payout.plan_selected === 'elite') share = 80;
                                            if (payout.plan_selected === 'basic' && siteSettings.pricing_basic_share) share = parseInt(siteSettings.pricing_basic_share);
                                            if (payout.plan_selected === 'premium' && siteSettings.pricing_premium_share) share = parseInt(siteSettings.pricing_premium_share);
                                            if (payout.plan_selected === 'elite' && siteSettings.pricing_elite_share) share = parseInt(siteSettings.pricing_elite_share);

                                            const platformFeePerOrder = parseInt(siteSettings.payout_platform_charge || '0');
                                            const revenue = parseFloat(revenueInputs[payout.id] || '0');
                                            const orders = parseInt(orderInputs[payout.id] || '0');

                                            const totalShare = (revenue * share) / 100;
                                            const feeDeduction = orders * platformFeePerOrder;
                                            const netPayout = Math.max(0, totalShare - feeDeduction);

                                            return (
                                                <tr key={payout.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{payout.full_name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{payout.city}, {payout.state || 'N/A'}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{
                                                                padding: '4px 10px',
                                                                borderRadius: '20px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '600',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.025em',
                                                                background: payout.plan_selected === 'elite' ? 'linear-gradient(135deg, #fefce8 0%, #fff7ed 100%)' : payout.plan_selected === 'premium' ? '#f3e8ff' : '#eff6ff',
                                                                color: payout.plan_selected === 'elite' ? '#b45309' : payout.plan_selected === 'premium' ? '#7e22ce' : '#1d4ed8',
                                                                border: payout.plan_selected === 'elite' ? '1px solid #fed7aa' : '1px solid transparent'
                                                            }}>
                                                                {payout.plan_selected}
                                                            </span>
                                                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>{share}% Share</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ color: '#94a3b8' }}>₹</span>
                                                            <input
                                                                type="number"
                                                                placeholder="0"
                                                                value={revenueInputs[payout.id] || ''}
                                                                onChange={(e) => setRevenueInputs({ ...revenueInputs, [payout.id]: e.target.value })}
                                                                style={{
                                                                    width: '120px',
                                                                    padding: '8px 12px',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid #cbd5e1',
                                                                    fontWeight: '600',
                                                                    color: '#1e293b'
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            value={orderInputs[payout.id] || ''}
                                                            onChange={(e) => setOrderInputs({ ...orderInputs, [payout.id]: e.target.value })}
                                                            style={{
                                                                width: '100px',
                                                                padding: '8px 12px',
                                                                borderRadius: '6px',
                                                                border: '1px solid #cbd5e1',
                                                                fontWeight: '600',
                                                                color: '#1e293b',
                                                                textAlign: 'center'
                                                            }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>
                                                                ₹{netPayout.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                            </span>
                                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                                (Share: ₹{totalShare.toLocaleString('en-IN', { maximumFractionDigits: 0 })} - Fees: ₹{feeDeduction})
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <button
                                                            onClick={() => handleProcessPayout(payout)}
                                                            disabled={payoutProcessing === payout.id}
                                                            style={{
                                                                padding: '8px 16px',
                                                                background: '#3b82f6',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                fontSize: '0.875rem',
                                                                fontWeight: '500',
                                                                cursor: 'pointer',
                                                                opacity: payoutProcessing === payout.id ? 0.7 : 1,
                                                                transition: 'all 0.2s',
                                                                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                                                            }}
                                                        >
                                                            {payoutProcessing === payout.id ? <i className="fas fa-spinner fa-spin"></i> : 'Process'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    {payouts.filter(p => !payoutSearch || (p.full_name && p.full_name.toLowerCase().includes(payoutSearch.toLowerCase()))).length === 0 && (
                                        <tr>
                                            <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                                                <div style={{ marginBottom: '16px', fontSize: '2rem', color: '#cbd5e1' }}><i className="fas fa-search"></i></div>
                                                No franchises found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col gap-6">
                    {/* Filters */}
                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ fontWeight: '600', color: '#475569' }}>Filter History:</div>
                        <select
                            value={historyMonth}
                            onChange={(e) => setHistoryMonth(parseInt(e.target.value))}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                            ))}
                        </select>
                        <select
                            value={historyYear}
                            onChange={(e) => setHistoryYear(parseInt(e.target.value))}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        >
                            <option value={2024}>2024</option>
                            <option value={2025}>2025</option>
                        </select>
                        <button onClick={fetchPayoutHistory} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                            <i className="fas fa-filter" style={{ marginRight: '8px' }}></i> Apply
                        </button>
                    </div>

                    {/* Calendar & Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                        {/* Calendar View */}
                        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                                Payment Calendar
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                    <div key={d} style={{ fontWeight: 'bold', color: '#94a3b8', fontSize: '0.8rem' }}>{d}</div>
                                ))}
                                {Array.from({ length: new Date(historyYear, historyMonth - 1, 1).getDay() }).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                ))}
                                {Array.from({ length: new Date(historyYear, historyMonth, 0).getDate() }).map((_, i) => {
                                    const day = i + 1;
                                    const hasPayout = payoutHistory.some(p => {
                                        const d = new Date(p.payout_date);
                                        return d.getDate() === day && d.getMonth() === historyMonth - 1 && d.getFullYear() === historyYear;
                                    });
                                    return (
                                        <div key={day} style={{
                                            padding: '10px 0',
                                            borderRadius: '8px',
                                            background: hasPayout ? '#ecfdf5' : 'transparent',
                                            color: hasPayout ? '#059669' : '#475569',
                                            fontWeight: hasPayout ? '700' : '400',
                                            border: hasPayout ? '1px solid #a7f3d0' : '1px solid transparent'
                                        }}>
                                            {day}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', flex: 1 }}>
                                <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '8px' }}>Total Payouts (This Month)</div>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a' }}>
                                    ₹{payoutHistory.reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toLocaleString('en-IN')}
                                </div>
                                <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '0.9rem', color: '#64748b' }}>
                                    <div>Transactions: <b style={{ color: '#1e293b' }}>{payoutHistory.length}</b></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History Table */}
                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <h3 style={{ padding: '20px 24px', margin: 0, fontSize: '1.1rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            Processed Transactions
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Date</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Franchise</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Amount</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Revenue / Orders</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payoutHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No history found for this period.</td>
                                        </tr>
                                    ) : (
                                        payoutHistory.map((p) => (
                                            <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '16px 24px' }}>
                                                    {new Date(p.payout_date).toLocaleDateString()}
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(p.payout_date).toLocaleTimeString()}</div>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{p.franchise_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.city}</div>
                                                </td>
                                                <td style={{ padding: '16px 24px', fontWeight: '700', color: '#10b981' }}>
                                                    ₹{parseFloat(p.amount).toLocaleString('en-IN')}
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div>Ref: ₹{parseFloat(p.revenue_reported).toLocaleString('en-IN')}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.orders_count} Orders</div>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#ecfdf5', color: '#059669', fontSize: '0.75rem', fontWeight: '600' }}>
                                                        Processed
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Payout Confirmation Modal */}
            {payoutConfirmModal && selectedPayout && (
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
                    <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '400px', maxWidth: '90%' }}>
                        <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem' }}>Confirm Payout</h3>

                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem', color: '#64748b' }}>
                                <span>Revenue Reported:</span>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>₹{selectedPayout.revenue.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem', color: '#64748b' }}>
                                <span>Total Share ({selectedPayout.share}%):</span>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>₹{((selectedPayout.revenue * selectedPayout.share) / 100).toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem', color: '#64748b' }}>
                                <span>Deductions ({selectedPayout.orders} orders):</span>
                                <span style={{ fontWeight: '600', color: '#ef4444' }}>- ₹{selectedPayout.feeDeduction.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                <span>Net Payout:</span>
                                <span style={{ color: '#10b981' }}>₹{selectedPayout.netPayout.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={confirmPayout}
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '12px', fontSize: '1rem' }}
                            >
                                Confirm & Process
                            </button>
                            <button
                                onClick={() => setPayoutConfirmModal(false)}
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '12px', fontSize: '1rem' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
