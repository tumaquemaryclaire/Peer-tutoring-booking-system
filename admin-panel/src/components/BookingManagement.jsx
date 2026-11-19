import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import {
  Search,
  CalendarDays,
  Clock,
  BookOpen,
  UserRound,
  GraduationCap,
  Eye,
  X,
  Monitor,
  MapPin,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

import { db } from "../services/firebase";
import "./BookingManagement.css";

function formatDate(value) {
  if (!value) return "Not specified";

  try {
    if (typeof value.toDate === "function") {
      value = value.toDate();
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not specified";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Not specified";
  }
}

function getStatusClass(status) {
  const value = String(status || "Pending").toLowerCase();

  if (value === "accepted") return "accepted";
  if (value === "rejected") return "rejected";

  return "pending";
}

function BookingDetailsModal({ booking, onClose }) {
  if (!booking) return null;

  const details = [
    { label: "Booking ID", value: booking.id, icon: CalendarDays },
    { label: "Student", value: booking.studentName || "Not provided", icon: UserRound },
    { label: "Student Email", value: booking.studentEmail || "Not provided", icon: UserRound },
    { label: "Tutor", value: booking.tutorName || "Not provided", icon: GraduationCap },
    { label: "Subject", value: booking.subject || "Not specified", icon: BookOpen },
    {
      label: "Teaching Mode",
      value: booking.teachingMode || "Not specified",
      icon: booking.teachingMode === "Online" ? Monitor : MapPin,
    },
    { label: "Preferred Date", value: formatDate(booking.preferredDate), icon: CalendarDays },
    { label: "Preferred Time", value: booking.preferredTime || "Not specified", icon: Clock },
  ];

  return (
    <div className="student-modal-overlay" onClick={onClose}>
      <div
        className="student-profile-modal booking-details-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="student-modal-header">
          <div>
            <span className="modal-eyebrow">BOOKING INFORMATION</span>
            <h2>Booking Details</h2>
            <p>View the complete tutoring reservation information.</p>
          </div>

          <button
            className="student-modal-close"
            onClick={onClose}
            aria-label="Close booking details"
          >
            <X size={21} />
          </button>
        </div>

        <div className="booking-modal-status">
          <span className={`booking-status ${getStatusClass(booking.status)}`}>
            {booking.status || "Pending"}
          </span>
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

        {booking.message && (
          <div className="booking-message-section">
            <div className="student-detail-icon">
              <MessageSquare size={17} />
            </div>

            <div>
              <strong>Student Message</strong>
              <p>{booking.message}</p>
            </div>
          </div>
        )}

        <div className="student-modal-footer">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "bookings"),
      (snapshot) => {
        const records = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        records.sort((a, b) => {
          const dateA = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(a.createdAt || 0);

          const dateB = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(b.createdAt || 0);

          return dateB - dateA;
        });

        setBookings(records);
        setLoading(false);
        setRefreshing(false);
        setError("");
      },
      (err) => {
        console.error("Booking records error:", err);
        setError(
          "Unable to load booking records. Please check Firestore permissions."
        );
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredBookings = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesStatus =
        statusFilter === "All" ||
        String(booking.status || "Pending").toLowerCase() ===
          statusFilter.toLowerCase();

      const values = [
        booking.studentName,
        booking.studentEmail,
        booking.tutorName,
        booking.subject,
        booking.teachingMode,
        booking.status,
        booking.id,
      ];

      const matchesSearch =
        !search ||
        values.some((value) =>
          String(value || "").toLowerCase().includes(search)
        );

      return matchesStatus && matchesSearch;
    });
  }, [bookings, searchTerm, statusFilter]);

  const pendingCount = bookings.filter(
    (item) => String(item.status || "Pending").toLowerCase() === "pending"
  ).length;

  const acceptedCount = bookings.filter(
    (item) => String(item.status || "").toLowerCase() === "accepted"
  ).length;

  const rejectedCount = bookings.filter(
    (item) => String(item.status || "").toLowerCase() === "rejected"
  ).length;

  const handleRefresh = () => {
    setRefreshing(true);
    // Firestore onSnapshot already updates records in real time.
    // This button provides visual feedback while the listener remains active.
    setTimeout(() => setRefreshing(false), 600);
  };

  const summaryCards = [
    {
      title: "Total Bookings",
      value: bookings.length,
      icon: CalendarDays,
      color: "blue",
      description: "All reservations",
    },
    {
      title: "Pending",
      value: pendingCount,
      icon: Clock,
      color: "orange",
      description: "Awaiting response",
    },
    {
      title: "Accepted",
      value: acceptedCount,
      icon: BookOpen,
      color: "green",
      description: "Confirmed sessions",
    },
    {
      title: "Rejected",
      value: rejectedCount,
      icon: X,
      color: "red",
      description: "Declined requests",
    },
  ];

  return (
    <section className="booking-page">
      <div className="booking-page-heading">
        <div>
          <span className="booking-eyebrow">PLATFORM RECORDS</span>
          <h1>Booking Management</h1>
          <p>Monitor all tutoring reservations made through PeerTutor.</p>
        </div>

        <button
          className="booking-refresh-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "booking-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {error && <div className="booking-error">{error}</div>}

      <div className="booking-summary-grid">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article className="booking-summary-card" key={card.title}>
              <div className={`booking-summary-icon ${card.color}`}>
                <Icon size={23} />
              </div>

              <div className="booking-summary-content">
                <span>{card.title}</span>
                <strong>{loading ? "..." : card.value}</strong>
                <small>{card.description}</small>
              </div>
            </article>
          );
        })}
      </div>

      <div className="booking-records-panel">
        <div className="booking-records-heading">
          <div>
            <h2>Booking Records</h2>
            <p>All student tutoring reservations.</p>
          </div>

          <span className="booking-record-count">
            {filteredBookings.length} records
          </span>
        </div>

        <div className="booking-filter-row">
          <div className="booking-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search student, tutor, subject, or booking ID..."
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

          <select
            className="booking-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="booking-table-scroll">
          <table className="booking-table">
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>TUTOR</th>
                <th>SUBJECT</th>
                <th>SESSION</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="booking-table-message">
                    Loading booking records...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="booking-table-message">
                    No booking records found.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div className="booking-person">
                        <div className="booking-person-avatar student">
                          <UserRound size={18} />
                        </div>
                        <div>
                          <strong>
                            {booking.studentName || "Unknown Student"}
                          </strong>
                          <span>
                            {booking.studentEmail || "No email provided"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="booking-person">
                        <div className="booking-person-avatar tutor">
                          <GraduationCap size={18} />
                        </div>
                        <div>
                          <strong>
                            {booking.tutorName || "Unknown Tutor"}
                          </strong>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="booking-subject">
                        {booking.subject || "Not specified"}
                      </span>
                    </td>

                    <td>
                      <div className="booking-session-info">
                        <strong>{formatDate(booking.preferredDate)}</strong>
                        <span>{booking.preferredTime || "Time not specified"}</span>
                        <span>{booking.teachingMode || "Not specified"}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`booking-status ${getStatusClass(
                          booking.status
                        )}`}
                      >
                        {booking.status || "Pending"}
                      </span>
                    </td>

                    <td>
                      <button
                        className="booking-view-button"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="booking-table-footer">
          <span>
            Showing {filteredBookings.length} of {bookings.length} bookings
          </span>

          <span className="booking-readonly-label">
            <span className="booking-live-dot" />
            Live records · Read only
          </span>
        </div>
      </div>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </section>
  );
}