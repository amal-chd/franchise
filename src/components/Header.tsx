'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // Close menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileMenuOpen]);

    return (
        <header className="site-header">
            <div className="container header-container">
                <Link href="/" className="logo">
                    <img src="/logo.png" alt="The Kada Logo" />
                    <span>The Kada</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="desktop-nav">
                    <Link href="/#home" className="nav-link">Overview</Link>
                    <Link href="/about" className="nav-link">About</Link>
                    <Link href="/#benefits" className="nav-link">Benefits</Link>
                    <Link href="/support" className="nav-link">Support</Link>
                    <Link href="/careers" className="nav-link">Careers</Link>
                    {/*<Link href="/admin" className="nav-link text-primary">Admin</Link> */}
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
                    <Link href="/#home" className="mobile-nav-link">Overview</Link>
                    <Link href="/about" className="mobile-nav-link">About</Link>
                    <Link href="/#benefits" className="mobile-nav-link">Benefits</Link>
                    <Link href="/support" className="mobile-nav-link">Support</Link>
                    <Link href="/admin" className="mobile-nav-link text-primary">Admin Panel</Link>
                </div>
            </div>
        </header>
    );
}
