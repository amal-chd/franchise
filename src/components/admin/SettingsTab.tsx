'use client';

import React from 'react';

interface SettingsTabProps {
    siteSettings: any;
    setSiteSettings: (settings: any) => void;
    handleSaveSettings: () => void;
    savingCms: boolean;
}

export default function SettingsTab({
    siteSettings,
    setSiteSettings,
    handleSaveSettings,
    savingCms
}: SettingsTabProps) {

    const savePlatformCharge = async () => {
        if (!siteSettings.payout_platform_charge) return;
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: { payout_platform_charge: siteSettings.payout_platform_charge } })
            });
            if (res.ok) alert('Platform Charge updated successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to update');
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Payout Configuration */}
            <div className="p-6 bg-white rounded-lg border border-slate-200">
                <h3 className="text-xl font-bold mb-6">Payout Configuration</h3>
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm text-slate-500 mb-1.5">Platform Fee per Order (₹)</label>
                        <input
                            type="number"
                            className="form-input w-full"
                            placeholder="e.g. 50"
                            value={siteSettings.payout_platform_charge || ''}
                            onChange={(e) => setSiteSettings({ ...siteSettings, payout_platform_charge: e.target.value })}
                        />
                        <p className="text-xs text-slate-400 mt-1">This fee is multiplied by total orders and deducted from the weekly payout.</p>
                    </div>
                    <button
                        onClick={savePlatformCharge}
                        className="btn btn-primary h-[42px] mb-[1px]"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>

            {/* General Settings */}
            <div className="p-6 bg-white rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="m-0 text-lg font-semibold">General Settings</h3>
                    <button
                        onClick={handleSaveSettings}
                        disabled={savingCms}
                        className="btn btn-primary w-auto px-4 py-2 h-auto text-sm"
                    >
                        {savingCms ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
                <div className="form-group mb-4">
                    <label className="form-label block mb-2">Site Title</label>
                    <input
                        type="text"
                        className="form-input w-full"
                        value={siteSettings.site_title || ''}
                        onChange={(e) => setSiteSettings({ ...siteSettings, site_title: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label block mb-2">Site Description</label>
                    <textarea
                        className="form-textarea w-full"
                        rows={3}
                        value={siteSettings.site_description || ''}
                        onChange={(e) => setSiteSettings({ ...siteSettings, site_description: e.target.value })}
                    />
                </div>
            </div>

            {/* Contact Settings */}
            <div className="p-6 bg-white rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="form-group mb-4">
                    <label className="form-label block mb-2">Contact Email</label>
                    <input
                        type="email"
                        className="form-input w-full"
                        value={siteSettings.contact_email || ''}
                        onChange={(e) => setSiteSettings({ ...siteSettings, contact_email: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label block mb-2">Contact Phone</label>
                    <input
                        type="text"
                        className="form-input w-full"
                        value={siteSettings.contact_phone || ''}
                        onChange={(e) => setSiteSettings({ ...siteSettings, contact_phone: e.target.value })}
                    />
                </div>
            </div>

            {/* Social Media Settings */}
            <div className="p-6 bg-white rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold mb-4">Social Media Links</h3>
                <div className="form-group mb-4">
                    <label className="form-label block mb-2">Facebook</label>
                    <input
                        type="text"
                        className="form-input w-full"
                        value={siteSettings.social_facebook || ''}
                        onChange={(e) => setSiteSettings({ ...siteSettings, social_facebook: e.target.value })}
                    />
                </div>
                <div className="form-group mb-4">
                    <label className="form-label block mb-2">Twitter</label>
                    <input
                        type="text"
                        className="form-input w-full"
                        value={siteSettings.social_twitter || ''}
                        onChange={(e) => setSiteSettings({ ...siteSettings, social_twitter: e.target.value })}
                    />
                </div>
                <div className="form-group mb-4">
                    <label className="form-label block mb-2">Instagram</label>
                    <input
                        type="text"
                        className="form-input w-full"
                        value={siteSettings.social_instagram || ''}
                        onChange={(e) => setSiteSettings({ ...siteSettings, social_instagram: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label block mb-2">LinkedIn</label>
                    <input
                        type="text"
                        className="form-input w-full"
                        value={siteSettings.social_linkedin || ''}
                        onChange={(e) => setSiteSettings({ ...siteSettings, social_linkedin: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
}
