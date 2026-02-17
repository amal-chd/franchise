'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { useConfirmation } from '@/context/ConfirmationContext';

interface Testimonial {
    name: string;
    role: string;
    content?: string;
    message?: string;
    rating: number;
}

export default function TestimonialsTab() {
    const { showToast } = useToast();
    const { confirm } = useConfirmation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        try {
            const res = await fetch('/api/admin/cms');
            if (res.ok) {
                const data = await res.json();
                const section = data.testimonials;
                if (section) {
                    // The CMS stores testimonials as section.testimonials or section.items (JSON string)
                    const raw = section.testimonials || section.items;
                    if (raw) {
                        try {
                            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                            setTestimonials(Array.isArray(parsed) ? parsed : []);
                        } catch {
                            setTestimonials([]);
                        }
                    } else if (Array.isArray(section)) {
                        setTestimonials(section);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch testimonials', error);
            showToast('Failed to load testimonials', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/cms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section: 'testimonials',
                    content: { testimonials }
                })
            });
            if (res.ok) {
                showToast('Testimonials saved!', 'success');
            } else {
                showToast('Failed to save', 'error');
            }
        } catch {
            showToast('Error saving testimonials', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (index: number) => {
        const t = testimonials[index];
        const confirmed = await confirm({
            title: 'Remove Testimonial',
            message: `Remove testimonial from "${t.name || 'Unnamed'}"?`,
            confirmText: 'Remove',
            cancelText: 'Cancel',
            type: 'danger'
        });
        if (confirmed) {
            const updated = [...testimonials];
            updated.splice(index, 1);
            setTestimonials(updated);
            showToast('Removed — click Save to apply', 'info');
        }
    };

    const avatarColors = ['#4A90D9', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899'];

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-500">
                <i className="fas fa-spinner fa-spin mr-2"></i> Loading testimonials...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                        <i className="fas fa-star text-white"></i>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Testimonials</h3>
                        <p className="text-sm text-slate-500">
                            {testimonials.length} testimonial{testimonials.length !== 1 ? 's' : ''} • Displayed on homepage
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl text-sm font-semibold hover:from-slate-700 hover:to-slate-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                    <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'}`}></i>
                    {saving ? 'Saving...' : 'Save All'}
                </button>
            </div>

            {/* Testimonial Cards */}
            {testimonials.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-quote-right text-2xl text-amber-400"></i>
                    </div>
                    <h4 className="text-slate-900 font-semibold mb-1">No testimonials yet</h4>
                    <p className="text-slate-500 text-sm">Add your first testimonial to display on the homepage.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {testimonials.map((t, i) => {
                        const color = avatarColors[i % avatarColors.length];
                        const quote = t.content || t.message || '';
                        const rating = t.rating || 5;

                        return (
                            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-all shadow-sm">
                                {/* Preview Header */}
                                <div className="flex items-center gap-3 px-5 py-3.5 bg-slate-50 border-b border-slate-100">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                                        style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
                                    >
                                        {t.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-700 text-sm truncate">{t.name || 'Unnamed'}</p>
                                        <p className="text-xs text-slate-400 truncate">{t.role || 'No role set'}</p>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <i key={s} className={s <= rating ? 'fas fa-star' : 'far fa-star'}
                                                style={{ fontSize: '0.7rem', color: s <= rating ? '#FBBF24' : '#D1D5DB' }}></i>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(i)}
                                        className="ml-1 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Remove"
                                    >
                                        <i className="fas fa-trash-alt text-xs"></i>
                                    </button>
                                </div>

                                {/* Edit Body */}
                                <div className="p-5 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                                placeholder="e.g. Rajesh Kumar"
                                                value={t.name || ''}
                                                onChange={(e) => {
                                                    const u = [...testimonials];
                                                    u[i] = { ...u[i], name: e.target.value };
                                                    setTestimonials(u);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Role / Location</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                                placeholder="e.g. Franchise Partner, Kochi"
                                                value={t.role || ''}
                                                onChange={(e) => {
                                                    const u = [...testimonials];
                                                    u[i] = { ...u[i], role: e.target.value };
                                                    setTestimonials(u);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Testimonial Quote</label>
                                        <textarea
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                            placeholder="What did they say about The Kada?"
                                            rows={3}
                                            value={quote}
                                            onChange={(e) => {
                                                const u = [...testimonials];
                                                u[i] = { ...u[i], content: e.target.value };
                                                setTestimonials(u);
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rating</label>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map(r => (
                                                <button
                                                    key={r}
                                                    type="button"
                                                    onClick={() => {
                                                        const u = [...testimonials];
                                                        u[i] = { ...u[i], rating: r };
                                                        setTestimonials(u);
                                                    }}
                                                    className="p-0.5 transition-transform hover:scale-110"
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                                >
                                                    <i className={r <= rating ? 'fas fa-star' : 'far fa-star'}
                                                        style={{ fontSize: '1.1rem', color: r <= rating ? '#FBBF24' : '#D1D5DB' }}></i>
                                                </button>
                                            ))}
                                        </div>
                                        <span className="text-xs text-slate-400">{rating}/5</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Button */}
            <button
                onClick={() => setTestimonials([...testimonials, { name: '', role: '', content: '', rating: 5 }])}
                className="w-full py-4 bg-white border-2 border-dashed border-slate-200 text-slate-500 rounded-2xl hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/30 transition-all font-medium flex items-center justify-center gap-2"
            >
                <i className="fas fa-plus-circle"></i> Add Testimonial
            </button>
        </div>
    );
}
