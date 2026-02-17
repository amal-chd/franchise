import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';

interface CmsContent {
    hero: any;
    about: any;
    stats: any;
}

export default function CMSTab() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [savingCms, setSavingCms] = useState(false);

    const [cmsContent, setCmsContent] = useState<CmsContent>({
        hero: {},
        about: {},
        stats: {}
    });


    const fetchCmsData = async () => {
        try {
            const res = await fetch('/api/admin/cms');
            if (res.ok) {
                const data = await res.json();
                setCmsContent(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error('Failed to fetch CMS content', error);
            showToast('Failed to load content', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCmsData();
    }, []);

    const handleSaveCms = async (section: string) => {
        setSavingCms(true);
        try {
            const res = await fetch('/api/admin/cms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section,
                    content: cmsContent[section as keyof CmsContent]
                })
            });

            if (res.ok) {
                showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} content updated successfully!`, 'success');
            } else {
                showToast('Failed to update content', 'error');
            }
        } catch (error) {
            console.error('Error saving CMS content:', error);
            showToast('Error saving content', 'error');
        } finally {
            setSavingCms(false);
        }
    };


    if (loading) {
        return <div className="p-8 text-center text-slate-500"><i className="fas fa-spinner fa-spin mr-2"></i> Loading CMS content...</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Hero Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Hero Section</h3>
                    <button
                        onClick={() => handleSaveCms('hero')}
                        disabled={savingCms}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        {savingCms ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="form-group">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hero Title (HTML allowed for line breaks)</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={cmsContent.hero?.title || ''}
                            onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, title: e.target.value } })}
                            placeholder="One Platform.<br />Endless Opportunities."
                        />
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hero Subtitle</label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            rows={3}
                            value={cmsContent.hero?.subtitle || ''}
                            onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, subtitle: e.target.value } })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hero Image Path</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={cmsContent.hero?.image || ''}
                            onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, image: e.target.value } })}
                            placeholder="/hero-image.png"
                        />
                        <p className="text-xs text-slate-500 mt-1">Relative path to image in /public folder</p>
                    </div>

                    <h4 className="mt-8 mb-4 pt-6 border-t border-slate-100 font-semibold text-slate-700">Card 1 - Franchise</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                value={cmsContent.hero?.card1_title || ''}
                                onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card1_title: e.target.value } })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Icon (FontAwesome class)</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                value={cmsContent.hero?.card1_icon || ''}
                                onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card1_icon: e.target.value } })}
                                placeholder="fa-store"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            rows={2}
                            value={cmsContent.hero?.card1_description || ''}
                            onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card1_description: e.target.value } })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Link</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={cmsContent.hero?.card1_link || ''}
                            onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card1_link: e.target.value } })}
                            placeholder="#contact"
                        />
                    </div>

                    <h4 className="mt-8 mb-4 pt-6 border-t border-slate-100 font-semibold text-slate-700">Card 2 - Delivery Partner</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                value={cmsContent.hero?.card2_title || ''}
                                onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card2_title: e.target.value } })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Icon (FontAwesome class)</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                value={cmsContent.hero?.card2_icon || ''}
                                onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card2_icon: e.target.value } })}
                                placeholder="fa-motorcycle"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            rows={2}
                            value={cmsContent.hero?.card2_description || ''}
                            onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card2_description: e.target.value } })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Link</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={cmsContent.hero?.card2_link || ''}
                            onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card2_link: e.target.value } })}
                            placeholder="/careers"
                        />
                    </div>

                    <h4 className="mt-8 mb-4 pt-6 border-t border-slate-100 font-semibold text-slate-700">Card 3 - Vendor</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                value={cmsContent.hero?.card3_title || ''}
                                onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card3_title: e.target.value } })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Icon (FontAwesome class)</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                value={cmsContent.hero?.card3_icon || ''}
                                onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card3_icon: e.target.value } })}
                                placeholder="fa-shop"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            rows={2}
                            value={cmsContent.hero?.card3_description || ''}
                            onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card3_description: e.target.value } })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Link</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={cmsContent.hero?.card3_link || ''}
                            onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card3_link: e.target.value } })}
                            placeholder="#contact"
                        />
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">About Section</h3>
                    <button
                        onClick={() => handleSaveCms('about')}
                        disabled={savingCms}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        {savingCms ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
                <div className="space-y-4">
                    <div className="form-group">
                        <label className="block text-sm font-medium text-slate-700 mb-1">About Title</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={cmsContent.about?.title || ''}
                            onChange={(e) => setCmsContent({ ...cmsContent, about: { ...cmsContent.about, title: e.target.value } })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="block text-sm font-medium text-slate-700 mb-1">About Description</label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            rows={3}
                            value={cmsContent.about?.description || ''}
                            onChange={(e) => setCmsContent({ ...cmsContent, about: { ...cmsContent.about, description: e.target.value } })}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Stats Section</h3>
                    <button
                        onClick={() => handleSaveCms('stats')}
                        disabled={savingCms}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        {savingCms ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Active Franchises</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={cmsContent.stats?.active_franchises || ''}
                            onChange={(e) => setCmsContent({ ...cmsContent, stats: { ...cmsContent.stats, active_franchises: e.target.value } })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Daily Orders</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={cmsContent.stats?.daily_orders || ''}
                            onChange={(e) => setCmsContent({ ...cmsContent, stats: { ...cmsContent.stats, daily_orders: e.target.value } })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Partner Vendors</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={cmsContent.stats?.partner_vendors || ''}
                            onChange={(e) => setCmsContent({ ...cmsContent, stats: { ...cmsContent.stats, partner_vendors: e.target.value } })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Partner Revenue</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={cmsContent.stats?.partner_revenue || ''}
                            onChange={(e) => setCmsContent({ ...cmsContent, stats: { ...cmsContent.stats, partner_revenue: e.target.value } })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
