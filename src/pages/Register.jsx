
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/auth";

// Calculate age automatically using birthday
function calculateAge(birthday) {
  if (!birthday) return "";

  const birthDate = new Date(`${birthday}T00:00:00`);
  const today = new Date();

  if (Number.isNaN(birthDate.getTime()) || birthDate > today) {
    return "";
  }

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function Register() {
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    birthday: "",
    contactNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student"
  });

  const [error, setError] = useState("");
  const [numberError, setNumberError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "contactNumber") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 11);

      setFormData((prev) => ({
        ...prev,
        contactNumber: digitsOnly
      }));

      if (digitsOnly.length === 0) {
        setNumberError("");
      } else if (digitsOnly.length < 11) {
        setNumberError("Contact number must contain 11 digits.");
      } else {
        setNumberError("");
      }

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!formData.birthday) {
      setError("Please select your birthday.");
      return;
    }

    const age = calculateAge(formData.birthday);

    if (age === "" || age < 0) {
      setError("Please enter a valid birthday.");
      return;
    }

    if (age < 13) {
      setError("You must be at least 13 years old to register.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(formData.email.trim())) {
      setError(
        "Please enter a valid email address with @ and a domain, such as example@gmail.com."
      );
      return;
    }

    if (formData.contactNumber.length !== 11) {
      setError("Contact number must contain exactly 11 digits.");
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        lastName: formData.lastName.trim(),
        suffix: formData.suffix.trim(),
        birthday: formData.birthday,
        contactNumber: formData.contactNumber,
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role
      });

      alert("Your PeerTutor account has been created successfully!");
      navigate("/login");

    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email address is already registered.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must contain at least 8 characters.");
      } else if (err.code === "permission-denied") {
        setError(
          "Unable to save your profile. Please check your account permissions."
        );
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-form-side">
        <div className="register-form-wrapper">

          <Link to="/" className="auth-brand">
            <span className="brand-icon">P</span>
            <span>
              Peer<span className="brand-highlight">Tutor</span>
            </span>
          </Link>

          <div className="register-heading">
            <span className="eyebrow">JOIN OUR COMMUNITY</span>
            <h1>Create your account</h1>
            <p>
              Start connecting, learning, and sharing knowledge
              with fellow students.
            </p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">

            {/* NAME FIELDS */}
            <div className="register-name-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="middleName">
                  Middle Name <span className="register-hint">(Optional)</span>
                </label>
                <input
                  id="middleName"
                  type="text"
                  name="middleName"
                  placeholder="Enter middle name"
                  value={formData.middleName}
                  onChange={handleChange}
                  autoComplete="additional-name"
                />
              </div>
            </div>

            <div className="register-name-row">
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="suffix">
                  Suffix <span className="register-hint">(Optional)</span>
                </label>
                <select
                  id="suffix"
                  name="suffix"
                  value={formData.suffix}
                  onChange={handleChange}
                >
                  <option value="">No suffix</option>
                  <option value="Jr.">Jr.</option>
                  <option value="Sr.">Sr.</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                  <option value="V">V</option>
                </select>
              </div>
            </div>

            {/* BIRTHDAY */}
            <div className="form-group">
              <label htmlFor="birthday">Birthday</label>
              <input
                id="birthday"
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                min="1900-01-01"
                max={today}
                required
              />
              <small className="register-hint">
                Select your date of birth.
              </small>
            </div>

            {/* AUTOMATIC AGE */}
            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                type="text"
                value={
                  formData.birthday
                    ? `${calculateAge(formData.birthday)} years old`
                    : ""
                }
                placeholder="Automatically calculated from birthday"
                readOnly
              />
              <small className="register-hint">
                Your age will be calculated automatically after selecting your birthday.
              </small>
            </div>

            {/* CONTACT NUMBER */}
            <div className="form-group">
              <label htmlFor="contactNumber">Contact Number</label>

              <input
                id="contactNumber"
                type="tel"
                name="contactNumber"
                placeholder="09XXXXXXXXX"
                value={formData.contactNumber}
                onChange={handleChange}
                onBlur={() => {
                  if (formData.contactNumber.length !== 11) {
                    setNumberError("Please enter exactly 11 digits.");
                  }
                }}
                inputMode="numeric"
                maxLength={11}
                aria-invalid={!!numberError}
                required
              />

              {numberError && (
                <small className="field-error">
                  {numberError}
                </small>
              )}

              {!numberError && (
                <small className="register-hint">
                  Enter exactly 11 digits.
                </small>
              )}
            </div>

            {/* EMAIL */}
            <div className="form-group">
              <label htmlFor="registerEmail">Email Address</label>
              <input
                id="registerEmail"
                type="email"
                name="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
              <small className="register-hint">
                Enter a valid email address with @ and a domain.
              </small>
            </div>

            {/* PASSWORD */}
            <div className="form-group">
              <label htmlFor="registerPassword">Password</label>
              <input
                id="registerPassword"
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <small className="register-hint">
                Password must be at least 8 characters.
              </small>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            {/* ROLE */}
            <div className="form-group">
              <label htmlFor="role">Register As</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="student">Student</option>
                <option value="tutor">Tutor</option>
              </select>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
              {!loading && <span>→</span>}
            </button>

          </form>

          <div className="register-login">
            Already have an account?{" "}
            <Link to="/login">Log in</Link>
          </div>

          <Link to="/" className="back-home">
            ← Back to Home
          </Link>

        </div>
      </div>

      <div className="register-side">
        <div className="register-side-content">
          <span className="register-side-symbol">✦</span>

          <span className="register-side-label">
            YOUR JOURNEY STARTS HERE
          </span>

          <h2>
            Every student has something to learn and something to share.
          </h2>

          <p>
            Whether you want to find academic support or help
            other students, PeerTutor gives you a place to grow
            together.
          </p>

          <div className="register-benefits">
            <div><span>✓</span> Connect with fellow students</div>
            <div><span>✓</span> Find and offer tutoring sessions</div>
            <div><span>✓</span> Learn at your own pace</div>
          </div>

          <div className="register-side-footer">
            LEARN • SHARE • GROW
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
