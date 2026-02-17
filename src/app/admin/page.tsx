'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem('isAdmin', 'true');
            router.push('/admin/dashboard');
        } else {
            setError(data.message || 'Invalid credentials');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px',
                padding: '48px 36px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
            }}>
                {/* Logo & Brand */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <Image
                        src="/logo.png"
                        alt="The Kada"
                        width={64}
                        height={64}
                        style={{ borderRadius: '16px', marginBottom: '16px' }}
                    />
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: '800',
                        color: '#ffffff',
                        margin: '0 0 4px 0',
                        letterSpacing: '-0.5px'
                    }}>
                        The Kada
                    </h1>
                    <p style={{
                        fontSize: '0.85rem',
                        color: 'rgba(148,163,184,0.8)',
                        margin: 0,
                        fontWeight: '500',
                        letterSpacing: '2px',
                        textTransform: 'uppercase'
                    }}>
                        Admin Portal
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: '#94A3B8',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#fff',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#4A90D9'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            placeholder="Enter username"
                        />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: '#94A3B8',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#fff',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#4A90D9'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            placeholder="Enter password"
                        />
                    </div>

                    {error && (
                        <p style={{
                            color: '#EF4444',
                            fontSize: '0.85rem',
                            marginBottom: '16px',
                            padding: '10px 14px',
                            background: 'rgba(239,68,68,0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(239,68,68,0.2)'
                        }}>
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #4A90D9 0%, #357ABD 100%)',
                            color: '#fff',
                            fontSize: '1rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 15px rgba(74,144,217,0.3)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(74,144,217,0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(74,144,217,0.3)';
                        }}
                    >
                        Sign In
                    </button>
                </form>

                <Link
                    href="/"
                    style={{
                        display: 'block',
                        textAlign: 'center',
                        marginTop: '24px',
                        color: '#64748B',
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        transition: 'color 0.2s'
                    }}
                >
                    ← Back to Website
                </Link>
            </div>
        </div>
    );
}
