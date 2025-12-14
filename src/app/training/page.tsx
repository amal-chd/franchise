/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function TrainingPage() {
    const [role, setRole] = useState('franchise');
    const [modules, setModules] = useState<any[]>([]);
    const [activeModule, setActiveModule] = useState<any | null>(null);
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    useEffect(() => {
        fetchModules();
    }, [role, fetchModules]);

    useEffect(() => {
        if (activeModule) {
            fetchMaterials(activeModule.id);
        } else {
            setMaterials([]);
        }
    }, [activeModule, fetchMaterials]);

    const fetchModules = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/training/modules?role=${role}`);
            const data = await res.json();
            setModules(Array.isArray(data) ? data : []);
            // Auto-select first module if available
            if (Array.isArray(data) && data.length > 0) {
                setActiveModule(data[0]);
            } else {
                setActiveModule(null);
            }
        } catch (error) {
            console.error('Failed to fetch modules', error);
        } finally {
            setLoading(false);
        }
    }, [role]);

    const fetchMaterials = useCallback(async (moduleId: number) => {
        try {
            const res = await fetch(`/api/admin/training/materials?moduleId=${moduleId}`);
            const data = await res.json();
            setMaterials(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch materials', error);
        }
    }, []);

    return (
        <div className="container section" style={{ minHeight: '80vh' }}>
            <div className="text-center training-header" style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Training Hub</h1>
                <p style={{ maxWidth: '600px', margin: '0 auto' }}>
                    Welcome to the learning center. Select your role to access tailored training materials, guides, and resources.
                </p>
            </div>

            {/* Role Selector */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
                {[
                    { id: 'franchise', label: 'Franchise Owner', icon: 'fa-store' },
                    { id: 'delivery_partner', label: 'Delivery Partner', icon: 'fa-motorcycle' },
                    { id: 'vendor', label: 'Vendor', icon: 'fa-shop' }
                ].map(r => (
                    <button
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className={`btn ${role === r.id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ minWidth: '180px', gap: '8px' }}
                    >
                        <i className={`fas ${r.icon}`}></i> {r.label}
                    </button>
                ))}
            </div>

            {/* Mobile Toggle Button */}
            <button
                className="mobile-sidebar-toggle"
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                style={{
                    display: 'none', // Hidden by default, shown in media query
                    width: '100%',
                    padding: '12px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: 'bold',
                    color: 'var(--text-main)',
                    cursor: 'pointer'
                }}
            >
                <span><i className="fas fa-list" style={{ marginRight: '8px' }}></i> {activeModule ? activeModule.title : 'Select Module'}</span>
                <i className={`fas fa-chevron-${showMobileSidebar ? 'up' : 'down'}`}></i>
            </button>

            <div className="training-layout" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', alignItems: 'start' }}>
                {/* Sidebar - Modules */}
                <div className={`training-sidebar ${showMobileSidebar ? 'open' : ''}`} style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #e2e8f0', position: 'sticky', top: '100px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
                        <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                            Modules
                        </h3>
                        <button
                            className="close-sidebar-btn"
                            onClick={() => setShowMobileSidebar(false)}
                            style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    {loading ? (
                        <p>Loading modules...</p>
                    ) : modules.length === 0 ? (
                        <p style={{ color: '#64748B' }}>No modules found for this role.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {Object.entries(modules.reduce((acc: any, module) => {
                                const cat = module.category || 'General';
                                if (!acc[cat]) acc[cat] = [];
                                acc[cat].push(module);
                                return acc;
                            }, {})).map(([category, catModules]: [string, any]) => (
                                <div key={category}>
                                    <h5 style={{
                                        fontSize: '0.85rem',
                                        textTransform: 'uppercase',
                                        color: '#64748B',
                                        fontWeight: 'bold',
                                        marginBottom: '8px',
                                        letterSpacing: '0.05em',
                                        paddingLeft: '16px'
                                    }}>
                                        {category}
                                    </h5>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {catModules.map((module: any) => (
                                            <button
                                                key={module.id}
                                                onClick={() => {
                                                    setActiveModule(module);
                                                    setShowMobileSidebar(false);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                style={{
                                                    textAlign: 'left',
                                                    padding: '10px 16px',
                                                    borderRadius: '8px',
                                                    background: activeModule?.id === module.id ? 'var(--primary-color)' : 'transparent',
                                                    color: activeModule?.id === module.id ? 'white' : 'var(--text-main)',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontWeight: activeModule?.id === module.id ? '600' : '400',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    fontSize: '0.95rem'
                                                }}
                                            >
                                                <span>{module.title}</span>
                                                {activeModule?.id === module.id && <i className="fas fa-chevron-right" style={{ fontSize: '0.8rem' }}></i>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="training-content">
                    {activeModule ? (
                        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '32px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ marginBottom: '32px', borderBottom: '1px solid #eee', paddingBottom: '24px' }}>
                                <h2 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>{activeModule.title}</h2>
                                <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: '1.6' }}>{activeModule.description}</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                                {materials.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No materials available in this module yet.</p>
                                ) : (
                                    materials.map((material, idx) => (
                                        <div key={material.id} className="material-item">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                                <span style={{
                                                    background: '#e0f2fe', color: '#0369a1',
                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {idx + 1}
                                                </span>
                                                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{material.title}</h3>
                                            </div>

                                            {material.type === 'text' && (
                                                <div
                                                    style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', lineHeight: '1.8' }}
                                                    className="prose max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: material.content_text }}
                                                />
                                            )}

                                            {material.type === 'video' && (
                                                <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-md)', position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                                                    {/* Simple embed check - if youtube, use iframe, else video tag */}
                                                    {/* Simple embed check - if youtube, use iframe, else video tag */}
                                                    {(material.content_url.includes('youtube.com') || material.content_url.includes('youtu.be')) ? (
                                                        <iframe
                                                            src={(() => {
                                                                const url = material.content_url;
                                                                let videoId = '';
                                                                if (url.includes('youtu.be/')) {
                                                                    videoId = url.split('youtu.be/')[1]?.split('?')[0];
                                                                } else if (url.includes('watch?v=')) {
                                                                    videoId = url.split('watch?v=')[1]?.split('&')[0];
                                                                } else if (url.includes('/shorts/')) {
                                                                    videoId = url.split('/shorts/')[1]?.split('?')[0];
                                                                } else if (url.includes('/embed/')) {
                                                                    videoId = url.split('/embed/')[1]?.split('?')[0];
                                                                }
                                                                return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
                                                            })()}
                                                            title={material.title}
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                                        ></iframe>
                                                    ) : (
                                                        <video controls style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}>
                                                            <source src={material.content_url} />
                                                            Your browser does not support the video tag.
                                                        </video>
                                                    )}
                                                </div>
                                            )}

                                            {material.type === 'image' && (
                                                <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                                                    <img src={material.content_url} alt={material.title} style={{ width: '100%', display: 'block' }} />
                                                </div>
                                            )}

                                            {material.type === 'pdf' && (
                                                <div style={{ padding: '24px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <i className="fas fa-file-pdf" style={{ fontSize: '2rem', color: '#e11d48' }}></i>
                                                    <div>
                                                        <h4 style={{ margin: '0 0 4px 0' }}>PDF Document</h4>
                                                        <a href={material.content_url} target="_blank" rel="noopener noreferrer" style={{ color: '#e11d48', fontWeight: 'bold', textDecoration: 'underline' }}>
                                                            Download / View PDF
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            background: '#f8fafc',
                            borderRadius: 'var(--radius-lg)',
                            padding: '40px',
                            textAlign: 'center',
                            border: '2px dashed #e2e8f0',
                            color: '#64748B'
                        }}>
                            <i className="fas fa-book-open" style={{ fontSize: '3rem', marginBottom: '16px', color: '#cbd5e1' }}></i>
                            <h3>Select a module to start learning</h3>
                            <p>Choose a topic from the sidebar to view its contents.</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    .training-header {
                        margin-top: 60px !important;
                    }
                    .training-layout {
                        grid-template-columns: 1fr !important;
                    }
                    .mobile-sidebar-toggle {
                        display: flex !important;
                    }
                    .training-sidebar {
                        display: none;
                        position: fixed !important;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 1000;
                        border-radius: 0 !important;
                        overflow-y: auto;
                    }
                    .training-sidebar.open {
                        display: block;
                    }
                    .close-sidebar-btn {
                        display: block !important;
                    }
                }
            `}</style>
        </div>
    );
}
