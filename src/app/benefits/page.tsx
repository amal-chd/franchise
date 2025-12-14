'use client';

import Link from 'next/link';
import { useState } from 'react';

type Role = 'franchise' | 'delivery' | 'vendor';

export default function Benefits() {
    const [activeRole, setActiveRole] = useState<Role>('franchise');

    const benefits = {
        franchise: [
            { icon: 'fa-chart-line', title: 'High ROI', description: 'Break even in 3-6 months with our proven business model. Low operational costs maximize your profits.' },
            { icon: 'fa-headset', title: '24/7 Support', description: 'Dedicated support team to help you succeed. We are always just a call away.' },
            { icon: 'fa-laptop-code', title: 'Tech Platform', description: 'Advanced dashboard to manage operations effortlessly. Real-time analytics at your fingertips.' },
            { icon: 'fa-bullhorn', title: 'Marketing Support', description: 'National and local marketing campaigns included. We drive customers to your doorstep.' },
            { icon: 'fa-graduation-cap', title: 'Training Programs', description: 'Comprehensive training for you and your team. Master the business from day one.' },
            { icon: 'fa-shield-alt', title: 'Protected Territory', description: 'Exclusive rights in your operating area. No competition from other franchise partners.' },
            { icon: 'fa-users', title: 'Network Access', description: 'Join a growing community of successful franchise owners. Share insights and grow together.' },
            { icon: 'fa-coins', title: 'Low Investment', description: 'Affordable franchise fee with flexible payment options. Start your journey with minimal risk.' }
        ],
        delivery: [
            { icon: 'fa-wallet', title: 'Daily Payouts', description: 'Get paid every day for your hard work. No waiting for weekly or monthly cycles.' },
            { icon: 'fa-clock', title: 'Flexible Hours', description: 'Work when you want, as much as you want. Be your own boss.' },
            { icon: 'fa-shield-check', title: 'Insurance Coverage', description: 'Comprehensive insurance for your safety on and off the road.' },
            { icon: 'fa-mobile-alt', title: 'Easy App', description: 'Simple app to accept and complete deliveries. Navigation and earnings all in one place.' },
            { icon: 'fa-gas-pump', title: 'Fuel Allowance', description: 'Additional compensation for fuel expenses based on distance traveled.' },
            { icon: 'fa-trophy', title: 'Performance Bonuses', description: 'Earn extra for excellent service ratings and completing milestone targets.' },
            { icon: 'fa-user-friends', title: 'Referral Rewards', description: 'Get bonuses for bringing new delivery partners to the network.' },
            { icon: 'fa-chart-bar', title: 'Track Earnings', description: 'Real-time view of your earnings and statistics. Know exactly how much you make.' }
        ],
        vendor: [
            { icon: 'fa-store', title: 'Zero Commission', description: 'Keep 100% of your profits for the first 3 months. Grow your customer base risk-free.' },
            { icon: 'fa-users-cog', title: 'Customer Base', description: 'Instant access to thousands of active customers in your locality.' },
            { icon: 'fa-chart-simple', title: 'Sales Analytics', description: 'Detailed insights to grow your business. Understand what sells best.' },
            { icon: 'fa-camera', title: 'Free Photography', description: 'Professional product photos at no cost. Showcase your products beautifully.' },
            { icon: 'fa-bolt', title: 'Fast Onboarding', description: 'Get started and selling within 24 hours. Simple documentation process.' },
            { icon: 'fa-credit-card', title: 'Quick Settlements', description: 'Weekly payouts directly to your bank account. Cash flow made easy.' },
            { icon: 'fa-bullseye', title: 'Targeted Promotions', description: 'Featured listings and promotional campaigns to boost your visibility.' },
            { icon: 'fa-handshake', title: 'Dedicated Manager', description: 'Personal account manager to support your growth and resolve issues.' }
        ]
    };

    const roleInfo = {
        franchise: {
            title: 'Franchise Partner',
            subtitle: 'Build a profitable delivery business in your city',
            color: '#2563EB',
            bg: 'rgba(37, 99, 235, 0.1)',
            gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            cta: 'Start Your Franchise'
        },
        delivery: {
            title: 'Delivery Partner',
            subtitle: 'Earn flexible income with daily payouts',
            color: '#059669',
            bg: 'rgba(5, 150, 105, 0.1)',
            gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            cta: 'Join as Delivery Partner'
        },
        vendor: {
            title: 'Vendor Partner',
            subtitle: 'Expand your reach and grow sales online',
            color: '#D97706',
            bg: 'rgba(217, 119, 6, 0.1)',
            gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            cta: 'Register Your Shop'
        }
    };

    return (
        <main className="benefits-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="container">
                    <div className="badge-wrapper">
                        <span className="hero-badge">Why Choose The Kada?</span>
                    </div>
                    <h1>Unlock Your Potential with <br /><span className="text-gradient">The Kada Ecosystem</span></h1>
                    <p className="hero-subtitle">
                        Whether you want to own a business, earn extra income, or grow your sales — we have the perfect opportunity for you.
                    </p>
                    <div style={{ marginTop: '32px' }}>
                        <Link
                            href="#roles"
                            className="hero-arrow-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                document.querySelector('.tabs-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            Explore Opportunities <i className="fas fa-arrow-down"></i>
                        </Link>
                    </div>
                </div>
            </section>

            <style jsx>{`
                .hero-arrow-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: #2563EB;
                    font-weight: 600;
                    font-size: 1.1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    padding: 12px 24px;
                    border-radius: 99px;
                    background: rgba(37, 99, 235, 0.05);
                }
                .hero-arrow-btn:hover {
                    background: rgba(37, 99, 235, 0.1);
                    transform: translateY(2px);
                }
            `}</style>


            {/* Role Navigation */}
            <section className="tabs-section">
                <div className="container">
                    {/* Removed global glass-card class to prevent style conflicts */}
                    <div className="custom-tabs-container">
                        {(Object.keys(roleInfo) as Role[]).map((role) => (
                            <button
                                key={role}
                                onClick={() => setActiveRole(role)}
                                className={`tab-button ${activeRole === role ? 'active' : ''}`}
                                style={{
                                    '--active-color': roleInfo[role].color,
                                    '--active-bg': roleInfo[role].bg
                                } as React.CSSProperties}
                            >
                                <span className="tab-icon">
                                    <i className={`fas ${role === 'franchise' ? 'fa-building' : role === 'delivery' ? 'fa-motorcycle' : 'fa-store'}`}></i>
                                </span>
                                {roleInfo[role].title}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="content-section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2 style={{ color: roleInfo[activeRole].color, marginBottom: '0.5rem' }}>{roleInfo[activeRole].title} Benefits</h2>
                        <p style={{ fontSize: '1.25rem', color: 'var(--text-main)', maxWidth: '600px', margin: '0 auto' }}>
                            {roleInfo[activeRole].subtitle}
                        </p>
                    </div>

                    <div className="benefits-grid">
                        {benefits[activeRole].map((benefit, idx) => (
                            <div key={idx} className="custom-card">
                                <div className="card-icon" style={{ color: roleInfo[activeRole].color, background: roleInfo[activeRole].bg }}>
                                    <i className={`fas ${benefit.icon}`}></i>
                                </div>
                                <h3>{benefit.title}</h3>
                                <p>{benefit.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="cta-container">
                        <Link
                            href={activeRole === 'franchise' ? '/apply' : activeRole === 'delivery' ? 'https://thekada.in/deliveryman/apply' : 'https://thekada.in/vendor/apply'}
                            className="primary-cta-btn"
                            style={{ background: roleInfo[activeRole].gradient }}
                        >
                            {roleInfo[activeRole].cta} <i className="fas fa-arrow-right"></i>
                        </Link>
                    </div>
                </div>
            </section>

            <style jsx>{`
                .benefits-page {
                    background: #F8FAFC;
                    min-height: 100vh;
                }

                /* Hero Styles */
                .hero-section {
                    padding: 120px 0 80px;
                    background: linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%);
                    text-align: center;
                }

                .badge-wrapper {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 24px;
                }

                .hero-badge {
                    padding: 8px 20px;
                    background: rgba(37, 99, 235, 0.1);
                    color: var(--primary-color);
                    border-radius: 999px;
                    font-weight: 700;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                h1 {
                    font-size: clamp(2.5rem, 5vw, 4rem);
                    font-weight: 800;
                    line-height: 1.1;
                    margin-bottom: 24px;
                    color: #0F172A;
                    letter-spacing: -0.02em;
                }

                .text-gradient {
                    background: linear-gradient(135deg, var(--primary-color) 0%, #7C3AED 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .hero-subtitle {
                    font-size: 1.25rem;
                    line-height: 1.6;
                    color: #64748B;
                    max-width: 700px;
                    margin: 0 auto;
                }

                /* Tabs Styles */
                .tabs-section {
                    position: sticky;
                    top: 80px;
                    z-index: 50;
                    margin-bottom: 40px;
                    pointer-events: none; /* Allow click through around pill */
                }

                .tabs-section .container {
                    display: flex;
                    justify-content: center;
                }

                .custom-tabs-container {
                    pointer-events: auto; /* Re-enable clicks */
                    display: flex;
                    padding: 6px;
                    gap: 8px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    max-width: fit-content;
                }

                .tab-button {
                    border: none;
                    background: transparent;
                    padding: 12px 24px;
                    border-radius: 999px;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #64748B;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    white-space: nowrap;
                }

                .tab-button:hover {
                    color: #1E293B;
                    background: rgba(0,0,0,0.05);
                }

                .tab-button.active {
                    background: var(--active-bg);
                    color: var(--active-color);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                /* Content Styles */
                .content-section {
                    padding-bottom: 160px; /* Increased to prevent bottom cutoff on mobile */
                }

                .section-header {
                    margin-bottom: 60px;
                }

                .benefits-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 32px;
                    margin-bottom: 80px; /* Increased space before CTA */
                }

                .cta-container {
                    text-align: center;
                    position: relative;
                    z-index: 10;
                    padding: 0 20px; /* Safety padding */
                }

                .custom-card {
                    background: white;
                    padding: 32px;
                    border-radius: 24px;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    height: 100%;
                }

                .custom-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    border-color: rgba(37, 99, 235, 0.3);
                }

                .card-icon {
                    width: 64px;
                    height: 64px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.75rem;
                    margin-bottom: 24px;
                }

                .custom-card h3 {
                    font-size: 1.35rem;
                    font-weight: 700;
                    margin: 0 0 12px 0;
                    color: #1E293B;
                }

                .custom-card p {
                    margin: 0;
                    font-size: 1rem;
                    line-height: 1.6;
                    color: #64748B;
                }

                .cta-container {
                    text-align: center;
                }

                /* CTA Button Polish */
                .primary-cta-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 48px;
                    height: 64px;
                    border-radius: 99px; /* Pill shape is more modern for gradients */
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: white;
                    text-decoration: none;
                    gap: 12px;
                    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.15); /* More neutral base shadow */
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    width: auto;
                    min-width: 260px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }

                .primary-cta-btn:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.2);
                    filter: brightness(1.1);
                }

                .primary-cta-btn:active {
                    transform: translateY(0);
                }

                @media (max-width: 768px) {
                    .primary-cta-btn {
                        width: 100%; /* Full width on mobile */
                        max-width: 100%;
                    }
                    
                    /* Better Tab Alignment on Mobile */
                    .tab-button {
                        width: 100%;
                        justify-content: center; /* Center text/icon */
                        text-align: center;
                        padding: 16px;
                    }
                    
                    .custom-tabs-container {
                        width: 100%;
                        padding: 6px;
                        border-radius: 16px;
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                }
            `}</style>
        </main>
    );
}
