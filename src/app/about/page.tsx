export default function AboutPage() {
    return (
        <main className="section" style={{ paddingTop: '100px', minHeight: '80vh' }}>
            <div className="container">
                <h1 className="text-primary" style={{ marginBottom: '2rem' }}>Our Story</h1>
                <div style={{ maxWidth: '800px', lineHeight: '1.8' }}>
                    <p style={{ marginBottom: '1.5rem' }}>
                        The Kada was born from a simple observation: while big cities enjoyed the convenience of instant delivery, smaller towns were often left behind. We set out to bridge this gap by building a hyper-local delivery platform tailored for Bharat.
                    </p>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Starting from a single town, we have now expanded to over 50 locations, empowering thousands of local vendors to compete with e-commerce giants. Our mission is to simplify life for our customers while boosting the local economy.
                    </p>
                    <p>
                        We believe in the power of community. By connecting local buyers with local sellers, we create a sustainable ecosystem where everyone thrives.
                    </p>
                </div>
            </div>
        </main>
    );
}
