'use client';

import { useState } from 'react';
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
        setStep(2);
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
      {/* Header */}
      <header className="header">
        <div className="container nav">
          <Link href="/" className="logo">
            <img src="/logo.png" alt="The Kada Logo" style={{ height: '40px', width: 'auto' }} />
            <span style={{ marginLeft: '8px' }}>The Kada</span>
          </Link>
          <ul className="nav-links">
            <li><Link href="#home" className="nav-link">Overview</Link></li>
            <li><Link href="#about" className="nav-link">About</Link></li>
            <li><Link href="#benefits" className="nav-link">Benefits</Link></li>
            <li><Link href="#contact" className="nav-link">Contact</Link></li>
            <li><Link href="/admin" className="nav-link" style={{ color: 'var(--primary-color)' }}>Admin</Link></li>
          </ul>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <h1>Empowering Local Commerce, One Town at a Time</h1>
            <p>Join the revolution in hyper-local delivery. Connect local vendors with customers through our world-class technology platform. Start your profitable franchise journey today.</p>
            <div className="hero-btns">
              <Link href="#contact" className="btn btn-primary">Start Your Franchise</Link>
              <Link href="#about" className="btn btn-secondary">Learn More</Link>
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
      <section id="about" className="section">
        <div className="container">
          <div className="text-center" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 className="text-primary">Why The Kada?</h2>
            <p>We are building the digital backbone for small-town India. Our platform enables local kirana stores, restaurants, and pharmacies to compete with e-commerce giants by offering instant delivery and digital presence.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-mobile-alt"></i></div>
              <h4>Advanced Tech Stack</h4>
              <p>Get access to our state-of-the-art ordering app, delivery partner app, and vendor dashboard. No coding required.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-hand-holding-usd"></i></div>
              <h4>Low Investment</h4>
              <p>Start your business with minimal capital. Our franchise model is designed for high ROI and quick break-even.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-headset"></i></div>
              <h4>24/7 Support</h4>
              <p>We provide round-the-clock operational and technical support to ensure your business runs smoothly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section" style={{ background: 'var(--bg-surface)' }}>
        <div className="container">
          <div className="contact-form">
            <div className="text-center" style={{ marginBottom: '2rem' }}>
              <h2 className="text-primary">Become a Partner</h2>
              <p>Ready to transform your local market? Follow the steps below.</p>
            </div>

            {/* Step Indicators */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: step >= 1 ? 1 : 0.5 }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: step >= 1 ? 'var(--primary-color)' : '#ccc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
                <span style={{ fontSize: '0.9rem' }}>Details</span>
              </div>
              <div style={{ width: '30px', height: '2px', background: '#ccc', alignSelf: 'center' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: step >= 2 ? 1 : 0.5 }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: step >= 2 ? 'var(--primary-color)' : '#ccc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
                <span style={{ fontSize: '0.9rem' }}>KYC</span>
              </div>
              <div style={{ width: '30px', height: '2px', background: '#ccc', alignSelf: 'center' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: step >= 3 ? 1 : 0.5 }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: step >= 3 ? 'var(--primary-color)' : '#ccc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</div>
                <span style={{ fontSize: '0.9rem' }}>Pricing</span>
              </div>
              <div style={{ width: '30px', height: '2px', background: '#ccc', alignSelf: 'center' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: step >= 4 ? 1 : 0.5 }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: step >= 4 ? 'var(--primary-color)' : '#ccc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>4</div>
                <span style={{ fontSize: '0.9rem' }}>Agreement</span>
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
                    placeholder="John Doe"
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
                    placeholder="john@example.com"
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
                    placeholder="+91 98765 43210"
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
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={status === 'sending'}>
                  {status === 'sending' ? 'Processing...' : 'Next: Upload KYC'}
                </button>
                {status === 'error' && <p style={{ color: 'var(--accent-color)', marginTop: '1rem', textAlign: 'center' }}>Something went wrong. Please try again.</p>}
              </form>
            )}

            {step === 2 && (
              <div className="kyc-section">
                <h3 style={{ marginBottom: '1rem' }}>Upload KYC Document</h3>
                <p style={{ marginBottom: '1.5rem', color: '#666' }}>Please upload a clear copy of your Aadhar Card (PDF, JPG, PNG).</p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setKycFile(e.target.files ? e.target.files[0] : null)}
                  style={{ marginBottom: '1rem', width: '100%' }}
                />
                <button onClick={handleKycSubmit} className="btn btn-primary" style={{ width: '100%' }} disabled={status === 'sending' || !kycFile}>
                  {status === 'sending' ? 'Uploading...' : 'Next: Select Pricing Plan'}
                </button>
                {status === 'error' && <p style={{ color: 'var(--accent-color)', marginTop: '1rem', textAlign: 'center' }}>Upload failed. Please try again.</p>}
              </div>
            )}

            {step === 3 && (
              <div className="pricing-section">
                <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Choose Your Plan</h3>
                <p style={{ marginBottom: '2rem', color: '#666', textAlign: 'center' }}>Select the revenue sharing model that works best for you</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  {/* Free Plan */}
                  <div style={{
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    background: selectedPlan === 'free' ? '#f0f7ff' : '#fff',
                    borderColor: selectedPlan === 'free' ? 'var(--primary-color)' : '#e0e0e0'
                  }} onClick={() => setSelectedPlan('free')}>
                    <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>50-50 Split</h4>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>FREE</div>
                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>Equal revenue sharing</p>
                    <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', fontSize: '0.9rem' }}>
                      <li style={{ marginBottom: '0.5rem' }}>✓ 50% revenue share</li>
                      <li style={{ marginBottom: '0.5rem' }}>✓ Basic support</li>
                      <li style={{ marginBottom: '0.5rem' }}>✓ Standard features</li>
                    </ul>
                  </div>

                  {/* Basic Plan */}
                  <div style={{
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    background: selectedPlan === 'basic' ? '#f0f7ff' : '#fff',
                    borderColor: selectedPlan === 'basic' ? 'var(--primary-color)' : '#e0e0e0'
                  }} onClick={() => setSelectedPlan('basic')}>
                    <div style={{ background: '#ffa726', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block', fontSize: '0.75rem', marginBottom: '0.5rem' }}>POPULAR</div>
                    <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>60-40 Split</h4>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>₹5,000</div>
                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>One-time payment</p>
                    <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', fontSize: '0.9rem' }}>
                      <li style={{ marginBottom: '0.5rem' }}>✓ 60% revenue share</li>
                      <li style={{ marginBottom: '0.5rem' }}>✓ Priority support</li>
                      <li style={{ marginBottom: '0.5rem' }}>✓ Advanced features</li>
                    </ul>
                  </div>

                  {/* Premium Plan */}
                  <div style={{
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    background: selectedPlan === 'premium' ? '#f0f7ff' : '#fff',
                    borderColor: selectedPlan === 'premium' ? 'var(--primary-color)' : '#e0e0e0'
                  }} onClick={() => setSelectedPlan('premium')}>
                    <div style={{ background: '#4caf50', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block', fontSize: '0.75rem', marginBottom: '0.5rem' }}>BEST VALUE</div>
                    <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>70-30 Split</h4>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>₹10,000</div>
                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>One-time payment</p>
                    <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', fontSize: '0.9rem' }}>
                      <li style={{ marginBottom: '0.5rem' }}>✓ 70% revenue share</li>
                      <li style={{ marginBottom: '0.5rem' }}>✓ Dedicated support</li>
                      <li style={{ marginBottom: '0.5rem' }}>✓ Premium features</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => handlePricingSubmit(selectedPlan)}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={status === 'sending' || !selectedPlan}
                >
                  {status === 'sending' ? 'Processing...' : selectedPlan === 'free' ? 'Continue to Agreement' : 'Proceed to Payment'}
                </button>
                {status === 'error' && <p style={{ color: 'var(--accent-color)', marginTop: '1rem', textAlign: 'center' }}>Something went wrong. Please try again.</p>}
              </div>
            )}

            {step === 4 && (
              <div className="agreement-section">
                <h3 style={{ marginBottom: '1rem' }}>Franchise Agreement</h3>
                <div style={{
                  background: '#f9f9f9',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  border: '1px solid #eee',
                  height: '200px',
                  overflowY: 'scroll',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem',
                  lineHeight: '1.6'
                }}>
                  <p><strong>THE KADA FRANCHISE AGREEMENT</strong></p>
                  <p>This Agreement is made between The Kada Digital Ventures Pvt Ltd and the Franchise Partner.</p>
                  <p>1. <strong>Grant of Franchise:</strong> The Company grants the Franchisee the right to operate a The Kada delivery hub in the designated territory.</p>
                  <p>2. <strong>Term:</strong> This agreement shall be valid for a period of 5 years, renewable upon mutual consent.</p>
                  <p>3. <strong>Responsibilities:</strong> The Franchisee agrees to uphold the brand standards, ensure timely deliveries, and maintain customer satisfaction.</p>
                  <p>4. <strong>Support:</strong> The Company will provide technology, marketing, and operational support.</p>
                  <p>5. <strong>Fees:</strong> The Franchisee agrees to the revenue sharing model as defined in the separate commercial terms.</p>
                  <p>By clicking "Accept & Submit", you agree to the terms and conditions outlined above.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <input
                    type="checkbox"
                    id="accept-agreement"
                    checked={agreementAccepted}
                    onChange={(e) => setAgreementAccepted(e.target.checked)}
                    style={{ marginRight: '0.5rem', width: 'auto' }}
                  />
                  <label htmlFor="accept-agreement">I have read and agree to the Franchise Agreement.</label>
                </div>
                <button onClick={handleAgreementSubmit} className="btn btn-primary" style={{ width: '100%' }} disabled={status === 'sending' || !agreementAccepted}>
                  {status === 'sending' ? 'Finalizing...' : 'Accept & Submit Application'}
                </button>
                {status === 'error' && <p style={{ color: 'var(--accent-color)', marginTop: '1rem', textAlign: 'center' }}>Submission failed. Please try again.</p>}
              </div>
            )}

            {step === 5 && (
              <div className="success-message text-center">
                <div style={{ fontSize: '3rem', color: 'var(--success-color)', marginBottom: '1rem' }}><i className="fas fa-check-circle"></i></div>
                <h3>Application Submitted Successfully!</h3>
                <p>Thank you for partnering with The Kada. Our team will verify your documents and contact you shortly.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <Link href="#" className="logo" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <img src="/logo.png" alt="The Kada Logo" style={{ height: '32px', width: 'auto' }} />
                <span>The Kada</span>
              </Link>
            </div>
            <div className="footer-col">
              <h4>About</h4>
              <ul className="footer-links">
                <li><Link href="#about">Our Story</Link></li>
                <li><Link href="#benefits">Careers</Link></li>
                <li><Link href="#contact">Press</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <ul className="footer-links">
                <li><Link href="#">Help Center</Link></li>
                <li><Link href="#">Terms of Service</Link></li>
                <li><Link href="#">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 The Kada Digital Ventures Pvt Ltd.</p>
          </div>
        </div>
      </footer>

      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

      {/* FontAwesome CDN */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </main>
  );
}
