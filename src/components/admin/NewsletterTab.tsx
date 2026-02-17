import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';

interface Subscriber {
    id: number;
    email: string;
    subscribed_at: string;
}

export default function NewsletterTab() {
    const { showToast } = useToast();
    const [newsletter, setNewsletter] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNewsletter = async () => {
        try {
            const res = await fetch('/api/admin/newsletter');
            if (res.ok) {
                const data = await res.json();
                setNewsletter(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch newsletter');
                showToast('Failed to load subscribers', 'error');
            }
        } catch (error) {
            console.error('Failed to fetch newsletter', error);
            showToast('Error loading subscribers', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNewsletter();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('Email copied to clipboard', 'success');
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Newsletter Subscribers</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage your email subscribers list</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchNewsletter}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Refresh List"
                    >
                        <i className="fas fa-sync-alt"></i>
                    </button>
                    <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                        <i className="fas fa-download mr-2"></i> Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-slate-500 text-sm font-medium mb-1">Total Subscribers</div>
                            <div className="text-3xl font-bold text-slate-800">{newsletter.length}</div>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <i className="fas fa-users text-lg"></i>
                        </div>
                    </div>
                </div>

                {/* Placeholder stats for visual richness */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-slate-500 text-sm font-medium mb-1">New This Month</div>
                            <div className="text-3xl font-bold text-emerald-600">
                                {newsletter.filter(s => {
                                    const d = new Date(s.subscribed_at);
                                    const now = new Date();
                                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                                }).length}
                            </div>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <i className="fas fa-chart-line text-lg"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-slate-500 text-sm font-medium mb-1">Conversion Rate</div>
                            <div className="text-3xl font-bold text-violet-600">--</div>
                        </div>
                        <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
                            <i className="fas fa-percentage text-lg"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscribers List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 font-semibold text-slate-600 text-sm">ID</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Email Address</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Date Subscribed</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                        <i className="fas fa-spinner fa-spin mr-2"></i> Loading subscribers...
                                    </td>
                                </tr>
                            ) : newsletter.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <div className="text-slate-300 text-4xl mb-3"><i className="fas fa-inbox"></i></div>
                                        <div className="text-slate-500 font-medium">No subscribers yet</div>
                                        <div className="text-slate-400 text-sm">Your subscriber list is empty.</div>
                                    </td>
                                </tr>
                            ) : (
                                newsletter.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4 text-slate-500 font-mono text-xs">#{sub.id}</td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-700 flex items-center gap-2">
                                                {sub.email}
                                                <button
                                                    onClick={() => copyToClipboard(sub.email)}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500 transition-all"
                                                    title="Copy Email"
                                                >
                                                    <i className="fas fa-copy text-xs"></i>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600 text-sm">
                                            {new Date(sub.subscribed_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="text-slate-400 hover:text-red-500 p-2 transition-colors" title="Remove Subscriber">
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && newsletter.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-sm text-slate-500">
                        <div>Showing all {newsletter.length} subscribers</div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50" disabled>Previous</button>
                            <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50" disabled>Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
