
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  ShieldCheck,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

import { auth, db } from "../services/firebase";
import "./AdminLogin.css";

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists() || userSnap.data().role !== "admin") {
        await signOut(auth);
        setError("Access denied. This account is not an administrator.");
        return;
      }

      onLogin({
        uid: result.user.uid,
        email: result.user.email,
        role: "admin",
      });
    } catch (err) {
      console.error("Admin login error:", err);

      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Incorrect email or password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Unable to sign in. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">

        {/* LEFT BRANDING PANEL */}
        <section className="admin-brand-panel">
          <div className="admin-brand-content">

            <div className="admin-brand-logo">
              <GraduationCap size={30} />
            </div>

            <h1>
              Peer<span>Tutor</span>
            </h1>

            <div className="admin-brand-divider"></div>

            <h2>
              Empowering Learning.
              <br />
              Connecting Students.
            </h2>

            <p>
              Manage the PeerTutor platform through one centralized
              administration portal. Monitor users, manage tutoring
              activities, and keep everything organized.
            </p>

            <div className="admin-brand-features">
              <div>
                <ShieldCheck size={19} />
                <span>Secure Administration</span>
              </div>

              <div>
                <GraduationCap size={19} />
                <span>Learning Management</span>
              </div>
            </div>
          </div>

          <div className="admin-brand-bottom">
            <span>PEERTUTOR ADMINISTRATION SYSTEM</span>
            <span>© 2026 PeerTutor</span>
          </div>
        </section>

        {/* RIGHT LOGIN PANEL */}
        <section className="admin-form-panel">
          <div className="admin-login-card">

            <div className="admin-form-icon">
              <ShieldCheck size={27} />
            </div>

            <div className="admin-form-heading">
              <span className="admin-eyebrow">
                ADMINISTRATOR ACCESS
              </span>

              <h2>Welcome Back</h2>

              <p>
                Sign in to access your administrator dashboard.
              </p>
            </div>

            <form onSubmit={handleLogin}>

              <div className="admin-input-group">
                <label htmlFor="admin-email">
                  Email Address
                </label>

                <div className="admin-input-wrapper">
                  <Mail size={19} />

                  <input
                    id="admin-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="admin-input-group">
                <label htmlFor="admin-password">
                  Password
                </label>

                <div className="admin-input-wrapper">
                  <LockKeyhole size={19} />

                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="admin-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="admin-login-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="admin-signin-button"
                disabled={loading}
              >
                <span>
                  {loading ? "Signing in..." : "Sign In"}
                </span>

                {!loading && <ArrowRight size={19} />}
              </button>

            </form>

            <div className="admin-security-note">
              <ShieldCheck size={17} />

              <span>
                Secure access for authorized administrators only.
              </span>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}

export default AdminLogin;
