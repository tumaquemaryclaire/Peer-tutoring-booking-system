
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { logoutUser } from "../services/auth";
import { db } from "../services/firebase";

import "./StudentDashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);

  // CHECK STUDENT LOGIN
  useEffect(() => {
    const savedUser = JSON.parse(
      sessionStorage.getItem("pt_current_user") || "null"
    );

    if (!savedUser || savedUser.role !== "student") {
      navigate("/login", { replace: true });
      return;
    }

    setCurrentUser(savedUser);
  }, [navigate]);

  // LOAD REGISTERED TUTORS FROM FIRESTORE
  useEffect(() => {
    if (!currentUser) return;

    const tutorsQuery = query(
      collection(db, "tutorProfiles"),
      where("status", "==", "Active")
    );

    const unsubscribe = onSnapshot(
      tutorsQuery,
      (snapshot) => {
        const registeredTutors = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data()
        }));

        setTutors(registeredTutors);
        setLoadingTutors(false);
      },
      (error) => {
        console.error("Error loading tutors:", error);
        setLoadingTutors(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // LOGOUT
  async function handleLogout() {
    try {
      await logoutUser();
      sessionStorage.removeItem("pt_current_user");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Unable to log out. Please try again.");
    }
  }

  // TEMPORARY PAGE ACTION
  function showComingSoon(page) {
    alert(`${page} page will be available soon.`);
  }

  if (!currentUser) {
    return null;
  }

  // COMPLETE STUDENT NAME
  const firstName = currentUser.firstName || "Student";

  const middleName = currentUser.middleName || "";
  const lastName = currentUser.lastName || "";
  const suffix = currentUser.suffix || "";

  const fullName = currentUser.fullName ||
    currentUser.name ||
    [
      firstName,
      middleName,
      lastName
    ].filter(Boolean).join(" ") + (suffix ? `, ${suffix}` : "");

  const initials = firstName.charAt(0).toUpperCase();

  return (
    <div className="student-dashboard">

      {/* SIDEBAR */}
      <aside className="student-sidebar">

        <div className="student-brand">
          <div className="brand-icon">P</div>
          <div>
            <h2>PeerTutor</h2>
            <span>Learn Together</span>
          </div>
        </div>

        <div className="sidebar-label">MENU</div>

        <nav className="student-nav">
          <button className="student-nav-item active">
            <span className="nav-icon">▦</span>
            Dashboard
          </button>

          <button
            className="student-nav-item"
            onClick={() => showComingSoon("Find Tutors")}
          >
            <span className="nav-icon">⌕</span>
            Find Tutors
          </button>

          <button
            className="student-nav-item"
            onClick={() => showComingSoon("My Bookings")}
          >
            <span className="nav-icon">▣</span>
            My Bookings
          </button>

          <button
            className="student-nav-item"
            onClick={() => showComingSoon("Messages")}
          >
            <span className="nav-icon">✉</span>
            Messages
          </button>

          <button
            className="student-nav-item"
            onClick={() => showComingSoon("Notifications")}
          >
            <span className="nav-icon">♧</span>
            Notifications
          </button>
        </nav>

        <div className="sidebar-label sidebar-bottom-label">
          ACCOUNT
        </div>

        <nav className="student-nav">
          <button
            className="student-nav-item"
            onClick={() => showComingSoon("My Profile")}
          >
            <span className="nav-icon">♙</span>
            My Profile
          </button>

          <button
            className="student-nav-item logout-item"
            onClick={handleLogout}
          >
            <span className="nav-icon">↪</span>
            Logout
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-avatar">{initials}</div>

          <div className="sidebar-user-info">
            <strong>{fullName}</strong>
            <span>Student Account</span>
          </div>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="student-main">

        {/* TOPBAR */}
        <header className="student-topbar">
          <div>
            <span className="topbar-subtitle">STUDENT PORTAL</span>
            <h2>Dashboard</h2>
          </div>

          <div className="topbar-right">
            <button
              className="notification-button"
              onClick={() => showComingSoon("Notifications")}
              aria-label="Notifications"
            >
              ♧
              <span className="notification-dot"></span>
            </button>

            <div className="topbar-profile">
              <div className="topbar-avatar">{initials}</div>
              <div>
                <strong>{firstName}</strong>
                <span>Student</span>
              </div>
            </div>
          </div>
        </header>

        <section className="student-content">

          {/* WELCOME BANNER */}
          <div className="welcome-banner">
            <div className="welcome-text">
              <span className="welcome-label">
                YOUR LEARNING SPACE
              </span>

              <h1>Welcome back, {firstName}!</h1>

              <p>
                Ready to learn something new today? Find a tutor and start
                improving your skills.
              </p>

              <button
                className="welcome-button"
                onClick={() => showComingSoon("Find Tutors")}
              >
                Find a Tutor <span>→</span>
              </button>
            </div>

            <div className="welcome-decoration">
              <div className="decoration-circle circle-one"></div>
              <div className="decoration-circle circle-two"></div>
              <div className="book-illustration">📚</div>
            </div>
          </div>

          {/* SUMMARY CARDS */}
          <div className="dashboard-section-heading">
            <div>
              <h2>Learning Overview</h2>
              <p>Here's a quick look at your learning activity.</p>
            </div>
          </div>

          <div className="student-stats">

            <div className="student-stat-card">
              <div className="stat-icon purple-icon">▣</div>
              <div>
                <span>Total Bookings</span>
                <h3>0</h3>
                <small>Your tutoring sessions</small>
              </div>
            </div>

            <div className="student-stat-card">
              <div className="stat-icon blue-icon">◷</div>
              <div>
                <span>Upcoming Sessions</span>
                <h3>0</h3>
                <small>Sessions scheduled</small>
              </div>
            </div>

            <div className="student-stat-card">
              <div className="stat-icon green-icon">✓</div>
              <div>
                <span>Completed Sessions</span>
                <h3>0</h3>
                <small>Keep learning!</small>
              </div>
            </div>

          </div>

          {/* UPCOMING SESSIONS */}
          <section className="dashboard-panel">

            <div className="panel-heading">
              <div>
                <h2>Upcoming Sessions</h2>
                <p>Your next tutoring appointments</p>
              </div>

              <button
                className="view-all-button"
                onClick={() => showComingSoon("My Bookings")}
              >
                View All →
              </button>
            </div>

            <div className="empty-sessions">
              <div className="empty-icon">📅</div>

              <h3>No upcoming sessions yet</h3>

              <p>
                You haven't booked a tutoring session. Find a tutor to get
                started with your learning journey.
              </p>

              <button
                className="primary-small-button"
                onClick={() => showComingSoon("Find Tutors")}
              >
                Explore Tutors
              </button>
            </div>

          </section>

          {/* REGISTERED TUTORS */}
          <section className="dashboard-panel tutors-panel">

            <div className="panel-heading">
              <div>
                <h2>Available Tutors</h2>
                <p>Explore registered tutors on PeerTutor</p>
              </div>

              <button
                className="view-all-button"
                onClick={() => showComingSoon("Find Tutors")}
              >
                See All →
              </button>
            </div>

            <div className="recommended-tutors">

              {loadingTutors ? (
                <div className="tutor-empty-message">
                  Loading registered tutors...
                </div>
              ) : tutors.length === 0 ? (
                <div className="tutor-empty-message">
                  <div className="empty-icon">👨‍🏫</div>

                  <h3>No tutors available yet</h3>

                  <p>
                    Registered tutors will appear here once they
                    create their tutor profiles.
                  </p>
                </div>
              ) : (
                tutors.map((tutor) => (
                  <div
                    className="recommended-tutor-card"
                    key={tutor.id}
                  >
                    <div className="tutor-avatar">
                      {(tutor.firstName || "T")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="tutor-details">
                      <h3>
                        {tutor.fullName ||
                          [
                            tutor.firstName || "",
                            tutor.middleName || "",
                            tutor.lastName || ""
                          ].filter(Boolean).join(" ") +
                          (tutor.suffix ? `, ${tutor.suffix}` : "")}
                      </h3>

                      <p>
                        {tutor.subjects?.length
                          ? tutor.subjects.join(", ")
                          : "Subjects not added yet"}
                      </p>

                      <span>
                        {tutor.teachingMode ||
                          "Teaching mode not added yet"}
                      </span>
                    </div>

                    <div className="tutor-rating">
                      <button
                        onClick={() =>
                          showComingSoon("Tutor Profile")
                        }
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))
              )}

            </div>
          </section>

          {/* FOOTER */}
          <footer className="student-footer">
            © 2026 PeerTutor. Learn together, grow together.
          </footer>

        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;
