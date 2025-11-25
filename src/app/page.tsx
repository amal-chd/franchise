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
            <h1>Life. Simplified. One Platform Is All You Need.</h1>
            <p>Shop the Best. Sell with Ease. Only on The Kada. We connect customers to nearby grocery stores, restaurants, pharmacies, and more.</p>
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
      <section id="about" className="section">
        <div className="container">
          <div className="text-center" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 className="text-primary">Why The Kada?</h2>
            <p>We are building the digital backbone for small-town India. Our platform enables local kirana stores, restaurants, and pharmacies to compete with e-commerce giants by offering instant delivery and digital presence.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-store"></i></div>
              <h4>Trusted Local Shops</h4>
              <p>We bring your favorite local shops to your fingertips. Order from trusted vendors in your neighborhood.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-truck-fast"></i></div>
              <h4>Fast Delivery</h4>
              <p>Get your orders delivered to your doorstep quickly and affordably. We value your time.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fas fa-mobile-screen"></i></div>
              <h4>Seamless App</h4>
              <p>Enjoy a smooth shopping journey with our user-friendly app. One platform for all your needs.</p>
            </div>
          </div>
        </div>
      </section>

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
                    placeholder="e.g. +91 98765 43210"
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
