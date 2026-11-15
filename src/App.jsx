
import {
  BrowserRouter,
  Routes,
  Route,
  Link
} from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import TutorDashboard from "./pages/TutorDashboard";

import "./App.css";

// HOME PAGE
function Home() {
  return (
    <div className="home-page">
      <nav className="navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">P</span>
          <span>Peer<span className="brand-highlight">Tutor</span></span>
        </Link>

        <div className="nav-links">
          <a href="/#home">Home</a>
          <a href="/#features">Features</a>
          <a href="/#about">About</a>
        </div>

        <div className="nav-actions">
          <Link to="/login" className="login-link">Log In</Link>
          <Link to="/register" className="nav-button">Get Started</Link>
        </div>
      </nav>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">LEARN TOGETHER. GROW TOGETHER.</span>

            <h1>
              Your Learning Journey
              <span> Starts With the Right Tutor.</span>
            </h1>

            <p>
              Connect with fellow students, share knowledge, and
              improve your skills through personalized peer tutoring.
              Learning is better when we grow together.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="primary-button">
                Get Started <span>→</span>
              </Link>

              <a href="#features" className="secondary-button">
                Explore Features
              </a>
            </div>

            <div className="hero-note">
              <span className="note-check">✓</span>
              A community where students help students succeed.
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow"></div>

            <div className="learning-card">
              <div className="card-top">
                <div>
                  <span className="small-label">YOUR LEARNING SPACE</span>
                  <h3>Learn something new today.</h3>
                </div>
                <span className="card-symbol">✦</span>
              </div>

              <div className="tutor-preview">
                <div className="tutor-avatar">T</div>
                <div className="tutor-info">
                  <strong>Peer Tutoring</strong>
                  <span>Learn from fellow students</span>
                </div>
                <span className="online-dot"></span>
              </div>

              <div className="session-box">
                <span className="small-label">AVAILABLE LEARNING MODES</span>

                <div className="mode-item">
                  <span className="mode-icon">⌨</span>
                  <div>
                    <strong>Online Tutoring</strong>
                    <span>Learn from anywhere</span>
                  </div>
                </div>

                <div className="mode-item">
                  <span className="mode-icon">♧</span>
                  <div>
                    <strong>Face-to-Face</strong>
                    <span>Learn together in person</span>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <span>Knowledge is better when shared.</span>
                <span className="footer-star">✦</span>
              </div>
            </div>

            <div className="floating-note">
              <span className="floating-icon">✓</span>
              <div>
                <strong>Keep growing!</strong>
                <span>Your next lesson awaits.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading">
            <span className="eyebrow">WHY PEERTUTOR?</span>
            <h2>Learning made easier, together.</h2>
            <p>
              Everything you need to connect, learn, and share
              knowledge with other students.
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon blue-icon">⌕</div>
              <h3>Find Tutors</h3>
              <p>
                Discover fellow students who can help you understand
                different subjects and topics.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon purple-icon">▣</div>
              <h3>Book Sessions</h3>
              <p>
                Request tutoring sessions and choose a schedule
                that works best for you.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon green-icon">♡</div>
              <h3>Learn Together</h3>
              <p>
                Share knowledge, build confidence, and improve
                your academic skills.
              </p>
            </div>
          </div>
        </section>

        <section className="bottom-cta" id="about">
          <h2>Ready to grow your knowledge?</h2>
          <p>Join PeerTutor and make every learning opportunity count.</p>

          <Link to="/register" className="primary-button">
            Join PeerTutor <span>→</span>
          </Link>
        </section>
      </main>

      <footer className="site-footer">
        <Link to="/" className="brand footer-brand">
          <span className="brand-icon">P</span>
          <span>Peer<span className="brand-highlight">Tutor</span></span>
        </Link>

        <p>Learn together. Grow together.</p>
        <span>© 2026 PeerTutor. All rights reserved.</span>
      </footer>
    </div>
  );
}

// 404 PAGE
function NotFound() {
  return <h1>404 - Page Not Found</h1>;
}

// MAIN APP
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/student/dashboard"
          element={<StudentDashboard />}
        />

        <Route
          path="/tutor/dashboard"
          element={<TutorDashboard />}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
