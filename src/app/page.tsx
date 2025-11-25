'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',

    phone: '',
    city: ''
  });
  const [status, setStatus] = useState('');
  const [step, setStep] = useState(1);
  const [requestId, setRequestId] = useState('');
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [content, setContent] = useState<Record<string, any>>({});
  const [testimonialIndex, setTestimonialIndex] = useState(0);

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

  // Auto-rotate testimonials
  useEffect(() => {
    if (content.testimonials && content.testimonials.length > 0) {
      const interval = setInterval(() => {
        setTestimonialIndex((prev) => (prev + 1) % content.testimonials.length);
      }, 5000); // Change every 5 seconds
      return () => clearInterval(interval);
    }
  }, [content.testimonials]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setRequestId(data.requestId);
        setStatus('');
        // Redirect to the new apply page for next steps
        window.location.href = `/apply?id=${data.requestId}`;
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  const handleKycSubmit = async () => {
    if (!kycFile || !requestId) return;
    setStatus('sending');

    const formData = new FormData();
    formData.append('file', kycFile);
    formData.append('requestId', requestId);

    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setStatus('');
        setStep(3);
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  const handlePricingSubmit = async (plan: string) => {
    setSelectedPlan(plan);
    setStatus('sending');

    try {
      const res = await fetch('/api/pricing/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, plan }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.isFree) {
          // Free plan, skip payment
          setStatus('');
          setStep(4);
        } else {
          // Paid plan, open Razorpay
          const options = {
            key: data.keyId,
            amount: data.amount,
            currency: data.currency,
            name: 'The Kada Franchise',
            description: `${plan === 'basic' ? '60-40' : '70-30'} Revenue Share Plan`,
            order_id: data.orderId,
            handler: async function (response: any) {
              // Verify payment
              const verifyRes = await fetch('/api/pricing/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  requestId,
                }),
              });

              if (verifyRes.ok) {
                setStatus('');
                setStep(4);
              } else {
                setStatus('error');
              }
            },
            prefill: {
              name: formData.name,
              email: formData.email,
              contact: formData.phone,
            },
            theme: {
              color: '#2563EB',
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          setStatus('');
        }
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  const handleAgreementSubmit = async () => {
    if (!agreementAccepted || !requestId) return;
    setStatus('sending');

    try {
      const res = await fetch('/api/agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        setStatus('success');
        setStep(5);
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <main>


      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <h1>{content.hero_title || 'Life. Simplified. One Platform Is All You Need.'}</h1>
            <p>{content.hero_subtitle || 'Shop the Best. Sell with Ease. Only on The Kada. We connect customers to nearby grocery stores, restaurants, pharmacies, and more.'}</p>
            <div className="hero-btns">
              <Link href="#contact" className="btn btn-primary">
                Start Your Franchise
              </Link>
              <Link href="#about" className="btn btn-secondary">
                Learn More
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <img src="/hero-image.png" alt="The Kada Delivery Partner" style={{ borderRadius: 'var(--radius-lg)', width: '100%' }} />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section stats">
        <div className="container stats-grid">
          <div className="stat-item">
            <h3>50+</h3>
            <p>Active Franchises</p>
          </div>
          <div className="stat-item">
            <h3>10k+</h3>
            <p>Daily Orders</p>
          </div>
          <div className="stat-item">
            <h3>500+</h3>
            <p>Partner Vendors</p>
          </div>
          <div className="stat-item">
            <h3>₹1Cr+</h3>
            <p>Partner Revenue</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section" style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          {/* Section Header */}
          <div className="text-center" style={{ marginBottom: '2.5rem' }}>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: '800',
              marginBottom: '0.75rem',
              background: 'linear-gradient(135deg, var(--text-primary), #64748B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Why The Kada?
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              {content.about_text || 'We are building the digital backbone for small-town India.'}
            </p>
          </div>

          {/* Horizontal Sliding Carousel */}
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '1rem 0'
          }}>
            <div className="features-slider" style={{
              display: 'flex',
              gap: '1.5rem',
              animation: 'slide 20s linear infinite',
              width: 'fit-content'
            }}>
              {/* Feature 1 */}
              <div className="glass-card" style={{
                minWidth: '280px',
                maxWidth: '280px',
                padding: '1.5rem',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(37, 99, 235, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '';
                }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  margin: '0 auto 1rem',
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(139, 92, 246, 0.15))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(37, 99, 235, 0.3)'
                }}>
                  <i className="fas fa-store" style={{
                    fontSize: '1.5rem',
                    background: 'linear-gradient(135deg, var(--primary-color), #8B5CF6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}></i>
                </div>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)'
                }}>
                  Trusted Local Shops
                </h4>
                <p style={{
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  Order from trusted vendors in your neighborhood
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-card" style={{
                minWidth: '280px',
                maxWidth: '280px',
                padding: '1.5rem',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '';
                }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  margin: '0 auto 1rem',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <i className="fas fa-truck-fast" style={{
                    fontSize: '1.5rem',
                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}></i>
                </div>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)'
                }}>
                  Fast Delivery
                </h4>
                <p style={{
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  Quick and affordable doorstep delivery
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-card" style={{
                minWidth: '280px',
                maxWidth: '280px',
                padding: '1.5rem',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(16, 185, 129, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '';
                }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  margin: '0 auto 1rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <i className="fas fa-mobile-screen" style={{
                    fontSize: '1.5rem',
                    background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}></i>
                </div>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)'
                }}>
                  Seamless App
                </h4>
                <p style={{
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  User-friendly platform for all your needs
                </p>
              </div>

              {/* Duplicate cards for seamless loop */}
              <div className="glass-card" style={{
                minWidth: '280px',
                maxWidth: '280px',
                padding: '1.5rem',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(37, 99, 235, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '';
                }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  margin: '0 auto 1rem',
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(139, 92, 246, 0.15))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(37, 99, 235, 0.3)'
                }}>
                  <i className="fas fa-store" style={{
                    fontSize: '1.5rem',
                    background: 'linear-gradient(135deg, var(--primary-color), #8B5CF6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}></i>
                </div>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)'
                }}>
                  Trusted Local Shops
                </h4>
                <p style={{
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  Order from trusted vendors in your neighborhood
                </p>
              </div>

              <div className="glass-card" style={{
                minWidth: '280px',
                maxWidth: '280px',
                padding: '1.5rem',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '';
                }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  margin: '0 auto 1rem',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <i className="fas fa-truck-fast" style={{
                    fontSize: '1.5rem',
                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}></i>
                </div>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)'
                }}>
                  Fast Delivery
                </h4>
                <p style={{
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  Quick and affordable doorstep delivery
                </p>
              </div>

              <div className="glass-card" style={{
                minWidth: '280px',
                maxWidth: '280px',
                padding: '1.5rem',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(16, 185, 129, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '';
                }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  margin: '0 auto 1rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <i className="fas fa-mobile-screen" style={{
                    fontSize: '1.5rem',
                    background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}></i>
                </div>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)'
                }}>
                  Seamless App
                </h4>
                <p style={{
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  User-friendly platform for all your needs
                </p>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes slide {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(-280px * 3 - 1.5rem * 3));
            }
          }

          .features-slider:hover {
            animation-play-state: paused;
          }

          @media (max-width: 768px) {
            @keyframes slide {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(calc(-280px * 3 - 1.5rem * 3));
              }
            }
          }
        `}</style>
      </section>

      {/* Testimonials Section */}
      {content.testimonials && content.testimonials.length > 0 && (
        <section className="section" style={{
          background: 'linear-gradient(135deg, var(--primary-color), #8B5CF6)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <div className="text-center" style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                fontWeight: '800',
                marginBottom: '0.75rem',
                color: 'white'
              }}>
                What Our Partners Say
              </h2>
              <p style={{ fontSize: '1.125rem', opacity: 0.95, maxWidth: '600px', margin: '0 auto' }}>
                Join hundreds of successful franchise partners across India
              </p>
            </div>

            {/* Testimonial Carousel */}
            <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
              <div className="glass-card" style={{
                padding: 'clamp(2rem, 4vw, 3rem)',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                minHeight: '280px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <div style={{
                  fontSize: '3rem',
                  opacity: 0.3,
                  marginBottom: '1rem',
                  fontFamily: 'Georgia, serif'
                }}>"</div>
                <p style={{
                  fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)',
                  lineHeight: '1.8',
                  marginBottom: '2rem',
                  fontStyle: 'italic'
                }}>
                  {content.testimonials[testimonialIndex]?.message}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    border: '2px solid rgba(255,255,255,0.3)'
                  }}>
                    {content.testimonials[testimonialIndex]?.name?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.125rem' }}>
                      {content.testimonials[testimonialIndex]?.name}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: '0.95rem' }}>
                      {content.testimonials[testimonialIndex]?.role} • {content.testimonials[testimonialIndex]?.company}
                    </div>
                    <div style={{ marginTop: '0.25rem' }}>
                      {[...Array(content.testimonials[testimonialIndex]?.rating || 5)].map((_, i) => (
                        <i key={i} className="fas fa-star" style={{ color: '#FFD700', fontSize: '0.875rem', marginRight: '2px' }}></i>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Carousel Indicators */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '2rem'
              }}>
                {Array.isArray(content.testimonials) && content.testimonials.map((_: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setTestimonialIndex(index)}
                    style={{
                      width: index === testimonialIndex ? '32px' : '12px',
                      height: '12px',
                      borderRadius: '6px',
                      background: index === testimonialIndex ? 'white' : 'rgba(255,255,255,0.4)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      {content.how_it_works && content.how_it_works.length > 0 && (
        <section className="section" style={{ background: 'var(--bg-primary)' }}>
          <div className="container">
            <div className="text-center" style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                fontWeight: '800',
                marginBottom: '0.75rem',
                background: 'linear-gradient(135deg, var(--text-primary), #64748B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                How It Works
              </h2>
              <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                Get started in 4 simple steps
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'clamp(2rem, 4vw, 3rem)',
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              {Array.isArray(content.how_it_works) && content.how_it_works.map((step: any, index: number) => (
                <div key={step.id} style={{
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  {/* Step Number Circle */}
                  <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 1.5rem',
                    background: `linear-gradient(135deg, ${index % 2 === 0 ? 'var(--primary-color), #8B5CF6' : '#8B5CF6, #EC4899'})`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: '0 10px 30px rgba(37, 99, 235, 0.3)'
                  }}>
                    <i className={`fas ${step.icon}`} style={{
                      fontSize: '2rem',
                      color: 'white'
                    }}></i>
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      width: '32px',
                      height: '32px',
                      background: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '1rem',
                      color: 'var(--primary-color)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                      {index + 1}
                    </div>
                  </div>

                  <h4 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    marginBottom: '0.75rem',
                    color: 'var(--text-primary)'
                  }}>
                    {step.title}
                  </h4>
                  <p style={{
                    color: 'var(--text-secondary)',
                    lineHeight: '1.7',
                    fontSize: '0.95rem'
                  }}>
                    {step.description}
                  </p>

                  {/* Connector Line (except for last item) */}
                  {index < content.how_it_works.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      top: '40px',
                      left: 'calc(50% + 40px)',
                      width: 'calc(100% - 80px)',
                      height: '2px',
                      background: 'linear-gradient(90deg, var(--primary-color), transparent)',
                      opacity: 0.3,
                      display: window.innerWidth > 768 ? 'block' : 'none'
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {content.faq_items && content.faq_items.length > 0 && (
        <section className="section" style={{ background: 'var(--bg-secondary)' }}>
          <div className="container">
            <div className="text-center" style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                fontWeight: '800',
                marginBottom: '0.75rem',
                background: 'linear-gradient(135deg, var(--text-primary), #64748B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Frequently Asked Questions
              </h2>
              <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                Everything you need to know about partnering with us
              </p>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              {Array.isArray(content.faq_items) && content.faq_items.map((faq: any, index: number) => (
                <details
                  key={faq.id}
                  className="glass-card"
                  style={{
                    marginBottom: '1rem',
                    padding: '0',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <summary style={{
                    padding: 'clamp(1.25rem, 3vw, 1.5rem)',
                    fontWeight: '600',
                    fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    listStyle: 'none'
                  }}>
                    <span style={{ flex: 1, paddingRight: '1rem' }}>{faq.question}</span>
                    <i className="fas fa-chevron-down" style={{
                      fontSize: '0.875rem',
                      transition: 'transform 0.3s ease'
                    }}></i>
                  </summary>
                  <div style={{
                    padding: '0 clamp(1.25rem, 3vw, 1.5rem) clamp(1.25rem, 3vw, 1.5rem)',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.7',
                    fontSize: '0.95rem',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="section contact">
        <div className="container">
          <div className="contact-form glass-card">
            <div className="text-center" style={{ marginBottom: '3rem' }}>
              <h2 className="text-primary">Become a Partner</h2>
              <p>Ready to transform your local market? Start your journey today.</p>
            </div>

            {/* Modern Step Wizard */}
            <div className="step-wizard">
              <div className="step-line">
                <div className="step-progress" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
              </div>

              <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                <div className="step-circle">{step > 1 ? '✓' : '1'}</div>
                <div className="step-label">Details</div>
              </div>

              <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                <div className="step-circle">{step > 2 ? '✓' : '2'}</div>
                <div className="step-label">KYC</div>
              </div>

              <div className={`step-item ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                <div className="step-circle">{step > 3 ? '✓' : '3'}</div>
                <div className="step-label">Pricing</div>
              </div>

              <div className={`step-item ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
                <div className="step-circle">{step > 4 ? '✓' : '4'}</div>
                <div className="step-label">Sign</div>
              </div>
            </div>

            {step === 1 && (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    placeholder="e.g. john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    required
                    placeholder="e.g. +91 9496491654"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred City/Town</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Kochi"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={status === 'sending'}>
                  {status === 'sending' ? 'Processing...' : 'Next: Upload KYC'} <i className="fas fa-arrow-right"></i>
                </button>
                {status === 'error' && <p style={{ color: 'var(--accent-color)', marginTop: '1rem', textAlign: 'center' }}>Something went wrong. Please try again.</p>}
              </form>
            )}
          </div>
        </div>
      </section>



      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

      {/* FontAwesome CDN */}

    </main>
  );
}
