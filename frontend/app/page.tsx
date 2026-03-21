import Link from "next/link";

export default function Home() {
  return (
    <main className="page-shell">
      <div className="page-inner">
        <header className="page-header">
          <div className="brand">
            <span className="brand-mark">AC</span>
            <span>AI Clinical Skills Coach</span>
          </div>
          <span className="pill">Simulation-only training product</span>
        </header>

        <section className="hero">
          <div className="hero-grid">
            <article className="hero-card hero-copy">
              <span className="pill">Phase 1 mock trainer loop</span>
              <h1>Practice a simple interrupted suture with calm, structured coaching.</h1>
              <p>
                This first phase turns a webcam into a believable simulation-first trainer
                for medical students practicing on an orange, banana, or foam pad. It is
                scoped to one procedure, one polished camera workflow, and one review page.
              </p>
              <div className="button-row">
                <Link
                  className="button-primary"
                  href="/train/simple-interrupted-suture"
                >
                  Start Training
                </Link>
                <a className="button-secondary" href="#how-it-works">
                  See the Flow
                </a>
              </div>
              <p className="fine-print">
                Built for simulated deliberate practice only. This product does not replace
                instructors, real-patient training, or clinical judgment.
              </p>
            </article>

            <aside className="hero-card hero-aside">
              <div className="stat-card">
                <strong>Hero workflow</strong>
                <p className="panel-copy">
                  Frame the practice surface, capture a step, receive mock feedback, retry
                  once, and finish with a local review summary.
                </p>
              </div>
              <div className="stat-card">
                <strong>Technical boundary</strong>
                <p className="panel-copy">
                  Next.js owns camera and overlays. FastAPI owns the procedure contract and
                  deterministic mock analysis.
                </p>
              </div>
              <div className="stat-card">
                <strong>Phase 2 direction</strong>
                <p className="panel-copy">
                  Real Claude-powered frame analysis and AI debriefing will plug into this
                  same frontend loop next.
                </p>
              </div>
            </aside>
          </div>

          <div className="feature-grid" id="how-it-works">
            <article className="feature-card">
              <h2>One believable procedure</h2>
              <p>
                The app stays focused on simple interrupted suturing so the UI, scoring, and
                coaching all feel coherent instead of spread thin.
              </p>
            </article>
            <article className="feature-card">
              <h2>Live mock coaching loop</h2>
              <p>
                The frontend calls the real FastAPI service right now, even though the
                analysis remains deterministic in Phase 1.
              </p>
            </article>
            <article className="feature-card">
              <h2>Review that feels educational</h2>
              <p>
                Each attempt is stored locally so the review page can show progress, stage
                outcomes, and the last coaching cue without waiting for AI debriefing.
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
