/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { useConfirmation } from '@/context/ConfirmationContext';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface Request {
    id: number;
    name: string;
    email: string;
    phone: string;
    city: string;
    status: string;
    aadhar_url?: string;
    agreement_accepted?: boolean;
    created_at: string;
}

export default function AdminDashboard() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [replyingTicket, setReplyingTicket] = useState<any | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [careers, setCareers] = useState<any[]>([]);
    const [newJob, setNewJob] = useState({ title: '', department: '', location: '', type: 'Full-time', description: '' });
    const [siteContent, setSiteContent] = useState<Record<string, string>>({});

    const [testimonials, setTestimonials] = useState<any[]>([]);
    const [newTestimonial, setNewTestimonial] = useState({ name: '', role: '', company: '', message: '', rating: 5, avatar: '' });
    const [rejectionReason, setRejectionReason] = useState('');
    const [newsletter, setNewsletter] = useState<any[]>([]);

    // Payouts State
    const [payouts, setPayouts] = useState<any[]>([]);
    const [revenueInputs, setRevenueInputs] = useState<Record<number, string>>({});
    const [orderInputs, setOrderInputs] = useState<Record<number, string>>({});
    const [payoutSearch, setPayoutSearch] = useState('');
    const [payoutProcessing, setPayoutProcessing] = useState<number | null>(null);
    const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
    const [payoutView, setPayoutView] = useState<'weekly' | 'history'>('weekly');
    const [historyMonth, setHistoryMonth] = useState(new Date().getMonth() + 1);
    const [historyYear, setHistoryYear] = useState(new Date().getFullYear());

    // Training State
    const [trainingModules, setTrainingModules] = useState<any[]>([]);
    const [activeTrainingModule, setActiveTrainingModule] = useState<any | null>(null);
    const [trainingMaterials, setTrainingMaterials] = useState<any[]>([]);
    const [newTrainingModule, setNewTrainingModule] = useState({ title: '', description: '', role: 'franchise', thumbnail_url: '', category: 'General' });
    const [editingModule, setEditingModule] = useState<any | null>(null);
    const [newTrainingMaterial, setNewTrainingMaterial] = useState({ title: '', type: 'video', content_url: '', content_text: '', order_index: 0 });
    const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
    const [trainingRoleFilter, setTrainingRoleFilter] = useState('all');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // CMS State
    const [cmsContent, setCmsContent] = useState<any>({
        hero: {},
        about: {},
        stats: {}
    });
    const [siteSettings, setSiteSettings] = useState<any>({});
    const [savingCms, setSavingCms] = useState(false);

    const navItems = [
        { id: 'analytics', label: 'Analytics', icon: 'fa-chart-line' },
        { id: 'franchises', label: 'Franchise Requests', icon: 'fa-store' },
        { id: 'support', label: 'Support Tickets', icon: 'fa-headset' },
        { id: 'careers', label: 'Careers', icon: 'fa-briefcase' },
        { id: 'testimonials', label: 'Testimonials', icon: 'fa-star' },
        { id: 'newsletter', label: 'Newsletter', icon: 'fa-envelope' },
        { id: 'pricing', label: 'Pricing & Agreement', icon: 'fa-tags' },
        { id: 'training', label: 'Training', icon: 'fa-graduation-cap' },
        { id: 'cms', label: 'Website Editor', icon: 'fa-pen-to-square' },
        { id: 'payouts', label: 'Payouts', icon: 'fa-money-bill-wave' },
        { id: 'settings', label: 'Settings', icon: 'fa-cog' }
    ];

    const router = useRouter();
    const { showToast } = useToast();
    const { confirm } = useConfirmation();

    const [analytics, setAnalytics] = useState({ totalRequests: 0, pendingVerification: 0, approved: 0, rejected: 0, activeFranchises: 0, pendingTickets: 0, repliedTickets: 0 });
    const [activeTab, setActiveTab] = useState('analytics');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/admin/requests');
            const data = await res.json();
            setRequests(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch', error);
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/admin/analytics');
            const data = await res.json();
            setAnalytics(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch analytics', error);
            setLoading(false);
        }
    };

    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/admin/support/tickets');
            const data = await res.json();
            setTickets(data);
        } catch (error) {
            console.error('Failed to fetch tickets', error);
        }
    };

    const fetchCareers = async () => {
        try {
            const res = await fetch('/api/admin/careers');
            const data = await res.json();
            setCareers(data);
        } catch (error) {
            console.error('Failed to fetch careers', error);
        }
    };

    const fetchSiteContent = async () => {
        try {
            const res = await fetch('/api/admin/cms');
            const data = await res.json();
            setSiteContent(data);
        } catch (error) {
            console.error('Failed to fetch site content', error);
        }
    };

    const fetchTestimonials = async () => {
        try {
            const res = await fetch('/api/admin/cms');
            const data = await res.json();
            if (Array.isArray(data.testimonials)) {
                setTestimonials(data.testimonials);
            } else if (data.testimonials) {
                const parsed = typeof data.testimonials === 'string' ? JSON.parse(data.testimonials) : data.testimonials;
                setTestimonials(Array.isArray(parsed) ? parsed : []);
            } else {
                setTestimonials([]);
            }
        } catch (error) {
            console.error('Failed to fetch testimonials', error);
        }
    };

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

    // State for Franchise CRUD
    const [isFranchiseModalOpen, setIsFranchiseModalOpen] = useState(false);
    const [editingFranchise, setEditingFranchise] = useState<any>(null);
    const [franchiseForm, setFranchiseForm] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
        plan_selected: 'standard',
        status: 'pending_verification',
        upi_id: '',
        bank_account_number: '',
        ifsc_code: '',
        bank_name: ''
    });

    const handleAddFranchise = () => {
        setEditingFranchise(null);
        setFranchiseForm({
            name: '',
            email: '',
            phone: '',
            city: '',
            plan_selected: 'standard',
            status: 'pending_verification',
            upi_id: '',
            bank_account_number: '',
            ifsc_code: '',
            bank_name: ''
        });
        setIsFranchiseModalOpen(true);
    };

    const handleEditFranchise = (franchise: any) => {
        setEditingFranchise(franchise);
        setFranchiseForm({
            name: franchise.name,
            email: franchise.email,
            phone: franchise.phone,
            city: franchise.city,
            plan_selected: franchise.plan_selected || 'standard',
            status: franchise.status || 'pending_verification',
            upi_id: franchise.upi_id || '',
            bank_account_number: franchise.bank_account_number || '',
            ifsc_code: franchise.ifsc_code || '',
            bank_name: franchise.bank_name || ''
        });
        setIsFranchiseModalOpen(true);
    };

    const handleDeleteFranchise = async (id: number) => {
        const isConfirmed = await confirm({
            title: 'Delete Franchise',
            message: 'Are you sure you want to delete this franchise? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });

        if (isConfirmed) {
            try {
                const res = await fetch(`/api/admin/franchises?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showToast('Franchise deleted successfully', 'success');
                    fetchRequests(); // Refresh list
                } else {
                    const data = await res.json();
                    showToast(data.error || 'Failed to delete franchise', 'error');
                }
            } catch (error) {
                console.error('Error deleting franchise:', error);
                showToast('An error occurred', 'error');
            }
        }
    };

    const handleSaveFranchise = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingFranchise ? 'PUT' : 'POST';
        const body = editingFranchise ? { ...franchiseForm, id: editingFranchise.id } : franchiseForm;

        try {
            const res = await fetch('/api/admin/franchises', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                showToast(editingFranchise ? 'Franchise updated successfully' : 'Franchise created successfully', 'success');
                setIsFranchiseModalOpen(false);
                fetchRequests(); // Refresh list
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to save franchise', 'error');
            }
        } catch (error) {
            console.error('Error saving franchise:', error);
            showToast('An error occurred', 'error');
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

    // State for Payout Confirmation Modal
    const [payoutConfirmModal, setPayoutConfirmModal] = useState(false);
    const [selectedPayout, setSelectedPayout] = useState<any>(null);

    const handleProcessPayout = (payout: any) => {
        // Calculate details first for the modal
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
                // Clear inputs
                const newRevenue = { ...revenueInputs };
                const newOrders = { ...orderInputs };
                delete newRevenue[selectedPayout.id];
                delete newOrders[selectedPayout.id];
                setRevenueInputs(newRevenue);
                setOrderInputs(newOrders);
                setPayoutConfirmModal(false);
                setSelectedPayout(null);
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

    const fetchNewsletter = async () => {
        try {
            const res = await fetch('/api/admin/newsletter');
            const data = await res.json();
            setNewsletter(data);
        } catch (error) {
            console.error('Failed to fetch newsletter', error);
        }
    };

    const fetchTrainingModules = async () => {
        try {
            const res = await fetch('/api/admin/training/modules');
            const data = await res.json();
            setTrainingModules(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch training modules', error);
        }
    };

    const fetchTrainingMaterials = async (moduleId: number) => {
        try {
            const res = await fetch(`/api/admin/training/materials?moduleId=${moduleId}`);
            const data = await res.json();
            setTrainingMaterials(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch training materials', error);
        }
    };

    const fetchCmsData = async () => {
        try {
            const [cmsRes, settingsRes] = await Promise.all([
                fetch('/api/admin/cms'),
                fetch('/api/admin/settings')
            ]);

            if (cmsRes.ok) {
                const data = await cmsRes.json();
                setCmsContent((prev: any) => ({ ...prev, ...data }));
            }

            if (settingsRes.ok) {
                const data = await settingsRes.json();
                setSiteSettings(data);
            }
        } catch (error) {
            console.error('Error fetching CMS data:', error);
        }
    };

    const handleSaveCms = async (section: string) => {
        setSavingCms(true);
        try {
            const res = await fetch('/api/admin/cms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section,
                    content: cmsContent[section]
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

    const handleSaveTestimonials = async () => {
        setSavingCms(true);
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
                showToast('Testimonials updated successfully!', 'success');
            } else {
                showToast('Failed to update testimonials', 'error');
            }
        } catch (error) {
            console.error('Error saving testimonials:', error);
            showToast('Error saving testimonials', 'error');
        } finally {
            setSavingCms(false);
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

        if (activeTab === 'franchises') fetchRequests();
        if (activeTab === 'newsletter') fetchNewsletter();
        if (activeTab === 'payouts') {
            fetchPayouts();
            fetchPayoutHistory();
        }
        if (activeTab === 'cms') fetchSiteContent();
        if (activeTab === 'support') fetchTickets();
        if (activeTab === 'careers') fetchCareers();
        if (activeTab === 'testimonials') fetchTestimonials();
        if (activeTab === 'training') fetchTrainingModules();

        // Always fetch analytics on mount or tab change to keep counts fresh
        fetchAnalytics();

        // CMS data needed for general settings
        if (activeTab === 'settings' || activeTab === 'cms' || activeTab === 'payouts') fetchCmsData();

    }, [activeTab, fetchPayoutHistory, router]);

    useEffect(() => {
        if (activeTab === 'payouts' && payoutView === 'history') {
            fetchPayoutHistory();
        }
    }, [historyMonth, historyYear, payoutView, fetchPayoutHistory, activeTab]);

    const handleStatusChange = async (id: number, status: string, reason?: string) => {
        try {
            const res = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, rejectionReason: reason }),
            });

            if (res.ok) {
                fetchRequests();
                fetchAnalytics();
            } else {
                const data = await res.json();
                showToast(`Failed to update status: ${data.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Failed to update status', error);
            showToast('An error occurred while updating the status.', 'error');
        }
    };

    const handleReplySubmit = async () => {
        if (!replyingTicket || !replyMessage) return;

        try {
            const res = await fetch('/api/admin/support/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId: replyingTicket.id,
                    message: replyMessage,
                    userEmail: replyingTicket.email,
                    userName: replyingTicket.name,
                    ticketSubject: replyingTicket.subject
                }),
            });

            if (res.ok) {
                showToast('Reply sent successfully', 'success');
                setReplyingTicket(null);
                setReplyMessage('');
                fetchTickets();
                fetchAnalytics();
            } else {
                showToast('Failed to send reply', 'error');
            }
        } catch (error) {
            console.error('Failed to send reply', error);
            alert('Error sending reply');
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
            message: 'Are you sure you want to delete this job?',
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



    const handleCreateModule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = '/api/admin/training/modules';
            const method = editingModule ? 'PUT' : 'POST';
            const body = editingModule ? { ...newTrainingModule, id: editingModule.id } : newTrainingModule;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                showToast(`Module ${editingModule ? 'updated' : 'created'} successfully`, 'success');
                setNewTrainingModule({ title: '', description: '', role: 'franchise', thumbnail_url: '', category: 'General' });
                setEditingModule(null);
                fetchTrainingModules();
            } else {
                showToast(`Failed to ${editingModule ? 'update' : 'create'} module`, 'error');
            }
        } catch (error) {
            console.error('Error saving module', error);
            showToast('Error saving module', 'error');
        }
    };

    const handleEditModule = (module: any) => {
        setEditingModule(module);
        setNewTrainingModule({
            title: module.title,
            description: module.description,
            role: module.role,
            thumbnail_url: module.thumbnail_url || '',
            category: module.category || 'General'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteModule = async (id: number) => {
        const isConfirmed = await confirm({
            title: 'Delete Module',
            message: 'Are you sure? This will delete all materials in this module.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });

        if (isConfirmed) {
            try {
                const res = await fetch(`/api/admin/training/modules?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showToast('Module deleted successfully', 'success');
                    fetchTrainingModules();
                    if (activeTrainingModule?.id === id) setActiveTrainingModule(null);
                } else {
                    showToast('Failed to delete module', 'error');
                }
            } catch (error) {
                console.error('Error deleting module', error);
                showToast('Error deleting module', 'error');
            }
        }
    };

    const handleCreateMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeTrainingModule) return;
        try {
            const url = '/api/admin/training/materials';
            const method = editingMaterial ? 'PUT' : 'POST';
            const body = editingMaterial
                ? { ...newTrainingMaterial, id: editingMaterial.id, module_id: activeTrainingModule.id }
                : { ...newTrainingMaterial, module_id: activeTrainingModule.id };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                showToast(`Material ${editingMaterial ? 'updated' : 'added'} successfully`, 'success');
                setNewTrainingMaterial({ title: '', type: 'video', content_url: '', content_text: '', order_index: 0 });
                setEditingMaterial(null);
                fetchTrainingMaterials(activeTrainingModule.id);
            } else {
                showToast(`Failed to ${editingMaterial ? 'update' : 'add'} material`, 'error');
            }
        } catch (error) {
            console.error('Error saving material', error);
            showToast('Error saving material', 'error');
        }
    };

    const handleEditMaterial = (material: any) => {
        setEditingMaterial(material);
        setNewTrainingMaterial({
            title: material.title,
            type: material.type,
            content_url: material.content_url || '',
            content_text: material.content_text || '',
            order_index: material.order_index || 0
        });
        // Scroll to material form if needed, or just let user see it in modal/section
    };

    const handleDeleteMaterial = async (id: number) => {
        const isConfirmed = await confirm({
            title: 'Delete Material',
            message: 'Are you sure you want to delete this material?',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });

        if (isConfirmed) {
            try {
                const res = await fetch(`/api/admin/training/materials?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showToast('Material deleted successfully', 'success');
                    if (activeTrainingModule) fetchTrainingMaterials(activeTrainingModule.id);
                } else {
                    showToast('Failed to delete material', 'error');
                }
            } catch (error) {
                console.error('Error deleting material', error);
                showToast('Error deleting material', 'error');
            }
        }
    };

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
                <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)', margin: 0 }}>Admin Panel</h2>
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
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        <i className="fas fa-bars"></i>
                    </button>
                    <h1 style={{ fontSize: '1.25rem', margin: 0 }}>{navItems.find(i => i.id === activeTab)?.label}</h1>
                </div>

                {/* Desktop Header */}
                <div className="desktop-header" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{navItems.find(i => i.id === activeTab)?.label}</h1>
                </div>

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="analytics-dashboard">
                        <div className="analytics-grid">
                            <div className="analytics-card primary">
                                <div className="icon-wrapper"><i className="fas fa-clipboard-list"></i></div>
                                <div className="card-content">
                                    <h3>Total Requests</h3>
                                    <div className="value">{analytics.totalRequests}</div>
                                </div>
                            </div>
                            <div className="analytics-card warning">
                                <div className="icon-wrapper"><i className="fas fa-clock"></i></div>
                                <div className="card-content">
                                    <h3>Pending Verification</h3>
                                    <div className="value">{analytics.pendingVerification}</div>
                                </div>
                            </div>
                            <div className="analytics-card success">
                                <div className="icon-wrapper"><i className="fas fa-check-circle"></i></div>
                                <div className="card-content">
                                    <h3>Approved</h3>
                                    <div className="value">{analytics.approved}</div>
                                </div>
                            </div>
                            <div className="analytics-card danger">
                                <div className="icon-wrapper"><i className="fas fa-times-circle"></i></div>
                                <div className="card-content">
                                    <h3>Rejected</h3>
                                    <div className="value">{analytics.rejected}</div>
                                </div>
                            </div>
                            <div className="analytics-card info">
                                <div className="icon-wrapper"><i className="fas fa-ticket-alt"></i></div>
                                <div className="card-content">
                                    <h3>Pending Tickets</h3>
                                    <div className="value">{analytics.pendingTickets}</div>
                                </div>
                            </div>
                            <div className="analytics-card success-alt">
                                <div className="icon-wrapper"><i className="fas fa-reply"></i></div>
                                <div className="card-content">
                                    <h3>Replied Tickets</h3>
                                    <div className="value">{analytics.repliedTickets}</div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Section (Mocked for now, can be real later) */}
                        <div style={{ marginTop: '32px', background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Quick Actions</h3>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <button onClick={() => setActiveTab('franchises')} className="btn btn-secondary" style={{ height: '40px', fontSize: '0.9rem' }}>
                                    View Requests
                                </button>
                                <button onClick={() => setActiveTab('support')} className="btn btn-secondary" style={{ height: '40px', fontSize: '0.9rem' }}>
                                    Check Tickets
                                </button>
                                <button onClick={() => setActiveTab('cms')} className="btn btn-secondary" style={{ height: '40px', fontSize: '0.9rem' }}>
                                    Edit Website
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Content */}
                {activeTab === 'newsletter' && (
                    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                        <h3 style={{ marginBottom: '16px' }}>Newsletter Subscribers</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #dadce0' }}>
                                        <th style={{ padding: '12px' }}>ID</th>
                                        <th style={{ padding: '12px' }}>Email</th>
                                        <th style={{ padding: '12px' }}>Subscribed At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {newsletter.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#666' }}>No subscribers yet.</td>
                                        </tr>
                                    ) : (
                                        newsletter.map((sub) => (
                                            <tr key={sub.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                <td style={{ padding: '12px' }}>#{sub.id}</td>
                                                <td style={{ padding: '12px' }}>{sub.email}</td>
                                                <td style={{ padding: '12px' }}>{new Date(sub.subscribed_at).toLocaleString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Payouts Tab */}
                {activeTab === 'payouts' && (
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

                                                        // Calculation Logic
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
                    </div>
                )}

                {activeTab === 'pricing' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Pricing Plans */}
                        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', fontWeight: '600' }}>Pricing Plans</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                                {/* Free Plan */}
                                <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                                    <h4 style={{ color: 'var(--primary-color)', marginBottom: '16px', fontWeight: '600' }}>Starter (Free)</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', color: '#64748b', marginBottom: '6px' }}>Revenue Share (%)</label>
                                            <input
                                                type="number"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                                value={siteSettings.pricing_free_share || ''}
                                                onChange={(e) => setSiteSettings({ ...siteSettings, pricing_free_share: e.target.value })}
                                                placeholder="e.g. 50"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', color: '#64748b', marginBottom: '6px' }}>Doc Fee (₹)</label>
                                            <input
                                                type="number"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                                value={siteSettings.pricing_free_price || ''}
                                                onChange={(e) => setSiteSettings({ ...siteSettings, pricing_free_price: e.target.value })}
                                                placeholder="e.g. 1500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Basic Plan */}
                                <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white' }}>
                                    <h4 style={{ color: '#2563eb', marginBottom: '16px', fontWeight: '600' }}>Standard</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', color: '#64748b', marginBottom: '6px' }}>Yearly Price (₹)</label>
                                            <input
                                                type="number"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                                value={siteSettings.pricing_basic_price || ''}
                                                onChange={(e) => setSiteSettings({ ...siteSettings, pricing_basic_price: e.target.value })}
                                                placeholder="e.g. 499"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', color: '#64748b', marginBottom: '6px' }}>Revenue Share (%)</label>
                                            <input
                                                type="number"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                                value={siteSettings.pricing_basic_share || ''}
                                                onChange={(e) => setSiteSettings({ ...siteSettings, pricing_basic_share: e.target.value })}
                                                placeholder="e.g. 60"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Premium Plan */}
                                <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#eff6ff' }}>
                                    <h4 style={{ color: '#7c3aed', marginBottom: '16px', fontWeight: '600' }}>Premium</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', color: '#64748b', marginBottom: '6px' }}>Yearly Price (₹)</label>
                                            <input
                                                type="number"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                                value={siteSettings.pricing_premium_price || ''}
                                                onChange={(e) => setSiteSettings({ ...siteSettings, pricing_premium_price: e.target.value })}
                                                placeholder="e.g. 999"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', color: '#64748b', marginBottom: '6px' }}>Revenue Share (%)</label>
                                            <input
                                                type="number"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                                value={siteSettings.pricing_premium_share || ''}
                                                onChange={(e) => setSiteSettings({ ...siteSettings, pricing_premium_share: e.target.value })}
                                                placeholder="e.g. 70"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Elite Plan */}
                                <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'linear-gradient(135deg, #fefce8 0%, #fff7ed 100%)' }}>
                                    <h4 style={{ color: '#b45309', marginBottom: '16px', fontWeight: '600' }}>Elite (Exclusive)</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', color: '#64748b', marginBottom: '6px' }}>Yearly Price (₹)</label>
                                            <input
                                                type="number"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                                value={siteSettings.pricing_elite_price || ''}
                                                onChange={(e) => setSiteSettings({ ...siteSettings, pricing_elite_price: e.target.value })}
                                                placeholder="e.g. 2499"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', color: '#64748b', marginBottom: '6px' }}>Revenue Share (%)</label>
                                            <input
                                                type="number"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                                value={siteSettings.pricing_elite_share || ''}
                                                onChange={(e) => setSiteSettings({ ...siteSettings, pricing_elite_share: e.target.value })}
                                                placeholder="e.g. 80"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Agreement Editor */}
                        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', fontWeight: '600' }}>Franchise Agreement</h3>
                            <div style={{ marginBottom: '16px' }}>
                                <ReactQuill
                                    theme="snow"
                                    value={siteSettings.agreement_text || ''}
                                    onChange={(content) => setSiteSettings({ ...siteSettings, agreement_text: content })}
                                    style={{ height: '300px', marginBottom: '50px' }}
                                />
                            </div>
                        </div>

                        {/* Save Button */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleSaveSettings}
                                disabled={savingCms}
                                className="btn btn-primary"
                                style={{ padding: '10px 24px', fontSize: '1rem' }}
                            >
                                {savingCms ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'franchises' && (
                    <div style={{ overflowX: 'auto', background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ fontWeight: '500', color: '#666' }}>Filter by Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="all">All Requests</option>
                                <option value="pending_verification">Pending Verification</option>
                                <option value="under_review">Under Review</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <button
                            onClick={handleAddFranchise}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <i className="fas fa-plus"></i> Add Franchise
                        </button>
                        <table className="desktop-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #dadce0' }}>
                                    <th style={{ padding: '12px' }}>ID</th>
                                    <th style={{ padding: '12px' }}>Name</th>
                                    <th style={{ padding: '12px' }}>City</th>
                                    <th style={{ padding: '12px' }}>Contact</th>
                                    <th style={{ padding: '12px' }}>KYC</th>
                                    <th style={{ padding: '12px' }}>Agreement</th>
                                    <th style={{ padding: '12px' }}>Status</th>
                                    <th style={{ padding: '12px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(requests) && requests
                                    .filter(req => statusFilter === 'all' || req.status === statusFilter)
                                    .map((req) => (
                                        <tr key={req.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '12px' }}>#{req.id}</td>
                                            <td style={{ padding: '12px' }}>{req.name}</td>
                                            <td style={{ padding: '12px' }}>{req.city}</td>
                                            <td style={{ padding: '12px' }}>
                                                <div>{req.email}</div>
                                                <div style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>{req.phone}</div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {req.aadhar_url ? (
                                                    <a href={req.aadhar_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>View Doc</a>
                                                ) : (
                                                    <span style={{ color: '#999' }}>Pending</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {req.agreement_accepted ? (
                                                    <span style={{ color: 'var(--success-color)' }}><i className="fas fa-check-circle"></i> Signed</span>
                                                ) : (
                                                    <span style={{ color: '#999' }}>Pending</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    background: req.status === 'approved' ? '#e6f4ea' : req.status === 'rejected' ? '#fce8e6' : '#fff3cd',
                                                    color: req.status === 'approved' ? '#1e8e3e' : req.status === 'rejected' ? '#d93025' : '#856404',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500
                                                }}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {(req.status === 'pending_verification' || req.status === 'under_review') && (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        {req.status === 'pending_verification' && (
                                                            <button
                                                                onClick={() => handleStatusChange(req.id, 'under_review')}
                                                                className="btn btn-primary"
                                                                style={{ height: '32px', padding: '0 12px', fontSize: '0.875rem' }}
                                                            >
                                                                Verify
                                                            </button>
                                                        )}
                                                        {req.status === 'under_review' && (
                                                            <button
                                                                onClick={() => handleStatusChange(req.id, 'approved')}
                                                                className="btn btn-success"
                                                                style={{ height: '32px', padding: '0 12px', fontSize: '0.875rem', background: 'var(--success-color)', color: 'white', border: 'none' }}
                                                            >
                                                                Approve
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                setRejectingId(req.id);
                                                                setRejectionReason('');
                                                            }}
                                                            className="btn btn-danger"
                                                            style={{ height: '32px', padding: '0 12px', fontSize: '0.875rem', background: '#d93025', color: 'white', border: 'none' }}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                    <button
                                                        onClick={() => handleEditFranchise(req)}
                                                        title="Edit Details"
                                                        style={{
                                                            padding: '6px',
                                                            borderRadius: '4px',
                                                            border: '1px solid #ddd',
                                                            background: 'white',
                                                            cursor: 'pointer',
                                                            color: '#3b82f6'
                                                        }}
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteFranchise(req.id)}
                                                        title="Delete Franchise"
                                                        style={{
                                                            padding: '6px',
                                                            borderRadius: '4px',
                                                            border: '1px solid #ddd',
                                                            background: 'white',
                                                            cursor: 'pointer',
                                                            color: '#ef4444'
                                                        }}
                                                    >
                                                        <i className="fas fa-trash-alt"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>

                        {/* Mobile View - Cards */}
                        <div className="mobile-cards">
                            {Array.isArray(requests) && requests.filter(req => statusFilter === 'all' || req.status === statusFilter).length > 0 ? (
                                requests
                                    .filter(req => statusFilter === 'all' || req.status === statusFilter)
                                    .map((req) => (
                                        <div key={req.id} className="mobile-card">
                                            <div className="mobile-card-row">
                                                <span className="mobile-card-label">ID</span>
                                                <span className="mobile-card-value">#{req.id}</span>
                                            </div>
                                            <div className="mobile-card-row">
                                                <span className="mobile-card-label">Name</span>
                                                <span className="mobile-card-value">{req.name}</span>
                                            </div>
                                            <div className="mobile-card-row">
                                                <span className="mobile-card-label">City</span>
                                                <span className="mobile-card-value">{req.city}</span>
                                            </div>
                                            <div className="mobile-card-row">
                                                <span className="mobile-card-label">Contact</span>
                                                <span className="mobile-card-value" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                    <div>{req.email}</div>
                                                    <div style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>{req.phone}</div>
                                                </span>
                                            </div>
                                            <div className="mobile-card-row">
                                                <span className="mobile-card-label">KYC</span>
                                                <span className="mobile-card-value">
                                                    {req.aadhar_url ? (
                                                        <a
                                                            href={req.aadhar_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            <i className="fas fa-file-alt"></i> View Aadhar
                                                        </a>
                                                    ) : (
                                                        <span style={{ color: '#9CA3AF' }}>Pending</span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="mobile-card-row">
                                                <span className="mobile-card-label">Status</span>
                                                <span className="mobile-card-value">
                                                    <span
                                                        style={{
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 500,
                                                            background:
                                                                req.status === 'approved' ? '#def7ec' :
                                                                    req.status === 'rejected' ? '#fde8e8' :
                                                                        req.status === 'pending_verification' ? '#feecdc' :
                                                                            '#e1effe',
                                                            color:
                                                                req.status === 'approved' ? '#03543f' :
                                                                    req.status === 'rejected' ? '#9b1c1c' :
                                                                        req.status === 'pending_verification' ? '#9a3412' :
                                                                            '#1e429f'
                                                        }}
                                                    >
                                                        {req.status === 'pending_verification' ? 'Pending Verif.' :
                                                            req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="mobile-card-actions">
                                                {req.status === 'pending_verification' && (
                                                    <button
                                                        onClick={() => handleStatusChange(req.id, 'under_review')}
                                                        className="btn"
                                                        style={{ background: '#3B82F6', color: 'white', padding: '6px 12px', fontSize: '0.85rem', height: 'auto' }}
                                                    >
                                                        Review
                                                    </button>
                                                )}
                                                {req.status === 'under_review' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusChange(req.id, 'approved')}
                                                            className="btn"
                                                            style={{ background: '#10B981', color: 'white', padding: '6px 12px', fontSize: '0.85rem', height: 'auto' }}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectingId(req.id)}
                                                            className="btn"
                                                            style={{ background: '#EF4444', color: 'white', padding: '6px 12px', fontSize: '0.85rem', height: 'auto' }}
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {(req.status === 'approved' || req.status === 'rejected') && (
                                                    <button
                                                        onClick={() => handleStatusChange(req.id, 'pending_verification')}
                                                        className="btn"
                                                        style={{ background: '#6B7280', color: 'white', padding: '6px 12px', fontSize: '0.85rem', height: 'auto' }}
                                                    >
                                                        Revert
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEditFranchise(req)}
                                                    className="btn"
                                                    style={{ background: 'white', border: '1px solid #E5E7EB', color: '#374151', padding: '6px 12px', fontSize: '0.85rem', height: 'auto' }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFranchise(req.id)}
                                                    className="btn"
                                                    style={{ background: 'white', border: '1px solid #FECACA', color: '#EF4444', padding: '6px 12px', fontSize: '0.85rem', height: 'auto' }}
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                            {rejectingId === req.id && (
                                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                                                    <textarea
                                                        placeholder="Reason for rejection..."
                                                        className="form-textarea"
                                                        style={{ width: '100%', marginBottom: '8px', fontSize: '0.9rem' }}
                                                        rows={2}
                                                        id={`reason-${req.id}`}
                                                    />
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => setRejectingId(null)}
                                                            className="btn btn-secondary"
                                                            style={{ padding: '4px 12px', height: '32px', fontSize: '0.85rem' }}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const reason = (document.getElementById(`reason-${req.id}`) as HTMLTextAreaElement).value;
                                                                if (!reason) {
                                                                    showToast('Please provide a reason', 'error');
                                                                    return;
                                                                }
                                                                handleStatusChange(req.id, 'rejected', reason);
                                                                setRejectingId(null);
                                                            }}
                                                            className="btn btn-primary"
                                                            style={{ padding: '4px 12px', height: '32px', fontSize: '0.85rem', background: '#EF4444' }}
                                                        >
                                                            Confirm Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                                    No requests found matching this filter.
                                </div>
                            )}
                        </div>

                        {/* Franchise CRUD Modal */}
                        {isFranchiseModalOpen && (
                            <div style={{
                                position: 'fixed',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1100
                            }}>
                                <div style={{
                                    background: 'white',
                                    padding: '24px',
                                    borderRadius: '12px',
                                    width: '90%',
                                    maxWidth: '600px',
                                    maxHeight: '90vh',
                                    overflowY: 'auto'
                                }}>
                                    <h3 style={{ marginBottom: '20px' }}>{editingFranchise ? 'Edit Franchise' : 'Add New Franchise'}</h3>
                                    <form onSubmit={handleSaveFranchise}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div className="form-group">
                                                <label className="form-label">Name</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    required
                                                    value={franchiseForm.name}
                                                    onChange={e => setFranchiseForm({ ...franchiseForm, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Email</label>
                                                <input
                                                    type="email"
                                                    className="form-input"
                                                    required
                                                    value={franchiseForm.email}
                                                    onChange={e => setFranchiseForm({ ...franchiseForm, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Phone</label>
                                                <input
                                                    type="tel"
                                                    className="form-input"
                                                    required
                                                    value={franchiseForm.phone}
                                                    onChange={e => setFranchiseForm({ ...franchiseForm, phone: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">City</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    required
                                                    value={franchiseForm.city}
                                                    onChange={e => setFranchiseForm({ ...franchiseForm, city: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Plan</label>
                                                <select
                                                    className="form-input"
                                                    value={franchiseForm.plan_selected}
                                                    onChange={e => setFranchiseForm({ ...franchiseForm, plan_selected: e.target.value })}
                                                >
                                                    <option value="free">Starter (Free)</option>
                                                    <option value="basic">Standard</option>
                                                    <option value="premium">Premium</option>
                                                    <option value="elite">Elite</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Status</label>
                                                <select
                                                    className="form-input"
                                                    value={franchiseForm.status}
                                                    onChange={e => setFranchiseForm({ ...franchiseForm, status: e.target.value })}
                                                >
                                                    <option value="pending_verification">Pending Verification</option>
                                                    <option value="under_review">Under Review</option>
                                                    <option value="approved">Approved</option>
                                                    <option value="rejected">Rejected</option>
                                                </select>
                                            </div>
                                        </div>

                                        <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '1rem', color: '#64748B' }}>Banking Details</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div className="form-group">
                                                <label className="form-label">UPI ID</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={franchiseForm.upi_id}
                                                    onChange={e => setFranchiseForm({ ...franchiseForm, upi_id: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Account No</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={franchiseForm.bank_account_number}
                                                    onChange={e => setFranchiseForm({ ...franchiseForm, bank_account_number: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">IFSC Code</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={franchiseForm.ifsc_code}
                                                    onChange={e => setFranchiseForm({ ...franchiseForm, ifsc_code: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Bank Name</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={franchiseForm.bank_name}
                                                    onChange={e => setFranchiseForm({ ...franchiseForm, bank_name: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                            <button
                                                type="button"
                                                onClick={() => setIsFranchiseModalOpen(false)}
                                                className="btn btn-secondary"
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn btn-primary">
                                                {editingFranchise ? 'Update Franchise' : 'Add Franchise'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Rejection Modal */}
                        {rejectingId && (
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
                                <div style={{
                                    background: 'white',
                                    padding: '24px',
                                    borderRadius: '12px',
                                    width: '90%',
                                    maxWidth: '400px'
                                }}>
                                    <h3 style={{ marginBottom: '16px' }}>Reject Application</h3>
                                    <p style={{ marginBottom: '12px', color: '#666' }}>Please provide a reason for rejection:</p>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '100px',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            marginBottom: '16px',
                                            resize: 'none'
                                        }}
                                        placeholder="Enter rejection reason..."
                                    />
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => setRejectingId(null)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                border: '1px solid #ddd',
                                                background: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (rejectingId) {
                                                    handleStatusChange(rejectingId, 'rejected', rejectionReason);
                                                    setRejectingId(null);
                                                }
                                            }}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: '#d93025',
                                                color: 'white',
                                                cursor: 'pointer'
                                            }}
                                            disabled={!rejectionReason.trim()}
                                        >
                                            Confirm Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
                }

                {
                    activeTab === 'support' && (
                        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                            <h3 style={{ marginBottom: '16px' }}>Support Tickets</h3>
                            {tickets.length === 0 ? (
                                <p>No tickets found.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {tickets.map((ticket) => (
                                        <div key={ticket.id} style={{ padding: '16px', border: '1px solid #f0f0f0', borderRadius: '8px', background: '#f9fafb' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <h4 style={{ margin: 0 }}>{ticket.subject}</h4>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.8rem',
                                                    background: ticket.status === 'open' ? '#e0f2fe' : '#dcfce7',
                                                    color: ticket.status === 'open' ? '#0369a1' : '#15803d'
                                                }}>
                                                    {ticket.status}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
                                                From: {ticket.name} ({ticket.email})
                                            </p>
                                            <p style={{ marginBottom: '16px' }}>{ticket.message}</p>

                                            {ticket.status === 'open' && (
                                                <button
                                                    onClick={() => setReplyingTicket(ticket)}
                                                    className="btn btn-primary"
                                                    style={{ fontSize: '0.9rem', padding: '6px 12px' }}
                                                >
                                                    Reply
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reply Modal */}
                            {replyingTicket && (
                                <div style={{
                                    position: 'fixed',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'rgba(0,0,0,0.5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    zIndex: 1000
                                }}>
                                    <div style={{
                                        background: 'white',
                                        padding: '24px',
                                        borderRadius: '12px',
                                        width: '90%',
                                        maxWidth: '500px'
                                    }}>
                                        <h3 style={{ marginBottom: '16px' }}>Reply to {replyingTicket.name}</h3>
                                        <textarea
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            style={{
                                                width: '100%',
                                                height: '150px',
                                                padding: '12px',
                                                marginBottom: '16px',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd'
                                            }}
                                            placeholder="Type your reply..."
                                        />
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => setReplyingTicket(null)}
                                                style={{ padding: '8px 16px', background: 'none', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleReplySubmit}
                                                className="btn btn-primary"
                                                style={{ padding: '8px 16px' }}
                                            >
                                                Send Reply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }

                {
                    activeTab === 'careers' && (
                        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                            <h3 style={{ marginBottom: '16px' }}>Manage Careers</h3>

                            {/* Add New Job Form */}
                            <div style={{ marginBottom: '32px', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
                                <h4 style={{ marginBottom: '16px' }}>Post New Job</h4>
                                <form onSubmit={handleJobSubmit} style={{ display: 'grid', gap: '16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <input
                                            type="text"
                                            placeholder="Job Title"
                                            value={newJob.title}
                                            onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                                            className="form-input"
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Department"
                                            value={newJob.department}
                                            onChange={e => setNewJob({ ...newJob, department: e.target.value })}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <input
                                            type="text"
                                            placeholder="Location"
                                            value={newJob.location}
                                            onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                                            className="form-input"
                                            required
                                        />
                                        <select
                                            value={newJob.type}
                                            onChange={e => setNewJob({ ...newJob, type: e.target.value })}
                                            className="form-input"
                                        >
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Internship">Internship</option>
                                        </select>
                                    </div>
                                    <textarea
                                        placeholder="Job Description"
                                        value={newJob.description}
                                        onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                                        className="form-input"
                                        style={{ height: '100px' }}
                                        required
                                    />
                                    <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start' }}>
                                        Post Job
                                    </button>
                                </form>
                            </div>

                            {/* Job List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {careers.map((job) => (
                                    <div key={job.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 4px 0' }}>{job.title}</h4>
                                            <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>
                                                {job.department} • {job.location} • {job.type}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleJobDelete(job.id)}
                                            style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            <i className="fas fa-trash"></i> Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'testimonials' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            {/* Testimonials List */}
                            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                                <h3 style={{ marginBottom: '16px' }}>Existing Testimonials</h3>
                                {testimonials.length === 0 ? (
                                    <p>No testimonials added yet.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {testimonials.map((t, idx) => (
                                            <div key={t.id} style={{ padding: '16px', border: '1px solid #f0f0f0', borderRadius: '8px', background: '#f9fafb' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <div style={{ fontWeight: 'bold', color: '#333' }}>#{idx + 1}</div>
                                                    <button
                                                        onClick={() => {
                                                            const newArr = testimonials.filter(item => item.id !== t.id);
                                                            setTestimonials(newArr);
                                                        }}
                                                        style={{ color: '#d93025', background: 'none', border: 'none', cursor: 'pointer' }}
                                                        title="Delete Testimonial"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                                    <div className="form-group">
                                                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            style={{ padding: '8px', fontSize: '0.9rem' }}
                                                            value={t.name}
                                                            onChange={e => {
                                                                const newArr = [...testimonials];
                                                                newArr[idx].name = e.target.value;
                                                                setTestimonials(newArr);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Role</label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            style={{ padding: '8px', fontSize: '0.9rem' }}
                                                            value={t.role}
                                                            onChange={e => {
                                                                const newArr = [...testimonials];
                                                                newArr[idx].role = e.target.value;
                                                                setTestimonials(newArr);
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                                    <div className="form-group">
                                                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Company</label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            style={{ padding: '8px', fontSize: '0.9rem' }}
                                                            value={t.company}
                                                            onChange={e => {
                                                                const newArr = [...testimonials];
                                                                newArr[idx].company = e.target.value;
                                                                setTestimonials(newArr);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Rating</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="5"
                                                            className="form-input"
                                                            style={{ padding: '8px', fontSize: '0.9rem' }}
                                                            value={t.rating}
                                                            onChange={e => {
                                                                const newArr = [...testimonials];
                                                                newArr[idx].rating = Number(e.target.value);
                                                                setTestimonials(newArr);
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Message</label>
                                                    <textarea
                                                        className="form-input"
                                                        style={{ padding: '8px', fontSize: '0.9rem', height: '80px', minHeight: '80px' }}
                                                        value={t.message}
                                                        onChange={e => {
                                                            const newArr = [...testimonials];
                                                            newArr[idx].message = e.target.value;
                                                            setTestimonials(newArr);
                                                        }}
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Avatar (Optional)</label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="form-input"
                                                        style={{ padding: '8px', fontSize: '0.9rem' }}
                                                        onChange={async e => {
                                                            if (!e.target.files?.[0]) return;
                                                            const formData = new FormData();
                                                            formData.append('file', e.target.files[0]);
                                                            const res = await fetch('/api/admin/upload-background', {
                                                                method: 'POST',
                                                                body: formData,
                                                            });
                                                            const data = await res.json();
                                                            if (data.url) {
                                                                const newArr = [...testimonials];
                                                                newArr[idx].avatar = data.url;
                                                                setTestimonials(newArr);
                                                            }
                                                        }}
                                                    />
                                                    {t.avatar && <div style={{ fontSize: '0.8rem', color: 'green', marginTop: '4px' }}>Avatar uploaded</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Save Button */}
                                <div style={{ marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const res = await fetch('/api/admin/cms', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        section: 'testimonials',
                                                        content: { testimonials: testimonials }
                                                    })
                                                });
                                                if (res.ok) {
                                                    alert('Testimonials saved successfully!');
                                                } else {
                                                    alert('Failed to save testimonials');
                                                }
                                            } catch (err) {
                                                console.error('Error saving testimonials:', err);
                                                alert('Error saving testimonials');
                                            }
                                        }}
                                        className="btn btn-success"
                                        style={{ width: '100%', background: 'var(--success-color)', color: 'white', border: 'none' }}
                                    >
                                        Save All Changes
                                    </button>
                                </div>
                            </div>

                            {/* Add New Testimonial Form */}
                            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0', height: 'fit-content' }}>
                                <h3 style={{ marginBottom: '16px' }}>Add New Testimonial</h3>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. John Doe"
                                        value={newTestimonial.name}
                                        onChange={e => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Franchise Owner"
                                        value={newTestimonial.role}
                                        onChange={e => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Company / Location</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. The Kada - Kochi"
                                        value={newTestimonial.company}
                                        onChange={e => setNewTestimonial({ ...newTestimonial, company: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Rating (1-5)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        className="form-input"
                                        value={newTestimonial.rating}
                                        onChange={e => setNewTestimonial({ ...newTestimonial, rating: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Message</label>
                                    <textarea
                                        className="form-input"
                                        style={{ height: '100px' }}
                                        placeholder="Enter testimonial text..."
                                        value={newTestimonial.message}
                                        onChange={e => setNewTestimonial({ ...newTestimonial, message: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Avatar Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="form-input"
                                        onChange={async e => {
                                            if (!e.target.files?.[0]) return;
                                            const formData = new FormData();
                                            formData.append('file', e.target.files[0]);
                                            try {
                                                const res = await fetch('/api/admin/upload-background', {
                                                    method: 'POST',
                                                    body: formData,
                                                });
                                                const data = await res.json();
                                                if (data.url) {
                                                    setNewTestimonial({ ...newTestimonial, avatar: data.url });
                                                }
                                            } catch (err) {
                                                console.error('Error uploading avatar:', err);
                                            }
                                        }}
                                    />
                                    {newTestimonial.avatar && <div style={{ fontSize: '0.8rem', color: 'green', marginTop: '4px' }}>Image uploaded ready</div>}
                                </div>
                                <button
                                    onClick={() => {
                                        if (!newTestimonial.name || !newTestimonial.message) {
                                            alert('Name and Message are required');
                                            return;
                                        }
                                        const newItem = { ...newTestimonial, id: Date.now().toString() };
                                        setTestimonials([...testimonials, newItem]);
                                        setNewTestimonial({ name: '', role: '', company: '', message: '', rating: 5, avatar: '' });
                                    }}
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: '8px' }}
                                >
                                    Add Testimonial
                                </button>
                            </div>

                            <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                                        Make sure to save your changes to make them live on the website.
                                    </p>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const res = await fetch('/api/admin/cms', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        section: 'testimonials',
                                                        content: { testimonials: testimonials }
                                                    })
                                                });
                                                if (res.ok) {
                                                    alert('All Changes Saved!');
                                                } else {
                                                    alert('Failed to save changes');
                                                }
                                            } catch (error) {
                                                console.error('Error saving all:', error);
                                                alert('Error saving changes');
                                            }
                                        }}
                                        className="btn btn-primary"
                                        style={{ padding: '8px 24px' }}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }


                {
                    activeTab === 'training' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                            {/* Modules List */}
                            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0', height: 'fit-content' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ margin: 0 }}>Training Modules</h3>
                                    <select
                                        value={trainingRoleFilter}
                                        onChange={(e) => setTrainingRoleFilter(e.target.value)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid #ddd',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="all">All Roles</option>
                                        <option value="franchise">Franchise</option>
                                        <option value="delivery_partner">Delivery Partner</option>
                                        <option value="vendor">Vendor</option>
                                    </select>
                                </div>

                                <form onSubmit={handleCreateModule} style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h4 style={{ fontSize: '1rem', margin: 0 }}>{editingModule ? 'Edit Module' : 'Create New Module'}</h4>
                                        {editingModule && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingModule(null);
                                                    setNewTrainingModule({ title: '', description: '', role: 'franchise', thumbnail_url: '', category: 'General' });
                                                }}
                                                style={{ fontSize: '0.8rem', color: '#666', background: 'none', border: '1px solid #ddd', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Cancel Edit
                                            </button>
                                        )}
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '12px' }}>
                                        <input
                                            type="text"
                                            placeholder="Module Title"
                                            className="form-input"
                                            value={newTrainingModule.title}
                                            onChange={e => setNewTrainingModule({ ...newTrainingModule, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '12px' }}>
                                        <select
                                            className="form-input"
                                            value={newTrainingModule.role}
                                            onChange={e => setNewTrainingModule({ ...newTrainingModule, role: e.target.value })}
                                        >
                                            <option value="franchise">Franchise</option>
                                            <option value="delivery_partner">Delivery Partner</option>
                                            <option value="vendor">Vendor</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '12px' }}>
                                        <textarea
                                            placeholder="Description"
                                            className="form-input"
                                            style={{ height: '60px' }}
                                            value={newTrainingModule.description}
                                            onChange={e => setNewTrainingModule({ ...newTrainingModule, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '12px' }}>
                                        <input
                                            type="text"
                                            placeholder="Category (e.g. Onboarding, Safety)"
                                            className="form-input"
                                            value={newTrainingModule.category}
                                            onChange={e => setNewTrainingModule({ ...newTrainingModule, category: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '0.9rem', padding: '8px' }}>
                                        {editingModule ? 'Update Module' : 'Create Module'}
                                    </button>
                                </form>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    {['franchise', 'delivery_partner', 'vendor']
                                        .filter(role => trainingRoleFilter === 'all' || trainingRoleFilter === role)
                                        .map(role => {
                                            const roleModules = trainingModules.filter(m => m.role === role);
                                            if (roleModules.length === 0) return null;

                                            return (
                                                <div key={role}>
                                                    <h4 style={{
                                                        fontSize: '1rem',
                                                        fontWeight: 'bold',
                                                        color: '#1e293b',
                                                        paddingBottom: '8px',
                                                        borderBottom: '2px solid #e2e8f0',
                                                        marginBottom: '16px',
                                                        textTransform: 'capitalize'
                                                    }}>
                                                        {role.replace('_', ' ')} Modules
                                                    </h4>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                        {Object.entries(roleModules.reduce((acc: any, module) => {
                                                            const cat = module.category || 'General';
                                                            if (!acc[cat]) acc[cat] = [];
                                                            acc[cat].push(module);
                                                            return acc;
                                                        }, {})).map(([category, modules]: [string, any]) => (
                                                            <div key={category}>
                                                                <h5 style={{
                                                                    fontSize: '0.85rem',
                                                                    textTransform: 'uppercase',
                                                                    color: '#64748B',
                                                                    fontWeight: 'bold',
                                                                    marginBottom: '8px',
                                                                    letterSpacing: '0.05em'
                                                                }}>
                                                                    {category}
                                                                </h5>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    {modules.map((module: any) => (
                                                                        <div
                                                                            key={module.id}
                                                                            onClick={() => {
                                                                                setActiveTrainingModule(module);
                                                                                fetchTrainingMaterials(module.id);
                                                                            }}
                                                                            style={{
                                                                                padding: '12px',
                                                                                borderRadius: '8px',
                                                                                border: activeTrainingModule?.id === module.id ? '2px solid var(--primary-color)' : '1px solid #e2e8f0',
                                                                                background: activeTrainingModule?.id === module.id ? '#eff6ff' : 'white',
                                                                                cursor: 'pointer',
                                                                                transition: 'all 0.2s'
                                                                            }}
                                                                        >
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{module.title}</h4>
                                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); handleEditModule(module); }}
                                                                                        style={{ color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer' }}
                                                                                    >
                                                                                        <i className="fas fa-edit"></i>
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }}
                                                                                        style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                                                                    >
                                                                                        <i className="fas fa-trash"></i>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            <span style={{
                                                                                fontSize: '0.75rem',
                                                                                padding: '2px 8px',
                                                                                borderRadius: '12px',
                                                                                background: '#e2e8f0',
                                                                                color: '#475569',
                                                                                textTransform: 'capitalize'
                                                                            }}>
                                                                                {module.role.replace('_', ' ')}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* Materials List */}
                            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                                {activeTrainingModule ? (
                                    <>
                                        <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
                                            <h3 style={{ marginBottom: '8px' }}>{activeTrainingModule.title} - Materials</h3>
                                            <p style={{ color: '#64748B', margin: 0 }}>{activeTrainingModule.description}</p>
                                        </div>

                                        <form onSubmit={handleCreateMaterial} style={{ marginBottom: '24px', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                <h4 style={{ fontSize: '1rem', margin: 0 }}>{editingMaterial ? 'Edit Material' : 'Add Material'}</h4>
                                                {editingMaterial && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingMaterial(null);
                                                            setNewTrainingMaterial({ title: '', type: 'video', content_url: '', content_text: '', order_index: 0 });
                                                        }}
                                                        style={{ fontSize: '0.8rem', color: '#666', background: 'none', border: '1px solid #ddd', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                                    >
                                                        Cancel Edit
                                                    </button>
                                                )}
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Material Title"
                                                    className="form-input"
                                                    value={newTrainingMaterial.title}
                                                    onChange={e => setNewTrainingMaterial({ ...newTrainingMaterial, title: e.target.value })}
                                                    required
                                                />
                                                <select
                                                    className="form-input"
                                                    value={newTrainingMaterial.type}
                                                    onChange={e => setNewTrainingMaterial({ ...newTrainingMaterial, type: e.target.value })}
                                                >
                                                    <option value="video">Video URL</option>
                                                    <option value="pdf">PDF URL</option>
                                                    <option value="image">Image URL</option>
                                                    <option value="text">Text Content</option>
                                                </select>
                                            </div>

                                            {newTrainingMaterial.type === 'text' ? (
                                                <div style={{ marginBottom: '12px', background: 'white' }}>
                                                    <ReactQuill
                                                        theme="snow"
                                                        value={newTrainingMaterial.content_text}
                                                        onChange={(value) => setNewTrainingMaterial({ ...newTrainingMaterial, content_text: value })}
                                                        style={{ height: '200px', marginBottom: '50px' }}
                                                        modules={{
                                                            toolbar: [
                                                                [{ 'header': [1, 2, 3, false] }],
                                                                ['bold', 'italic', 'underline', 'strike'],
                                                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                                ['link', 'clean']
                                                            ],
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                                    <input
                                                        type="text"
                                                        placeholder={newTrainingMaterial.type === 'video' ? 'YouTube/Video URL' : 'File URL'}
                                                        className="form-input"
                                                        value={newTrainingMaterial.content_url}
                                                        onChange={e => setNewTrainingMaterial({ ...newTrainingMaterial, content_url: e.target.value })}
                                                    />
                                                    {/* File Upload Helper */}
                                                    {(newTrainingMaterial.type === 'pdf' || newTrainingMaterial.type === 'image') && (
                                                        <div style={{ marginTop: '8px' }}>
                                                            <input
                                                                type="file"
                                                                accept={newTrainingMaterial.type === 'pdf' ? '.pdf' : 'image/*'}
                                                                onChange={async e => {
                                                                    if (!e.target.files?.[0]) return;
                                                                    const formData = new FormData();
                                                                    formData.append('file', e.target.files[0]);
                                                                    const res = await fetch('/api/admin/upload-background', {
                                                                        method: 'POST',
                                                                        body: formData,
                                                                    });
                                                                    const data = await res.json();
                                                                    if (data.url) {
                                                                        setNewTrainingMaterial({ ...newTrainingMaterial, content_url: data.url });
                                                                    }
                                                                }}
                                                            />
                                                            <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '8px' }}>Upload to generate URL</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <button type="submit" className="btn btn-primary">
                                                {editingMaterial ? 'Update Material' : 'Add Material'}
                                            </button>
                                        </form>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {trainingMaterials.map((material) => (
                                                <div key={material.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{
                                                                background: '#e0f2fe', color: '#0369a1',
                                                                padding: '2px 8px', borderRadius: '4px',
                                                                fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold'
                                                            }}>
                                                                {material.type}
                                                            </span>
                                                            <h4 style={{ margin: 0 }}>{material.title}</h4>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                onClick={() => handleEditMaterial(material)}
                                                                style={{ color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer' }}
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteMaterial(material.id)}
                                                                style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {material.type === 'text' && (
                                                        <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                            {material.content_text.replace(/<[^>]*>?/gm, '')}
                                                        </p>
                                                    )}
                                                    {material.type !== 'text' && (
                                                        <a href={material.content_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', textDecoration: 'underline' }}>
                                                            View Content <i className="fas fa-external-link-alt" style={{ fontSize: '0.8rem' }}></i>
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {trainingMaterials.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>No materials added yet.</p>}
                                    </>
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                        <p>Select a module to view and manage materials</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'cms' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Hero Section */}
                            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ margin: 0 }}>Hero Section</h3>
                                    <button
                                        onClick={() => handleSaveCms('hero')}
                                        disabled={savingCms}
                                        className="btn btn-primary"
                                        style={{ width: 'auto', padding: '8px 16px', height: 'auto', fontSize: '0.9rem' }}
                                    >
                                        {savingCms ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Hero Title (HTML allowed for line breaks)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={cmsContent.hero?.title || ''}
                                        onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, title: e.target.value } })}
                                        placeholder="One Platform.<br />Endless Opportunities."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Hero Subtitle</label>
                                    <textarea
                                        className="form-textarea"
                                        rows={3}
                                        value={cmsContent.hero?.subtitle || ''}
                                        onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, subtitle: e.target.value } })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Hero Image Path</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={cmsContent.hero?.image || ''}
                                        onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, image: e.target.value } })}
                                        placeholder="/hero-image.png"
                                    />
                                    <small style={{ color: '#64748B' }}>Relative path to image in /public folder</small>
                                </div>

                                <h4 style={{ marginTop: '24px', marginBottom: '16px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>Card 1 - Franchise</h4>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Title</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={cmsContent.hero?.card1_title || ''}
                                            onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card1_title: e.target.value } })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Icon (FontAwesome class)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={cmsContent.hero?.card1_icon || ''}
                                            onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card1_icon: e.target.value } })}
                                            placeholder="fa-store"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        rows={2}
                                        value={cmsContent.hero?.card1_description || ''}
                                        onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card1_description: e.target.value } })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Link</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={cmsContent.hero?.card1_link || ''}
                                        onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card1_link: e.target.value } })}
                                        placeholder="#contact"
                                    />
                                </div>

                                <h4 style={{ marginTop: '24px', marginBottom: '16px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>Card 2 - Delivery Partner</h4>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Title</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={cmsContent.hero?.card2_title || ''}
                                            onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card2_title: e.target.value } })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Icon (FontAwesome class)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={cmsContent.hero?.card2_icon || ''}
                                            onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card2_icon: e.target.value } })}
                                            placeholder="fa-motorcycle"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        rows={2}
                                        value={cmsContent.hero?.card2_description || ''}
                                        onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card2_description: e.target.value } })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Link</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={cmsContent.hero?.card2_link || ''}
                                        onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card2_link: e.target.value } })}
                                        placeholder="/careers"
                                    />
                                </div>

                                <h4 style={{ marginTop: '24px', marginBottom: '16px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>Card 3 - Vendor</h4>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Title</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={cmsContent.hero?.card3_title || ''}
                                            onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card3_title: e.target.value } })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Icon (FontAwesome class)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={cmsContent.hero?.card3_icon || ''}
                                            onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card3_icon: e.target.value } })}
                                            placeholder="fa-shop"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        rows={2}
                                        value={cmsContent.hero?.card3_description || ''}
                                        onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card3_description: e.target.value } })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Link</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={cmsContent.hero?.card3_link || ''}
                                        onChange={(e) => setCmsContent({ ...cmsContent, hero: { ...cmsContent.hero, card3_link: e.target.value } })}
                                        placeholder="#contact"
                                    />
                                </div>
                            </div>

                            {/* About Section */}
                            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ margin: 0 }}>About Section</h3>
                                    <button
                                        onClick={() => handleSaveCms('about')}
                                        disabled={savingCms}
                                        className="btn btn-primary"
                                        style={{ width: 'auto', padding: '8px 16px', height: 'auto', fontSize: '0.9rem' }}
                                    >
                                        {savingCms ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">About Title</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={cmsContent.about?.title || ''}
                                        onChange={(e) => setCmsContent({ ...cmsContent, about: { ...cmsContent.about, title: e.target.value } })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">About Description</label>
                                    <textarea
                                        className="form-textarea"
                                        rows={3}
                                        value={cmsContent.about?.description || ''}
                                        onChange={(e) => setCmsContent({ ...cmsContent, about: { ...cmsContent.about, description: e.target.value } })}
                                    />
                                </div>
                            </div>

                            {/* Stats Section */}
                            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ margin: 0 }}>Stats Section</h3>
                                    <button
                                        onClick={() => handleSaveCms('stats')}
                                        disabled={savingCms}
                                        className="btn btn-primary"
                                        style={{ width: 'auto', padding: '8px 16px', height: 'auto', fontSize: '0.9rem' }}
                                    >
                                        {savingCms ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Active Franchises</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={cmsContent.stats?.active_franchises || ''}
                                            onChange={(e) => setCmsContent({ ...cmsContent, stats: { ...cmsContent.stats, active_franchises: e.target.value } })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Daily Orders</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={cmsContent.stats?.daily_orders || ''}
                                            onChange={(e) => setCmsContent({ ...cmsContent, stats: { ...cmsContent.stats, daily_orders: e.target.value } })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Partner Vendors</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={cmsContent.stats?.partner_vendors || ''}
                                            onChange={(e) => setCmsContent({ ...cmsContent, stats: { ...cmsContent.stats, partner_vendors: e.target.value } })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Partner Revenue</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={cmsContent.stats?.partner_revenue || ''}
                                            onChange={(e) => setCmsContent({ ...cmsContent, stats: { ...cmsContent.stats, partner_revenue: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <h4 style={{ marginTop: '24px', marginBottom: '16px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>Testimonials Section</h4>
                            <div className="testimonials-editor">
                                {testimonials.map((t: any, i: number) => (
                                    <div key={i} style={{ padding: '16px', marginBottom: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <h5 style={{ margin: 0, fontSize: '0.95rem' }}>Testimonial #{i + 1}</h5>
                                            <button
                                                onClick={() => {
                                                    const newTestimonials = [...testimonials];
                                                    newTestimonials.splice(i, 1);
                                                    setTestimonials(newTestimonials);
                                                }}
                                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                                            >
                                                <i className="fas fa-trash"></i> Remove
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Name"
                                                value={t.name || ''}
                                                onChange={(e) => {
                                                    const newTestimonials = [...testimonials];
                                                    newTestimonials[i] = { ...newTestimonials[i], name: e.target.value };
                                                    setTestimonials(newTestimonials);
                                                }}
                                            />
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Role (e.g. Franchise Owner)"
                                                value={t.role || ''}
                                                onChange={(e) => {
                                                    const newTestimonials = [...testimonials];
                                                    newTestimonials[i] = { ...newTestimonials[i], role: e.target.value };
                                                    setTestimonials(newTestimonials);
                                                }}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '12px' }}>
                                            <textarea
                                                className="form-textarea"
                                                placeholder="Testimonial Content"
                                                rows={3}
                                                value={t.content || ''}
                                                onChange={(e) => {
                                                    const newTestimonials = [...testimonials];
                                                    newTestimonials[i] = { ...newTestimonials[i], content: e.target.value };
                                                    setTestimonials(newTestimonials);
                                                }}
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: '#64748b', marginRight: '8px' }}>Rating:</label>
                                            <select
                                                className="form-input"
                                                style={{ width: 'auto', padding: '4px 12px' }}
                                                value={t.rating || 5}
                                                onChange={(e) => {
                                                    const newTestimonials = [...testimonials];
                                                    newTestimonials[i] = { ...newTestimonials[i], rating: parseInt(e.target.value) };
                                                    setTestimonials(newTestimonials);
                                                }}
                                            >
                                                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Stars</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ))}

                                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                    <button
                                        onClick={() => setTestimonials([...testimonials, { name: '', role: '', content: '', rating: 5 }])}
                                        className="btn btn-secondary"
                                        style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                    >
                                        <i className="fas fa-plus"></i> Add Testimonial
                                    </button>
                                    <button
                                        onClick={handleSaveTestimonials}
                                        disabled={savingCms}
                                        className="btn btn-primary"
                                        style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                    >
                                        {savingCms ? 'Saving...' : 'Save Testimonials'}
                                    </button>
                                </div>
                            </div>
                        </div>

                    )
                }

                {
                    activeTab === 'settings' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Payout Configuration */}
                            <div style={{ padding: '24px', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid #dadce0' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '24px' }}>Payout Configuration</h3>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#64748b', marginBottom: '6px' }}>Platform Fee per Order (₹)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="e.g. 50"
                                            value={siteSettings.payout_platform_charge || ''}
                                            onChange={(e) => setSiteSettings({ ...siteSettings, payout_platform_charge: e.target.value })}
                                        />
                                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>This fee is multiplied by total orders and deducted from the weekly payout.</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!siteSettings.payout_platform_charge) return;
                                            try {
                                                const res = await fetch('/api/admin/settings', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ settings: { payout_platform_charge: siteSettings.payout_platform_charge } })
                                                });
                                                if (res.ok) alert('Platform Charge updated successfully!');
                                            } catch (e) { console.error(e); alert('Failed to update'); }
                                        }}
                                        className="btn btn-primary"
                                        style={{ height: '42px', marginBottom: '1px' }}
                                    >
                                        Save Configuration
                                    </button>
                                </div>
                            </div>

                            {/* General Settings */}
                            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ margin: 0 }}>General Settings</h3>
                                    <button
                                        onClick={handleSaveSettings}
                                        disabled={savingCms}
                                        className="btn btn-primary"
                                        style={{ width: 'auto', padding: '8px 16px', height: 'auto', fontSize: '0.9rem' }}
                                    >
                                        {savingCms ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Site Title</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={siteSettings.site_title || ''}
                                        onChange={(e) => setSiteSettings({ ...siteSettings, site_title: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Site Description</label>
                                    <textarea
                                        className="form-textarea"
                                        rows={3}
                                        value={siteSettings.site_description || ''}
                                        onChange={(e) => setSiteSettings({ ...siteSettings, site_description: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Contact Settings */}
                            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                                <h3 style={{ marginBottom: '16px' }}>Contact Information</h3>
                                <div className="form-group">
                                    <label className="form-label">Contact Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={siteSettings.contact_email || ''}
                                        onChange={(e) => setSiteSettings({ ...siteSettings, contact_email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Phone</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={siteSettings.contact_phone || ''}
                                        onChange={(e) => setSiteSettings({ ...siteSettings, contact_phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Social Media Settings */}
                            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                                <h3 style={{ marginBottom: '16px' }}>Social Media Links</h3>
                                <div className="form-group">
                                    <label className="form-label">Facebook</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={siteSettings.social_facebook || ''}
                                        onChange={(e) => setSiteSettings({ ...siteSettings, social_facebook: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Twitter</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={siteSettings.social_twitter || ''}
                                        onChange={(e) => setSiteSettings({ ...siteSettings, social_twitter: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Instagram</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={siteSettings.social_instagram || ''}
                                        onChange={(e) => setSiteSettings({ ...siteSettings, social_instagram: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">LinkedIn</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={siteSettings.social_linkedin || ''}
                                        onChange={(e) => setSiteSettings({ ...siteSettings, social_linkedin: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }
            </main >
            {/* Payout Confirmation Modal */}
            {
                payoutConfirmModal && selectedPayout && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000
                    }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
                            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>Confirm Payout</h3>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <p><strong>Franchise:</strong> {selectedPayout.full_name}</p>
                                <p><strong>Net Payout:</strong> <span style={{ fontSize: '1.25rem', color: '#16A34A', fontWeight: 'bold' }}>₹{selectedPayout.netPayout}</span></p>
                                <p style={{ fontSize: '0.9rem', color: '#666' }}>Revenue: ₹{selectedPayout.revenue} | Orders: {selectedPayout.orders}</p>
                            </div>

                            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: '#475569' }}>Banking Details</h4>
                                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    <div><span style={{ color: '#64748B' }}>UPI ID:</span> {selectedPayout.upi_id || 'Not Provided'}</div>
                                    <div><span style={{ color: '#64748B' }}>Account No:</span> {selectedPayout.bank_account_number || 'Not Provided'}</div>
                                    <div><span style={{ color: '#64748B' }}>IFSC Code:</span> {selectedPayout.ifsc_code || 'Not Provided'}</div>
                                    <div><span style={{ color: '#64748B' }}>Bank Name:</span> {selectedPayout.bank_name || 'Not Provided'}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button
                                    onClick={() => setPayoutConfirmModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmPayout}
                                    className="btn btn-primary"
                                    disabled={payoutProcessing === selectedPayout.id}
                                >
                                    {payoutProcessing === selectedPayout.id ? 'Processing...' : 'Confirm & Pay'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
