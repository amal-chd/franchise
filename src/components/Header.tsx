'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    const navLinks = [
        { href: '/#home', label: 'Overview' },
        { href: '/about', label: 'About' },
        { href: '/benefits', label: 'Benefits' },
        { href: '/support', label: 'Support' },
        { href: '/careers', label: 'Careers' },
        { href: '/training', label: 'Training' },
    ];

    return (
        <header className="site-header">
            <div className="container header-container">
                <Link href="/" className="logo">
                    <img src="/logo.png" alt="The Kada Logo" />
                    <span>The Kada</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="desktop-nav">
                    {navLinks.map((link) => (
                        <Link key={link.href} href={link.href} className="nav-link">{link.label}</Link>
                    ))}
                    <Link href="/apply" className="nav-cta">
                        Apply Now
                    </Link>
                </nav>

                {/* Mobile Menu Toggle */}
                <button
                    className="mobile-toggle"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-content">
                    {navLinks.map((link) => (
                        <Link key={link.href} href={link.href} className="mobile-nav-link">{link.label}</Link>
                    ))}
                    <Link href="/apply" className="btn btn-primary" style={{ marginTop: '16px', maxWidth: '280px', width: '100%' }}>
                        Apply Now
                    </Link>
                </div>
            </div>
        </header>
    );
}
