'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ConditionalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname();
    const isApplyPage = pathname?.startsWith('/apply');

    const isAdminPage = pathname?.startsWith('/admin');

    return (
        <>
            {!isAdminPage && <Header />}
            {children}
            {!isApplyPage && !isAdminPage && <Footer />}
        </>
    );
}
