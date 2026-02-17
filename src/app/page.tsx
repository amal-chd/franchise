'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [content, setContent] = useState<Record<string, any>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/content');
      const data = await res.json();
      setContent(data);
    } catch (error) {
      console.error('Failed to fetch content', error);
    }
  };



  const features = [
    {
      icon: content.hero?.card1_icon || 'fa-chart-line',
      title: content.hero?.card1_title || 'High ROI',
      description: content.hero?.card1_description || 'Low investment with high returns. Break even in just 3-6 months.',
      color: '#4A90D9',
      bg: 'rgba(74, 144, 217, 0.1)',
    },
    {
      icon: content.hero?.card2_icon || 'fa-mobile-alt',
      title: content.hero?.card2_title || 'Tech-First',
      description: content.hero?.card2_description || 'Advanced app for managing orders, delivery, and payments effortlessly.',
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      icon: content.hero?.card3_icon || 'fa-users',
      title: content.hero?.card3_title || 'Full Support',
      description: content.hero?.card3_description || 'Marketing, training, and operational support to ensure your success.',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)',
    },

  ];

  const defaultTestimonials = [
    {
      quote: 'The Kada has transformed my business. In 6 months, my revenue has doubled!',
      name: 'Rajesh Kumar',
      role: 'Franchise Partner, Kochi',
    },
    {
      quote: 'Amazing support from the team. They helped me set up everything from scratch.',
      name: 'Priya Menon',
      role: 'Franchise Partner, Thrissur',
    },
    {
      quote: 'The technology is incredible. Managing orders has never been this easy.',
      name: 'Anil Sharma',
      role: 'Franchise Partner, Calicut',
    },
  ];

  const testimonials = Array.isArray(content.testimonials?.testimonials) && content.testimonials.testimonials.length > 0
    ? content.testimonials.testimonials
    : defaultTestimonials;

  const steps = [
    { number: '01', title: 'Apply Online', description: 'Fill out a simple application form and tell us about your city.', icon: 'fa-paper-plane' },
    { number: '02', title: 'Get Approved', description: 'Our team reviews your application and gets in touch within 48 hours.', icon: 'fa-check-circle' },
    { number: '03', title: 'Setup & Train', description: 'We help you set up operations with complete training and tech support.', icon: 'fa-graduation-cap' },
    { number: '04', title: 'Go Live!', description: 'Launch in your city and start earning. We handle the tech, you handle the growth.', icon: 'fa-rocket' },
  ];

  const faqItems = content.faq?.faqs || [
    { question: 'What is the investment required?', answer: 'The investment varies by city tier, starting from as low as ₹10,000. This covers onboarding, training, technology setup, and initial marketing.' },
    { question: 'How long does it take to break even?', answer: 'Most of our franchise partners break even within 3-6 months of going live, depending on the city and market conditions.' },
    { question: 'Do I need prior business experience?', answer: 'No prior experience required! We provide comprehensive training covering operations, tech, customer management, and marketing.' },
    { question: 'What ongoing support do you provide?', answer: 'We offer 24/7 tech support, dedicated relationship managers, regular training sessions, marketing campaigns, and business growth consulting.' },
    { question: 'Which cities are available?', answer: 'We are expanding rapidly across India. Check our availability page or contact us to see if your city is available for franchise.' },
  ];

  return (
    <main>

      {/* ── Hero ── */}
      <section id="home" className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <h1>{content.hero?.title || 'Life. Simplified. One Platform Is All You Need.'}</h1>
            <p>{content.hero?.subtitle || 'Shop the Best. Sell with Ease. Only on The Kada. We connect customers to nearby grocery stores, restaurants, pharmacies, and more.'}</p>
            <div className="hero-btns">
              <Link href="/apply" className="btn btn-primary">
                Start Your Franchise
              </Link>
              <Link href="#about" className="btn btn-secondary">
                Learn More
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <img src={content.hero?.image || "/hero-image.png"} alt="The Kada Delivery Partner" />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="section stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <h3>{content.stats?.active_franchises || '50+'}</h3>
              <p>Active Franchises</p>
            </div>
            <div className="stat-item">
              <h3>{content.stats?.daily_orders || '10k+'}</h3>
              <p>Daily Orders</p>
            </div>
            <div className="stat-item">
              <h3>{content.stats?.partner_vendors || '500+'}</h3>
              <p>Partner Vendors</p>
            </div>
            <div className="stat-item">
              <h3>{content.stats?.partner_revenue || '₹1Cr+'}</h3>
              <p>Partner Revenue</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why The Kada (Features) ── */}
      <section id="about" className="section features">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '2rem' }}>
            <h2>{content.about?.title || 'Why The Kada?'}</h2>
            <p style={{ margin: '0 auto', maxWidth: '560px' }}>
              {content.about?.description || 'We are building the digital backbone for small-town India.'}
            </p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon" style={{ background: f.bg, color: f.color }}>
                  <i className={`fas ${f.icon}`}></i>
                </div>
                <h4>{f.title}</h4>
                <p style={{ fontSize: '0.9rem', marginBottom: 0 }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="section" style={{ background: 'var(--bg-surface)', overflow: 'hidden' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3rem' }}>
            <span style={{
              display: 'inline-block', padding: '6px 16px', borderRadius: 'var(--radius-pill)',
              background: 'rgba(74, 144, 217, 0.08)', color: 'var(--primary-color)',
              fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase',
              marginBottom: '12px',
            }}>
              Testimonials
            </span>
            <h2>{content.testimonials?.title || 'What Our Partners Say'}</h2>
            <p style={{ margin: '0 auto', maxWidth: '500px' }}>
              {content.testimonials?.subtitle || 'Hear from franchise owners who are already winning with The Kada.'}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            maxWidth: '1000px',
            margin: '0 auto',
          }}>
            {testimonials.map((t: any, i: number) => {
              const avatarColors = ['#4A90D9', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899'];
              const color = avatarColors[i % avatarColors.length];
              const quote = t.quote || t.content || t.message || '';
              const rating = t.rating || 5;
              return (
                <div key={i} className="testimonial-card" style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '28px 24px',
                  position: 'relative',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'default',
                }}>
                  {/* Quote icon */}
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: `linear-gradient(135deg, ${color}18, ${color}30)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '18px',
                  }}>
                    <i className="fas fa-quote-left" style={{ fontSize: '1rem', color }}></i>
                  </div>

                  {/* Stars */}
                  <div style={{ display: 'flex', gap: '3px', marginBottom: '14px' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <i key={s} className={s <= rating ? 'fas fa-star' : 'far fa-star'}
                        style={{ fontSize: '0.8rem', color: s <= rating ? '#FBBF24' : '#D1D5DB' }}></i>
                    ))}
                  </div>

                  {/* Quote text */}
                  <p style={{
                    color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.7',
                    marginBottom: '22px', minHeight: '80px',
                  }}>
                    &ldquo;{quote}&rdquo;
                  </p>

                  {/* Author */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      background: `linear-gradient(135deg, ${color}, ${color}CC)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: '700', fontSize: '0.9rem',
                      flexShrink: 0,
                    }}>
                      {t.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '2px' }}>
                        {t.name}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {t.role}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section" style={{ background: 'var(--bg-surface)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '2.5rem' }}>
            <h2>{content.howItWorks?.title || 'How It Works'}</h2>
            <p style={{ margin: '0 auto', maxWidth: '500px' }}>
              {content.howItWorks?.subtitle || 'From application to launch in just 4 simple steps.'}
            </p>
          </div>

          <div className="how-it-works-grid">
            {steps.map((step, i) => (
              <div className="hiw-step" key={i}>
                <div className="hiw-number">{step.number}</div>
                <div className="hiw-icon">
                  <i className={`fas ${step.icon}`}></i>
                </div>
                <h4 style={{ marginBottom: '6px', fontSize: '1rem' }}>{step.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 0, lineHeight: '1.5' }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .how-it-works-grid {
            display: flex;
            flex-direction: column;
            gap: 0;
            position: relative;
            padding-left: 24px;
          }
          .hiw-step {
            position: relative;
            padding: 0 0 32px 32px;
            border-left: 2px solid var(--border-color);
          }
          .hiw-step:last-child {
            border-left-color: transparent;
            padding-bottom: 0;
          }
          .hiw-number {
            position: absolute;
            left: -17px;
            top: 0;
            width: 32px;
            height: 32px;
            background: var(--primary-color);
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            font-weight: 800;
          }
          .hiw-icon {
            font-size: 1.25rem;
            color: var(--primary-color);
            margin-bottom: 8px;
          }

          @media (min-width: 768px) {
            .how-it-works-grid {
              flex-direction: row;
              gap: 24px;
              padding-left: 0;
            }
            .hiw-step {
              flex: 1;
              padding: 32px 24px;
              border-left: none;
              border: 1px solid var(--border-color);
              border-radius: var(--radius-lg);
              background: #fff;
              text-align: center;
              box-shadow: var(--shadow-sm);
              transition: all 0.3s;
            }
            .hiw-step:last-child {
              border-color: var(--border-color);
            }
            .hiw-step:hover {
              transform: translateY(-4px);
              box-shadow: var(--shadow-lg);
            }
            .hiw-number {
              position: static;
              margin: 0 auto 12px;
              width: 40px;
              height: 40px;
              font-size: 0.8rem;
            }
            .hiw-icon {
              font-size: 1.5rem;
              margin-bottom: 12px;
            }
          }
        `}</style>
      </section>

      {/* ── FAQ ── */}
      <section className="section" style={{ background: '#FFFFFF' }}>
        <div className="container" style={{ maxWidth: '720px' }}>
          <div className="text-center" style={{ marginBottom: '2rem' }}>
            <h2>Frequently Asked Questions</h2>
            <p style={{ margin: '0 auto' }}>Everything you need to know about The Kada franchise opportunity.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {faqItems.map((faq: any, i: number) => (
              <div key={i} style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: openFaq === i ? 'var(--bg-surface)' : '#fff',
                transition: 'all 0.2s',
              }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                  width: '100%',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: 'var(--text-main)',
                  textAlign: 'left',
                }}>
                  <span>{faq.question}</span>
                  <i className="fas fa-chevron-down" style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    transition: 'transform 0.3s',
                    transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)',
                    flexShrink: 0,
                    marginLeft: '12px',
                  }}></i>
                </button>
                <div style={{
                  maxHeight: openFaq === i ? '300px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease',
                }}>
                  <p style={{
                    padding: '0 20px 16px',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    margin: 0,
                  }}>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        background: 'linear-gradient(180deg, #EFF6FF, #F8FAFC)',
        padding: '48px 0',
        textAlign: 'center',
      }}>
        <div className="container">
          <h2 style={{ marginBottom: '12px' }}>
            {content.teaser?.title || 'Ready to Own a Franchise?'}
          </h2>
          <p style={{ maxWidth: '500px', margin: '0 auto 24px' }}>
            {content.teaser?.description || 'Join 50+ successful franchise partners across India. Apply now and start your journey.'}
          </p>
          <Link href="/apply" className="btn btn-primary" style={{ maxWidth: '280px', margin: '0 auto' }}>
            Apply Now <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
          </Link>
        </div>
      </section>

    </main>
  );
}
