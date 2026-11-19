import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";

import {
  Users,
  GraduationCap,
  CalendarCheck,
  Clock,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  Menu,
  X,
  Activity,
  ChevronRight,
  Search,
  Eye,
  Mail,
  Phone,
  UserRound,
  CalendarDays,
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  Wallet,
  Award,
} from "lucide-react";

import { auth, db } from "./services/firebase";
import AdminLogin from "./pages/AdminLogin";
import BookingManagement from "./components/BookingManagement";
import "./App.css";

/* =====================================
   HELPER FUNCTIONS
===================================== */

function getStudentName(student) {
  const fullName = student.fullName || student.name;

  if (fullName) return fullName;

  return [
    student.firstName,
    student.middleName,
    student.lastName,
    student.suffix,
  ]
    .filter(Boolean)
    .join(" ") || "Name not provided";
}

function getTutorName(tutor) {
  const fullName = tutor.fullName || tutor.name;

  if (fullName) return fullName;

  return [
    tutor.firstName,
    tutor.middleName,
    tutor.lastName,
    tutor.suffix,
  ]
    .filter(Boolean)
    .join(" ") || "Name not provided";
}

function formatRegistrationDate(person) {
  const dateValue =
    person.createdAt ||
    person.registeredAt ||
    person.dateCreated ||
    person.created_at;

  if (!dateValue) return "Not available";

  try {
    const date =
      typeof dateValue.toDate === "function"
        ? dateValue.toDate()
        : new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Not available";
  }
}

function getTutorSubjects(tutor) {
  const subjects = tutor.subjects || tutor.subject || tutor.specialization;

  if (Array.isArray(subjects)) {
    return subjects.join(", ");
  }

  if (typeof subjects === "string") {
    return subjects;
  }

  return "Not specified";
}

/* =====================================
   STUDENT PROFILE MODAL
===================================== */

