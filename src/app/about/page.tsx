'use client';

import Link from 'next/link';

export default function AboutPage() {
    const values = [
        { icon: 'fa-bullseye', title: 'Our Mission', desc: 'To simplify daily life for millions in small towns by connecting them to the best local vendors through technology.' },
        { icon: 'fa-eye', title: 'Our Vision', desc: 'To become India\'s largest hyper-local commerce platform, empowering every town with the convenience of instant delivery.' },
        { icon: 'fa-heart', title: 'Our Values', desc: 'Community first. We believe in building sustainable ecosystems where local buyers, sellers, and delivery partners all thrive together.' },
    ];

    const stats = [
        { label: 'Towns Active', value: '50+' },
        { label: 'Local Vendors', value: '10,000+' },
        { label: 'Daily Deliveries', value: '25,000+' },
        { label: 'Happy Customers', value: '1M+' },
    ];

    return (
        <main className="min-h-screen bg-white">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-40"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[120px] opacity-40"></div>
            </div>

            <div className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto">
                {/* Hero Section */}
                <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in-up">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-bold tracking-wide mb-6 uppercase">
                        Our Story
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                        Empowering <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Bharat</span>, One Town at a Time.
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                        We are building the digital infrastructure for small-town India, connecting local communities through hyper-local commerce.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24 animate-fade-in-up delay-100">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white/80 backdrop-blur-md border border-slate-100 p-6 rounded-2xl shadow-sm text-center hover:shadow-md transition-shadow">
                            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">{stat.value}</h3>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Story Section */}
                <div className="grid md:grid-cols-2 gap-12 items-center mb-24 animate-fade-in-up delay-200">
                    <div className="order-2 md:order-1 relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl transform rotate-3 opacity-20 blur-lg"></div>
                        <div className="relative bg-slate-900 rounded-3xl p-8 md:p-12 text-white overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                            <i className="fas fa-quote-left text-4xl text-blue-400 mb-6 opacity-50"></i>
                            <p className="text-xl md:text-2xl font-medium italic leading-relaxed mb-6">
                                "The Kada was born from a simple observation: while big cities enjoyed the convenience of instant delivery, smaller towns were often left behind."
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                                    <i className="fas fa-user-edit"></i>
                                </div>
                                <div>
                                    <p className="font-bold">The Founders</p>
                                    <p className="text-sm text-white/60">The Kada Team</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 md:order-2 space-y-6">
                        <h2 className="text-3xl font-bold text-slate-900">From a Simple Idea to a Movement</h2>
                        <div className="prose prose-lg text-slate-600 space-y-4">
                            <p>
                                We noticed a gap. While metropolitan areas were flooded with quick-commerce apps, millions of people in Tier-2 and Tier-3 cities still relied on traditional, often inefficient, ways of shopping.
                            </p>
                            <p>
                                We set out to change that. Not by replacing local vendors, but by <strong>empowering them</strong>. We built a platform that gives the neighborhood Kirana store the same digital power as a warehouse giant.
                            </p>
                            <p>
                                Starting from a single pilot town, we have now expanded to over 50 locations, processing thousands of orders daily and proving that the convenience of modern commerce belongs to everyone.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mission & Values */}
                <div className="mb-24 animate-fade-in-up delay-300">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">What Drives Us</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">Core principles that guide every decision we make.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {values.map((v, i) => (
                            <div key={i} className="group bg-white border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                                    <i className={`fas ${v.icon} text-9xl text-slate-900`}></i>
                                </div>
                                <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                    <i className={`fas ${v.icon}`}></i>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{v.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white text-center py-20 px-6 shadow-2xl animate-fade-in-up delay-300">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[100px] opacity-20 transform translate-x-1/3 -translate-y-1/3"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600 rounded-full blur-[100px] opacity-20 transform -translate-x-1/3 translate-y-1/3"></div>
                    </div>
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Ready to Join the Revolution?</h2>
                        <p className="text-lg text-slate-300 mb-10">
                            Whether you're a vendor looking to grow or an entrepreneur ready to franchise, there's a place for you at The Kada.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/apply" className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-1">
                                Apply for Franchise
                            </Link>
                            <Link href="/careers" className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold text-lg border border-white/10 transition-all">
                                View Careers
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
