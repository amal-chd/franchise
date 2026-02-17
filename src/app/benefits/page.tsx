'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

type Role = 'franchise' | 'delivery' | 'vendor';

function useInView(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return { ref, visible };
}

export default function Benefits() {
    const [activeRole, setActiveRole] = useState<Role>('franchise');

    const benefits = {
        franchise: [
            { emoji: '📈', title: 'High ROI', desc: 'Break even in 3-6 months with our proven business model. Low operational costs maximize your profits.' },
            { emoji: '🎧', title: '24/7 Support', desc: 'Dedicated support team available round the clock. We are always just a call away.' },
            { emoji: '💻', title: 'Tech Platform', desc: 'Advanced dashboard with real-time analytics to manage operations effortlessly.' },
            { emoji: '📣', title: 'Marketing Support', desc: 'National and local marketing campaigns included. We drive customers to your doorstep.' },
            { emoji: '🎓', title: 'Training Programs', desc: 'Comprehensive training for you and your team. Master the business from day one.' },
            { emoji: '🛡️', title: 'Protected Territory', desc: 'Exclusive rights in your operating area. No competition from other franchise partners.' },
            { emoji: '🤝', title: 'Network Access', desc: 'Join a growing community of successful franchise owners. Share insights and grow together.' },
            { emoji: '💰', title: 'Low Investment', desc: 'Affordable franchise fee with flexible payment options. Start with minimal risk.' },
        ],
        delivery: [
            { emoji: '💸', title: 'Daily Payouts', desc: 'Get paid every day for your hard work. No waiting for weekly or monthly cycles.' },
            { emoji: '⏰', title: 'Flexible Hours', desc: 'Work when you want, as much as you want. Be your own boss.' },
            { emoji: '🛡️', title: 'Insurance Coverage', desc: 'Comprehensive insurance for your safety on and off the road.' },
            { emoji: '📱', title: 'Easy App', desc: 'Simple app to accept and complete deliveries. Navigation and earnings all in one place.' },
            { emoji: '⛽', title: 'Fuel Allowance', desc: 'Additional compensation for fuel expenses based on distance traveled.' },
            { emoji: '🏆', title: 'Performance Bonuses', desc: 'Earn extra for excellent ratings and completing milestone targets.' },
            { emoji: '👥', title: 'Referral Rewards', desc: 'Get bonuses for bringing new delivery partners to the network.' },
            { emoji: '📊', title: 'Track Earnings', desc: 'Real-time view of your earnings and statistics. Know exactly how much you make.' },
        ],
        vendor: [
            { emoji: '🏪', title: 'Zero Commission', desc: 'Keep 100% of your profits for the first 3 months. Grow your base risk-free.' },
            { emoji: '👥', title: 'Customer Base', desc: 'Instant access to thousands of active customers in your locality.' },
            { emoji: '📈', title: 'Sales Analytics', desc: 'Detailed insights to grow your business. Understand what sells best.' },
            { emoji: '📸', title: 'Free Photography', desc: 'Professional product photos at no cost. Showcase your products beautifully.' },
            { emoji: '⚡', title: 'Fast Onboarding', desc: 'Get started and selling within 24 hours. Simple documentation process.' },
            { emoji: '💳', title: 'Quick Settlements', desc: 'Weekly payouts directly to your bank account. Cash flow made easy.' },
            { emoji: '🎯', title: 'Targeted Promos', desc: 'Featured listings and promotional campaigns to boost your visibility.' },
            { emoji: '🤝', title: 'Dedicated Manager', desc: 'Personal account manager to support your growth and resolve issues.' },
        ],
    };

    const roles: { key: Role; icon: string; label: string; tagline: string; accent: string; gradient: string }[] = [
        { key: 'franchise', icon: '🏢', label: 'Franchise Partner', tagline: 'Build a profitable delivery business in your city', accent: '#4A90D9', gradient: 'linear-gradient(135deg,#4A90D9 0%,#7C3AED 100%)' },
        { key: 'delivery', icon: '🏍️', label: 'Delivery Partner', tagline: 'Earn flexible income with daily payouts', accent: '#10B981', gradient: 'linear-gradient(135deg,#10B981 0%,#059669 100%)' },
        { key: 'vendor', icon: '🛒', label: 'Vendor Partner', tagline: 'Expand your reach and grow sales online', accent: '#F59E0B', gradient: 'linear-gradient(135deg,#F59E0B 0%,#EF4444 100%)' },
    ];

    const stats = [
        { value: '50+', label: 'Active Franchises' },
        { value: '3-6', label: 'Months to Break Even' },
        { value: '24/7', label: 'Support Available' },
        { value: '100%', label: 'Commission-Free Start' },
    ];

    const currentRole = roles.find(r => r.key === activeRole)!;

    const heroObs = useInView();
    const statsObs = useInView();
    const gridObs = useInView();
    const compObs = useInView();
    const ctaObs = useInView();

    return (
        <main>
            {/* ─── HERO ─── */}
            <section ref={heroObs.ref} className={`bf-hero ${heroObs.visible ? 'in' : ''}`}>
                <div className="bf-hero__bg" />
                <div className="container bf-hero__inner">
                    <span className="bf-chip">Why Choose The Kada?</span>
                    <h1>Benefits That<br /><span className="bf-grad">Set You Apart</span></h1>
                    <p className="bf-hero__sub">
                        Whether you want to own a business, earn extra income, or grow your sales — we have the perfect opportunity for you.
                    </p>
                    <button
                        className="bf-scroll-btn"
                        onClick={() => document.getElementById('bf-tabs')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        Explore Opportunities <span className="bf-scroll-arrow">↓</span>
                    </button>
                </div>
            </section>

            {/* ─── STATS RIBBON ─── */}
            <section ref={statsObs.ref} className={`bf-stats ${statsObs.visible ? 'in' : ''}`}>
                <div className="container bf-stats__grid">
                    {stats.map((s, i) => (
                        <div key={i} className="bf-stat" style={{ transitionDelay: `${i * 80}ms` }}>
                            <span className="bf-stat__val">{s.value}</span>
                            <span className="bf-stat__lbl">{s.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── ROLE TABS ─── */}
            <section id="bf-tabs" className="bf-tabs">
                <div className="container">
                    <div className="bf-tabs__bar">
                        {roles.map((r) => (
                            <button
                                key={r.key}
                                className={`bf-tab ${activeRole === r.key ? 'bf-tab--active' : ''}`}
                                onClick={() => setActiveRole(r.key)}
                                style={{ '--tab-accent': r.accent } as React.CSSProperties}
                            >
                                <span className="bf-tab__icon">{r.icon}</span>
                                <span className="bf-tab__label">{r.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="bf-tabs__header">
                        <h2 style={{ color: currentRole.accent }}>{currentRole.label}</h2>
                        <p>{currentRole.tagline}</p>
                    </div>
                </div>
            </section>

            {/* ─── BENEFITS GRID ─── */}
            <section ref={gridObs.ref} className={`bf-grid-section ${gridObs.visible ? 'in' : ''}`}>
                <div className="container">
                    <div className="bf-grid">
                        {benefits[activeRole].map((b, i) => (
                            <div
                                key={`${activeRole}-${i}`}
                                className="bf-card"
                                style={{
                                    transitionDelay: `${i * 60}ms`,
                                    '--card-accent': currentRole.accent,
                                } as React.CSSProperties}
                            >
                                <div className="bf-card__emoji">{b.emoji}</div>
                                <h3>{b.title}</h3>
                                <p>{b.desc}</p>
                                <div className="bf-card__shine" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── COMPARISON TABLE ─── */}
            <section ref={compObs.ref} className={`bf-compare ${compObs.visible ? 'in' : ''}`}>
                <div className="container">
                    <div className="bf-compare__header">
                        <h2>The Kada vs Others</h2>
                        <p>See how The Kada franchise stands out from the competition</p>
                    </div>
                    <div className="bf-table-wrap">
                        <table className="bf-table">
                            <thead>
                                <tr>
                                    <th>Feature</th>
                                    <th className="bf-table__highlight">The Kada</th>
                                    <th>Others</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['Investment Required', 'Starting ₹10,000', '₹5L – ₹20L+'],
                                    ['Break-Even Timeline', '3-6 Months', '12-24 Months'],
                                    ['Tech Platform', 'Full Suite Included', 'Basic / Extra Cost'],
                                    ['Marketing Support', 'National + Local', 'Limited / Self'],
                                    ['Territory Protection', 'Exclusive Zone', 'Overlapping'],
                                    ['Training', 'Complete Program', 'Minimal / Paid'],
                                    ['Support', '24/7 Dedicated', 'Business Hours'],
                                ].map(([feature, kada, others], idx) => (
                                    <tr key={idx}>
                                        <td>{feature}</td>
                                        <td className="bf-table__highlight">{kada}</td>
                                        <td className="bf-table__muted">{others}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* ─── FINAL CTA ─── */}
            <section ref={ctaObs.ref} className={`bf-cta ${ctaObs.visible ? 'in' : ''}`}>
                <div className="container bf-cta__inner">
                    <h2>Ready to Start Your Journey?</h2>
                    <p>Join hundreds of successful partners across India. Low investment, high returns, and full support from day one.</p>
                    <div className="bf-cta__btns">
                        <Link href="/apply" className="bf-btn bf-btn--primary">Apply for Franchise</Link>
                        <Link href="/support" className="bf-btn bf-btn--outline">Contact Us</Link>
                    </div>
                </div>
            </section>

            {/* ─── STYLES ─── */}
            <style jsx>{`
                /* == HERO ============================== */
                .bf-hero {
                    position: relative;
                    overflow: hidden;
                    padding: 140px 0 80px;
                    text-align: center;
                    background: var(--bg-dark);
                    color: #fff;
                }
                .bf-hero__bg {
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(ellipse 80% 60% at 50% 0%, rgba(74,144,217,.25) 0%, transparent 70%),
                        radial-gradient(ellipse 50% 40% at 80% 100%, rgba(124,58,237,.18) 0%, transparent 70%);
                    pointer-events: none;
                }
                .bf-hero__inner {
                    position: relative;
                    z-index: 1;
                    max-width: 780px;
                    margin: 0 auto;
                }
                .bf-chip {
                    display: inline-block;
                    padding: 6px 18px;
                    border-radius: var(--radius-pill);
                    font-size: .8rem;
                    font-weight: 700;
                    letter-spacing: .06em;
                    text-transform: uppercase;
                    color: var(--primary-color);
                    background: rgba(74,144,217,.12);
                    margin-bottom: 24px;
                }
                .bf-hero h1 {
                    font-size: clamp(2.4rem, 5.5vw, 3.8rem);
                    font-weight: 800;
                    line-height: 1.1;
                    letter-spacing: -0.03em;
                    margin: 0 0 20px;
                    color: #fff;
                }
                .bf-grad {
                    background: linear-gradient(135deg, var(--primary-color), #A78BFA);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .bf-hero__sub {
                    font-size: 1.15rem;
                    line-height: 1.7;
                    color: #94A3B8;
                    max-width: 600px;
                    margin: 0 auto 32px;
                }
                .bf-scroll-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 28px;
                    border: none;
                    border-radius: var(--radius-pill);
                    background: rgba(255,255,255,.08);
                    color: #CBD5E1;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: var(--transition-std);
                    backdrop-filter: blur(8px);
                }
                .bf-scroll-btn:hover { background: rgba(255,255,255,.14); color: #fff; }
                .bf-scroll-arrow {
                    display: inline-block;
                    animation: bounce 1.6s infinite;
                }
                @keyframes bounce {
                    0%,100% { transform: translateY(0); }
                    50% { transform: translateY(4px); }
                }

                /* hero entrance */
                .bf-hero .bf-chip,
                .bf-hero h1,
                .bf-hero__sub,
                .bf-scroll-btn { opacity: 0; transform: translateY(24px); transition: opacity .7s ease, transform .7s ease; }
                .bf-hero.in .bf-chip   { opacity:1; transform:translateY(0); transition-delay:.1s; }
                .bf-hero.in h1         { opacity:1; transform:translateY(0); transition-delay:.2s; }
                .bf-hero.in .bf-hero__sub  { opacity:1; transform:translateY(0); transition-delay:.3s; }
                .bf-hero.in .bf-scroll-btn { opacity:1; transform:translateY(0); transition-delay:.4s; }

                /* == STATS ============================== */
                .bf-stats {
                    position: relative;
                    margin-top: -40px;
                    padding: 0 16px;
                    z-index: 2;
                }
                .bf-stats__grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1px;
                    background: var(--border-color);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    box-shadow: var(--shadow-lg);
                }
                .bf-stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 28px 16px;
                    background: #fff;
                    opacity: 0;
                    transform: translateY(16px);
                    transition: opacity .5s ease, transform .5s ease;
                }
                .bf-stats.in .bf-stat { opacity: 1; transform: translateY(0); }
                .bf-stat__val {
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: var(--primary-color);
                    letter-spacing: -0.02em;
                }
                .bf-stat__lbl {
                    font-size: .85rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                    margin-top: 4px;
                }

                @media (max-width: 640px) {
                    .bf-stats__grid { grid-template-columns: repeat(2, 1fr); }
                }

                /* == ROLE TABS ============================== */
                .bf-tabs {
                    padding: 56px 0 0;
                }
                .bf-tabs__bar {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    padding: 6px;
                    background: var(--bg-secondary);
                    border-radius: var(--radius-pill);
                    max-width: fit-content;
                    margin: 0 auto 40px;
                }
                .bf-tab {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 24px;
                    border: none;
                    border-radius: var(--radius-pill);
                    background: transparent;
                    font-size: .95rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all .25s ease;
                    white-space: nowrap;
                }
                .bf-tab:hover { color: var(--text-main); background: rgba(0,0,0,.04); }
                .bf-tab--active {
                    background: #fff !important;
                    color: var(--tab-accent) !important;
                    box-shadow: var(--shadow-sm);
                }
                .bf-tab__icon { font-size: 1.2rem; }

                .bf-tabs__header {
                    text-align: center;
                    max-width: 560px;
                    margin: 0 auto;
                }
                .bf-tabs__header h2 {
                    font-size: 2rem;
                    font-weight: 800;
                    margin: 0 0 8px;
                }
                .bf-tabs__header p {
                    font-size: 1.1rem;
                    color: var(--text-secondary);
                    margin: 0;
                }

                @media (max-width: 640px) {
                    .bf-tabs__bar {
                        flex-direction: column;
                        border-radius: var(--radius-md);
                        width: 100%;
                        max-width: 100%;
                    }
                    .bf-tab { justify-content: center; width: 100%; padding: 14px; }
                }

                /* == BENEFITS GRID ============================== */
                .bf-grid-section {
                    padding: 48px 0 80px;
                }
                .bf-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 20px;
                }
                .bf-card {
                    position: relative;
                    overflow: hidden;
                    padding: 28px;
                    background: #fff;
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    transition: transform .35s ease, box-shadow .35s ease, opacity .5s ease;
                    opacity: 0;
                    transform: translateY(20px);
                    cursor: default;
                }
                .bf-grid-section.in .bf-card { opacity: 1; transform: translateY(0); }
                .bf-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 40px -8px rgba(0,0,0,.10);
                    border-color: var(--card-accent);
                }
                .bf-card__emoji {
                    font-size: 2rem;
                    margin-bottom: 14px;
                    display: block;
                    line-height: 1;
                }
                .bf-card h3 {
                    font-size: 1.15rem;
                    font-weight: 700;
                    margin: 0 0 8px;
                    color: var(--text-main);
                }
                .bf-card p {
                    font-size: .92rem;
                    line-height: 1.6;
                    color: var(--text-secondary);
                    margin: 0;
                }
                .bf-card__shine {
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(120deg, transparent 40%, rgba(255,255,255,.45) 50%, transparent 60%);
                    opacity: 0;
                    transform: translateX(-100%);
                    transition: none;
                    pointer-events: none;
                }
                .bf-card:hover .bf-card__shine {
                    opacity: 1;
                    transform: translateX(100%);
                    transition: transform .8s ease;
                }

                /* == COMPARISON TABLE ============================== */
                .bf-compare {
                    padding: 80px 0;
                    background: var(--bg-secondary);
                }
                .bf-compare__header {
                    text-align: center;
                    margin-bottom: 48px;
                }
                .bf-compare__header h2 {
                    font-size: 2rem;
                    font-weight: 800;
                    margin: 0 0 8px;
                    color: var(--text-main);
                }
                .bf-compare__header p {
                    font-size: 1.1rem;
                    color: var(--text-secondary);
                    margin: 0;
                }
                .bf-table-wrap {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }
                .bf-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    background: #fff;
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    box-shadow: var(--shadow-md);
                    min-width: 520px;
                }
                .bf-table th,
                .bf-table td {
                    padding: 16px 24px;
                    text-align: left;
                    font-size: .95rem;
                    border-bottom: 1px solid var(--border-color);
                }
                .bf-table thead th {
                    font-weight: 700;
                    color: var(--text-secondary);
                    font-size: .8rem;
                    text-transform: uppercase;
                    letter-spacing: .06em;
                    background: var(--bg-surface);
                }
                .bf-table tbody tr:last-child td { border-bottom: none; }
                .bf-table__highlight {
                    color: var(--primary-color) !important;
                    font-weight: 700 !important;
                    background: rgba(74,144,217,.04);
                }
                .bf-table thead .bf-table__highlight {
                    color: var(--primary-color) !important;
                }
                .bf-table__muted {
                    color: var(--text-muted);
                }

                /* comparison entrance */
                .bf-compare .bf-compare__header,
                .bf-compare .bf-table-wrap {
                    opacity: 0;
                    transform: translateY(20px);
                    transition: opacity .6s ease, transform .6s ease;
                }
                .bf-compare.in .bf-compare__header { opacity:1; transform:translateY(0); transition-delay:.1s; }
                .bf-compare.in .bf-table-wrap { opacity:1; transform:translateY(0); transition-delay:.25s; }

                /* == CTA ============================== */
                .bf-cta {
                    padding: 80px 0 120px;
                    background: var(--bg-dark);
                    color: #fff;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                .bf-cta::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(ellipse 70% 50% at 50% 100%, rgba(74,144,217,.22), transparent 70%);
                    pointer-events: none;
                }
                .bf-cta__inner {
                    position: relative;
                    z-index: 1;
                    max-width: 640px;
                    margin: 0 auto;
                }
                .bf-cta h2 {
                    font-size: clamp(1.8rem, 4vw, 2.6rem);
                    font-weight: 800;
                    margin: 0 0 16px;
                    color: #fff;
                }
                .bf-cta p {
                    font-size: 1.1rem;
                    line-height: 1.7;
                    color: #94A3B8;
                    margin: 0 0 36px;
                }
                .bf-cta__btns {
                    display: flex;
                    gap: 14px;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                .bf-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 14px 36px;
                    border-radius: var(--radius-pill);
                    font-size: 1rem;
                    font-weight: 700;
                    text-decoration: none;
                    transition: var(--transition-std);
                    cursor: pointer;
                    border: none;
                }
                .bf-btn--primary {
                    background: linear-gradient(135deg, var(--primary-color), #7C3AED);
                    color: #fff;
                    box-shadow: 0 8px 24px -6px rgba(74,144,217,.4);
                }
                .bf-btn--primary:hover { transform: translateY(-3px); box-shadow: 0 14px 32px -6px rgba(74,144,217,.5); }
                .bf-btn--outline {
                    background: transparent;
                    color: #CBD5E1;
                    border: 1.5px solid rgba(203,213,225,.3);
                }
                .bf-btn--outline:hover { background: rgba(255,255,255,.06); border-color: rgba(203,213,225,.5); color: #fff; }

                /* CTA entrance */
                .bf-cta h2,
                .bf-cta p,
                .bf-cta__btns {
                    opacity: 0;
                    transform: translateY(20px);
                    transition: opacity .6s ease, transform .6s ease;
                }
                .bf-cta.in h2 { opacity:1; transform:translateY(0); transition-delay:.1s; }
                .bf-cta.in p { opacity:1; transform:translateY(0); transition-delay:.2s; }
                .bf-cta.in .bf-cta__btns { opacity:1; transform:translateY(0); transition-delay:.3s; }

                @media (max-width: 480px) {
                    .bf-cta__btns { flex-direction: column; }
                    .bf-btn { width: 100%; }
                }
            `}</style>
        </main>
    );
}
