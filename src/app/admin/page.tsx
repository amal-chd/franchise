'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
            // In a real app, we'd set a cookie/token here.
            // For this demo, we'll just redirect and use local storage or similar if needed, 
            // but simpler to just redirect to the dashboard which will fetch data.
            // Ideally, the dashboard API would check the cookie.
            // For this "hardcoded" requirement, we'll simulate auth by just redirecting.
            localStorage.setItem('isAdmin', 'true');
            router.push('/admin/dashboard');
        } else {
            setError(data.message || 'Invalid credentials');
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <h2 className="admin-login-title">Admin Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="btn btn-primary">Login</button>
                </form>
                <Link href="/" className="btn btn-secondary" style={{ marginTop: '16px' }}>
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
