'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { useConfirmation } from '@/context/ConfirmationContext';

export default function CareersTab() {
    const [careers, setCareers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newJob, setNewJob] = useState({ title: '', department: '', location: '', type: 'Full-time', description: '' });
    const { showToast } = useToast();
    const { confirm } = useConfirmation();

    useEffect(() => {
        fetchCareers();
    }, []);

    const fetchCareers = async () => {
        try {
            const res = await fetch('/api/admin/careers');
            const data = await res.json();
            setCareers(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch careers', error);
            showToast('Failed to load careers', 'error');
            setLoading(false);
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
                showToast('Job posted successfully', 'success');
                setNewJob({ title: '', department: '', location: '', type: 'Full-time', description: '' });
                fetchCareers();
            } else {
                showToast('Failed to post job', 'error');
            }
        } catch (error) {
            console.error('Error posting job', error);
            showToast('Error posting job', 'error');
        }
    };

    const handleJobDelete = async (id: number) => {
        const isConfirmed = await confirm({
            title: 'Delete Job',
            message: 'Are you sure you want to delete this job posting?',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });

        if (isConfirmed) {
            try {
                const res = await fetch(`/api/admin/careers?id=${id}`, {
                    method: 'DELETE',
                });
                if (res.ok) {
                    showToast('Job deleted successfully', 'success');
                    fetchCareers();
                } else {
                    showToast('Failed to delete job', 'error');
                }
            } catch (error) {
                console.error('Error deleting job', error);
                showToast('Error deleting job', 'error');
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading careers...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Post New Job Form */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
                    <div className="p-6 border-b border-slate-100 bg-indigo-50/50">
                        <h3 className="text-lg font-bold text-slate-800">Post New Job</h3>
                        <p className="text-sm text-slate-500">Add a new opening to the careers page.</p>
                    </div>
                    <form onSubmit={handleJobSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Job Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Sales Executive"
                                value={newJob.title}
                                onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Sales"
                                    value={newJob.department}
                                    onChange={e => setNewJob({ ...newJob, department: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Location</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Remote"
                                    value={newJob.location}
                                    onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Type</label>
                            <select
                                value={newJob.type}
                                onChange={e => setNewJob({ ...newJob, type: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                                <option value="Internship">Internship</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                            <textarea
                                placeholder="Job responsibilities and requirements..."
                                value={newJob.description}
                                onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all h-32 resize-none"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            Post Job Opening
                        </button>
                    </form>
                </div>
            </div>

            {/* Job List */}
            <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <i className="fas fa-briefcase text-indigo-500"></i> Active Listings
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs">{careers.length}</span>
                </h3>

                {careers.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-clipboard-list text-2xl text-slate-400"></i>
                        </div>
                        <h4 className="text-slate-900 font-semibold">No jobs posted yet</h4>
                        <p className="text-slate-500 text-sm mt-1">Use the form to post your first job opening.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {careers.map((job) => (
                            <div key={job.id} className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs font-bold uppercase">{job.type}</span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs text-slate-500 font-medium">{job.location}</span>
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{job.title}</h4>
                                        <p className="text-sm text-slate-500 mt-1">{job.department}</p>
                                    </div>
                                    <button
                                        onClick={() => handleJobDelete(job.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Delete Job"
                                    >
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
