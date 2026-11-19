
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { loginUser } from "../services/auth";
import { db } from "../services/firebase";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginUser(
        formData.email,
        formData.password
      );

      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        setError("Your account profile was not found.");
        return;
      }

      const userData = userSnapshot.data();
      const role = String(userData.role || "").toLowerCase();

      if (role !== "student" && role !== "tutor") {
        setError("Your account has an invalid user role.");
        return;
      }

      // GET COMPLETE NAME INFORMATION
      const firstName = userData.firstName || "";
      const middleName = userData.middleName || "";
      const lastName = userData.lastName || "";
      const suffix = userData.suffix || "";

      // CREATE COMPLETE NAME
      const fullName = userData.fullName || [
        firstName,
        middleName,
        lastName
      ].filter(Boolean).join(" ") + (suffix ? `, ${suffix}` : "");

      // SAVE CURRENT USER INFORMATION
      const currentUser = {
        uid: user.uid,
        email: user.email,
        firstName,
        middleName,
        lastName,
        suffix,
        fullName,
        name: fullName,
        role
      };

      sessionStorage.setItem(
        "pt_current_user",
        JSON.stringify(currentUser)
      );

      navigate(`/${role}/dashboard`);

    } catch (err) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Incorrect email or password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message || "Unable to log in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand">
          <span className="brand-icon">P</span>
          <span>Peer<span className="brand-highlight">Tutor</span></span>
        </Link>

        <div className="auth-heading">
          <span className="eyebrow">WELCOME BACK</span>
          <h1>Log in to your account</h1>
          <p>
            Continue your learning journey with PeerTutor.
          </p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
            {!loading && <span>→</span>}
          </button>
        </form>

        <div className="auth-divider">
          <span>NEW TO PEERTUTOR?</span>
        </div>

        <p className="auth-switch">
          Don't have an account?{" "}
          <Link to="/register">Create an account</Link>
        </p>

        <Link to="/" className="back-home">
          ← Back to Home
        </Link>
      </div>

      <div className="auth-side">
        <div className="auth-side-content">
          <span className="auth-side-symbol">✦</span>
          <h2>Learning is better when we grow together.</h2>
          <p>
            Connect with fellow students, discover helpful tutors,
            and make every learning opportunity count.
          </p>
          <div className="auth-side-bottom">
            <span>PEERTUTOR</span>
            <span>LEARN • SHARE • GROW</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
