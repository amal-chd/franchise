'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import LiveRegistrations from '@/components/LiveRegistrations';
import IndiaPresenceMap from '@/components/IndiaPresenceMap';

export default function Home() {
  const [content, setContent] = useState<Record<string, any>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/content');
      const data = await res.json();
      setContent(data);
    } catch (error) {
      console.error('Failed to fetch content', error);
    }
  };

  const features = [
    {
      icon: content.hero?.card1_icon || 'fa-chart-line',
      title: content.hero?.card1_title || 'High ROI',
      description: content.hero?.card1_description || 'Low investment with high returns. Break even in just 3-6 months.',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      icon: content.hero?.card2_icon || 'fa-mobile-alt',
      title: content.hero?.card2_title || 'Tech-First',
      description: content.hero?.card2_description || 'Advanced app for managing orders, delivery, and payments effortlessly.',
      bg: 'bg-green-50',
      text: 'text-green-600',
    },
    {
      icon: content.hero?.card3_icon || 'fa-users',
      title: content.hero?.card3_title || 'Full Support',
      description: content.hero?.card3_description || 'Marketing, training, and operational support to ensure your success.',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
  ];

  const stats = [
    { label: 'Active Franchises', value: content.stats?.active_franchises || '50+' },
    { label: 'Daily Orders', value: content.stats?.daily_orders || '10k+' },
    { label: 'Partner Vendors', value: content.stats?.partner_vendors || '500+' },
    { label: 'Partner Revenue', value: content.stats?.partner_revenue || '₹1Cr+' },
  ];

  const testimonials = Array.isArray(content.testimonials?.testimonials) && content.testimonials.testimonials.length > 0
    ? content.testimonials.testimonials
    : [
      { quote: 'The Kada has transformed my business. In 6 months, my revenue has doubled!', name: 'Rajesh Kumar', role: 'Franchise Partner, Kochi' },
      { quote: 'Amazing support from the team. They helped me set up everything from scratch.', name: 'Priya Menon', role: 'Franchise Partner, Thrissur' },
      { quote: 'The technology is incredible. Managing orders has never been this easy.', name: 'Anil Sharma', role: 'Franchise Partner, Calicut' },
    ];

  const faqItems = content.faq?.faqs || [
    { question: 'What is the investment required?', answer: 'The investment varies by city tier, starting from as low as ₹10,000. This covers onboarding, training, technology setup, and initial marketing.' },
    { question: 'How long does it take to break even?', answer: 'Most of our franchise partners break even within 3-6 months of going live, depending on the city and market conditions.' },
    { question: 'Do I need prior business experience?', answer: 'No prior experience required! We provide comprehensive training covering operations, tech, customer management, and marketing.' },
    { question: 'What ongoing support do you provide?', answer: 'We offer 24/7 tech support, dedicated relationship managers, regular training sessions, marketing campaigns, and business growth consulting.' },
    { question: 'Which cities are available?', answer: 'We are expanding rapidly across India. Check our availability page or contact us to see if your city is available for franchise.' },
  ];

  return (
    <main className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen overflow-x-hidden">
      <LiveRegistrations />

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-8 md:pt-32 md:pb-20 overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-200 rounded-full blur-[100px] md:blur-[150px] opacity-30 animate-pulse"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-200 rounded-full blur-[100px] md:blur-[150px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container relative z-10 px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <span className="inline-block px-3 py-1.5 md:px-4 md:py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 text-[10px] md:text-xs font-bold tracking-wider mb-6 shadow-sm uppercase">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2 animate-pulse"></span>
                Now expanding across India
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
                {content.hero?.title || <>Life. Simplified.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">The Kada Way.</span></>}
              </h1>
              <p className="text-base md:text-lg text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {content.hero?.subtitle || 'Join the hyper-local revolution. We connect customers to their favorite nearby stores, delivering happiness in minutes.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
                <Link href="/apply" className="px-6 py-3.5 md:px-8 md:py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xl shadow-slate-900/20 transition-all transform hover:-translate-y-1 text-base md:text-lg">
                  Start Your Franchise
                </Link>
                <Link href="/about" className="px-6 py-3.5 md:px-8 md:py-4 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-bold border border-slate-200 shadow-sm transition-all text-base md:text-lg">
                  Learn More
                </Link>
              </div>

              <div className="mt-8 md:mt-12 flex items-center justify-center lg:justify-start gap-4 text-xs md:text-sm text-slate-500 font-medium">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden relative">
                      <img
                        src={`/avatars/avatar${i}.png`}
                        alt={`Partner ${i}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${40 + i}.jpg`;
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p>Join 10,000+ local partners today.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative mt-12 lg:mt-0 block"
            >
              <img
                src={content.hero?.image || "/hero-image.png"}
                alt="App Interface"
                className="relative z-10 w-full max-w-lg mx-auto drop-shadow-2xl rounded-3xl transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500"
                onError={(e) => {
                  // Fallback if image fails
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x800/EEE/31343C?text=Mobile+App+UI';
                }}
              />

            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="bg-white py-8 md:py-12 border-y border-slate-100 shadow-sm relative z-20">
        <div className="container px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:divide-x md:divide-slate-100">
            {stats.map((stat, i) => (
              <div key={i} className="text-center group cursor-default px-2 md:px-4 md:first:pl-0 md:last:pr-0">
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-1 md:mb-2 text-slate-900 group-hover:text-blue-600 transition-colors">
                  {stat.value}
                </h3>
                <p className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why The Kada (Bento Grid) ── */}
      <section id="features" className="py-16 md:py-24 px-6 bg-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <span className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-2 block">Why Choose Us</span>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-4 md:mb-6">Built for the Next Billion Users.</h2>
            <p className="text-base md:text-lg text-slate-600">
              {content.about?.description || 'We are building the digital backbone for small-town India, empowering local economies with world-class technology.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className={`p-6 md:p-8 rounded-3xl border border-slate-100 shadow-lg hover:shadow-xl transition-all ${i === 1 ? 'md:col-span-2 bg-slate-900 text-white' : 'bg-white'}`}
              >
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-xl md:text-2xl mb-4 md:mb-6 ${i === 1 ? 'bg-white/10 text-white' : `${f.bg} ${f.text}`}`}>
                  <i className={`fas ${f.icon}`}></i>
                </div>
                <h3 className={`text-xl md:text-2xl font-bold mb-3 md:mb-4 ${i === 1 ? 'text-white' : 'text-slate-900'}`}>{f.title}</h3>
                <p className={`text-sm md:text-base leading-relaxed ${i === 1 ? 'text-slate-300' : 'text-slate-600'}`}>
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Locations Map ── */}
      <section className="py-16 md:py-24 px-6 bg-slate-50 relative overflow-hidden">
        <div className="container max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-12 items-center">

            {/* Visual: Mobile-First Status Board */}
            <div className="w-full order-1 hidden md:block">
              <div className="bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-slate-800">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

                {/* Header */}
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-white font-bold tracking-wider uppercase text-sm">Live Network</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-bold text-white/80">
                    India
                  </div>
                </div>

                {/* Big Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-3xl font-extrabold text-white mb-1">50+</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Cities</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-3xl font-extrabold text-white mb-1">12+</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">States</p>
                  </div>
                </div>

                {/* Horizontal Scroll Cities */}
                <div className="mb-8 -mx-6 px-6 relative z-10">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Top Performing Hubs</p>
                  <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                    {['Delhi NCR', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kochi'].map((city, i) => (
                      <div key={i} className="flex-shrink-0 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 flex items-center gap-3 min-w-[140px]">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                          <i className="fas fa-map-marker-alt text-xs"></i>
                        </div>
                        <span className="text-white font-bold text-sm">{city}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Ticker */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <i className="fas fa-clock text-blue-400 animate-pulse text-xs"></i>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Launching Soon</p>
                  </div>
                  <div className="overflow-hidden relative">
                    <div className="whitespace-nowrap animate-marquee text-white/80 text-sm font-medium">
                      Lucknow • Chandigarh • Indore • Surat • Nagpur • Patna • Bhopal • Vadodara • Ludhiana • Nashik • Vizag •
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Text Content */}
            <div className="order-2">
              <span className="text-purple-600 font-bold tracking-wider uppercase text-xs md:text-sm mb-2 block">Our Presence</span>
              <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-4 md:mb-6">Dominating the Indian Market.</h2>
              <p className="text-base md:text-lg text-slate-600 mb-6 md:mb-8 leading-relaxed">
                From <strong>Metros</strong> to <strong>Tier-2 Cities</strong>, we are rapidly expanding our footprint. Our franchise model ensures that every town we enter becomes a success story.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <i className="fas fa-city"></i>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm md:text-base">Hyper-Local Focus</p>
                    <p className="text-xs md:text-sm text-slate-500">Deep penetration in every pincode.</p>
                  </div>
                </li>
                <li className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                    <i className="fas fa-globe-asia"></i>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm md:text-base">Pan-India Network</p>
                    <p className="text-xs md:text-sm text-slate-500">Unified logistics and tech infrastructure.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-4">{content.testimonials?.title || 'Partners in Success'}</h2>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">{content.testimonials?.subtitle || "Don't just take our word for it. Hear from the people who are building their wealth with The Kada."}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((t: any, i: number) => (
              <div key={i} className="bg-slate-50 p-6 md:p-8 rounded-3xl relative">
                <i className="fas fa-quote-left text-3xl md:text-4xl text-blue-200 absolute top-6 left-6 md:top-8 md:left-8"></i>
                <p className="text-base md:text-lg text-slate-700 leading-relaxed mb-6 md:mb-8 relative z-10 pt-4 md:pt-6">"{t.quote || t.content || t.message}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm md:text-base">
                    {t.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm md:text-base">{t.name}</p>
                    <p className="text-xs md:text-sm text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-24 px-6 bg-slate-50">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqItems.map((faq: any, i: number) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left"
                >
                  <span className="font-bold text-slate-800 text-base md:text-lg pr-4">{faq.question}</span>
                  <i className={`fas fa-chevron-down text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}></i>
                </button>
                <div className={`transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="px-5 pb-5 md:px-6 md:pb-6 text-slate-600 leading-relaxed text-sm md:text-base">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-16 md:py-24 px-6 relative overflow-hidden bg-slate-900 text-white text-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 w-full h-full max-w-[800px] bg-blue-600 rounded-full blur-[100px] md:blur-[150px] opacity-20 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        </div>
        <div className="container max-w-4xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-extrabold mb-6 md:mb-8 tracking-tight !text-white relative z-20">
            {content.teaser?.title || 'Ready to Join the Revolution?'}
          </h2>
          <p className="text-lg md:text-xl !text-white/90 mb-8 md:mb-12 max-w-2xl mx-auto relative z-20">
            {content.teaser?.description || 'Join the fastest growing hyper-local network in India. Limited franchise slots available in select cities.'}
          </p>
          <Link href="/apply" className="inline-flex items-center gap-3 px-8 py-4 md:px-10 md:py-5 bg-white text-slate-900 rounded-2xl font-bold text-lg md:text-xl hover:bg-blue-50 transition-all transform hover:-translate-y-1 shadow-2xl">
            Apply Now <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </section>
    </main>
  );
}
