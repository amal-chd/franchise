/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { useConfirmation } from '@/context/ConfirmationContext';
import dynamic from 'next/dynamic';

import 'react-quill-new/dist/quill.snow.css';
import ShopTab from '@/components/admin/ShopTab';
import ChatTab from '@/components/admin/ChatTab';
import PlanRequestsTab from '@/components/admin/PlanRequestsTab';
import PlanUpgradesLog from '@/components/admin/PlanUpgradesLog';
import PricingTab from '@/components/admin/PricingTab';
import SupportTicketsTab from '@/components/admin/SupportTicketsTab';
import CareersTab from '@/components/admin/CareersTab';
import ResumesTab from '@/components/admin/ResumesTab';
import FranchiseRequestsTab from '@/components/admin/FranchiseRequestsTab';
import PayoutsTab from '@/components/admin/PayoutsTab';
import TrainingTab from '@/components/admin/TrainingTab';
import NewsletterTab from '@/components/admin/NewsletterTab';
import CMSTab from '@/components/admin/CMSTab';
import TestimonialsTab from '@/components/admin/TestimonialsTab';
import SettingsTab from '@/components/admin/SettingsTab';
import AnalyticsTab from '@/components/admin/AnalyticsTab';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });



export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [siteContent, setSiteContent] = useState<Record<string, string>>({});





    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [siteSettings, setSiteSettings] = useState<any>({});
    const [savingCms, setSavingCms] = useState(false);

    const navItems = [
        { id: 'analytics', label: 'Analytics', icon: 'fa-chart-line' },
        { id: 'franchises', label: 'Franchise Requests', icon: 'fa-store' },
        { id: 'support', label: 'Support Tickets', icon: 'fa-headset' },
        { id: 'careers', label: 'Careers', icon: 'fa-briefcase' },
        { id: 'resumes', label: 'Resumes', icon: 'fa-file-alt' },

        { id: 'newsletter', label: 'Newsletter', icon: 'fa-envelope' },
        { id: 'pricing', label: 'Pricing & Agreement', icon: 'fa-tags' },
        { id: 'training', label: 'Training', icon: 'fa-graduation-cap' },
        { id: 'cms', label: 'Website Editor', icon: 'fa-pen-to-square' },
        { id: 'testimonials', label: 'Testimonials', icon: 'fa-star' },
        { id: 'payouts', label: 'Payouts', icon: 'fa-money-bill-wave' },
        { id: 'shop', label: 'Shop', icon: 'fa-shopping-bag' },
        { id: 'plan-requests', label: 'Plan Requests', icon: 'fa-exchange-alt' },
        { id: 'upgrades', label: 'Plan Upgrades', icon: 'fa-arrow-circle-up' },
        { id: 'chat', label: 'Support Chat', icon: 'fa-comments' },
        { id: 'settings', label: 'Settings', icon: 'fa-cog' }
    ];

    const router = useRouter();
    const { showToast } = useToast();
    const { confirm } = useConfirmation();

    const [activeTab, setActiveTab] = useState('analytics');



    // UseEffect to fetch initial data if needed, or rely on components
















    const fetchSiteSettings = async () => {
        try {
            const settingsRes = await fetch('/api/admin/settings');
            if (settingsRes.ok) {
                const data = await settingsRes.json();
                setSiteSettings(data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };



    const handleSaveSettings = async () => {
        setSavingCms(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: siteSettings })
            });

            if (res.ok) {
                showToast('Settings updated successfully!', 'success');
            } else {
                showToast('Failed to update settings', 'error');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('Error saving settings', 'error');
        } finally {
            setSavingCms(false);
        }
    };

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (!isAdmin) {
            router.push('/admin');
            return;
        }

        setLoading(false);

        if (['settings', 'pricing', 'payouts'].includes(activeTab)) fetchSiteSettings();



    }, [activeTab, router]);







    if (loading) return <div className="container section">Loading...</div>;

    return (
        <div className="admin-layout">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
                />
            )}

            {/* Sidebar */}
            {/* Sidebar */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/logo.png" alt="The Kada" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0, lineHeight: 1.2 }}>The Kada</h2>
                        <p style={{ fontSize: '0.65rem', color: '#94A3B8', margin: 0, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600' }}>Admin Panel</p>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                                className={`admin-nav-btn ${activeTab === item.id ? 'active' : ''}`}
                            >
                                <i className={`fas ${item.icon}`}></i>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </nav>

                <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
                    <button
                        onClick={() => { localStorage.removeItem('isAdmin'); router.push('/admin'); }}
                        className="admin-logout-btn"
                    >
                        <i className="fas fa-sign-out-alt"></i>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">

                {/* Mobile Header */}
                <div className="mobile-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            <i className="fas fa-bars"></i>
                        </button>
                        <img src="/logo.png" alt="The Kada" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                        <span style={{ fontWeight: '700', fontSize: '1rem', color: '#0F172A' }}>The Kada</span>
                    </div>
                </div>

                {/* Desktop Header */}
                <div className="desktop-header" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{navItems.find(i => i.id === activeTab)?.label}</h1>
                </div>


                {/* Analytics Tab */}
                {activeTab === 'analytics' && <AnalyticsTab />}

                {/* Tab Content */}
                {activeTab === 'newsletter' && (
                    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                        <NewsletterTab />
                    </div>
                )}





                {/* Payouts Tab */}
                {
                    activeTab === 'payouts' && (
                        <div className="p-8 bg-slate-50/50 min-h-screen">
                            <PayoutsTab siteSettings={siteSettings} />
                        </div>
                    )
                }


                {
                    activeTab === 'pricing' && (
                        <div className="p-8 bg-slate-50/50 min-h-screen">
                            <PricingTab
                                siteSettings={siteSettings}
                                setSiteSettings={setSiteSettings}
                                handleSaveSettings={handleSaveSettings}
                                savingCms={savingCms}
                            />
                        </div>
                    )
                }

                {
                    activeTab === 'franchises' && <FranchiseRequestsTab />
                }

                {
                    activeTab === 'support' && <SupportTicketsTab />
                }

                {
                    activeTab === 'careers' && <CareersTab />
                }

                {
                    activeTab === 'resumes' && <ResumesTab />
                }




                {/* Shop Tab */}
                {activeTab === 'shop' && <ShopTab />}

                {/* Chat Tab */}
                {activeTab === 'chat' && <ChatTab />}

                {/* Plan Requests Tab */}
                {activeTab === 'plan-requests' && <PlanRequestsTab />}

                {/* Training Tab */}
                {activeTab === 'training' && <TrainingTab />}
                {
                    activeTab === 'cms' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <CMSTab />
                        </div>
                    )
                }

                {activeTab === 'testimonials' && <TestimonialsTab />}

                {
                    activeTab === 'upgrades' && (
                        <div style={{ padding: '24px' }}>
                            <PlanUpgradesLog />
                        </div>
                    )
                }

                {
                    activeTab === 'settings' && (
                        <div className="p-8 bg-slate-50/50 min-h-screen">
                            <SettingsTab
                                siteSettings={siteSettings}
                                setSiteSettings={setSiteSettings}
                                handleSaveSettings={handleSaveSettings}
                                savingCms={savingCms}
                            />
                        </div>
                    )
                }
            </main >

        </div >
    );
}
