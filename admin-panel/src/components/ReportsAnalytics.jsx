
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import {
  Users,
  GraduationCap,
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Monitor,
  MapPin,
  TrendingUp,
  Activity,
  BookOpen,
  CalendarDays,
} from "lucide-react";

import { db } from "../services/firebase";
import "./ReportsAnalytics.css";

function toDate(value) {
  if (!value) return null;

  try {
    const date =
      typeof value.toDate === "function"
        ? value.toDate()
        : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function formatDate(value) {
  const date = toDate(value);

  if (!date) return "Date not available";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatus(status) {
  return String(status || "Pending").toLowerCase();
}

function getStatusClass(status) {
  const value = getStatus(status);

  if (value === "accepted") return "accepted";
  if (value === "rejected") return "rejected";

  return "pending";
}

function getBookingDate(booking) {
  return toDate(booking.createdAt) || toDate(booking.preferredDate);
}

export default function ReportsAnalytics() {
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let loadedUsers = false;
    let loadedTutors = false;
    let loadedBookings = false;

    const checkLoaded = () => {
      if (loadedUsers && loadedTutors && loadedBookings) {
        setLoading(false);
      }
    };

    const handleError = (err) => {
      console.error("Reports data error:", err);
      setError(
        "Unable to load analytics data. Please check your Firestore security rules."
      );
      setLoading(false);
    };

    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const studentRecords = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .filter(
            (item) =>
              String(item.role || "").toLowerCase() === "student"
          );

        setStudents(studentRecords);
        loadedUsers = true;
        checkLoaded();
      },
      handleError
    );

    const unsubscribeTutors = onSnapshot(
      collection(db, "tutorProfiles"),
      (snapshot) => {
        setTutors(snapshot.docs);
        loadedTutors = true;
        checkLoaded();
      },
      handleError
    );

    const unsubscribeBookings = onSnapshot(
      collection(db, "bookings"),
      (snapshot) => {
        const records = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        records.sort((a, b) => {
          const dateA = toDate(a.createdAt)?.getTime() || 0;
          const dateB = toDate(b.createdAt)?.getTime() || 0;
          return dateB - dateA;
        });

        setBookings(records);
        loadedBookings = true;
        checkLoaded();
      },
      handleError
    );

    return () => {
      unsubscribeUsers();
      unsubscribeTutors();
      unsubscribeBookings();
    };
  }, []);

  const statusCounts = useMemo(() => {
    return {
      pending: bookings.filter(
        (item) => getStatus(item.status) === "pending"
      ).length,
      accepted: bookings.filter(
        (item) => getStatus(item.status) === "accepted"
      ).length,
      rejected: bookings.filter(
        (item) => getStatus(item.status) === "rejected"
      ).length,
    };
  }, [bookings]);

  const monthlyData = useMemo(() => {
    const now = new Date();

    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (5 - index),
        1
      );

      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString("en-US", {
          month: "short",
        }),
        year: date.getFullYear(),
        count: 0,
      };
    });

    bookings.forEach((booking) => {
      const date = toDate(booking.createdAt);

      if (!date) return;

      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const month = months.find((item) => item.key === key);

      if (month) month.count += 1;
    });

    return months;
  }, [bookings]);

  const teachingModes = useMemo(() => {
    const online = bookings.filter(
      (item) =>
        String(item.teachingMode || "").toLowerCase() === "online"
    ).length;

    const faceToFace = bookings.filter(
      (item) =>
        ["face-to-face", "face to face"].includes(
          String(item.teachingMode || "").toLowerCase()
        )
    ).length;

    return {
      online,
      faceToFace,
      other: bookings.length - online - faceToFace,
    };
  }, [bookings]);

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => {
        const dateA = toDate(a.createdAt)?.getTime() || 0;
        const dateB = toDate(b.createdAt)?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [bookings]);

  const maxMonthlyCount = Math.max(
    ...monthlyData.map((item) => item.count),
    1
  );

  const statCards = [
    {
      label: "Total Students",
      value: students.length,
      description: "Registered student accounts",
      icon: Users,
      color: "blue",
    },
    {
      label: "Total Tutors",
      value: tutors.length,
      description: "Registered tutor profiles",
      icon: GraduationCap,
      color: "purple",
    },
    {
      label: "Total Bookings",
      value: bookings.length,
      description: "All tutoring reservations",
      icon: CalendarCheck,
      color: "green",
    },
    {
      label: "Pending Bookings",
      value: statusCounts.pending,
      description: "Waiting for tutor response",
      icon: Clock,
      color: "orange",
    },
  ];

  const statusItems = [
    {
      label: "Pending",
      value: statusCounts.pending,
      color: "orange",
      icon: Clock,
    },
    {
      label: "Accepted",
      value: statusCounts.accepted,
      color: "green",
      icon: CheckCircle2,
    },
    {
      label: "Rejected",
      value: statusCounts.rejected,
      color: "red",
      icon: XCircle,
    },
  ];

  return (
    <section className="reports-page">
      <div className="reports-heading">
        <div>
          <span className="reports-eyebrow">PLATFORM INSIGHTS</span>
          <h1>Reports & Analytics</h1>
          <p>
            Monitor PeerTutor registrations, booking activity, and platform
            performance.
          </p>
        </div>

        <div className="reports-live-badge">
          <span />
          Live Analytics
        </div>
      </div>

      {error && <div className="reports-error">{error}</div>}

      <div className="reports-stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <article className="reports-stat-card" key={card.label}>
              <div className={`reports-stat-icon ${card.color}`}>
                <Icon size={22} />
              </div>

              <div className="reports-stat-content">
                <span>{card.label}</span>
                <strong>{loading ? "..." : card.value.toLocaleString()}</strong>
                <small>{card.description}</small>
              </div>
            </article>
          );
        })}
      </div>

      <div className="reports-charts-grid">
        <section className="reports-panel monthly-panel">
          <div className="reports-panel-heading">
            <div className="reports-panel-title-icon">
              <TrendingUp size={19} />
            </div>
            <div>
              <h2>Monthly Booking Trends</h2>
              <p>New booking requests over the last six months</p>
            </div>
          </div>

          {loading ? (
            <div className="reports-empty">Loading monthly data...</div>
          ) : (
            <div className="reports-monthly-chart">
              {monthlyData.map((month) => (
                <div className="reports-month-column" key={month.key}>
                  <strong>{month.count}</strong>

                  <div className="reports-bar-track">
                    <div
                      className="reports-month-bar"
                      style={{
                        height: `${
                          month.count === 0
                            ? 0
                            : Math.max(
                                (month.count / maxMonthlyCount) * 100,
                                5
                              )
                        }%`,
                      }}
                    />
                  </div>

                  <span>{month.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="reports-chart-note">
            <CalendarDays size={15} />
            Based on booking creation dates
          </div>
        </section>

        <section className="reports-panel status-panel">
          <div className="reports-panel-heading">
            <div className="reports-panel-title-icon">
              <Activity size={19} />
            </div>
            <div>
              <h2>Booking Status</h2>
              <p>Distribution of all reservations</p>
            </div>
          </div>

          <div className="reports-status-total">
            <strong>{loading ? "..." : bookings.length}</strong>
            <span>Total bookings</span>
          </div>

          <div className="reports-status-list">
            {statusItems.map((item) => {
              const Icon = item.icon;
              const percentage =
                bookings.length > 0
                  ? (item.value / bookings.length) * 100
                  : 0;

              return (
                <div className="reports-status-item" key={item.label}>
                  <div className="reports-status-info">
                    <span className={`reports-status-icon ${item.color}`}>
                      <Icon size={16} />
                    </span>

                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>

                  <div className="reports-progress-track">
                    <div
                      className={`reports-progress-fill ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="reports-bottom-grid">
        <section className="reports-panel teaching-panel">
          <div className="reports-panel-heading">
            <div className="reports-panel-title-icon">
              <BookOpen size={19} />
            </div>
            <div>
              <h2>Teaching Mode</h2>
              <p>Reservation preferences</p>
            </div>
          </div>

          <div className="reports-mode-card">
            <div className="reports-mode-icon online">
              <Monitor size={20} />
            </div>
            <div>
              <span>Online Sessions</span>
              <strong>{loading ? "..." : teachingModes.online}</strong>
            </div>
          </div>

          <div className="reports-mode-card">
            <div className="reports-mode-icon face">
              <MapPin size={20} />
            </div>
            <div>
              <span>Face-to-Face Sessions</span>
              <strong>{loading ? "..." : teachingModes.faceToFace}</strong>
            </div>
          </div>

          {teachingModes.other > 0 && (
            <p className="reports-other-mode">
              Other or unspecified: {teachingModes.other}
            </p>
          )}
        </section>

        <section className="reports-panel recent-panel">
          <div className="reports-panel-heading">
            <div className="reports-panel-title-icon">
              <Activity size={19} />
            </div>
            <div>
              <h2>Recent Booking Activities</h2>
              <p>Latest five booking records</p>
            </div>
          </div>

          {loading ? (
            <div className="reports-empty">Loading recent activities...</div>
          ) : recentBookings.length === 0 ? (
            <div className="reports-empty">
              No booking activities available yet.
            </div>
          ) : (
            <div className="reports-recent-list">
              {recentBookings.map((booking) => (
                <div className="reports-recent-item" key={booking.id}>
                  <div className="reports-recent-icon">
                    <CalendarCheck size={17} />
                  </div>

                  <div className="reports-recent-details">
                    <strong>
                      {booking.studentName || "Unknown Student"}
                    </strong>
                    <span>
                      {booking.subject || "Unspecified subject"} ·{" "}
                      {booking.tutorName || "Unknown Tutor"}
                    </span>
                    <small>{formatDate(booking.createdAt)}</small>
                  </div>

                  <span
                    className={`reports-recent-status ${getStatusClass(
                      booking.status
                    )}`}
                  >
                    {booking.status || "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="reports-footer-note">
        <Activity size={16} />
        Analytics update automatically when Firestore records change.
      </div>
    </section>
  );
}
