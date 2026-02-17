
import React, { useState } from 'react';

interface PricingTabProps {
    siteSettings: any;
    setSiteSettings: (settings: any) => void;
    handleSaveSettings: () => void;
    savingCms: boolean;
}

export default function PricingTab({ siteSettings, setSiteSettings, handleSaveSettings, savingCms }: PricingTabProps) {
    const [uploadingAgreement, setUploadingAgreement] = useState(false);

    const handleAgreementUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file');
            return;
        }

        try {
            setUploadingAgreement(true);
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/admin/upload-agreement', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.url) {
                setSiteSettings({ ...siteSettings, agreement_url: data.url });
                alert('Agreement uploaded successfully!');
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Error uploading agreement:', error);
            alert('Failed to upload agreement');
        } finally {
            setUploadingAgreement(false);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}



            {/* Pricing Plans Header & Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Subscription Plans</h3>
                    <p className="text-sm text-slate-500">Set the pricing and revenue share for each tier.</p>
                </div>
                <button
                    onClick={handleSaveSettings}
                    disabled={savingCms}
                    className={`
                        px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/30 transition-all
                        ${savingCms ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'}
                    `}
                >
                    {savingCms ? (
                        <span className="flex items-center gap-2">
                            <i className="fas fa-circle-notch fa-spin"></i> Saving...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <i className="fas fa-save"></i> Save Prices
                        </span>
                    )}
                </button>
            </div>

            {/* Pricing Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                {/* Starter Plan Removed */}

                {/* Standard Plan */}
                <div className="relative group bg-white rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <i className="fas fa-layer-group text-4xl text-blue-600"></i>
                    </div>
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="mb-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 mb-2">POPULAR</span>
                        <h3 className="text-xl font-bold text-slate-800">Standard</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Yearly Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-bold text-blue-600"
                                    value={siteSettings.pricing_basic_price || ''}
                                    onChange={(e) => setSiteSettings({ ...siteSettings, pricing_basic_price: e.target.value })}
                                    placeholder="499"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Revenue Share</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold text-slate-700"
                                    value={siteSettings.pricing_basic_share || ''}
                                    onChange={(e) => setSiteSettings({ ...siteSettings, pricing_basic_share: e.target.value })}
                                    placeholder="60"
                                />
                                <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Premium Plan */}
                <div className="relative group bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <i className="fas fa-crown text-4xl text-indigo-600"></i>
                    </div>
                    <div className="mb-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 mb-2">PREMIUM</span>
                        <h3 className="text-xl font-bold text-slate-800">Premium</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Yearly Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-indigo-300 font-bold">₹</span>
                                <input
                                    type="number"
                                    className="w-full pl-7 pr-3 py-2 bg-white border border-indigo-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-bold text-indigo-600"
                                    value={siteSettings.pricing_premium_price || ''}
                                    onChange={(e) => setSiteSettings({ ...siteSettings, pricing_premium_price: e.target.value })}
                                    placeholder="999"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Revenue Share</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full pl-3 pr-8 py-2 bg-white border border-indigo-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-semibold text-slate-700"
                                    value={siteSettings.pricing_premium_share || ''}
                                    onChange={(e) => setSiteSettings({ ...siteSettings, pricing_premium_share: e.target.value })}
                                    placeholder="70"
                                />
                                <span className="absolute right-3 top-2 text-indigo-300 font-bold">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Elite Plan */}
                <div className="relative group bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <i className="fas fa-gem text-4xl text-amber-600"></i>
                    </div>
                    <div className="mb-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 mb-2">ELITE</span>
                        <h3 className="text-xl font-bold text-slate-800">Elite</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-amber-600/60 uppercase tracking-wider mb-2">Yearly Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-amber-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    className="w-full pl-7 pr-3 py-2 bg-white/80 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all font-bold text-amber-700"
                                    value={siteSettings.pricing_elite_price || ''}
                                    onChange={(e) => setSiteSettings({ ...siteSettings, pricing_elite_price: e.target.value })}
                                    placeholder="2499"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-amber-600/60 uppercase tracking-wider mb-2">Revenue Share</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full pl-3 pr-8 py-2 bg-white/80 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all font-semibold text-slate-700"
                                    value={siteSettings.pricing_elite_share || ''}
                                    onChange={(e) => setSiteSettings({ ...siteSettings, pricing_elite_share: e.target.value })}
                                    placeholder="80"
                                />
                                <span className="absolute right-3 top-2 text-amber-400 font-bold">%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agreement Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Franchise Agreement</h3>
                        <p className="text-sm text-slate-500">Edit the legal agreement shown to new franchises.</p>
                    </div>
                    <button
                        onClick={handleSaveSettings}
                        disabled={savingCms}
                        className={`
                            px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/30 transition-all
                            ${savingCms ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'}
                        `}
                    >
                        {savingCms ? (
                            <span className="flex items-center gap-2">
                                <i className="fas fa-circle-notch fa-spin"></i> Saving...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <i className="fas fa-save"></i> Save Changes
                            </span>
                        )}
                    </button>
                </div>
                <div className="p-6">
                    <div className="flex flex-col items-center gap-6 py-8">
                        {siteSettings.agreement_url ? (
                            <div className="w-full max-w-lg bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                        <i className="fas fa-file-pdf text-xl"></i>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-blue-900">Current Agreement</p>
                                        <a
                                            href={siteSettings.agreement_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            View PDF <i className="fas fa-external-link-alt text-[10px]"></i>
                                        </a>
                                    </div>
                                </div>
                                <div className="text-green-600 text-sm font-medium flex items-center gap-1">
                                    <i className="fas fa-check-circle"></i> Active
                                </div>
                            </div>
                        ) : (
                            <div className="w-full max-w-lg bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
                                <i className="fas fa-file-upload text-3xl text-slate-400 mb-2"></i>
                                <p className="text-slate-500 font-medium">No agreement uploaded yet</p>
                                <p className="text-slate-400 text-sm">Upload a PDF file to display to applicants</p>
                            </div>
                        )}

                        <div className="relative">
                            <input
                                type="file"
                                id="agreement-upload"
                                accept="application/pdf"
                                onChange={handleAgreementUpload}
                                className="hidden"
                                disabled={uploadingAgreement}
                            />
                            <label
                                htmlFor="agreement-upload"
                                className={`
                                    flex items-center gap-2 px-6 py-3 rounded-xl cursor-pointer transition-all
                                    ${uploadingAgreement
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-white border-2 border-blue-100 text-blue-600 hover:border-blue-200 hover:bg-blue-50 font-semibold shadow-sm'}
                                `}
                            >
                                {uploadingAgreement ? (
                                    <>
                                        <i className="fas fa-circle-notch fa-spin"></i> Uploading...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-cloud-upload-alt"></i>
                                        {siteSettings.agreement_url ? 'Upload New Version' : 'Upload Agreement PDF'}
                                    </>
                                )}
                            </label>
                        </div>
                        <p className="text-slate-400 text-xs text-center max-w-xs">
                            Supports PDF files only. New uploads will replace the current agreement immediately upon saving.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
