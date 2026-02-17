'use client';

export default function AboutPage() {
    const values = [
        { icon: 'fa-bullseye', title: 'Our Mission', desc: 'To simplify daily life for millions in small towns by connecting them to the best local vendors through technology.' },
        { icon: 'fa-eye', title: 'Our Vision', desc: 'To become India\'s largest hyper-local commerce platform, empowering every town with the convenience of instant delivery.' },
        { icon: 'fa-heart', title: 'Our Values', desc: 'Community first. We believe in building sustainable ecosystems where local buyers, sellers, and delivery partners all thrive together.' },
    ];

    return (
        <main className="section" style={{ paddingTop: '100px', minHeight: '80vh' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <h1 style={{ marginBottom: '12px' }}>Our Story</h1>
                <p style={{ marginBottom: '2rem', maxWidth: '600px' }}>
                    How a simple idea for small-town India turned into a movement.
                </p>

                <div style={{ lineHeight: '1.8', marginBottom: '3rem' }}>
                    <p>
                        The Kada was born from a simple observation: while big cities enjoyed the convenience of instant delivery, smaller towns were often left behind. We set out to bridge this gap by building a hyper-local delivery platform tailored for Bharat.
                    </p>
                    <p>
                        Starting from a single town, we have now expanded to over 50 locations, empowering thousands of local vendors to compete with e-commerce giants. Our mission is to simplify life for our customers while boosting the local economy.
                    </p>
                    <p style={{ marginBottom: 0 }}>
                        We believe in the power of community. By connecting local buyers with local sellers, we create a sustainable ecosystem where everyone thrives.
                    </p>
                </div>

                {/* Mission / Vision / Values */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    {values.map((v, i) => (
                        <div key={i} className="glass-card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: 'var(--primary-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary-color)',
                                fontSize: '1.1rem',
                                flexShrink: 0,
                            }}>
                                <i className={`fas ${v.icon}`}></i>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{v.title}</h3>
                                <p style={{ fontSize: '0.9rem', marginBottom: 0, lineHeight: '1.6' }}>{v.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
        @media (min-width: 768px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr 1fr 1fr !important;
          }
        }
      `}</style>
        </main>
    );
}
