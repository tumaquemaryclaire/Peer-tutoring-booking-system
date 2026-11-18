
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarDays,
  ChartNoAxesColumn,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  CheckCircle,
  BookOpen,
} from "lucide-react";

import { auth, db } from "./services/firebase";
import AdminLogin from "./pages/AdminLogin";
import "./App.css";

function AdminDashboard({ admin }) {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Students", icon: Users },
    { name: "Tutors", icon: GraduationCap },
    { name: "Bookings", icon: CalendarDays },
    { name: "Reports", icon: ChartNoAxesColumn },
  ];

  const handleLogout = async () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to log out?"
    );

    if (confirmLogout) {
      await signOut(auth);
    }
  };

  const renderPage = () => {
    if (activePage === "Dashboard") {
      return (
        <>
          <div className="dashboard-welcome">
            <div>
              <span className="dashboard-eyebrow">
                ADMINISTRATION OVERVIEW
              </span>
              <h1>Dashboard Overview</h1>
              <p>
                Welcome back! Here's what's happening on PeerTutor today.
              </p>
            </div>

            <div className="dashboard-date">
              <CalendarDays size={17} />
              <span>
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="dashboard-stats-grid">
            <div className="dashboard-stat-card">
              <div className="stat-card-top">
                <div className="stat-icon blue">
                  <Users size={22} />
                </div>
                <span className="stat-label">USER MANAGEMENT</span>
              </div>
              <h2>--</h2>
              <p>Total Students</p>
              <span className="stat-description">
                Registered student accounts
              </span>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-card-top">
                <div className="stat-icon purple">
                  <GraduationCap size={22} />
                </div>
                <span className="stat-label">TUTOR MANAGEMENT</span>
              </div>
              <h2>--</h2>
              <p>Total Tutors</p>
              <span className="stat-description">
                Registered tutor accounts
              </span>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-card-top">
                <div className="stat-icon green">
                  <CalendarDays size={22} />
                </div>
                <span className="stat-label">BOOKING ACTIVITY</span>
              </div>
              <h2>--</h2>
              <p>Total Bookings</p>
              <span className="stat-description">
                All tutoring booking requests
              </span>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-card-top">
                <div className="stat-icon orange">
                  <Clock size={22} />
                </div>
                <span className="stat-label">NEEDS ATTENTION</span>
              </div>
              <h2>--</h2>
              <p>Pending Bookings</p>
              <span className="stat-description">
                Requests waiting for tutor response
              </span>
            </div>
          </div>

          <div className="dashboard-content-grid">
            <div className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h3>Recent Activities</h3>
                  <p>Latest activities on the platform</p>
                </div>
                <Clock size={20} />
              </div>

              <div className="dashboard-empty-state">
                <div className="empty-state-icon">
                  <BookOpen size={27} />
                </div>
                <h4>Activity records will appear here</h4>
                <p>
                  Recent student registrations, tutor updates, and
                  booking activities will be displayed here.
                </p>
              </div>
            </div>

            <div className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h3>Quick Overview</h3>
                  <p>Platform management</p>
                </div>
                <ArrowUpRight size={20} />
              </div>

              <div className="quick-links">
                <button onClick={() => setActivePage("Students")}>
                  <div className="quick-link-icon blue">
                    <Users size={19} />
                  </div>
                  <span>
                    <strong>Manage Students</strong>
                    <small>View registered students</small>
                  </span>
                  <ArrowUpRight size={17} />
                </button>

                <button onClick={() => setActivePage("Tutors")}>
                  <div className="quick-link-icon purple">
                    <GraduationCap size={19} />
                  </div>
                  <span>
                    <strong>Manage Tutors</strong>
                    <small>View registered tutors</small>
                  </span>
                  <ArrowUpRight size={17} />
                </button>

                <button onClick={() => setActivePage("Bookings")}>
                  <div className="quick-link-icon green">
                    <CalendarDays size={19} />
                  </div>
                  <span>
                    <strong>Manage Bookings</strong>
                    <small>Review tutoring requests</small>
                  </span>
                  <ArrowUpRight size={17} />
                </button>
              </div>
            </div>
          </div>

          <div className="dashboard-system-notice">
            <ShieldCheck size={20} />
            <div>
              <strong>PeerTutor Administration Portal</strong>
              <p>
                You are signed in using an authorized administrator account.
              </p>
            </div>
          </div>
        </>
      );
    }

    const pageDetails = {
      Students: {
        icon: Users,
        title: "Students Management",
        description: "View and manage registered student accounts.",
        message: "Student records will be displayed here.",
      },
      Tutors: {
        icon: GraduationCap,
        title: "Tutors Management",
        description: "View and manage registered tutor accounts.",
        message: "Tutor records will be displayed here.",
      },
      Bookings: {
        icon: CalendarDays,
        title: "Bookings Management",
        description: "Monitor and review tutoring booking requests.",
        message: "Booking records will be displayed here.",
      },
      Reports: {
        icon: ChartNoAxesColumn,
        title: "Reports and Analytics",
        description: "Review platform activity and performance.",
        message: "Reports and analytics will be displayed here.",
      },
    };

    const page = pageDetails[activePage];
    const PageIcon = page.icon;

    return (
      <div className="management-page">
        <span className="dashboard-eyebrow">
          PEERTUTOR MANAGEMENT
        </span>

        <h1>{page.title}</h1>
        <p className="management-description">
          {page.description}
        </p>

        <div className="management-placeholder">
          <div className="management-placeholder-icon">
            <PageIcon size={32} />
          </div>

          <h3>{page.message}</h3>

          <p>
            This section is ready for its Firestore integration.
            We will connect the actual records next.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-layout">

      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <GraduationCap size={25} />
          </div>

          <div>
            <h2>PeerTutor</h2>
            <span>ADMIN PORTAL</span>
          </div>

          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-section-label">
          MAIN MENU
        </div>

        <nav className="sidebar-navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={
                  activePage === item.name
                    ? "sidebar-nav-item active"
                    : "sidebar-nav-item"
                }
                onClick={() => {
                  setActivePage(item.name);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-admin-card">
            <div className="sidebar-admin-avatar">
              <ShieldCheck size={21} />
            </div>

            <div className="sidebar-admin-info">
              <strong>Administrator</strong>
              <span>System Admin</span>
            </div>
          </div>

          <button
            className="sidebar-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Log Out</span>
          </button>

          <div className="sidebar-version">
            PeerTutor Admin v1.0
          </div>
        </div>
      </aside>

      <main className="admin-main-content">

        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={23} />
            </button>

            <div className="topbar-breadcrumb">
              <span>PeerTutor</span>
              <span className="breadcrumb-divider">/</span>
              <strong>{activePage}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <div className="admin-status">
              <span className="status-dot"></span>
              Admin Online
            </div>

            <div className="topbar-divider"></div>

            <div className="topbar-user">
              <div className="topbar-avatar">
                <ShieldCheck size={19} />
              </div>

              <div>
                <strong>Administrator</strong>
                <span>{admin.email}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="admin-page-container">
          {renderPage()}
        </section>

        <footer className="admin-footer">
          <span>© 2026 PeerTutor. All rights reserved.</span>
          <span>Administrator Portal</span>
        </footer>

      </main>
    </div>
  );
}

function App() {
  const [admin, setAdmin] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAdmin(null);
        setCheckingAuth(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().role === "admin") {
          setAdmin({
            uid: user.uid,
            email: user.email,
            role: "admin",
          });
        } else {
          setAdmin(null);
          await signOut(auth);
        }
      } catch (error) {
        console.error("Admin verification failed:", error);
        setAdmin(null);
        await signOut(auth);
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (checkingAuth) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner"></div>
        <p>Checking administrator access...</p>
      </div>
    );
  }

  return admin ? (
    <AdminDashboard admin={admin} />
  ) : (
    <AdminLogin onLogin={setAdmin} />
  );
}

export default App;
