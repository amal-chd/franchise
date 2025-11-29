'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
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
    const testimonialCount = content.testimonials?.testimonials?.length || 3;
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonialCount);
    }, 5000); // Change every 5 seconds
    return () => clearInterval(interval);
  }, [content.testimonials]);


  return (
    <main>


      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <h1>{content.hero?.title || 'Life. Simplified. One Platform Is All You Need.'}</h1>
            <p>{content.hero?.subtitle || 'Shop the Best. Sell with Ease. Only on The Kada. We connect customers to nearby grocery stores, restaurants, pharmacies, and more.'}</p>
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
            <img src={content.hero?.image || "/hero-image.png"} alt="The Kada Delivery Partner" style={{ borderRadius: 'var(--radius-lg)', width: '100%' }} />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section stats">
        <div className="container stats-grid">
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
              color: 'var(--text-main)' // Fallback color
            }}>
              <span style={{
                background: 'linear-gradient(135deg, var(--text-main), #64748B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {content.about?.title || 'Why The Kada?'}
              </span>
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              {content.about?.description || 'We are building the digital backbone for small-town India.'}
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
                  fontSize: '1.5rem',
                  color: 'var(--primary-color)'
                }}>
                  <i className={`fas ${content.hero?.card1_icon || 'fa-chart-line'}`}></i>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{content.hero?.card1_title || 'High ROI'}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{content.hero?.card1_description || 'Low investment with high returns. Break even in just 3-6 months.'}</p>
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
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.15))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: 'var(--success-color)'
                }}>
                  <i className={`fas ${content.hero?.card2_icon || 'fa-mobile-alt'}`}></i>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{content.hero?.card2_title || 'Tech-First'}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{content.hero?.card2_description || 'Advanced app for managing orders, delivery, and payments effortlessly.'}</p>
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
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.15))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: '#F59E0B'
                }}>
                  <i className={`fas ${content.hero?.card3_icon || 'fa-users'}`}></i>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{content.hero?.card3_title || 'Full Support'}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{content.hero?.card3_description || 'Marketing, training, and operational support to ensure your success.'}</p>
              </div>

              {/* Feature 4 (Duplicate for infinite scroll illusion) */}
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
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(244, 114, 182, 0.15))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: '#EC4899'
                }}>
                  <i className="fas fa-truck"></i>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Hyper-Local</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Dominate your local market with our specialized hyper-local delivery model.</p>
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
                  fontSize: '1.5rem',
                  color: 'var(--primary-color)'
                }}>
                  <i className="fas fa-chart-line"></i>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>High ROI</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Low investment with high returns. Break even in just 3-6 months.</p>
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
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.15))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: 'var(--success-color)'
                }}>
                  <i className="fas fa-mobile-alt"></i>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Tech-First</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Advanced app for managing orders, delivery, and payments effortlessly.</p>
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
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.15))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: '#F59E0B'
                }}>
                  <i className="fas fa-users"></i>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Full Support</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Marketing, training, and operational support to ensure your success.</p>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes slide {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(calc(-280px * 4 - 1.5rem * 4)); /* Adjusted for 4 unique items */
              }
            }
  
            .features-slider:hover {
              animation-play-state: paused;
            }
  
          `}</style>
        </div>
      </section>

      {/* Testimonials Section */}
      {(content.testimonials?.testimonials?.length > 0 || true) && (
        <section className="section" style={{
          backgroundColor: 'var(--primary-color)', // Fallback
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
              <p style={{ fontSize: '1.125rem', opacity: 0.95, maxWidth: '600px', margin: '0 auto', color: 'white' }}>
                Join hundreds of successful franchise partners across India
              </p>
            </div>

            {/* Testimonial Carousel */}
            <div className="testimonials-container" style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
              <div className="testimonials-track" style={{
                display: 'flex',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                gap: '1rem',
                paddingBottom: '1rem',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}>
                {(content.testimonials?.testimonials?.length > 0 ? content.testimonials.testimonials : [
                  {
                    name: "Rahul Sharma",
                    role: "Franchise Owner",
                    company: "Kochi",
                    message: "The Kada has transformed my business. The support and technology they provide are unmatched.",
                    rating: 5
                  },
                  {
                    name: "Anjali Menon",
                    role: "Partner",
                    company: "Trivandrum",
                    message: "I broke even in just 4 months. Highly recommend this franchise opportunity to anyone looking for high ROI.",
                    rating: 5
                  },
                  {
                    name: "Arjun Nair",
                    role: "Vendor",
                    company: "Calicut",
                    message: "Seamless delivery and payments. My sales have doubled since joining The Kada network.",
                    rating: 5
                  }
                ]).map((testimonial: any, index: number) => (
                  <div key={index} className="testimonial-card glass-card" style={{
                    minWidth: '100%',
                    scrollSnapAlign: 'center',
                    padding: 'clamp(2rem, 4vw, 3rem)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    minHeight: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <div className="quote-icon" style={{
                      fontSize: '3rem',
                      opacity: 0.3,
                      marginBottom: '1rem',
                      fontFamily: 'Georgia, serif',
                      color: 'white'
                    }}>"</div>
                    <p style={{
                      fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)',
                      lineHeight: '1.8',
                      marginBottom: '2rem',
                      fontStyle: 'italic',
                      color: 'white'
                    }}>
                      {testimonial.message}
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
                        border: '2px solid rgba(255,255,255,0.3)',
                        color: 'white'
                      }}>
                        {testimonial.avatar ? (
                          <img src={testimonial.avatar} alt={testimonial.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          testimonial.name?.charAt(0)
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '1.125rem', color: 'white' }}>
                          {testimonial.name}
                        </div>
                        <div style={{ opacity: 0.9, fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)' }}>
                          {testimonial.role} • {testimonial.company}
                        </div>
                        <div style={{ marginTop: '0.25rem' }}>
                          {[...Array(testimonial.rating || 5)].map((_, i) => (
                            <i key={i} className="fas fa-star" style={{ color: '#FFD700', fontSize: '0.875rem', marginRight: '2px' }}></i>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Carousel Indicators (Optional - can be removed if swipe is obvious) */}
              <div className="testimonial-indicators" style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '1rem'
              }}>
                {(content.testimonials?.testimonials?.length > 0 ? content.testimonials.testimonials : [1, 2, 3]).map((_: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'white',
                      opacity: index === testimonialIndex ? 1 : 0.5,
                      transition: 'opacity 0.3s'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section >
      )
      }

      {/* How It Works Section */}
      {
        content.how_it_works && content.how_it_works.length > 0 && (
          <section className="section" style={{ background: 'var(--bg-primary)' }}>
            <div className="container">
              <div className="text-center" style={{ marginBottom: '3rem' }}>
                <h2 style={{
                  fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                  fontWeight: '800',
                  marginBottom: '0.75rem',
                  color: 'var(--text-main)'
                }}>
                  <span style={{
                    background: 'linear-gradient(135deg, var(--text-main), #64748B)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    How It Works
                  </span>
                </h2>
                <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                  Get started in 4 simple steps
                </p>
              </div>

              <div className="how-it-works-grid">
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
                      color: 'var(--text-main)'
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
                        display: 'none'
                      }} />
                    )}
                  </div>
                ))}
              </div>

              <div className="mobile-scroll-hint">
                <span>Swipe to see steps <i className="fas fa-arrow-right" style={{ fontSize: '0.8em' }}></i></span>
              </div>

              <style jsx>{`
                .mobile-scroll-hint {
                  display: none;
                  text-align: center;
                  color: var(--text-secondary);
                  font-size: 0.875rem;
                  margin-top: 0.5rem;
                  opacity: 0.8;
                  animation: pulse 2s infinite;
                }

                @keyframes pulse {
                  0% { opacity: 0.5; }
                  50% { opacity: 1; }
                  100% { opacity: 0.5; }
                }

                .how-it-works-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                  gap: 2rem;
                  padding-bottom: 1rem;
                }

                .how-it-works-grid > div {
                  background: white;
                  padding: 2rem;
                  border-radius: 1rem;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                  transition: transform 0.3s ease;
                  border: 1px solid transparent;
                }

                .how-it-works-grid > div:hover {
                  transform: translateY(-5px);
                  border-color: var(--primary-color);
                }

                /* Testimonials Carousel Styles */
                .testimonials-track::-webkit-scrollbar {
                  display: none;
                }
                
                .testimonial-card {
                  transition: transform 0.3s ease;
                }

                @media (max-width: 768px) {
                  .mobile-scroll-hint {
                    display: none; /* Hide scroll hint for vertical layout */
                  }

                  .how-it-works-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    padding-bottom: 0.5rem; /* Reduced from 2rem to remove gap */
                    padding-right: 0;
                    margin-right: 0;
                    overflow: visible;
                    width: 100%; /* Ensure container doesn't overflow */
                  }
                  
                  .how-it-works-grid > div {
                    min-width: 0; /* Allow flex item to shrink */
                    width: auto;
                    max-width: 100%;
                    padding: 0 0 2rem 2rem;
                    flex: 1;
                    background: transparent;
                    border: none;
                    box-shadow: none;
                    border-radius: 0;
                    text-align: left;
                    position: relative;
                    border-left: 2px solid rgba(139, 92, 246, 0.2);
                    margin-left: 1rem;
                    margin-right: 0; /* Ensure no right margin */
                    box-sizing: border-box;
                  }

                  .how-it-works-grid > div:last-child {
                    border-left: 2px solid transparent;
                    padding-bottom: 0;
                  }

                  /* Step Number Circle Repositioning */
                  .how-it-works-grid > div > div:first-child {
                    width: 40px !important;
                    height: 40px !important;
                    margin: 0 !important;
                    position: absolute !important;
                    left: -21px !important;
                    top: 0 !important;
                    box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3) !important;
                    z-index: 2;
                  }

                  .how-it-works-grid > div > div:first-child i {
                    font-size: 1rem !important;
                  }

                  .how-it-works-grid > div > div:first-child > div {
                    display: none !important; /* Hide the small number badge */
                  }

                  .how-it-works-grid > div h4 {
                    font-size: 1.25rem !important;
                    margin-bottom: 0.5rem !important;
                    margin-top: -5px;
                    color: var(--text-main);
                    word-wrap: break-word; /* Prevent text overflow */
                  }

                  .how-it-works-grid > div p {
                    font-size: 1rem !important;
                    line-height: 1.6 !important;
                    color: var(--text-secondary);
                  }
                  
                  .testimonials-track {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem !important;
                    padding: 0 !important;
                    overflow: visible !important;
                    width: 100%;
                  }
                  
                  .testimonial-card {
                    min-width: 0 !important; /* Allow shrinking */
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 1.5rem !important;
                    min-height: auto !important;
                    background: rgba(255, 255, 255, 0.08) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 16px !important;
                    text-align: left !important;
                    align-items: flex-start !important;
                    box-sizing: border-box; /* Ensure padding doesn't add to width */
                  }

                  .testimonial-card .quote-icon {
                    display: none !important; /* Hide big quote icon for cleaner look */
                  }
                  
                  .testimonial-card p {
                    font-size: 1rem !important;
                    line-height: 1.6 !important;
                    margin-bottom: 1.5rem !important;
                    color: rgba(255, 255, 255, 0.9) !important;
                    order: 2; /* Move text below header */
                  }

                  .testimonial-card > div {
                    flex-direction: row !important;
                    align-items: center !important;
                    gap: 1rem !important;
                    width: 100%;
                    order: 1; /* Move header to top */
                    margin-bottom: 1rem;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding-bottom: 1rem;
                  }

                  .testimonial-indicators {
                    display: none !important; /* Hide dots */
                  }
                }
              `}</style>
            </div>
          </section>
        )
      }

      {/* FAQ Section */}
      {
        content.faq_items && content.faq_items.length > 0 && (
          <section className="section" style={{ background: 'var(--bg-secondary)' }}>
            <div className="container">
              <div className="text-center" style={{ marginBottom: '3rem' }}>
                <h2 style={{
                  fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                  fontWeight: '800',
                  marginBottom: '0.75rem',
                  color: 'var(--text-main)'
                }}>
                  <span style={{
                    background: 'linear-gradient(135deg, var(--text-main), #64748B)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Frequently Asked Questions
                  </span>
                </h2>
                <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                  Everything you need to know about partnering with us
                </p>
              </div>

              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {Array.isArray(content.faq_items) && content.faq_items.map((faq: any, index: number) => (
                  <details
                    key={faq.id}
                    className="glass-card faq-item"
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
                      color: 'var(--text-main)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      listStyle: 'none'
                    }}>
                      <span style={{ flex: 1, paddingRight: '1rem' }}>{faq.question}</span>
                      <i className="fas fa-chevron-down faq-icon" style={{
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
              <style jsx>{`
                details > summary {
                  list-style: none;
                }
                details > summary::-webkit-details-marker {
                  display: none;
                }
                details[open] .faq-icon {
                  transform: rotate(180deg);
                }
                details[open] {
                  background: rgba(255, 255, 255, 0.8);
                  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                
                @media (max-width: 768px) {
                  .faq-item {
                    margin-bottom: 0.75rem !important;
                  }
                  .faq-item summary {
                    padding: 1rem !important;
                    font-size: 0.95rem !important;
                  }
                  .faq-item div {
                    padding: 0 1rem 1rem 1rem !important;
                    font-size: 0.9rem !important;
                    line-height: 1.5 !important;
                  }
                }
              `}</style>
            </div>
          </section>
        )
      }

      {/* Become a Partner Teaser Section */}
      <section id="contact" className="section" style={{ background: 'white' }}>
        <div className="container">
          <div className="glass-card" style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: 'white',
            padding: 'clamp(3rem, 6vw, 5rem) 2rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background decoration */}
            <div style={{
              position: 'absolute',
              top: '-10%',
              left: '-10%',
              width: '300px',
              height: '300px',
              background: 'rgba(37, 99, 235, 0.2)',
              borderRadius: '50%',
              filter: 'blur(80px)'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '-10%',
              right: '-10%',
              width: '300px',
              height: '300px',
              background: 'rgba(236, 72, 153, 0.2)',
              borderRadius: '50%',
              filter: 'blur(80px)'
            }}></div>

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
              <h2 style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                fontWeight: '800',
                marginBottom: '1.5rem',
                background: 'linear-gradient(135deg, #fff, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Ready to Start Your Journey?
              </h2>
              <p style={{
                fontSize: '1.25rem',
                color: '#cbd5e1',
                marginBottom: '3rem',
                lineHeight: '1.6'
              }}>
                Join the fastest-growing hyper-local delivery network in Kerala.
                Empower your community, support local businesses, and build a profitable future.
              </p>

              <div className="grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '2rem',
                marginBottom: '3rem'
              }}>

              </div>

              <a href="/apply" className="btn btn-primary" style={{
                padding: '1rem 3rem',
                fontSize: '1.25rem',
                borderRadius: '50px',
                boxShadow: '0 10px 30px rgba(37, 99, 235, 0.4)',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'all 0.3s ease'
              }}>
                Apply Now
              </a>
            </div>
            <style jsx>{`
              @media (max-width: 768px) {
                #contact .glass-card {
                  padding: 2.5rem 1.5rem !important;
                  width: 100% !important;
                  box-sizing: border-box !important;
                }
                #contact h2 {
                  font-size: 2rem !important;
                  margin-bottom: 1rem !important;
                }
                #contact p {
                  font-size: 1rem !important;
                  margin-bottom: 2rem !important;
                }
                #contact .grid {
                  display: none !important; /* Hide features on mobile to save space */
                }
                #contact .btn {
                  padding: 0.875rem 2.5rem !important;
                  font-size: 1.125rem !important;
                  width: 100%;
                }
              }
            `}</style>
          </div>
        </div>
      </section>

    </main >
  );
}
