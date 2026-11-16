
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth";

import {
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

import { auth, db } from "../services/firebase";
import "./TutorDashboard.css";

function TutorDashboard() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");

  // TUTOR PROFILE STATES
  const [profileData, setProfileData] = useState({
    subjects: "",
    bio: "",
    teachingMode: ""
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // CHECK CURRENT USER
  useEffect(() => {
    const savedUser = JSON.parse(
      sessionStorage.getItem("pt_current_user") || "null"
    );

    if (!savedUser || savedUser.role !== "tutor") {
      navigate("/login");
      return;
    }

    setCurrentUser(savedUser);
  }, [navigate]);

  // FETCH TUTOR PROFILE FROM FIRESTORE
  useEffect(() => {
    const fetchTutorProfile = async () => {
      if (!currentUser?.uid) return;

      setProfileLoading(true);

      try {
        const profileRef = doc(
          db,
          "tutorProfiles",
          currentUser.uid
        );

        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const data = profileSnap.data();

          setProfileData({
            subjects: Array.isArray(data.subjects)
              ? data.subjects.join(", ")
              : "",
            bio: data.bio || "",
            teachingMode: data.teachingMode || ""
          });
        }
      } catch (error) {
        console.error("Error loading tutor profile:", error);
        alert("Unable to load your tutor profile.");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchTutorProfile();
  }, [currentUser]);

  // LOGOUT
  const handleLogout = async () => {
    try {
      await logoutUser();
      sessionStorage.removeItem("pt_current_user");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Unable to log out. Please try again.");
    }
  };

  // SAVE TUTOR PROFILE

const handleSaveProfile = async (e) => {
  e.preventDefault();

  const authenticatedUser = auth.currentUser;

  console.log("SESSION UID:", currentUser?.uid);
  console.log("FIREBASE AUTH UID:", authenticatedUser?.uid);

  if (!authenticatedUser) {
    alert("You are not currently authenticated. Please log in again.");
    return;
  }

  const tutorUid = authenticatedUser.uid;

  setSavingProfile(true);

  try {
    const profileRef = doc(db, "tutorProfiles", tutorUid);

    const subjectsArray = profileData.subjects
      .split(",")
      .map((subject) => subject.trim())
      .filter(Boolean);

    await updateDoc(profileRef, {
      subjects: subjectsArray,
      bio: profileData.bio.trim(),
      teachingMode: profileData.teachingMode
    });

    setProfileData((previous) => ({
      ...previous,
      subjects: subjectsArray.join(", ")
    }));

    alert("Tutor profile updated successfully!");

  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);

    alert(
      `Unable to update profile.\nError: ${error.code}\nMessage: ${error.message}`
    );

  } finally {
    setSavingProfile(false);
  }
};


  if (!currentUser) {
    return (
      <div className="dashboard-loading">
        Loading dashboard...
      </div>
    );
  }

  const tutorName =
    currentUser.fullName ||
    currentUser.name ||
    currentUser.firstName ||
    "Tutor";

  const menuItems = [
    { name: "Dashboard", icon: "🏠" },
    { name: "My Profile", icon: "👤" },
    { name: "Booking Requests", icon: "📩" },
    { name: "My Sessions", icon: "📅" },
    { name: "Messages", icon: "💬" },
    { name: "Notifications", icon: "🔔" }
  ];

  // PAGE CONTENT
  const renderContent = () => {
    switch (activePage) {
      // MY PROFILE
      case "My Profile":
        return (
          <section className="tutor-content-section">
            <h2>My Profile</h2>
            <p>Manage your personal and tutoring information.</p>

            {profileLoading ? (
              <div className="empty-state">
                <p>Loading your profile...</p>
              </div>
            ) : (
              <>
                <div className="profile-information">
                  <div className="profile-avatar">
                    {tutorName.charAt(0).toUpperCase()}
                  </div>

                  <div className="profile-details">
                    <h3>{tutorName}</h3>
                    <p>{currentUser.email}</p>
                    <span className="profile-role">Peer Tutor</span>
                  </div>
                </div>

                <form
                  className="tutor-profile-form"
                  onSubmit={handleSaveProfile}
                >
                  {/* PERSONAL INFORMATION */}
                  <div className="profile-info-card">
                    <div>
                      <span>First Name</span>
                      <strong>
                        {currentUser.firstName || "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Middle Name</span>
                      <strong>
                        {currentUser.middleName || "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Last Name</span>
                      <strong>
                        {currentUser.lastName || "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Suffix</span>
                      <strong>{currentUser.suffix || "None"}</strong>
                    </div>

                    <div>
                      <span>Email Address</span>
                      <strong>{currentUser.email}</strong>
                    </div>

                    <div>
                      <span>Contact Number</span>
                      <strong>
                        {currentUser.contactNumber || "Not provided"}
                      </strong>
                    </div>
                  </div>

                  {/* EDITABLE TUTOR INFORMATION */}
                  <div className="profile-edit-fields">
                    <div className="profile-field">
                      <label htmlFor="subjects">
                        Subjects You Teach
                      </label>

                      <input
                        id="subjects"
                        type="text"
                        placeholder="Example: Java, HTML, Database"
                        value={profileData.subjects}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            subjects: e.target.value
                          })
                        }
                      />

                      <small>
                        Separate each subject with a comma.
                      </small>
                    </div>

                    <div className="profile-field">
                      <label htmlFor="teachingMode">
                        Teaching Mode
                      </label>

                      <select
                        id="teachingMode"
                        value={profileData.teachingMode}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            teachingMode: e.target.value
                          })
                        }
                        required
                      >
                        <option value="">
                          Select teaching mode
                        </option>
                        <option value="Online">Online</option>
                        <option value="Face-to-Face">
                          Face-to-Face
                        </option>
                        <option value="Both">
                          Both Online and Face-to-Face
                        </option>
                      </select>
                    </div>

                    <div className="profile-field">
                      <label htmlFor="bio">
                        About Me / Tutor Bio
                      </label>

                      <textarea
                        id="bio"
                        rows="5"
                        placeholder="Tell students about your skills, experience, and how you can help them learn."
                        value={profileData.bio}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            bio: e.target.value
                          })
                        }
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="save-profile-button"
                    disabled={savingProfile}
                  >
                    {savingProfile
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </form>
              </>
            )}
          </section>
        );

      // BOOKING REQUESTS
      case "Booking Requests":
        return (
          <section className="tutor-content-section">
            <h2>Booking Requests</h2>
            <p>
              Review and manage tutoring requests from students.
            </p>

            <div className="empty-state">
              <span>📩</span>
              <h3>No booking requests yet</h3>
              <p>New student requests will appear here.</p>
            </div>
          </section>
        );

      // MY SESSIONS
      case "My Sessions":
        return (
          <section className="tutor-content-section">
            <h2>My Sessions</h2>
            <p>
              View your upcoming and completed tutoring sessions.
            </p>

            <div className="empty-state">
              <span>📅</span>
              <h3>No sessions scheduled</h3>
              <p>Your confirmed tutoring sessions will appear here.</p>
            </div>
          </section>
        );

      // MESSAGES
      case "Messages":
        return (
          <section className="tutor-content-section">
            <h2>Messages</h2>
            <p>
              Communicate with students who want tutoring assistance.
            </p>

            <div className="empty-state">
              <span>💬</span>
              <h3>No messages yet</h3>
              <p>Your student conversations will appear here.</p>
            </div>
          </section>
        );

      // NOTIFICATIONS
      case "Notifications":
        return (
          <section className="tutor-content-section">
            <h2>Notifications</h2>
            <p>
              Stay updated with your tutoring activities.
            </p>

            <div className="empty-state">
              <span>🔔</span>
              <h3>No notifications yet</h3>
              <p>Important updates will appear here.</p>
            </div>
          </section>
        );

      // DASHBOARD
      default:
        return (
          <>
            <div className="tutor-welcome-banner">
              <div>
                <span className="welcome-label">
                  TUTOR WORKSPACE
                </span>

                <h2>
                  Welcome, {currentUser.firstName || "Tutor"}!
                </h2>

                <p>
                  Manage your tutoring activities and help students
                  achieve their learning goals.
                </p>
              </div>

              <div className="welcome-icon">🎓</div>
            </div>

            <div className="tutor-stats-grid">
              <div className="tutor-stat-card">
                <span className="stat-icon">📩</span>
                <p>Booking Requests</p>
                <h3>0</h3>
              </div>

              <div className="tutor-stat-card">
                <span className="stat-icon">📅</span>
                <p>Upcoming Sessions</p>
                <h3>0</h3>
              </div>

              <div className="tutor-stat-card">
                <span className="stat-icon">💬</span>
                <p>Unread Messages</p>
                <h3>0</h3>
              </div>

              <div className="tutor-stat-card">
                <span className="stat-icon">⭐</span>
                <p>Average Rating</p>
                <h3>—</h3>
              </div>
            </div>

            <div className="tutor-dashboard-bottom">
              <div className="tutor-panel">
                <h3>Quick Actions</h3>
                <p>Manage your tutoring activities.</p>

                <div className="quick-action-list">
                  <button
                    onClick={() => setActivePage("My Profile")}
                  >
                    👤 View My Profile
                  </button>

                  <button
                    onClick={() => setActivePage("Booking Requests")}
                  >
                    📩 Check Booking Requests
                  </button>

                  <button
                    onClick={() => setActivePage("My Sessions")}
                  >
                    📅 View My Sessions
                  </button>
                </div>
              </div>

              <div className="tutor-panel">
                <h3>Account Information</h3>

                <div className="account-information">
                  <p>
                    <span>Name</span>
                    <strong>{tutorName}</strong>
                  </p>

                  <p>
                    <span>Email</span>
                    <strong>{currentUser.email}</strong>
                  </p>

                  <p>
                    <span>Account Type</span>
                    <strong>Peer Tutor</strong>
                  </p>

                  <p>
                    <span>Status</span>
                    <strong className="active-status">
                      Active
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="tutor-dashboard">
      <aside className="tutor-sidebar">
        <div className="tutor-brand">
          <span>📚</span>
          <h2>
            Peer<span>Tutor</span>
          </h2>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {tutorName.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{tutorName}</strong>
            <span>Peer Tutor</span>
          </div>
        </div>

        <nav className="tutor-navigation">
          <p className="sidebar-heading">MENU</p>

          {menuItems.map((item) => (
            <button
              key={item.name}
              className={
                activePage === item.name
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
              onClick={() => setActivePage(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <button
          className="tutor-logout-button"
          onClick={handleLogout}
        >
          <span>🚪</span>
          Logout
        </button>
      </aside>

      <main className="tutor-main">
        <header className="tutor-topbar">
          <div>
            <h1>{activePage}</h1>
            <p>PeerTutor / {activePage}</p>
          </div>

          <div className="topbar-user">
            <span className="topbar-avatar">
              {tutorName.charAt(0).toUpperCase()}
            </span>

            <span>{tutorName}</span>
          </div>
        </header>

        <div className="tutor-page-content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default TutorDashboard;