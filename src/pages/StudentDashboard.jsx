
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc
} from "firebase/firestore";

import {
  LayoutDashboard,
  Search,
  CalendarDays,
  MessagesSquare,
  Bell,
  UserRound,
  LogOut,
  Pencil,
  Save,
  X,
  Mail,
  Phone,
  User
} from "lucide-react";

import { logoutUser } from "../services/auth";
import { db } from "../services/firebase";
import Messenger from "../components/Messenger";

import "./StudentDashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");

  const [tutors, setTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);

  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const [selectedTutor, setSelectedTutor] = useState(null);

  // STUDENT PROFILE STATES
  const [profileForm, setProfileForm] = useState({
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  contactNumber: ""
});

  const [editingProfile, setEditingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    subject: "",
    teachingMode: "",
    preferredDate: "",
    preferredTime: "",
    message: ""
  });

  const [submittingBooking, setSubmittingBooking] = useState(false);

  // SIDEBAR MENU
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Find Tutors", icon: Search },
    { name: "My Bookings", icon: CalendarDays },
    { name: "Messages", icon: MessagesSquare },
    { name: "Notifications", icon: Bell },
    { name: "My Profile", icon: UserRound }
  ];

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

  // LOAD STUDENT PROFILE FROM FIRESTORE
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoadingProfile(true);

    const userRef = doc(db, "users", currentUser.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data();

          setProfileForm({
  firstName: userData.firstName || "",
  middleName: userData.middleName || "",
  lastName: userData.lastName || "",
  suffix: userData.suffix || "",
  contactNumber: userData.contactNumber || ""
});

          const updatedUser = {
            ...currentUser,
            ...userData,
            uid: currentUser.uid
          };

          setCurrentUser(updatedUser);

          sessionStorage.setItem(
            "pt_current_user",
            JSON.stringify(updatedUser)
          );
        }

        setLoadingProfile(false);
      },
      (error) => {
        console.error("Error loading student profile:", error);
        setLoadingProfile(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // LOAD ACTIVE TUTORS
  useEffect(() => {
    if (!currentUser?.uid) return;

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
  }, [currentUser?.uid]);

  // LOAD STUDENT BOOKINGS
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoadingBookings(true);

    const bookingsQuery = query(
      collection(db, "bookings"),
      where("studentUid", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const bookings = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data()
        }));

        bookings.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });

        setMyBookings(bookings);
        setLoadingBookings(false);
      },
      (error) => {
        console.error("Error loading student bookings:", error);
        setLoadingBookings(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // LOAD STUDENT NOTIFICATIONS
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoadingNotifications(true);

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("recipientUid", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationList = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data()
        }));

        notificationList.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });

        setNotifications(notificationList);
        setLoadingNotifications(false);
      },
      (error) => {
        console.error("Error loading notifications:", error);
        setLoadingNotifications(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

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

  // HANDLE PROFILE INPUTS
  function handleProfileChange(e) {
    const { name, value } = e.target;

    setProfileForm((previousForm) => ({
      ...previousForm,
      [name]: value
    }));
  }

  // ENABLE PROFILE EDITING
  function handleEditProfile() {
    setProfileForm({
  firstName: currentUser.firstName || "",
  middleName: currentUser.middleName || "",
  lastName: currentUser.lastName || "",
  suffix: currentUser.suffix || "",
  contactNumber: currentUser.contactNumber || ""
});

    setEditingProfile(true);
  }

  // CANCEL PROFILE EDITING
  function handleCancelProfile() {
    setProfileForm({
  firstName: currentUser.firstName || "",
  middleName: currentUser.middleName || "",
  lastName: currentUser.lastName || "",
  suffix: currentUser.suffix || "",
  contactNumber: currentUser.contactNumber || ""
});

    setEditingProfile(false);
  }

  // SAVE PROFILE CHANGES
  async function handleSaveProfile(e) {
    e.preventDefault();

    if (!currentUser?.uid) {
      alert("Unable to identify your account.");
      return;
    }

    const firstName = profileForm.firstName.trim();
    const lastName = profileForm.lastName.trim();
    const contactNumber = profileForm.contactNumber.trim();

    if (!firstName || !lastName || !contactNumber) {
      alert("Please complete all profile fields.");
      return;
    }

    setSavingProfile(true);

    try {
      const fullName = [
  firstName,
  profileForm.middleName.trim(),
  lastName
].filter(Boolean).join(" ") +
  (profileForm.suffix.trim()
    ? `, ${profileForm.suffix.trim()}`
    : "");

const userRef = doc(db, "users", currentUser.uid);

await updateDoc(userRef, {
  firstName,
  middleName: profileForm.middleName.trim(),
  lastName,
  suffix: profileForm.suffix.trim(),
  fullName,
  contactNumber
});

const updatedUser = {
  ...currentUser,
  firstName,
  middleName: profileForm.middleName.trim(),
  lastName,
  suffix: profileForm.suffix.trim(),
  fullName,
  contactNumber
};

setCurrentUser(updatedUser);

sessionStorage.setItem(
  "pt_current_user",
  JSON.stringify(updatedUser)
);

setEditingProfile(false);

alert("Your profile has been updated successfully!");
    } finally {
      setSavingProfile(false);
    }
  }

  // OPEN BOOKING FORM
  function openBookingForm(tutor) {
    setSelectedTutor(tutor);

    setBookingForm({
      subject: tutor.subjects?.[0] || "",
      teachingMode: "",
      preferredDate: "",
      preferredTime: "",
      message: ""
    });
  }

  // CLOSE BOOKING FORM
  function closeBookingForm() {
    if (submittingBooking) return;
    setSelectedTutor(null);
  }

  // HANDLE BOOKING FORM INPUTS
  function handleBookingChange(e) {
    const { name, value } = e.target;

    setBookingForm((previousForm) => ({
      ...previousForm,
      [name]: value
    }));
  }

  // SUBMIT BOOKING REQUEST
  async function handleBookingSubmit(e) {
    e.preventDefault();

    if (!currentUser?.uid || !selectedTutor) {
      alert("Unable to identify your account or selected tutor.");
      return;
    }

    if (
      !bookingForm.subject.trim() ||
      !bookingForm.teachingMode ||
      !bookingForm.preferredDate ||
      !bookingForm.preferredTime
    ) {
      alert("Please complete all required fields.");
      return;
    }

    setSubmittingBooking(true);

    try {
      const tutorName =
        selectedTutor.fullName ||
        [
          selectedTutor.firstName || "",
          selectedTutor.middleName || "",
          selectedTutor.lastName || ""
        ].filter(Boolean).join(" ") +
        (selectedTutor.suffix ? `, ${selectedTutor.suffix}` : "");

      const studentName =
        currentUser.fullName ||
        currentUser.name ||
        [
          currentUser.firstName || "",
          currentUser.middleName || "",
          currentUser.lastName || ""
        ].filter(Boolean).join(" ") +
        (currentUser.suffix ? `, ${currentUser.suffix}` : "");

      const bookingRef = await addDoc(collection(db, "bookings"), {
        studentUid: currentUser.uid,
        studentName,
        studentEmail: currentUser.email || "",

        tutorUid: selectedTutor.id,
        tutorName,

        subject: bookingForm.subject.trim(),
        teachingMode: bookingForm.teachingMode,
        preferredDate: bookingForm.preferredDate,
        preferredTime: bookingForm.preferredTime,
        message: bookingForm.message.trim(),

        status: "Pending",
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "notifications"), {
        recipientUid: selectedTutor.id,
        senderUid: currentUser.uid,
        title: "New Booking Request",
        message: `${studentName} sent you a tutoring request for ${bookingForm.subject.trim()}.`,
        type: "Pending",
        bookingId: bookingRef.id,
        read: false,
        createdAt: serverTimestamp()
      });

      alert("Booking request submitted successfully!");

      setSelectedTutor(null);

      setBookingForm({
        subject: "",
        teachingMode: "",
        preferredDate: "",
        preferredTime: "",
        message: ""
      });

      setActivePage("My Bookings");

    } catch (error) {
      console.error("Booking submission error:", error);
      alert("Unable to submit your booking request. Please try again.");
    } finally {
      setSubmittingBooking(false);
    }
  }

  // MARK NOTIFICATION AS READ
  async function markNotificationAsRead(notificationId) {
    try {
      await updateDoc(
        doc(db, "notifications", notificationId),
        { read: true }
      );
    } catch (error) {
      console.error("Error updating notification:", error);
      alert("Unable to update notification.");
    }
  }

  // MARK ALL NOTIFICATIONS AS READ
  async function markAllAsRead() {
    const unreadNotifications = notifications.filter(
      (notification) => notification.read !== true
    );

    try {
      await Promise.all(
        unreadNotifications.map((notification) =>
          updateDoc(
            doc(db, "notifications", notification.id),
            { read: true }
          )
        )
      );
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      alert("Unable to update notifications.");
    }
  }

  if (!currentUser) {
    return null;
  }

  // STUDENT INFORMATION
  const firstName = currentUser.firstName || "Student";

  const fullName =
    currentUser.fullName ||
    currentUser.name ||
    [
      currentUser.firstName || "",
      currentUser.middleName || "",
      currentUser.lastName || ""
    ].filter(Boolean).join(" ") +
    (currentUser.suffix ? `, ${currentUser.suffix}` : "");

  const initials = firstName.charAt(0).toUpperCase();

  const unreadCount = notifications.filter(
    (notification) => notification.read !== true
  ).length;

  // ONLY ACCEPTED ONLINE BOOKINGS CAN USE MESSENGER
  const onlineAcceptedBookings = myBookings.filter(
    (booking) =>
      booking.status === "Accepted" &&
      booking.teachingMode === "Online"
  );

  // TUTOR CARD
  const renderTutorCards = () => {
    if (loadingTutors) {
      return (
        <div className="tutor-empty-message">
          Loading registered tutors...
        </div>
      );
    }

    if (tutors.length === 0) {
      return (
        <div className="tutor-empty-message">
          <div className="empty-icon">👨‍🏫</div>
          <h3>No tutors available yet</h3>
          <p>
            Registered tutors will appear here once they
            create their tutor profiles.
          </p>
        </div>
      );
    }

    return tutors.map((tutor) => (
      <div className="recommended-tutor-card" key={tutor.id}>
        <div className="tutor-avatar">
          {(tutor.firstName || "T").charAt(0).toUpperCase()}
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
            {tutor.teachingMode || "Teaching mode not added yet"}
          </span>
        </div>

        <div className="tutor-rating">
          <button onClick={() => openBookingForm(tutor)}>
            Book Tutor
          </button>
        </div>
      </div>
    ));
  };

  // RENDER PAGE CONTENT
  const renderContent = () => {
    switch (activePage) {

      // MY PROFILE
      case "My Profile":
        return (
          <section className="student-content">
            <div className="dashboard-section-heading">
              <div>
                <h2>My Profile</h2>
                <p>Manage your personal and contact information.</p>
              </div>
            </div>

            <div className="student-profile-panel">
              {loadingProfile ? (
                <p>Loading your profile...</p>
              ) : (
                <>
                  <div className="student-profile-header">
                    <div className="student-profile-avatar">
                      {initials}
                    </div>

                    <div className="student-profile-heading">
                      <h2>{fullName}</h2>
                      <p>Student Account</p>
                    </div>

                    {!editingProfile && (
                      <button
                        type="button"
                        className="student-edit-profile-button"
                        onClick={handleEditProfile}
                      >
                        <Pencil size={17} />
                        Edit Profile
                      </button>
                    )}
                  </div>

                  <form
                    className="student-profile-form"
                    onSubmit={handleSaveProfile}
                  >
                    <div className="student-profile-section-title">
                      <User size={19} />
                      <h3>Personal Information</h3>
                    </div>

                    <div className="student-profile-grid">
  <div className="student-profile-field">
    <label htmlFor="profileFirstName">First Name</label>
    <input
      id="profileFirstName"
      type="text"
      name="firstName"
      value={profileForm.firstName}
      onChange={handleProfileChange}
      disabled={!editingProfile}
      required
    />
  </div>

  <div className="student-profile-field">
    <label htmlFor="profileMiddleName">Middle Name</label>
    <input
      id="profileMiddleName"
      type="text"
      name="middleName"
      value={profileForm.middleName}
      onChange={handleProfileChange}
      disabled={!editingProfile}
      placeholder="Enter middle name"
    />
  </div>

  <div className="student-profile-field">
    <label htmlFor="profileLastName">Last Name</label>
    <input
      id="profileLastName"
      type="text"
      name="lastName"
      value={profileForm.lastName}
      onChange={handleProfileChange}
      disabled={!editingProfile}
      required
    />
  </div>

  <div className="student-profile-field">
    <label htmlFor="profileSuffix">Suffix</label>
    <input
      id="profileSuffix"
      type="text"
      name="suffix"
      value={profileForm.suffix}
      onChange={handleProfileChange}
      disabled={!editingProfile}
      placeholder="e.g. Jr., Sr., III"
    />
  </div>
</div>

                    <div className="student-profile-section-title">
                      <Mail size={19} />
                      <h3>Account Information</h3>
                    </div>

                    <div className="student-profile-grid">
                      <div className="student-profile-field">
                        <label htmlFor="profileEmail">Email Address</label>
                        <input
                          id="profileEmail"
                          type="email"
                          value={currentUser.email || ""}
                          disabled
                        />
                        <small>Email address cannot be changed here.</small>
                      </div>

                      <div className="student-profile-field">
                        <label htmlFor="profileContact">
                          Contact Number
                        </label>
                        <div className="student-profile-input-icon">
                          <Phone size={17} />
                          <input
                            id="profileContact"
                            type="tel"
                            name="contactNumber"
                            value={profileForm.contactNumber}
                            onChange={handleProfileChange}
                            disabled={!editingProfile}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="student-profile-section-title">
                      <UserRound size={19} />
                      <h3>Account Details</h3>
                    </div>

                    <div className="student-profile-grid">
                      <div className="student-profile-field">
                        <label>Account Role</label>
                        <input
                          type="text"
                          value="Student"
                          disabled
                        />
                      </div>

                      <div className="student-profile-field">
                        <label>Account Status</label>
                        <input
                          type="text"
                          value={currentUser.status || "Active"}
                          disabled
                        />
                      </div>
                    </div>

                    {editingProfile && (
                      <div className="student-profile-actions">
                        <button
                          type="button"
                          className="student-cancel-profile-button"
                          onClick={handleCancelProfile}
                          disabled={savingProfile}
                        >
                          <X size={17} />
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="student-save-profile-button"
                          disabled={savingProfile}
                        >
                          <Save size={17} />
                          {savingProfile ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    )}
                  </form>
                </>
              )}
            </div>

            <footer className="student-footer">
              © 2026 PeerTutor. Learn together, grow together.
            </footer>
          </section>
        );

      // MY BOOKINGS
      case "My Bookings":
        return (
          <section className="student-content">
            <div className="dashboard-section-heading">
              <div>
                <h2>My Bookings</h2>
                <p>View and track your tutoring requests.</p>
              </div>
            </div>

            {loadingBookings ? (
              <div className="dashboard-panel">
                <p>Loading your bookings...</p>
              </div>
            ) : myBookings.length === 0 ? (
              <div className="dashboard-panel empty-sessions">
                <div className="empty-icon">📅</div>
                <h3>No bookings yet</h3>
                <p>
                  Your tutoring requests will appear here after
                  you book a tutor.
                </p>
                <button
                  className="primary-small-button"
                  onClick={() => setActivePage("Find Tutors")}
                >
                  Find a Tutor
                </button>
              </div>
            ) : (
              <div className="my-bookings-list">
                {myBookings.map((booking) => (
                  <div className="my-booking-card" key={booking.id}>
                    <div className="my-booking-header">
                      <div>
                        <h3>{booking.tutorName || "Tutor"}</h3>
                        <p>{booking.subject || "No subject specified"}</p>
                      </div>

                      <span
                        className={`my-booking-status ${
                          (booking.status || "Pending").toLowerCase()
                        }`}
                      >
                        {booking.status || "Pending"}
                      </span>
                    </div>

                    <div className="my-booking-details">
                      <p>
                        <strong>Teaching Mode:</strong>{" "}
                        {booking.teachingMode || "Not specified"}
                      </p>
                      <p>
                        <strong>Preferred Date:</strong>{" "}
                        {booking.preferredDate || "Not specified"}
                      </p>
                      <p>
                        <strong>Preferred Time:</strong>{" "}
                        {booking.preferredTime || "Not specified"}
                      </p>
                      <p>
                        <strong>Message:</strong>{" "}
                        {booking.message || "No message"}
                      </p>
                    </div>

                    <p className="my-booking-note">
                      {booking.status === "Accepted"
                        ? "Your booking has been accepted by the tutor."
                        : booking.status === "Rejected"
                        ? "Your booking request was rejected."
                        : "Waiting for the tutor to review your request."}
                    </p>

                    {booking.status === "Accepted" &&
                      booking.teachingMode === "Online" && (
                        <button
                          className="primary-small-button"
                          onClick={() => setActivePage("Messages")}
                        >
                          Open Messages
                        </button>
                      )}
                  </div>
                ))}
              </div>
            )}

            <footer className="student-footer">
              © 2026 PeerTutor. Learn together, grow together.
            </footer>
          </section>
        );

      // MESSAGES
      case "Messages":
        return (
          <section className="student-content">
            <Messenger
              currentUser={currentUser}
              bookings={onlineAcceptedBookings}
            />
          </section>
        );

      // NOTIFICATIONS
      case "Notifications":
        return (
          <section className="student-content">
            <div className="dashboard-section-heading notification-heading">
              <div>
                <h2>Notifications</h2>
                <p>Stay updated with your tutoring activities.</p>
              </div>

              {unreadCount > 0 && (
                <button
                  className="view-all-button"
                  onClick={markAllAsRead}
                >
                  Mark All as Read
                </button>
              )}
            </div>

            {loadingNotifications ? (
              <div className="dashboard-panel">
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="dashboard-panel empty-sessions">
                <div className="empty-icon">🔔</div>
                <h3>No notifications yet</h3>
                <p>
                  Updates about your booking requests will appear here.
                </p>
              </div>
            ) : (
              <div className="student-notifications-list">
                {notifications.map((notification) => (
                  <div
                    className={`student-notification-card ${
                      notification.read === true ? "read" : "unread"
                    }`}
                    key={notification.id}
                  >
                    <div className="notification-card-icon">
                      {notification.type === "Accepted"
                        ? "✅"
                        : notification.type === "Rejected"
                        ? "❌"
                        : "🔔"}
                    </div>

                    <div className="notification-card-content">
                      <div className="notification-card-header">
                        <h3>
                          {notification.title || "Booking Update"}
                        </h3>

                        {notification.read !== true && (
                          <span className="unread-label">NEW</span>
                        )}
                      </div>

                      <p>
                        {notification.message || "You have a new update."}
                      </p>

                      {notification.createdAt?.toDate && (
                        <small>
                          {notification.createdAt.toDate().toLocaleString()}
                        </small>
                      )}

                      {notification.read !== true && (
                        <button
                          className="mark-read-button"
                          onClick={() =>
                            markNotificationAsRead(notification.id)
                          }
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <footer className="student-footer">
              © 2026 PeerTutor. Learn together, grow together.
            </footer>
          </section>
        );

      // FIND TUTORS
      case "Find Tutors":
        return (
          <section className="student-content">
            <div className="dashboard-section-heading">
              <div>
                <h2>Available Tutors</h2>
                <p>Explore registered tutors on PeerTutor.</p>
              </div>
            </div>

            <div className="dashboard-panel tutors-panel">
              <div className="recommended-tutors">
                {renderTutorCards()}
              </div>
            </div>
          </section>
        );

      // DASHBOARD
      default:
        return (
          <section className="student-content">
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
                  onClick={() => setActivePage("Find Tutors")}
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
                  <h3>{myBookings.length}</h3>
                  <small>Your tutoring sessions</small>
                </div>
              </div>

              <div className="student-stat-card">
                <div className="stat-icon blue-icon">◷</div>
                <div>
                  <span>Upcoming Sessions</span>
                  <h3>
                    {myBookings.filter(
                      (booking) => booking.status === "Accepted"
                    ).length}
                  </h3>
                  <small>Accepted bookings</small>
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

            <section className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h2>Upcoming Sessions</h2>
                  <p>Your next tutoring appointments</p>
                </div>

                <button
                  className="view-all-button"
                  onClick={() => setActivePage("My Bookings")}
                >
                  View All →
                </button>
              </div>

              <div className="empty-sessions">
                {myBookings.some(
                  (booking) => booking.status === "Accepted"
                ) ? (
                  <>
                    <div className="empty-icon">🎓</div>
                    <h3>You have accepted bookings!</h3>
                    <p>
                      View your bookings to check your tutoring schedule.
                    </p>
                    <button
                      className="primary-small-button"
                      onClick={() => setActivePage("My Bookings")}
                    >
                      View My Bookings
                    </button>
                  </>
                ) : (
                  <>
                    <div className="empty-icon">📅</div>
                    <h3>No upcoming sessions yet</h3>
                    <p>
                      You haven't booked a tutoring session. Find a tutor to
                      get started with your learning journey.
                    </p>
                    <button
                      className="primary-small-button"
                      onClick={() => setActivePage("Find Tutors")}
                    >
                      Explore Tutors
                    </button>
                  </>
                )}
              </div>
            </section>

            <section className="dashboard-panel tutors-panel">
              <div className="panel-heading">
                <div>
                  <h2>Available Tutors</h2>
                  <p>Explore registered tutors on PeerTutor</p>
                </div>

                <button
                  className="view-all-button"
                  onClick={() => setActivePage("Find Tutors")}
                >
                  See All →
                </button>
              </div>

              <div className="recommended-tutors">
                {renderTutorCards()}
              </div>
            </section>

            <footer className="student-footer">
              © 2026 PeerTutor. Learn together, grow together.
            </footer>
          </section>
        );
    }
  };

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
          {menuItems
            .filter((item) => item.name !== "My Profile")
            .map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  className={`student-nav-item ${
                    activePage === item.name ? "active" : ""
                  }`}
                  onClick={() => setActivePage(item.name)}
                >
                  <Icon
                    size={20}
                    strokeWidth={1.8}
                    className="nav-icon"
                  />

                  {item.name}

                  {item.name === "Notifications" && unreadCount > 0 && (
                    <span className="notification-count">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>

        <div className="sidebar-label sidebar-bottom-label">
          ACCOUNT
        </div>

        <nav className="student-nav">
          <button
            className={`student-nav-item ${
              activePage === "My Profile" ? "active" : ""
            }`}
            onClick={() => setActivePage("My Profile")}
          >
            <UserRound
              size={20}
              strokeWidth={1.8}
              className="nav-icon"
            />
            My Profile
          </button>

          <button
            className="student-nav-item logout-item"
            onClick={handleLogout}
          >
            <LogOut
              size={20}
              strokeWidth={1.8}
              className="nav-icon"
            />
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
        <header className="student-topbar">
          <div>
            <span className="topbar-subtitle">STUDENT PORTAL</span>
            <h2>{activePage}</h2>
          </div>

          <div className="topbar-right">
            <button
              className="notification-button"
              onClick={() => setActivePage("Notifications")}
              aria-label="Notifications"
            >
              <Bell size={21} strokeWidth={1.8} />

              {unreadCount > 0 && (
                <span className="notification-dot"></span>
              )}
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

        {renderContent()}
      </main>

      {/* BOOKING FORM MODAL */}
      {selectedTutor && (
        <div
          className="booking-modal-overlay"
          onClick={closeBookingForm}
        >
          <div
            className="booking-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="booking-modal-header">
              <div>
                <span>PEERTUTOR BOOKING</span>
                <h2>Book a Tutoring Session</h2>
                <p>Fill in the details to send your booking request.</p>
              </div>

              <button
                type="button"
                className="close-booking-button"
                onClick={closeBookingForm}
                disabled={submittingBooking}
              >
                ×
              </button>
            </div>

            <div className="booking-selected-tutor">
              <div className="booking-tutor-avatar">
                {(selectedTutor.firstName || "T")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <span>SELECTED TUTOR</span>
                <h3>
                  {selectedTutor.fullName ||
                    [
                      selectedTutor.firstName || "",
                      selectedTutor.middleName || "",
                      selectedTutor.lastName || ""
                    ].filter(Boolean).join(" ") +
                    (selectedTutor.suffix
                      ? `, ${selectedTutor.suffix}`
                      : "")}
                </h3>
                <p>
                  {selectedTutor.subjects?.length
                    ? selectedTutor.subjects.join(", ")
                    : "No subjects listed"}
                </p>
              </div>
            </div>

            <form
              className="booking-form"
              onSubmit={handleBookingSubmit}
            >
              <div className="booking-form-field">
                <label htmlFor="bookingSubject">Subject *</label>
                <input
                  id="bookingSubject"
                  type="text"
                  name="subject"
                  placeholder="Enter the subject you need help with"
                  value={bookingForm.subject}
                  onChange={handleBookingChange}
                  required
                />
              </div>

              <div className="booking-form-field">
                <label htmlFor="bookingMode">
                  Preferred Teaching Mode *
                </label>
                <select
                  id="bookingMode"
                  name="teachingMode"
                  value={bookingForm.teachingMode}
                  onChange={handleBookingChange}
                  required
                >
                  <option value="">Select teaching mode</option>
                  <option value="Online">Online</option>
                  <option value="Face-to-Face">Face-to-Face</option>
                </select>
              </div>

              <div className="booking-form-row">
                <div className="booking-form-field">
                  <label htmlFor="bookingDate">Preferred Date *</label>
                  <input
                    id="bookingDate"
                    type="date"
                    name="preferredDate"
                    min={new Date().toLocaleDateString("en-CA")}
                    value={bookingForm.preferredDate}
                    onChange={handleBookingChange}
                    required
                  />
                </div>

                <div className="booking-form-field">
                  <label htmlFor="bookingTime">Preferred Time *</label>
                  <input
                    id="bookingTime"
                    type="time"
                    name="preferredTime"
                    value={bookingForm.preferredTime}
                    onChange={handleBookingChange}
                    required
                  />
                </div>
              </div>

              <div className="booking-form-field">
                <label htmlFor="bookingMessage">
                  Additional Message
                </label>
                <textarea
                  id="bookingMessage"
                  name="message"
                  placeholder="Tell the tutor what topic or lesson you need help with..."
                  value={bookingForm.message}
                  onChange={handleBookingChange}
                  rows="4"
                />
              </div>

              <div className="booking-form-note">
                <strong>Note:</strong> Your booking request will be sent
                to the tutor with a Pending status. The tutor must accept
                your request before the session is confirmed.
              </div>

              <div className="booking-form-actions">
                <button
                  type="button"
                  className="cancel-booking-button"
                  onClick={closeBookingForm}
                  disabled={submittingBooking}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-booking-button"
                  disabled={submittingBooking}
                >
                  {submittingBooking ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
