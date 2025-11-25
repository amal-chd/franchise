'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';

function ApplyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const requestId = searchParams.get('id');

    const [status, setStatus] = useState('');
    const [step, setStep] = useState(2); // Start from step 2
    const [kycFile, setKycFile] = useState<File | null>(null);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [agreementAccepted, setAgreementAccepted] = useState(false);

    useEffect(() => {
        if (!requestId) {
            router.push('/');
        }
    }, [requestId, router]);

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

    if (!requestId) return null;

    return (
        <main className="apply-page-container">
            <section className="apply-section">
                <div className="apply-content">
                    <div className="apply-form-wrapper">

                        {/* Step Indicators */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.5 }}>
                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#ccc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
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

                        {step === 2 && (
                            <div className="kyc-section">
                                <h3 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Upload KYC Document</h3>
                                <p style={{ marginBottom: '2rem', color: '#64748B', textAlign: 'center', fontSize: '0.95rem' }}>
                                    Upload a clear copy of your Aadhar Card, PAN Card, or Passport
                                </p>

                                <div
                                    className="file-upload-container"
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.add('drag-over');
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('drag-over');
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('drag-over');
                                        const files = e.dataTransfer.files;
                                        if (files && files[0]) {
                                            setKycFile(files[0]);
                                        }
                                    }}
                                    onClick={() => document.getElementById('kyc-file-input')?.click()}
                                >
                                    <input
                                        id="kyc-file-input"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => setKycFile(e.target.files ? e.target.files[0] : null)}
                                        style={{ display: 'none' }}
                                    />

                                    {!kycFile ? (
                                        <div className="upload-placeholder">
                                            <div className="upload-icon">
                                                <i className="fas fa-cloud-upload-alt"></i>
                                            </div>
                                            <h4>Drag & Drop your document here</h4>
                                            <p>or click to browse</p>
                                            <div className="file-types">
                                                <span className="file-type-badge">PDF</span>
                                                <span className="file-type-badge">JPG</span>
                                                <span className="file-type-badge">PNG</span>
                                            </div>
                                            <p className="file-size-hint">Maximum file size: 5MB</p>
                                        </div>
                                    ) : (
                                        <div className="file-preview">
                                            <div className="file-preview-icon">
                                                <i className={`fas ${kycFile.type.includes('pdf') ? 'fa-file-pdf' : 'fa-file-image'}`}></i>
                                            </div>
                                            <div className="file-info">
                                                <h4>{kycFile.name}</h4>
                                                <p>{(kycFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <button
                                                className="file-remove-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setKycFile(null);
                                                }}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="kyc-info-cards">
                                    <div className="info-card">
                                        <i className="fas fa-shield-alt"></i>
                                        <span>Secure & Encrypted</span>
                                    </div>
                                    <div className="info-card">
                                        <i className="fas fa-check-circle"></i>
                                        <span>Verified Instantly</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleKycSubmit}
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: '1.5rem' }}
                                    disabled={status === 'sending' || !kycFile}
                                >
                                    {status === 'sending' ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            Next: Select Pricing Plan
                                            <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
                                        </>
                                    )}
                                </button>
                                {status === 'error' && <p className="error-message" style={{ marginTop: '1rem' }}>Upload failed. Please try again.</p>}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="pricing-section">
                                <h3 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Choose Your Plan</h3>
                                <p style={{ marginBottom: '1.5rem', color: '#64748B', textAlign: 'center', fontSize: '0.9rem' }}>
                                    Select the revenue sharing model that works best for you
                                </p>

                                <div className="pricing-grid">
                                    {/* Free Plan */}
                                    <div
                                        className={`pricing-card ${selectedPlan === 'free' ? 'selected' : ''}`}
                                        onClick={() => setSelectedPlan('free')}
                                    >
                                        <div className="pricing-header">
                                            <h4>50-50 Split</h4>
                                            <div className="pricing-amount">FREE</div>
                                        </div>
                                        <ul className="pricing-features">
                                            <li><i className="fas fa-check"></i> 50% revenue share</li>
                                            <li><i className="fas fa-check"></i> Basic support</li>
                                            <li><i className="fas fa-check"></i> Standard features</li>
                                        </ul>
                                    </div>

                                    {/* Basic Plan */}
                                    <div
                                        className={`pricing-card popular ${selectedPlan === 'basic' ? 'selected' : ''}`}
                                        onClick={() => setSelectedPlan('basic')}
                                    >
                                        <div className="popular-badge">POPULAR</div>
                                        <div className="pricing-header">
                                            <h4>60-40 Split</h4>
                                            <div className="pricing-amount">₹5,000</div>
                                            <div className="pricing-period">One-time</div>
                                        </div>
                                        <ul className="pricing-features">
                                            <li><i className="fas fa-check"></i> 60% revenue share</li>
                                            <li><i className="fas fa-check"></i> Priority support</li>
                                            <li><i className="fas fa-check"></i> Advanced features</li>
                                        </ul>
                                    </div>

                                    {/* Premium Plan */}
                                    <div
                                        className={`pricing-card premium ${selectedPlan === 'premium' ? 'selected' : ''}`}
                                        onClick={() => setSelectedPlan('premium')}
                                    >
                                        <div className="premium-badge">BEST VALUE</div>
                                        <div className="pricing-header">
                                            <h4>70-30 Split</h4>
                                            <div className="pricing-amount">₹10,000</div>
                                            <div className="pricing-period">One-time</div>
                                        </div>
                                        <ul className="pricing-features">
                                            <li><i className="fas fa-check"></i> 70% revenue share</li>
                                            <li><i className="fas fa-check"></i> Dedicated support</li>
                                            <li><i className="fas fa-check"></i> Premium features</li>
                                        </ul>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handlePricingSubmit(selectedPlan)}
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: '1.5rem' }}
                                    disabled={status === 'sending' || !selectedPlan}
                                >
                                    {status === 'sending' ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            {selectedPlan === 'free' ? 'Continue to Agreement' : 'Proceed to Payment'}
                                            <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
                                        </>
                                    )}
                                </button>
                                {status === 'error' && <p className="error-message" style={{ marginTop: '1rem' }}>Something went wrong. Please try again.</p>}
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
                                <Link href="/" className="btn btn-primary" style={{ marginTop: '2rem', display: 'inline-flex' }}>Return to Home</Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Razorpay Script */}
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        </main>
    );
}

export default function ApplyPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ApplyContent />
        </Suspense>
    );
}
