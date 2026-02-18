'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';

function ApplyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

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
    const [content, setContent] = useState<Record<string, string>>({});
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            setRequestId(id);
            setStep(2);
        }
        fetchContent();
    }, [searchParams]);

    const fetchContent = async () => {
        try {
            const res = await fetch('/api/content');
            const data = await res.json();
            setContent(data);
        } catch (error) {
            console.error('Failed to fetch content', error);
        }
    };

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
                setErrorMessage('');
                setStep(2);
                router.push(`/apply?id=${data.requestId}`, { scroll: false });
            } else {
                setStatus('error');
                setErrorMessage(data.message || 'Failed to submit application.');
            }
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'An unexpected error occurred.');
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
                setErrorMessage('');
                setStep(3);
            } else {
                const data = await res.json();
                setStatus('error');
                setErrorMessage(data.message || 'Failed to upload document.');
            }
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Upload failed.');
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
                const options = {
                    key: data.keyId,
                    amount: data.amount,
                    currency: data.currency,
                    name: 'The Kada Franchise',
                    description: `${plan === 'basic' ? 'Standard' : plan === 'premium' ? 'Premium' : 'Elite'} Revenue Share Plan`,
                    order_id: data.orderId,
                    handler: async function (response: any) {
                        console.log('Razorpay Payment Success Callback:', response);
                        console.log('Verifying payment with requestId:', requestId);

                        try {
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

                            const verifyData = await verifyRes.json();
                            console.log('Verification API Response:', verifyData);

                            if (verifyRes.ok) {
                                console.log('Payment verified successfully. Moving to next step.');
                                setStatus('');
                                setErrorMessage('');
                                setStep(4);
                            } else {
                                console.error('Payment verification failed:', verifyData);
                                setStatus('error');
                                setErrorMessage(verifyData.message || 'Payment verification failed.');
                            }
                        } catch (err: any) {
                            console.error('Error during payment verification:', err);
                            setStatus('error');
                            setErrorMessage(err.message || 'Error verifying payment.');
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

                if (!(window as any).Razorpay) {
                    console.error('Razorpay SDK not loaded');
                    setStatus('error');
                    setErrorMessage('Razorpay SDK failed to load. Please refresh.');
                    return;
                }

                const rzp = new (window as any).Razorpay(options);
                rzp.open();
                setStatus('');
                setErrorMessage('');
            } else {
                const data = await res.json();
                console.error('Order creation failed:', data);
                setStatus('error');
                setErrorMessage(data.message || 'Failed to initialize payment.');
            }
        } catch (error: any) {
            console.error('Payment initialization error:', error);
            setStatus('error');
            setErrorMessage(error.message || 'Payment service unavailable.');
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
                setErrorMessage('');
                setStep(5);
            } else {
                const data = await res.json();
                setStatus('error');
                setErrorMessage(data.message || 'Failed to complete signing.');
            }
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Signing failed.');
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
            <div className="text-center" style={{ marginBottom: '3rem' }}>
                <h1 className="text-primary" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Partner Application</h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Complete the steps below to start your journey with The Kada.</p>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
                {/* Step Wizard */}
                <div className="step-wizard" style={{ marginBottom: '3rem' }}>
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

                {/* Step 1: Details */}
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

                        {/* Payment & Withdrawal Details */}
                        <div style={{ marginTop: '2rem', marginBottom: '1rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                            <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Payout Details (Optional but Recommended)</h4>
                            <div className="form-group">
                                <label className="form-label">UPI ID</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. yourname@upi"
                                    value={(formData as any).upi_id || ''}
                                    onChange={(e) => setFormData({ ...formData, upi_id: e.target.value } as any)}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Bank Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. SBI"
                                        value={(formData as any).bank_name || ''}
                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value } as any)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">IFSC Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. SBIN0001234"
                                        value={(formData as any).ifsc_code || ''}
                                        onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value } as any)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Account Number</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter account number"
                                    value={(formData as any).bank_account_number || ''}
                                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value } as any)}
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} disabled={status === 'sending'}>
                            {status === 'sending' ? 'Processing...' : 'Next: Upload KYC'} <i className="fas fa-arrow-right"></i>
                        </button>
                        {status === 'error' && (
                            <div className="error-box" style={{ color: '#ef4444', background: '#fee2e2', padding: '1rem', borderRadius: '0.75rem', marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                                <i className="fas fa-exclamation-circle" style={{ marginRight: '0.5rem' }}></i>
                                {errorMessage || 'Something went wrong. Please try again.'}
                            </div>
                        )}
                    </form>
                )}

                {/* Step 2: KYC */}
                {step === 2 && (
                    <div className="text-center">
                        <h3 style={{ marginBottom: '1.5rem' }}>Upload KYC Document</h3>
                        <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>Please upload your Aadhar Card or PAN Card (PDF/Image)</p>

                        <div style={{
                            border: '2px dashed var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '3rem',
                            marginBottom: '2rem',
                            background: 'var(--bg-secondary)'
                        }}>
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setKycFile(e.target.files?.[0] || null)}
                                style={{ display: 'none' }}
                                id="kyc-upload"
                            />
                            <label htmlFor="kyc-upload" style={{ cursor: 'pointer', display: 'block' }}>
                                <i className="fas fa-cloud-upload-alt" style={{ fontSize: '3rem', color: 'var(--primary-color)', marginBottom: '1rem' }}></i>
                                <p style={{ fontWeight: '600' }}>{kycFile ? kycFile.name : 'Click to Upload Document'}</p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Max size: 5MB</p>
                            </label>
                        </div>

                        <button
                            onClick={handleKycSubmit}
                            className="btn btn-primary"
                            disabled={!kycFile || status === 'sending'}
                            style={{ width: '100%' }}
                        >
                            {status === 'sending' ? 'Uploading...' : 'Next: Select Plan'} <i className="fas fa-arrow-right"></i>
                        </button>
                        {status === 'error' && (
                            <div className="error-box" style={{ color: '#ef4444', background: '#fee2e2', padding: '1rem', borderRadius: '0.75rem', marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                                <i className="fas fa-exclamation-circle" style={{ marginRight: '0.5rem' }}></i>
                                {errorMessage || 'Upload failed. Please try again.'}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Pricing */}
                {step === 3 && (
                    <div className="animate-fade-in">
                        <div className="text-center mb-6">
                            <h3 style={{ marginBottom: '0.5rem' }}>Choose Your Plan</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                Select the partnership tier that suits your goals.
                            </p>
                        </div>

                        <div className="pricing-grid">
                            {/* Basic Plan */}
                            <div
                                className={`pricing-card basic ${selectedPlan === 'basic' ? 'selected' : ''}`}
                                onClick={() => setSelectedPlan('basic')}
                            >
                                <div className="pricing-header">
                                    <h4>Standard Partner</h4>
                                    <div className="pricing-amount">₹{content.pricing_basic_price || '499'}<span>/year</span></div>
                                </div>
                                <ul className="pricing-features">
                                    <li><i className="fas fa-check"></i> {content.pricing_basic_share || '60'}% Revenue Share</li>
                                    <li><i className="fas fa-check"></i> Standard Support</li>
                                    <li><i className="fas fa-check"></i> Basic Marketing Kit</li>
                                    <li><i className="fas fa-check"></i> App Access</li>
                                    <li className="unavailable"><i className="fas fa-times"></i> Advanced Analytics</li>
                                </ul>
                                <button
                                    className="pricing-btn"
                                    onClick={(e) => { e.stopPropagation(); handlePricingSubmit('basic'); }}
                                    disabled={status === 'sending'}
                                >
                                    Select Standard
                                </button>
                            </div>

                            {/* Premium Plan */}
                            <div
                                className={`pricing-card premium ${selectedPlan === 'premium' ? 'selected' : ''}`}
                                onClick={() => setSelectedPlan('premium')}
                            >
                                <div className="popular-badge">Most Popular</div>
                                <div className="pricing-header">
                                    <h4>Premium Partner</h4>
                                    <div className="pricing-amount">₹{content.pricing_premium_price || '999'}<span>/year</span></div>
                                </div>
                                <ul className="pricing-features">
                                    <li><i className="fas fa-check"></i> {content.pricing_premium_share || '70'}% Revenue Share</li>
                                    <li><i className="fas fa-check"></i> Priority Support</li>
                                    <li><i className="fas fa-check"></i> Premium Marketing Kit</li>
                                    <li><i className="fas fa-check"></i> Advanced Analytics</li>
                                    <li><i className="fas fa-check"></i> Dedicated Manager</li>
                                </ul>
                                <button
                                    className="pricing-btn"
                                    onClick={(e) => { e.stopPropagation(); handlePricingSubmit('premium'); }}
                                    disabled={status === 'sending'}
                                >
                                    Select Premium
                                </button>
                            </div>

                            {/* Elite Plan */}
                            <div
                                className={`pricing-card elite ${selectedPlan === 'elite' ? 'selected' : ''}`}
                                onClick={() => setSelectedPlan('elite')}
                            >
                                <div className="elite-badge">Exclusive</div>
                                <div className="pricing-header">
                                    <h4>Elite Partner</h4>
                                    <div className="pricing-amount">₹{content.pricing_elite_price || '2499'}<span>/year</span></div>
                                </div>
                                <ul className="pricing-features">
                                    <li><i className="fas fa-check"></i> {content.pricing_elite_share || '80'}% Revenue Share</li>
                                    <li><i className="fas fa-check"></i> 24x7 Dedicated Support</li>
                                    <li><i className="fas fa-check"></i> Exclusive Marketing Kit</li>
                                    <li><i className="fas fa-check"></i> Deep Analytics + Insights</li>
                                    <li><i className="fas fa-check"></i> Zero Onboarding Fee</li>
                                </ul>
                                <button
                                    className="pricing-btn"
                                    onClick={(e) => { e.stopPropagation(); handlePricingSubmit('elite'); }}
                                    disabled={status === 'sending'}
                                >
                                    Select Elite
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Agreement */}
                {step === 4 && (
                    <div>
                        <h3 className="text-center" style={{ marginBottom: '1.5rem' }}>Sign Agreement</h3>
                        <div className="agreement-box" style={{
                            height: 'auto',
                            maxHeight: '45vh',
                            minHeight: '200px',
                            overflowY: 'scroll',
                            border: '1px solid var(--border-color)',
                            padding: '1.5rem',
                            borderRadius: 'var(--radius-md)',
                            background: '#f9fafb',
                            marginBottom: '1rem',
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap',
                            WebkitOverflowScrolling: 'touch' // Enable momentum scrolling on iOS
                        }}>
                            {content.agreement_url ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-4">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
                                        <i className="fas fa-file-contract text-3xl"></i>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800">Review Franchise Agreement</h4>
                                    <p className="text-slate-500 text-center max-w-md mb-4">
                                        Please download and review the Franchise Partner Agreement below before proceeding.
                                    </p>

                                    <a
                                        href={content.agreement_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 flex items-center gap-2 px-6 py-3 rounded-xl shadow-sm transition-all"
                                        download
                                    >
                                        <i className="fas fa-file-download text-blue-500"></i> Download Agreement PDF
                                    </a>
                                </div>
                            ) : (
                                content.agreement_text ? (
                                    <div dangerouslySetInnerHTML={{ __html: content.agreement_text }} />
                                ) : (
                                    <>
                                        <h4 style={{ marginBottom: '1rem' }}>FRANCHISE PARTNER AGREEMENT</h4>
                                        <p>This Agreement is made between The Kada Franchise ("Company") and the Applicant ("Partner").</p>
                                        <p><strong>1. Term:</strong> This agreement is valid for a period of 12 months from the date of signing.</p>
                                        <p><strong>2. Revenue Share:</strong> The Partner is entitled to the revenue share as per the selected plan of the net profit from their designated zone.</p>
                                        <p><strong>3. Responsibilities:</strong> The Partner agrees to manage local deliveries, onboard vendors, and maintain service quality standards set by the Company.</p>
                                        <p><strong>4. Termination:</strong> Either party may terminate this agreement with 30 days written notice.</p>
                                        <p><strong>5. Confidentiality:</strong> The Partner agrees to keep all business data and customer information confidential.</p>
                                    </>
                                )
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <input
                                type="checkbox"
                                id="agreement"
                                checked={agreementAccepted}
                                onChange={(e) => setAgreementAccepted(e.target.checked)}
                                style={{ width: '20px', height: '20px' }}
                            />
                            <label htmlFor="agreement" style={{ cursor: 'pointer' }}>I have read and agree to the Franchise Partner Agreement</label>
                        </div>

                        <button
                            onClick={handleAgreementSubmit}
                            className="btn btn-primary"
                            disabled={!agreementAccepted || status === 'sending'}
                            style={{ width: '100%' }}
                        >
                            {status === 'sending' ? 'Signing...' : 'Digitally Sign & Complete'}
                        </button>
                        {status === 'error' && (
                            <div className="error-box" style={{ color: '#ef4444', background: '#fee2e2', padding: '1rem', borderRadius: '0.75rem', marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                                <i className="fas fa-exclamation-circle" style={{ marginRight: '0.5rem' }}></i>
                                {errorMessage || 'Failed to sign agreement.'}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 5: Success */}
                {step === 5 && (
                    <div className="text-center" style={{ padding: '2rem 0' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: '#10B981',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            color: 'white',
                            fontSize: '2.5rem'
                        }}>
                            <i className="fas fa-check"></i>
                        </div>
                        <h2 style={{ marginBottom: '1rem' }}>Welcome to The Kada Family!</h2>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            Your application has been successfully submitted and your agreement is signed.
                            Our team will verify your documents and activate your partner account within 24-48 hours.
                        </p>
                        <Link href="/" className="btn btn-primary">
                            Return to Home
                        </Link>
                    </div>
                )}
            </div>
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="lazyOnload"
                onLoad={() => {
                    (window as any).isRazorpayLoaded = true;
                }}
            />
        </div >
    );
}

export default function ApplyPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ApplyContent />
        </Suspense>
    );
}