function StudentProfileModal({ student, onClose }) {
  if (!student) return null;

  const details = [
    {
      label: "Student ID",
      value: student.uid || student.id,
      icon: UserRound,
    },
    {
      label: "Full Name",
      value: getStudentName(student),
      icon: Users,
    },
    {
      label: "Email Address",
      value: student.email || "Not provided",
      icon: Mail,
    },
    {
      label: "Gender",
      value: student.gender || "Not provided",
      icon: UserRound,
    },
    {
      label: "Contact Number",
      value: student.contactNumber || "Not provided",
      icon: Phone,
    },
    {
      label: "Date Registered",
      value: formatRegistrationDate(student),
      icon: CalendarDays,
    },
  ];

  return (
    <div className="student-modal-overlay" onClick={onClose}>
      <div
        className="student-profile-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="student-modal-header">
          <div>
            <span className="modal-eyebrow">STUDENT INFORMATION</span>
            <h2>Student Profile</h2>
            <p>View the student's account details.</p>
          </div>

          <button
            className="student-modal-close"
            onClick={onClose}
            aria-label="Close profile"
          >
            <X size={21} />
          </button>
        </div>

        <div className="student-profile-summary">
          <div className="student-profile-avatar">
            <UserRound size={27} />
          </div>

          <div>
            <h3>{getStudentName(student)}</h3>
            <p>{student.email || "No email address"}</p>
          </div>

          <span className="student-status-badge">Student</span>
        </div>

        <div className="student-detail-grid">
          {details.map((detail) => {
            const Icon = detail.icon;

            return (
              <div className="student-detail-item" key={detail.label}>
                <div className="student-detail-icon">
                  <Icon size={17} />
                </div>

                <div>
                  <span>{detail.label}</span>
                  <strong>{detail.value}</strong>
                </div>
              </div>
            );
          })}
        </div>

        <div className="student-modal-footer">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* =====================================
   TUTOR PROFILE MODAL
===================================== */

function TutorProfileModal({ tutor, onClose }) {
  if (!tutor) return null;

  const details = [
    {
      label: "Tutor ID",
      value: tutor.uid || tutor.id,
      icon: UserRound,
    },
    {
      label: "Full Name",
      value: getTutorName(tutor),
      icon: Users,
    },
    {
      label: "Email Address",
      value: tutor.email || "Not provided",
      icon: Mail,
    },
    {
      label: "Gender",
      value: tutor.gender || "Not provided",
      icon: UserRound,
    },
    {
      label: "Contact Number",
      value: tutor.contactNumber || tutor.phone || "Not provided",
      icon: Phone,
    },
    {
      label: "Subject / Specialization",
      value: getTutorSubjects(tutor),
      icon: BookOpen,
    },
    {
      label: "Experience",
      value: tutor.experience || tutor.yearsOfExperience || "Not provided",
      icon: BriefcaseBusiness,
    },
    {
      label: "Hourly Rate",
      value:
        tutor.hourlyRate || tutor.rate
          ? `₱${tutor.hourlyRate || tutor.rate}`
          : "Not provided",
      icon: Wallet,
    },
    {
      label: "Qualification",
      value: tutor.qualification || tutor.education || "Not provided",
      icon: Award,
    },
    {
      label: "Date Registered",
      value: formatRegistrationDate(tutor),
      icon: CalendarDays,
    },
  ];

  return (
    <div className="student-modal-overlay" onClick={onClose}>
      <div
        className="student-profile-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="student-modal-header">
          <div>
            <span className="modal-eyebrow">TUTOR INFORMATION</span>
            <h2>Tutor Profile</h2>
            <p>View the tutor's profile and teaching information.</p>
          </div>

          <button
            className="student-modal-close"
            onClick={onClose}
            aria-label="Close profile"
          >
            <X size={21} />
          </button>
        </div>

        <div className="student-profile-summary">
          <div className="student-profile-avatar">
            <GraduationCap size={27} />
          </div>

          <div>
            <h3>{getTutorName(tutor)}</h3>
            <p>{tutor.email || "No email address"}</p>
          </div>

          <span className="student-status-badge">Tutor</span>
        </div>

        <div className="student-detail-grid">
          {details.map((detail) => {
            const Icon = detail.icon;

            return (
              <div className="student-detail-item" key={detail.label}>
                <div className="student-detail-icon">
                  <Icon size={17} />
                </div>

                <div>
                  <span>{detail.label}</span>
                  <strong>{detail.value}</strong>
                </div>
              </div>
            );
          })}
        </div>

        {tutor.bio && (
          <div className="tutor-bio-section">
            <strong>About the Tutor</strong>
            <p>{tutor.bio}</p>
          </div>
        )}

        <div className="student-modal-footer">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* =====================================
   ADMIN DASHBOARD
===================================== */

function AdminDashboard({ admin }) {
  const [stats, setStats] = useState({
    students: 0,
    tutors: 0,
    bookings: 0,
    pending: 0,
  });

  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTutor, setSelectedTutor] = useState(null);

  const [activePage, setActivePage] = useState("dashboard");
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingTutors, setLoadingTutors] = useState(true);

  const [dataError, setDataError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* =====================================
     FIRESTORE REAL-TIME LISTENERS
  ===================================== */

  useEffect(() => {
    let usersLoaded = false;
    let tutorsLoaded = false;
    let bookingsLoaded = false;

    const checkLoading = () => {
      if (usersLoaded && tutorsLoaded && bookingsLoaded) {
        setLoadingStats(false);
      }
    };

    const handleError = (error) => {
      console.error("Dashboard data error:", error);

      setDataError(
        "Unable to load dashboard records. Please check your Firestore security rules."
      );

      setLoadingStats(false);
      setLoadingStudents(false);
      setLoadingTutors(false);
    };

    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const allStudents = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .filter(
            (student) =>
              String(student.role || "").toLowerCase() === "student"
          );

        setStudents(allStudents);

        setStats((previous) => ({
          ...previous,
          students: allStudents.length,
        }));

        usersLoaded = true;
        setLoadingStudents(false);
        checkLoading();
      },
      handleError
    );

    const unsubscribeTutors = onSnapshot(
      collection(db, "tutorProfiles"),
      (snapshot) => {
        const allTutors = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setTutors(allTutors);

        setStats((previous) => ({
          ...previous,
          tutors: allTutors.length,
        }));

        tutorsLoaded = true;
        setLoadingTutors(false);
        checkLoading();
      },
      handleError
    );

    const unsubscribeBookings = onSnapshot(
      collection(db, "bookings"),
      (snapshot) => {
        const pending = snapshot.docs.filter(
          (item) =>
            String(item.data().status || "").toLowerCase() === "pending"
        ).length;

        setStats((previous) => ({
          ...previous,
          bookings: snapshot.size,
          pending,
        }));

        bookingsLoaded = true;
        checkLoading();
      },
      handleError
    );

    return () => {
      unsubscribeUsers();
      unsubscribeTutors();
      unsubscribeBookings();
    };
  }, []);

  /* =====================================
     SEARCH STUDENTS
  ===================================== */

  const filteredStudents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return students;

    return students.filter((student) => {
      const searchableValues = [
        getStudentName(student),
        student.email,
        student.uid,
        student.id,
        student.gender,
      ];

      return searchableValues.some((value) =>
        String(value || "").toLowerCase().includes(search)
      );
    });
  }, [students, searchTerm]);

  /* =====================================
     SEARCH TUTORS
  ===================================== */

  const filteredTutors = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return tutors;

    return tutors.filter((tutor) => {
      const searchableValues = [
        getTutorName(tutor),
        tutor.email,
        tutor.uid,
        tutor.id,
        tutor.gender,
        getTutorSubjects(tutor),
        tutor.specialization,
      ];

      return searchableValues.some((value) =>
        String(value || "").toLowerCase().includes(search)
      );
    });
  }, [tutors, searchTerm]);

  /* =====================================
     ACTIONS
  ===================================== */

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const openPage = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
    setSearchTerm("");
    setSelectedStudent(null);
    setSelectedTutor(null);
  };

  /* =====================================
     DASHBOARD STAT CARDS
  ===================================== */

  const statCards = [
    {
      title: "Total Students",
      value: stats.students,
      description: "Registered student accounts",
      icon: Users,
      color: "blue",
    },
    {
      title: "Total Tutors",
      value: stats.tutors,
      description: "Available tutor profiles",
      icon: GraduationCap,
      color: "purple",
    },
    {
      title: "Total Bookings",
      value: stats.bookings,
      description: "All tutoring reservations",
      icon: CalendarCheck,
      color: "green",
    },
    {
      title: "Pending Bookings",
      value: stats.pending,
      description: "Waiting for tutor response",
      icon: Clock,
      color: "orange",
    },
  ];

  /* =====================================
     MAIN RENDER
  ===================================== */

  return (
    <div className="admin-layout">
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <GraduationCap size={25} />
          </div>

          <div className="sidebar-brand-text">
            <h2>PeerTutor</h2>
            <span>ADMINISTRATION</span>
          </div>

          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-section-label">MAIN MENU</div>

        <nav className="sidebar-navigation">
          <button
            className={`sidebar-nav-item ${
              activePage === "dashboard" ? "active" : ""
            }`}
            onClick={() => openPage("dashboard")}
          >
            <LayoutDashboard size={19} />
            <span>Dashboard Overview</span>
          </button>

          <button
            className={`sidebar-nav-item ${
              activePage === "students" ? "active" : ""
            }`}
            onClick={() => openPage("students")}
          >
            <Users size={19} />
            <span>Student Management</span>
          </button>

          <button
            className={`sidebar-nav-item ${
              activePage === "tutors" ? "active" : ""
            }`}
            onClick={() => openPage("tutors")}
          >
            <GraduationCap size={19} />
            <span>Tutor Management</span>
          </button>

          <button
            className={`sidebar-nav-item ${
              activePage === "bookings" ? "active" : ""
            }`}
            onClick={() => openPage("bookings")}
          >
            <CalendarCheck size={19} />
            <span>Booking Management</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-admin-card">
            <div className="sidebar-admin-avatar">
              <ShieldCheck size={20} />
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
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>

          <div className="sidebar-version">
            PeerTutor Admin Panel · v1.0
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <div className="admin-main-content">
        {/* TOPBAR */}

        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={23} />
            </button>

            <div className="topbar-breadcrumb">
              <span>PeerTutor</span>
              <ChevronRight size={15} />

              <strong>
                {activePage === "dashboard"
                  ? "Dashboard"
                  : activePage === "students"
                  ? "Student Management"
                  : activePage === "tutors"
                  ? "Tutor Management"
                  : "Booking Management"}
              </strong>
            </div>
          </div>

          <div className="topbar-right">
            <div className="admin-status">
              <span className="status-dot" />
              System Online
            </div>

            <div className="topbar-divider" />

            <div className="topbar-user">
              <div className="topbar-avatar">
                <ShieldCheck size={19} />
              </div>

              <div className="topbar-user-info">
                <strong>Administrator</strong>
                <span>{admin.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}

        <main className="admin-page-container">
          {/* DASHBOARD */}

          {activePage === "dashboard" && (
            <>
              <section className="dashboard-welcome">
                <div>
                  <span className="dashboard-eyebrow">
                    ADMINISTRATION PANEL
                  </span>

                  <h1>Dashboard Overview</h1>

                  <p>
                    Welcome back! Here's an overview of your PeerTutor platform.
                  </p>
                </div>

                <div className="dashboard-live-indicator">
                  <span className="status-dot" />
                  Live Dashboard
                </div>
              </section>

              <section className="dashboard-account-card">
                <div className="account-card-icon">
                  <ShieldCheck size={23} />
                </div>

                <div className="account-card-info">
                  <span>Signed in as</span>
                  <strong>{admin.email}</strong>
                </div>

                <span className="admin-role-badge">
                  <ShieldCheck size={14} />
                  Admin Account
                </span>
              </section>

              <section className="dashboard-section">
                <div className="section-heading">
                  <div>
                    <h2>Platform Statistics</h2>
                    <p>Monitor your platform activity and records.</p>
                  </div>

                  <div className="section-live-label">
                    <Activity size={15} />
                    Real-time data
                  </div>
                </div>

                {dataError && (
                  <div className="admin-data-error">{dataError}</div>
                )}

                <div className="admin-stats">
                  {statCards.map((card) => {
                    const Icon = card.icon;

                    return (
                      <article className="admin-stat-card" key={card.title}>
                        <div className="stat-card-top">
                          <div className={`admin-stat-icon ${card.color}`}>
                            <Icon size={23} />
                          </div>

                          <span className="stat-card-indicator">
                            <span className="status-dot" />
                            Live
                          </span>
                        </div>

                        <div className="admin-stat-info">
                          <h3>{card.title}</h3>

                          <p>
                            {loadingStats
                              ? "..."
                              : card.value.toLocaleString()}
                          </p>

                          <span>{card.description}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="dashboard-system-notice">
                <div className="notice-icon">
                  <Activity size={21} />
                </div>

                <div>
                  <strong>Live Dashboard Updates</strong>
                  <p>
                    Your statistics are connected to the PeerTutor Firestore
                    database. Changes to records are reflected automatically.
                  </p>
                </div>

                <span className="notice-status">Connected</span>
              </section>
            </>
          )}

          {/* STUDENT MANAGEMENT */}

          {activePage === "students" && (
            <section className="student-management-page">
              <div className="student-page-heading">
                <div>
                  <span className="dashboard-eyebrow">
                    USER MANAGEMENT
                  </span>

                  <h1>Student Management</h1>

                  <p>
                    View and manage student account information.
                  </p>
                </div>

                <button
                  className="student-back-button"
                  onClick={() => openPage("dashboard")}
                >
                  <ArrowLeft size={16} />
                  Back to Dashboard
                </button>
              </div>

              <div className="student-summary-card">
                <div className="student-summary-icon">
                  <Users size={23} />
                </div>

                <div>
                  <span>Total Registered Students</span>

                  <strong>
                    {loadingStudents ? "..." : students.length}
                  </strong>
                </div>
              </div>

              <div className="student-table-panel">
                <div className="student-table-heading">
                  <div>
                    <h2>Student Records</h2>
                    <p>
                      All registered student accounts in PeerTutor.
                    </p>
                  </div>

                  <span className="student-record-count">
                    {filteredStudents.length} records
                  </span>
                </div>

                <div className="student-search-wrapper">
                  <Search size={18} />

                  <input
                    type="text"
                    placeholder="Search by name, email, ID, or gender..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />

                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      aria-label="Clear search"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>

                {dataError && (
                  <div className="admin-data-error">{dataError}</div>
                )}

                <div className="student-table-scroll">
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>STUDENT</th>
                        <th>STUDENT ID</th>
                        <th>GENDER</th>
                        <th>DATE REGISTERED</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loadingStudents ? (
                        <tr>
                          <td colSpan="5" className="student-table-message">
                            Loading student records...
                          </td>
                        </tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="student-table-message">
                            {searchTerm
                              ? "No students match your search."
                              : "No student records found."}
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => (
                          <tr key={student.id}>
                            <td>
                              <div className="student-table-person">
                                <div className="student-table-avatar">
                                  <UserRound size={18} />
                                </div>

                                <div>
                                  <strong>{getStudentName(student)}</strong>
                                  <span>
                                    {student.email || "No email provided"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className="student-id-text">
                                {(student.uid || student.id).slice(0, 12)}...
                              </span>
                            </td>

                            <td>
                              <span className="student-gender">
                                {student.gender || "Not specified"}
                              </span>
                            </td>

                            <td>
                              <span className="student-date">
                                {formatRegistrationDate(student)}
                              </span>
                            </td>

                            <td>
                              <button
                                className="student-view-button"
                                onClick={() => setSelectedStudent(student)}
                              >
                                <Eye size={15} />
                                View Profile
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="student-table-footer">
                  <span>
                    Showing {filteredStudents.length} of {students.length} students
                  </span>

                  <span className="student-readonly-label">
                    <ShieldCheck size={14} />
                    Read-only records
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* TUTOR MANAGEMENT */}

          {activePage === "tutors" && (
            <section className="student-management-page">
              <div className="student-page-heading">
                <div>
                  <span className="dashboard-eyebrow">
                    USER MANAGEMENT
                  </span>

                  <h1>Tutor Management</h1>

                  <p>
                    View registered tutors and their teaching profile information.
                  </p>
                </div>

                <button
                  className="student-back-button"
                  onClick={() => openPage("dashboard")}
                >
                  <ArrowLeft size={16} />
                  Back to Dashboard
                </button>
              </div>

              <div className="student-summary-card">
                <div className="student-summary-icon">
                  <GraduationCap size={23} />
                </div>

                <div>
                  <span>Total Registered Tutors</span>

                  <strong>
                    {loadingTutors ? "..." : tutors.length}
                  </strong>
                </div>
              </div>

              <div className="student-table-panel">
                <div className="student-table-heading">
                  <div>
                    <h2>Tutor Records</h2>
                    <p>
                      All tutor profiles registered in PeerTutor.
                    </p>
                  </div>

                  <span className="student-record-count">
                    {filteredTutors.length} records
                  </span>
                </div>

                <div className="student-search-wrapper">
                  <Search size={18} />

                  <input
                    type="text"
                    placeholder="Search by name, email, ID, or subject..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />

                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      aria-label="Clear search"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>

                {dataError && (
                  <div className="admin-data-error">{dataError}</div>
                )}

                <div className="student-table-scroll">
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>TUTOR</th>
                        <th>TUTOR ID</th>
                        <th>SUBJECT / SPECIALIZATION</th>
                        <th>DATE REGISTERED</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loadingTutors ? (
                        <tr>
                          <td colSpan="5" className="student-table-message">
                            Loading tutor records...
                          </td>
                        </tr>
                      ) : filteredTutors.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="student-table-message">
                            {searchTerm
                              ? "No tutors match your search."
                              : "No tutor profiles found."}
                          </td>
                        </tr>
                      ) : (
                        filteredTutors.map((tutor) => (
                          <tr key={tutor.id}>
                            <td>
                              <div className="student-table-person">
                                <div className="student-table-avatar">
                                  <GraduationCap size={18} />
                                </div>

                                <div>
                                  <strong>{getTutorName(tutor)}</strong>
                                  <span>
                                    {tutor.email || "No email provided"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className="student-id-text">
                                {(tutor.uid || tutor.id).slice(0, 12)}...
                              </span>
                            </td>

                            <td>
                              <span className="student-gender">
                                {getTutorSubjects(tutor)}
                              </span>
                            </td>

                            <td>
                              <span className="student-date">
                                {formatRegistrationDate(tutor)}
                              </span>
                            </td>

                            <td>
                              <button
                                className="student-view-button"
                                onClick={() => setSelectedTutor(tutor)}
                              >
                                <Eye size={15} />
                                View Profile
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="student-table-footer">
                  <span>
                    Showing {filteredTutors.length} of {tutors.length} tutors
                  </span>

                  <span className="student-readonly-label">
                    <ShieldCheck size={14} />
                    Read-only records
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* BOOKING MANAGEMENT */}
          {activePage === "bookings" && <BookingManagement />}
        </main>

        {/* FOOTER */}

        <footer className="admin-footer">
          <span>© 2026 PeerTutor. All rights reserved.</span>
          <span>Admin Dashboard</span>
        </footer>
      </div>

      {/* MODALS */}

      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {selectedTutor && (
        <TutorProfileModal
          tutor={selectedTutor}
          onClose={() => setSelectedTutor(null)}
        />
      )}
    </div>
  );
}

/* =====================================
   APP AUTHENTICATION
===================================== */

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
        <div className="admin-loading-spinner" />
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