'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { useConfirmation } from '@/context/ConfirmationContext';

interface ResumeSubmission {
    id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    job_title: string;
    resume_url?: string;
    status: string;
    submitted_at: string;
}

export default function ResumesTab() {
    const [submissions, setSubmissions] = useState<ResumeSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const { confirm } = useConfirmation();

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        try {
            const res = await fetch('/api/admin/resumes');
            const data = await res.json();
            setSubmissions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch resumes', error);
            showToast('Failed to load submissions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            const res = await fetch('/api/admin/resumes', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            if (res.ok) {
                showToast('Status updated', 'success');
                fetchSubmissions();
            } else {
                showToast('Failed to update status', 'error');
            }
        } catch {
            showToast('Error updating status', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: 'Delete Submission',
            message: 'Are you sure you want to delete this resume submission?',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });

        if (isConfirmed) {
            try {
                const res = await fetch(`/api/admin/resumes?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showToast('Submission deleted', 'success');
                    fetchSubmissions();
                } else {
                    showToast('Failed to delete', 'error');
                }
            } catch {
                showToast('Error deleting submission', 'error');
            }
        }
    };

    const statusColors: Record<string, { bg: string; text: string }> = {
        new: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' },
        reviewed: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B' },
        contacted: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' },
        rejected: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' },
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading submissions...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <i className="fas fa-file-alt text-indigo-500"></i> Resume Submissions
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs">{submissions.length}</span>
                </h3>
            </div>

            {submissions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-inbox text-2xl text-slate-400"></i>
                    </div>
                    <h4 className="text-slate-900 font-semibold">No submissions yet</h4>
                    <p className="text-slate-500 text-sm mt-1">Resume submissions from the careers page will appear here.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {submissions.map((sub) => {
                        const sc = statusColors[sub.status] || statusColors.new;
                        return (
                            <div key={sub.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start gap-4 flex-wrap">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <h4 className="text-lg font-bold text-slate-800">{sub.name}</h4>
                                            <span
                                                className="px-2 py-0.5 rounded text-xs font-bold uppercase"
                                                style={{ background: sc.bg, color: sc.text }}
                                            >
                                                {sub.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 mb-1">
                                            <i className="fas fa-briefcase mr-1"></i> {sub.job_title}
                                        </p>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                                            <span><i className="fas fa-envelope mr-1"></i> {sub.email}</span>
                                            {sub.phone && <span><i className="fas fa-phone mr-1"></i> {sub.phone}</span>}
                                            <span>
                                                <i className="fas fa-calendar mr-1"></i>
                                                {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <select
                                            value={sub.status}
                                            onChange={(e) => handleStatusChange(sub.id, e.target.value)}
                                            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="new">New</option>
                                            <option value="reviewed">Reviewed</option>
                                            <option value="contacted">Contacted</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                        <button
                                            onClick={() => handleDelete(sub.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>

                                {(sub.message || sub.resume_url) && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                                        {sub.message && (
                                            <p className="text-sm text-slate-600 whitespace-pre-line">{sub.message}</p>
                                        )}
                                        {sub.resume_url && (
                                            <a
                                                href={sub.resume_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors w-fit"
                                            >
                                                <i className="fas fa-download"></i> Download CV/Resume
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
