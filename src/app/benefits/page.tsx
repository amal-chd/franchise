'use client';

import Link from 'next/link';
import { useState } from 'react';

type Role = 'franchise' | 'delivery' | 'vendor';

export default function Benefits() {
    const [activeRole, setActiveRole] = useState<Role>('franchise');

    const benefits = {
        franchise: [
            { icon: 'fa-chart-line', title: 'High ROI', description: 'Break even in 3-6 months with our proven business model' },
            { icon: 'fa-headset', title: '24/7 Support', description: 'Dedicated support team to help you succeed' },
            { icon: 'fa-laptop-code', title: 'Tech Platform', description: 'Advanced dashboard to manage operations effortlessly' },
            { icon: 'fa-bullhorn', title: 'Marketing Support', description: 'National and local marketing campaigns included' },
            { icon: 'fa-graduation-cap', title: 'Training Programs', description: 'Comprehensive training for you and your team' },
            { icon: 'fa-shield-alt', title: 'Protected Territory', description: 'Exclusive rights in your operating area' },
            { icon: 'fa-users', title: 'Network Access', description: 'Join a growing community of successful franchise owners' },
            { icon: 'fa-coins', title: 'Low Investment', description: 'Affordable franchise fee with flexible payment options' }
        ],
        delivery: [
            { icon: 'fa-wallet', title: 'Daily Payouts', description: 'Get paid every day for your hard work' },
            { icon: 'fa-clock', title: 'Flexible Hours', description: 'Work when you want, as much as you want' },
            { icon: 'fa-shield-check', title: 'Insurance Coverage', description: 'Comprehensive insurance for your safety' },
            { icon: 'fa-mobile-alt', title: 'Easy App', description: 'Simple app to accept and complete deliveries' },
            { icon: 'fa-gas-pump', title: 'Fuel Allowance', description: 'Additional compensation for fuel expenses' },
            { icon: 'fa-trophy', title: 'Performance Bonuses', description: 'Earn extra for excellent service ratings' },
            { icon: 'fa-user-friends', title: 'Referral Rewards', description: 'Get bonuses for bringing new delivery partners' },
            { icon: 'fa-chart-bar', title: 'Track Earnings', description: 'Real-time view of your earnings and statistics' }
        ],
        vendor: [
            { icon: 'fa-store', title: 'Zero Commission', description: 'Keep 100% of your profits for the first 3 months' },
            { icon: 'fa-users-cog', title: 'Customer Base', description: 'Instant access to thousands of active customers' },
            { icon: 'fa-chart-simple', title: 'Sales Analytics', description: 'Detailed insights to grow your business' },
            { icon: 'fa-camera', title: 'Free Photography', description: 'Professional product photos at no cost' },
            { icon: 'fa-bolt', title: 'Fast Onboarding', description: 'Get started and selling within 24 hours' },
            { icon: 'fa-credit-card', title: 'Quick Settlements', description: 'Weekly payouts directly to your bank' },
            { icon: 'fa-bullseye', title: 'Targeted Promotions', description: 'Featured listings and promotional campaigns' },
            { icon: 'fa-handshake', title: 'Dedicated Manager', description: 'Personal account manager to support your growth' }
        ]
    };

    const roleInfo = {
        franchise: {
            title: 'Franchise Partnership',
            subtitle: 'Build a profitable delivery business in your city',
            color: '#2563EB',
            gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            cta: 'Start Your Franchise'
        },
        delivery: {
            title: 'Delivery Partner',
            subtitle: 'Earn flexible income with daily payouts',
            color: '#059669',
            gradient: 'linear-gradient(135deg, #10B981, #059669)',
            cta: 'Join as Delivery Partner'
        },
        vendor: {
            title: 'Vendor Partnership',
            subtitle: 'Expand your reach and grow sales online',
            color: '#D97706',
            gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
            cta: 'Register Your Shop'
        }
    };

    return (
        <main style={{ minHeight: '100vh' }}>
            {/* Hero Section */}
            <section style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '120px 0 80px',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                        fontWeight: '800',
                        marginBottom: '20px',
                        lineHeight: '1.2'
                    }}>
                        Why Partner with The Kada?
                    </h1>
                    <p style={{ fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto', opacity: 0.95 }}>
                        Discover the benefits of joining India's fastest-growing hyper-local delivery platform
                    </p>
                </div>
            </section>

            {/* Role Tabs */}
            <section style={{ background: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0', flexWrap: 'wrap' }}>
                        {(Object.keys(roleInfo) as Role[]).map((role) => (
                            <button
                                key={role}
                                onClick={() => setActiveRole(role)}
                                style={{
                                    flex: '1',
                                    minWidth: '200px',
                                    padding: '24px 32px',
                                    background: activeRole === role ? roleInfo[role].gradient : 'transparent',
                                    color: activeRole === role ? 'white' : '#64748B',
                                    border: 'none',
                                    borderBottom: activeRole === role ? 'none' : '3px solid transparent',
                                    fontWeight: '600',
                                    fontSize: '1.1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    position: 'relative'
                                }}
                            >
                                {roleInfo[role].title}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section style={{ padding: '80px 0', background: '#f8fafc' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: '800',
                            marginBottom: '16px',
                            background: roleInfo[activeRole].gradient,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            {roleInfo[activeRole].subtitle}
                        </h2>
                    </div>

                    <div className="benefits-grid">
                        {benefits[activeRole].map((benefit, idx) => (
                            <div
                                key={idx}
                                className="benefit-card"
                                style={{
                                    background: 'white',
                                    padding: '32px',
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    transition: 'all 0.3s ease',
                                    border: '2px solid transparent'
                                }}
                            >
                                <div
                                    className="benefit-icon"
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '16px',
                                        background: roleInfo[activeRole].gradient,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '20px',
                                        fontSize: '1.75rem',
                                        color: 'white',
                                        boxShadow: `0 8px 16px ${roleInfo[activeRole].color}33`
                                    }}
                                >
                                    <i className={`fas ${benefit.icon}`}></i>
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px', color: '#1e293b' }}>
                                    {benefit.title}
                                </h3>
                                <p style={{ color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                                    {benefit.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div style={{ textAlign: 'center', marginTop: '60px' }}>
                        <Link
                            href={activeRole === 'franchise' ? '#contact' : activeRole === 'delivery' ? 'https://thekada.in/deliveryman/apply' : 'https://thekada.in/vendor/apply'}
                            style={{
                                display: 'inline-block',
                                padding: '18px 48px',
                                background: roleInfo[activeRole].gradient,
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '12px',
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                boxShadow: `0 10px 25px ${roleInfo[activeRole].color}44`,
                                transition: 'all 0.3s ease'
                            }}
                            className="cta-button"
                        >
                            {roleInfo[activeRole].cta} <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
                        </Link>
                    </div>
                </div>
            </section>

            <style jsx>{`
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .benefit-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.15);
          border-color: ${roleInfo[activeRole].color};
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px ${roleInfo[activeRole].color}66;
        }

        @media (max-width: 768px) {
          .benefits-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </main>
    );
}
