'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { useConfirmation } from '@/context/ConfirmationContext';

interface FranchiseRequest {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    status: string;
    plan_selected: string;
    aadhar_url?: string;
    created_at: string;
    payment_status?: string;
    // Add other fields as needed
}

export default function LeadsTab() {
    const [requests, setRequests] = useState<FranchiseRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    // CRUD State
    const [isFranchiseModalOpen, setIsFranchiseModalOpen] = useState(false);
    const [editingFranchise, setEditingFranchise] = useState<any>(null);
    const [franchiseForm, setFranchiseForm] = useState({
        name: '', email: '', phone: '', city: '',
        plan_selected: 'standard', status: 'pending_verification',
        upi_id: '', bank_account_number: '', ifsc_code: '', bank_name: ''
    });

    const { showToast } = useToast();
    const { confirm } = useConfirmation();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/admin/requests');
            const data = await res.json();
            // Filter strictly for leads (NOT completed payment)
            const allRequests = Array.isArray(data) ? data : [];
            const leads = allRequests.filter((req: FranchiseRequest) =>
                req.payment_status !== 'completed' && req.status !== 'approved'
            );
            setRequests(leads);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch requests', error);
            showToast('Failed to load leads', 'error');
            setLoading(false);
        }
    };

    const handleDeleteFranchise = async (id: string) => {
        const isConfirmed = await confirm({
            title: 'Delete Lead',
            message: 'Are you sure you want to delete this lead? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });

        if (isConfirmed) {
            try {
                const res = await fetch(`/api/admin/franchises?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showToast('Lead deleted successfully', 'success');
                    fetchRequests();
                } else {
                    showToast('Failed to delete lead', 'error');
                }
            } catch (error) {
                console.error('Error deleting lead:', error);
                showToast('An error occurred', 'error');
            }
        }
    };

    const handleEditFranchise = (franchise: any) => {
        setEditingFranchise(franchise);
        setFranchiseForm({
            name: franchise.name,
            email: franchise.email,
            phone: franchise.phone,
            city: franchise.city,
            plan_selected: franchise.plan_selected || 'standard',
            status: franchise.status,
            upi_id: franchise.upi_id || '',
            bank_account_number: franchise.bank_account_number || '',
            ifsc_code: franchise.ifsc_code || '',
            bank_name: franchise.bank_name || ''
        });
        setIsFranchiseModalOpen(true);
    };

    const handleSaveFranchise = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = '/api/admin/franchises';
            const method = editingFranchise ? 'PUT' : 'POST';
            const body = editingFranchise ? { ...franchiseForm, id: editingFranchise.id } : franchiseForm;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                showToast(`Lead ${editingFranchise ? 'updated' : 'created'} successfully`, 'success');
                setIsFranchiseModalOpen(false);
                fetchRequests();
            } else {
                const data = await res.json();
                showToast(data.message || `Failed to ${editingFranchise ? 'update' : 'create'} lead`, 'error');
            }
        } catch (error) {
            console.error('Error saving lead', error);
            showToast('Error saving lead', 'error');
        }
    };

    const filteredRequests = requests.filter(req =>
        statusFilter === 'all' ? true : req.status === statusFilter
    );

    if (loading) return <div className="p-8 text-center text-slate-500">Loading leads...</div>;

    return (
        <div className="space-y-6">
            {/* Header & stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Leads</h2>
                    <p className="text-sm text-slate-500">Manage potential franchise partners (Pending Payment).</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex overflow-x-auto pb-2 gap-2 border-b border-slate-200">
                {['all', 'pending', 'pending_verification'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                            ${statusFilter === status
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}
                        `}
                    >
                        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Details</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No leads found matching this filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                                                    {String(req.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{req.name}</div>
                                                    <div className="text-xs text-slate-500">{req.email}</div>
                                                    <div className="text-xs text-slate-500">{req.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`
                                                px-2.5 py-1 rounded-md text-xs font-bold uppercase
                                                ${req.plan_selected === 'elite' ? 'bg-amber-100 text-amber-700' :
                                                    req.plan_selected === 'premium' ? 'bg-indigo-100 text-indigo-700' :
                                                        'bg-blue-100 text-blue-700'}
                                            `}>
                                                {req.plan_selected || 'Standard'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            <i className="fas fa-map-marker-alt text-slate-400 mr-1"></i> {req.city}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit bg-slate-100 text-slate-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                                {req.payment_status === 'pending' ? 'Payment Pending' : 'Incomplete'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleEditFranchise(req)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button onClick={() => handleDeleteFranchise(req.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Franchise Add/Edit Modal */}
            {isFranchiseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingFranchise ? 'Edit Lead' : 'Add New Lead'}
                            </h3>
                            <button onClick={() => setIsFranchiseModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSaveFranchise} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                        required
                                        value={franchiseForm.name}
                                        onChange={e => setFranchiseForm({ ...franchiseForm, name: e.target.value })}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                        required
                                        value={franchiseForm.email}
                                        onChange={e => setFranchiseForm({ ...franchiseForm, email: e.target.value })}
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                        required
                                        value={franchiseForm.phone}
                                        onChange={e => setFranchiseForm({ ...franchiseForm, phone: e.target.value })}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">City</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                        required
                                        value={franchiseForm.city}
                                        onChange={e => setFranchiseForm({ ...franchiseForm, city: e.target.value })}
                                        placeholder="Mumbai"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Plan Selection</label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm appearance-none"
                                            value={franchiseForm.plan_selected}
                                            onChange={e => setFranchiseForm({ ...franchiseForm, plan_selected: e.target.value })}
                                        >
                                            <option value="free">Starter (Free)</option>
                                            <option value="basic">Standard</option>
                                            <option value="premium">Premium</option>
                                            <option value="elite">Elite</option>
                                        </select>
                                        <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Application Status</label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm appearance-none"
                                            value={franchiseForm.status}
                                            onChange={e => setFranchiseForm({ ...franchiseForm, status: e.target.value })}
                                        >
                                            <option value="pending_verification">Pending Verification</option>
                                            <option value="under_review">Under Review</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                        <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsFranchiseModalOpen(false)}
                                    className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-lg shadow-slate-900/20 transition-all text-sm"
                                >
                                    {editingFranchise ? 'Update Lead' : 'Create Lead'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
