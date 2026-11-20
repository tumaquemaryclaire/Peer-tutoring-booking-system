
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

import {
  LayoutDashboard,
  UserRound,
  Inbox,
  CalendarDays,
  MessagesSquare,
  Bell,
  LogOut,
  Pencil,
  Save,
  X,
  User,
  GraduationCap
} from "lucide-react";

import { auth, db } from "../services/firebase";
import Messenger from "../components/Messenger";
import VideoCall from "../components/VideoCall";
import "./TutorDashboard.css";

// CONVERT SESSION DATE AND TIME
function getSessionDateTime(session) {
  if (!session.preferredDate) return null;

  const dateParts = session.preferredDate.split("-");
  if (dateParts.length !== 3) return null;

  const year = Number(dateParts[0]);
  const month = Number(dateParts[1]);
  const day = Number(dateParts[2]);

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;

  const time = (session.preferredTime || "12:00 AM").trim();

  let hours;
  let minutes;

  if (/^\d{2}:\d{2}$/.test(time)) {
    [hours, minutes] = time.split(":").map(Number);
  } else {
    const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return null;

    hours = Number(match[1]);
    minutes = Number(match[2]);

    const period = match[3]?.toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
}

// COMPRESS PROFILE PHOTO BEFORE SAVING TO FIRESTORE
async function compressProfileImage(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose a valid image file.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Please choose an image smaller than 5 MB.");
  }

  const imageBitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const maxDimension = 400;

  const scale = Math.min(
    1,
    maxDimension / Math.max(imageBitmap.width, imageBitmap.height)
  );

  canvas.width = Math.round(imageBitmap.width * scale);
  canvas.height = Math.round(imageBitmap.height * scale);

  const context = canvas.getContext("2d");

  if (!context) {
    imageBitmap.close?.();
    throw new Error("Your browser could not process this image.");
  }

  context.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
  imageBitmap.close?.();

  let quality = 0.75;
  let imageData = canvas.toDataURL("image/jpeg", quality);

  while (imageData.length > 350000 && quality > 0.35) {
    quality -= 0.1;
    imageData = canvas.toDataURL("image/jpeg", quality);
  }

  if (imageData.length > 350000) {
    throw new Error(
      "This image is too large after compression. Please choose another photo."
    );
  }

  return imageData;
}

// AUTOMATIC AGE CALCULATOR
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

// GET TODAY'S DATE
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function TutorDashboard() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");

  const [activeVideoBooking, setActiveVideoBooking] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // PROFILE STATES
  const [profileData, setProfileData] = useState({
    subjects: "",
    bio: "",
    teachingMode: "",
    gender: "",
    birthday: ""
  });

  const [originalProfileData, setOriginalProfileData] = useState({
    subjects: "",
    bio: "",
    teachingMode: "",
    gender: "",
    birthday: ""
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profilePicture, setProfilePicture] = useState("");
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // BOOKING STATES
  const [bookingRequests, setBookingRequests] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [updatingBooking, setUpdatingBooking] = useState("");

  // NOTIFICATION STATES
  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const tutorName =
    currentUser?.fullName ||
    currentUser?.name ||
    currentUser?.firstName ||
    "Tutor";

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

  // LOAD TUTOR PROFILE
  useEffect(() => {
    const fetchTutorProfile = async () => {
      if (!currentUser?.uid) return;

      setProfileLoading(true);

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const profileRef = doc(db, "tutorProfiles", currentUser.uid);

        const [userSnap, profileSnap] = await Promise.all([
          getDoc(userRef),
          getDoc(profileRef)
        ]);

        const userData = userSnap.exists() ? userSnap.data() : {};
        const tutorData = profileSnap.exists() ? profileSnap.data() : {};

        const loadedProfile = {
          birthday: userData.birthday || "",
          subjects: Array.isArray(tutorData.subjects)
            ? tutorData.subjects.join(", ")
            : "",
          bio: tutorData.bio || "",
          teachingMode: tutorData.teachingMode || "",
          gender: tutorData.gender || ""
        };

        setProfileData(loadedProfile);
        setOriginalProfileData(loadedProfile);
        setProfilePicture(tutorData.profilePicture || "");
        setIsEditingProfile(false);
      } catch (error) {
        console.error("Error loading tutor profile:", error);
        alert("Unable to load your tutor profile.");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchTutorProfile();
  }, [currentUser]);

  // REAL-TIME BOOKING REQUESTS
  useEffect(() => {
    if (!currentUser?.uid) return;

    setBookingLoading(true);

    const bookingsQuery = query(
      collection(db, "bookings"),
      where("tutorUid", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const requests = snapshot.docs.map((bookingDoc) => ({
          id: bookingDoc.id,
          ...bookingDoc.data()
        }));

        requests.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });

        setBookingRequests(requests);
        setBookingLoading(false);
      },
      (error) => {
        console.error("Error fetching booking requests:", error);
        alert("Unable to load booking requests.");
        setBookingLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // REAL-TIME TUTOR NOTIFICATIONS
  useEffect(() => {
    if (!currentUser?.uid) return;

    setNotificationLoading(true);

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("recipientUid", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationList = snapshot.docs.map((notificationDoc) => ({
          id: notificationDoc.id,
          ...notificationDoc.data()
        }));

        notificationList.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });

        setNotifications(notificationList);
        setNotificationLoading(false);
      },
      (error) => {
        console.error("Error fetching tutor notifications:", error);
        alert(`Unable to load notifications.\n${error.message}`);
        setNotificationLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // LOGOUT
  const handleLogout = async () => {
    try {
      await logoutUser();
      sessionStorage.removeItem("pt_current_user");
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Unable to log out. Please try again.");
    }
  };

  // UPLOAD PROFILE PICTURE
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !auth.currentUser ||
      auth.currentUser.uid !== currentUser?.uid
    ) {
      alert("Please log in again before changing your profile picture.");
      e.target.value = "";
      return;
    }

    setUploadingPicture(true);

    try {
      const compressedImage = await compressProfileImage(file);

      await updateDoc(doc(db, "tutorProfiles", currentUser.uid), {
        profilePicture: compressedImage
      });

      setProfilePicture(compressedImage);
      alert("Profile picture updated successfully!");
    } catch (error) {
      console.error("PROFILE PICTURE ERROR:", error);
      alert(error.message || "Unable to upload your profile picture.");
    } finally {
      setUploadingPicture(false);
      e.target.value = "";
    }
  };

  // REMOVE PROFILE PICTURE
  const handleRemoveProfilePicture = async () => {
    if (!profilePicture) return;

    if (
      !auth.currentUser ||
      auth.currentUser.uid !== currentUser?.uid
    ) {
      alert("Please log in again before changing your profile picture.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove your profile picture?"
    );

    if (!confirmed) return;

    setUploadingPicture(true);

    try {
      await updateDoc(doc(db, "tutorProfiles", currentUser.uid), {
        profilePicture: ""
      });

      setProfilePicture("");
      alert("Profile picture removed.");
    } catch (error) {
      console.error("REMOVE PROFILE PICTURE ERROR:", error);
      alert("Unable to remove your profile picture. Please try again.");
    } finally {
      setUploadingPicture(false);
    }
  };

  // EDIT PROFILE
  const handleEditProfile = () => {
    setOriginalProfileData({ ...profileData });
    setIsEditingProfile(true);
  };

  // CANCEL PROFILE EDIT
  const handleCancelProfileEdit = () => {
    setProfileData({ ...originalProfileData });
    setIsEditingProfile(false);
  };

  // SAVE TUTOR PROFILE
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    const authenticatedUser = auth.currentUser;

    if (!authenticatedUser) {
      alert("You are not currently authenticated. Please log in again.");
      return;
    }

    if (authenticatedUser.uid !== currentUser?.uid) {
      alert("Your session does not match your account. Please log in again.");
      return;
    }

    if (!profileData.birthday) {
      alert("Please enter your birthday.");
      return;
    }

    const age = calculateAge(profileData.birthday);

    if (age === "") {
      alert("Please enter a valid birthday.");
      return;
    }

    if (age < 13) {
      alert("You must be at least 13 years old.");
      return;
    }

    setSavingProfile(true);

    try {
      const profileRef = doc(
        db,
        "tutorProfiles",
        authenticatedUser.uid
      );

      const userRef = doc(
        db,
        "users",
        authenticatedUser.uid
      );

      const subjectsArray = profileData.subjects
        .split(",")
        .map((subject) => subject.trim())
        .filter(Boolean);

      await updateDoc(userRef, {
        birthday: profileData.birthday
      });

      await updateDoc(profileRef, {
        subjects: subjectsArray,
        bio: profileData.bio.trim(),
        teachingMode: profileData.teachingMode,
        gender: profileData.gender
      });

      const savedProfile = {
        ...profileData,
        subjects: subjectsArray.join(", ")
      };

      setProfileData(savedProfile);
      setOriginalProfileData(savedProfile);
      setIsEditingProfile(false);

      const updatedUser = {
        ...currentUser,
        birthday: profileData.birthday
      };

      setCurrentUser(updatedUser);

      sessionStorage.setItem(
        "pt_current_user",
        JSON.stringify(updatedUser)
      );

      alert("Tutor profile updated successfully!");
    } catch (error) {
      console.error("PROFILE UPDATE ERROR:", error);

      alert(
        `Unable to update profile.\nError: ${error.code || "Unknown"}\nMessage: ${error.message}`
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // ACCEPT OR REJECT BOOKING AND NOTIFY STUDENT
  const handleBookingStatus = async (bookingId, newStatus) => {
    const authenticatedUser = auth.currentUser;

    if (!authenticatedUser) {
      alert("Please log in again.");
      return;
    }

    const booking = bookingRequests.find(
      (item) => item.id === bookingId
    );

    if (!booking) {
      alert("Booking request not found.");
      return;
    }

    if (booking.status !== "Pending") {
      alert("This booking request has already been processed.");
      return;
    }

    if (!booking.studentUid) {
      alert("Student information is missing from this booking.");
      return;
    }

    setUpdatingBooking(bookingId);

    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: newStatus
      });

      const notificationMessage =
        newStatus === "Accepted"
          ? `${tutorName} accepted your tutoring request for ${booking.subject}.`
          : `${tutorName} rejected your tutoring request for ${booking.subject}.`;

      await addDoc(collection(db, "notifications"), {
        recipientUid: booking.studentUid,
        senderUid: authenticatedUser.uid,
        title: `Booking ${newStatus}`,
        message: notificationMessage,
        type: newStatus,
        bookingId,
        read: false,
        createdAt: serverTimestamp()
      });

      alert(`Booking ${newStatus.toLowerCase()} successfully!`);
    } catch (error) {
      console.error("Error updating booking:", error);

      alert(
        `Unable to complete the booking action.\nError: ${error.code || "Unknown"}\nMessage: ${error.message}`
      );
    } finally {
      setUpdatingBooking("");
    }
  };

  // MARK ONE NOTIFICATION AS READ
  const markNotificationAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      alert("Unable to update notification.");
    }
  };

  // MARK ALL NOTIFICATIONS AS READ
  const markAllNotificationsAsRead = async () => {
    const unreadNotifications = notifications.filter(
      (notification) => notification.read !== true
    );

    if (unreadNotifications.length === 0) return;

    try {
      await Promise.all(
        unreadNotifications.map((notification) =>
          updateDoc(doc(db, "notifications", notification.id), {
            read: true
          })
        )
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      alert("Unable to update notifications.");
    }
  };

  if (!currentUser) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  // SIDEBAR MENU
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Booking Requests", icon: Inbox },
    { name: "My Sessions", icon: CalendarDays },
    { name: "Messages", icon: MessagesSquare },
    { name: "Notifications", icon: Bell }
  ];

  const accountItems = [
    { name: "My Profile", icon: UserRound }
  ];

  const pendingBookings = bookingRequests.filter(
    (booking) => booking.status === "Pending"
  ).length;

  const acceptedBookings = bookingRequests.filter(
    (booking) => booking.status === "Accepted"
  ).length;

  const unreadNotificationCount = notifications.filter(
    (notification) => notification.read !== true
  ).length;

  // ACCEPTED SESSIONS
  const acceptedSessions = bookingRequests
    .filter((booking) => booking.status === "Accepted")
    .sort((a, b) => {
      const dateA = `${a.preferredDate || ""} ${a.preferredTime || ""}`;
      const dateB = `${b.preferredDate || ""} ${b.preferredTime || ""}`;
      return dateA.localeCompare(dateB);
    });

  // UPCOMING SESSION REMINDERS
  const now = new Date();

  const sevenDaysFromNow = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000
  );

  const upcomingSessions = acceptedSessions
    .filter((session) => {
      const sessionDate = getSessionDateTime(session);

      return (
        sessionDate &&
        sessionDate >= now &&
        sessionDate <= sevenDaysFromNow
      );
    })
    .sort((a, b) => {
      return (
        getSessionDateTime(a).getTime() -
        getSessionDateTime(b).getTime()
      );
    });

  // ONLY ACCEPTED ONLINE BOOKINGS CAN USE MESSENGER
  const onlineMessageBookings = bookingRequests.filter(
    (booking) =>
      booking.status === "Accepted" &&
      booking.teachingMode === "Online"
  );

  // PAGE CONTENT
  const renderContent = () => {
    switch (activePage) {
      // MY PROFILE
      case "My Profile":
        return (
          <section className="tutor-content-section">
            <div className="tutor-profile-panel">
              {profileLoading ? (
                <div className="empty-state">
                  <p>Loading your profile...</p>
                </div>
              ) : (
                <>
                  <div className="tutor-profile-header">
                    <div className="tutor-profile-avatar">
                      {profilePicture ? (
                        <img src={profilePicture} alt="Tutor profile" />
                      ) : (
                        tutorName.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="tutor-profile-heading">
                      <h2>{tutorName}</h2>
                      <p>{currentUser.email}</p>
                      <span className="profile-role">Peer Tutor</span>
                    </div>

                    {!isEditingProfile && (
                      <button
                        type="button"
                        className="tutor-edit-profile-button"
                        onClick={handleEditProfile}
                      >
                        <Pencil size={16} />
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {/* PROFILE PHOTO */}
                  <div className="tutor-profile-photo-controls">
                    <label className="tutor-photo-upload-button">
                      {uploadingPicture
                        ? "Please wait..."
                        : profilePicture
                        ? "Change Photo"
                        : "Upload Photo"}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        disabled={uploadingPicture}
                      />
                    </label>

                    {profilePicture && (
                      <button
                        type="button"
                        className="tutor-photo-remove-button"
                        onClick={handleRemoveProfilePicture}
                        disabled={uploadingPicture}
                      >
                        Remove Photo
                      </button>
                    )}

                    <small>
                      JPG, PNG, or other image formats. Maximum 5 MB before
                      compression.
                    </small>
                  </div>

                  <form onSubmit={handleSaveProfile}>
                    {/* PERSONAL INFORMATION */}
                    <div className="tutor-profile-section-title">
                      <User size={19} />
                      <h3>Personal Information</h3>
                    </div>

                    <div className="tutor-profile-grid">
                      <div className="tutor-profile-field">
                        <label>First Name</label>
                        <input
                          type="text"
                          value={currentUser.firstName || ""}
                          placeholder="Not provided"
                          disabled
                        />
                      </div>

                      <div className="tutor-profile-field">
                        <label>Middle Name</label>
                        <input
                          type="text"
                          value={currentUser.middleName || ""}
                          placeholder="Not provided"
                          disabled
                        />
                      </div>

                      <div className="tutor-profile-field">
                        <label>Last Name</label>
                        <input
                          type="text"
                          value={currentUser.lastName || ""}
                          placeholder="Not provided"
                          disabled
                        />
                      </div>

                      <div className="tutor-profile-field">
                        <label>Suffix</label>
                        <input
                          type="text"
                          value={currentUser.suffix || ""}
                          placeholder="None"
                          disabled
                        />
                      </div>

                      <div className="tutor-profile-field">
                        <label>Email Address</label>
                        <input
                          type="email"
                          value={currentUser.email || ""}
                          disabled
                        />
                      </div>

                      <div className="tutor-profile-field">
                        <label>Contact Number</label>
                        <input
                          type="text"
                          value={currentUser.contactNumber || ""}
                          placeholder="Not provided"
                          disabled
                        />
                      </div>

                      <div className="tutor-profile-field">
                        <label htmlFor="tutorBirthday">Birthday</label>
                        <input
                          id="tutorBirthday"
                          type="date"
                          value={profileData.birthday}
                          max={getTodayDate()}
                          min="1900-01-01"
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              birthday: e.target.value
                            })
                          }
                          disabled={!isEditingProfile}
                          required
                        />
                      </div>

                      <div className="tutor-profile-field">
                        <label htmlFor="tutorAge">Age</label>
                        <input
                          id="tutorAge"
                          type="text"
                          value={
                            profileData.birthday &&
                            calculateAge(profileData.birthday) !== ""
                              ? `${calculateAge(profileData.birthday)} years old`
                              : ""
                          }
                          placeholder="Automatically calculated from birthday"
                          readOnly
                        />
                      </div>
                    </div>

                    {/* TUTORING INFORMATION */}
                    <div className="tutor-profile-section-title">
                      <GraduationCap size={20} />
                      <h3>Tutoring Information</h3>
                    </div>

                    <div className="tutor-profile-grid">
                      <div className="tutor-profile-field">
                        <label htmlFor="tutorGender">Gender</label>
                        <select
                          id="tutorGender"
                          value={profileData.gender}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              gender: e.target.value
                            })
                          }
                          disabled={!isEditingProfile}
                          required
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Prefer not to say">
                            Prefer not to say
                          </option>
                        </select>
                      </div>

                      <div className="tutor-profile-field">
                        <label htmlFor="tutorSubjects">
                          Subjects You Teach
                        </label>
                        <input
                          id="tutorSubjects"
                          type="text"
                          placeholder="Example: Java, HTML, Database"
                          value={profileData.subjects}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              subjects: e.target.value
                            })
                          }
                          disabled={!isEditingProfile}
                        />
                        <small>Separate each subject with a comma.</small>
                      </div>

                      <div className="tutor-profile-field">
                        <label htmlFor="teachingMode">Teaching Mode</label>
                        <select
                          id="teachingMode"
                          value={profileData.teachingMode}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              teachingMode: e.target.value
                            })
                          }
                          disabled={!isEditingProfile}
                          required
                        >
                          <option value="">Select teaching mode</option>
                          <option value="Online">Online</option>
                          <option value="Face-to-Face">Face-to-Face</option>
                          <option value="Both">
                            Both Online and Face-to-Face
                          </option>
                        </select>
                      </div>

                      <div className="tutor-profile-field tutor-profile-bio">
                        <label htmlFor="tutorBio">About Me / Tutor Bio</label>
                        <textarea
                          id="tutorBio"
                          rows="5"
                          placeholder="Tell students about your skills, experience, and how you can help them learn."
                          value={profileData.bio}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              bio: e.target.value
                            })
                          }
                          disabled={!isEditingProfile}
                        />
                      </div>
                    </div>

                    {/* EDIT ACTIONS */}
                    {isEditingProfile && (
                      <div className="tutor-profile-actions">
                        <button
                          type="button"
                          className="tutor-cancel-profile-button"
                          onClick={handleCancelProfileEdit}
                          disabled={savingProfile}
                        >
                          <X size={16} />
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="tutor-save-profile-button"
                          disabled={savingProfile}
                        >
                          <Save size={16} />
                          {savingProfile ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    )}
                  </form>
                </>
              )}
            </div>
          </section>
        );

      // BOOKING REQUESTS
      case "Booking Requests":
        return (
          <section className="tutor-content-section">
            <h2>Booking Requests</h2>
            <p>Review and manage tutoring requests from students.</p>

            {bookingLoading ? (
              <div className="empty-state">
                <p>Loading booking requests...</p>
              </div>
            ) : bookingRequests.length === 0 ? (
              <div className="empty-state">
                <span>📩</span>
                <h3>No booking requests yet</h3>
                <p>New student requests will appear here.</p>
              </div>
            ) : (
              <div className="booking-request-list">
                {bookingRequests.map((booking) => (
                  <div className="booking-request-card" key={booking.id}>
                    <div className="booking-request-header">
                      <div>
                        <h3>{booking.studentName || "Student"}</h3>
                        <p>{booking.studentEmail || ""}</p>
                      </div>

                      <span
                        className={`booking-status ${(booking.status || "Pending").toLowerCase()}`}
                      >
                        {booking.status || "Pending"}
                      </span>
                    </div>

                    <div className="booking-request-details">
                      <p>
                        <strong>Subject:</strong>{" "}
                        {booking.subject || "Not specified"}
                      </p>
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

                    {booking.status === "Pending" && (
                      <div className="booking-request-actions">
                        <button
                          type="button"
                          disabled={updatingBooking === booking.id}
                          onClick={() =>
                            handleBookingStatus(booking.id, "Accepted")
                          }
                        >
                          {updatingBooking === booking.id
                            ? "Updating..."
                            : "Accept"}
                        </button>

                        <button
                          type="button"
                          disabled={updatingBooking === booking.id}
                          onClick={() =>
                            handleBookingStatus(booking.id, "Rejected")
                          }
                        >
                          {updatingBooking === booking.id
                            ? "Updating..."
                            : "Reject"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        );

      // MY SESSIONS
      case "My Sessions":
        return (
          <section className="tutor-content-section">
            <h2>My Sessions</h2>
            <p>View your confirmed tutoring sessions with students.</p>

            {bookingLoading ? (
              <div className="empty-state">
                <p>Loading your sessions...</p>
              </div>
            ) : acceptedSessions.length === 0 ? (
              <div className="empty-state">
                <span>📅</span>
                <h3>No sessions scheduled</h3>
                <p>Your accepted tutoring bookings will appear here.</p>
              </div>
            ) : (
              <div className="booking-request-list">
                {acceptedSessions.map((session) => (
                  <div className="booking-request-card" key={session.id}>
                    <div className="booking-request-header">
                      <div>
                        <h3>{session.studentName || "Student"}</h3>
                        <p>{session.studentEmail || ""}</p>
                      </div>

                      <span className="booking-status accepted">
                        Confirmed
                      </span>
                    </div>

                    <div className="booking-request-details">
                      <p>
                        <strong>Subject:</strong>{" "}
                        {session.subject || "Not specified"}
                      </p>
                      <p>
                        <strong>Teaching Mode:</strong>{" "}
                        {session.teachingMode || "Not specified"}
                      </p>
                      <p>
                        <strong>Session Date:</strong>{" "}
                        {session.preferredDate || "Not specified"}
                      </p>
                      <p>
                        <strong>Session Time:</strong>{" "}
                        {session.preferredTime || "Not specified"}
                      </p>
                      <p>
                        <strong>Student Message:</strong>{" "}
                        {session.message || "No message"}
                      </p>
                    </div>

                    {session.teachingMode === "Online" && (
                      <div className="booking-request-actions">
                        <button
                          type="button"
                          onClick={() => setActiveVideoBooking(session)}
                        >
                          Join Video Call
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        );

      // MESSAGES
      case "Messages":
        return (
          <section className="tutor-content-section">
            <Messenger
              currentUser={currentUser}
              bookings={onlineMessageBookings}
            />
          </section>
        );

      // NOTIFICATIONS
      case "Notifications":
        return (
          <section className="tutor-content-section">
            <div className="dashboard-section-heading">
              <div>
                <h2>Notifications</h2>
                <p>
                  View new booking requests and your upcoming session reminders.
                </p>
              </div>

              {unreadNotificationCount > 0 && (
                <button
                  type="button"
                  className="view-all-button"
                  onClick={markAllNotificationsAsRead}
                >
                  Mark All as Read
                </button>
              )}
            </div>

            {notificationLoading ? (
              <div className="empty-state">
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 && upcomingSessions.length === 0 ? (
              <div className="empty-state">
                <span>🔔</span>
                <h3>No Notifications Yet</h3>
                <p>
                  New booking requests and upcoming session reminders will
                  appear here.
                </p>
              </div>
            ) : (
              <>
                {notifications.length > 0 && (
                  <>
                    <h3 className="notification-section-title">
                      Booking Activity
                    </h3>

                    <div className="booking-request-list">
                      {notifications.map((notification) => (
                        <div
                          className={`booking-request-card ${
                            notification.read === true
                              ? "notification-read"
                              : "notification-unread"
                          }`}
                          key={notification.id}
                        >
                          <div className="booking-request-header">
                            <div>
                              <h3>
                                {notification.type === "Pending"
                                  ? "📩"
                                  : "🔔"}{" "}
                                {notification.title || "Booking Update"}
                              </h3>

                              {notification.createdAt?.toDate && (
                                <small>
                                  {notification.createdAt
                                    .toDate()
                                    .toLocaleString()}
                                </small>
                              )}
                            </div>

                            {notification.read !== true && (
                              <span className="booking-status pending">
                                NEW
                              </span>
                            )}
                          </div>

                          <div className="booking-request-details">
                            <p>
                              {notification.message ||
                                "You have a new booking update."}
                            </p>
                          </div>

                          {notification.read !== true && (
                            <div className="booking-request-actions">
                              <button
                                type="button"
                                onClick={() =>
                                  markNotificationAsRead(notification.id)
                                }
                              >
                                Mark as Read
                              </button>

                              {notification.type === "Pending" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActivePage("Booking Requests")
                                  }
                                >
                                  View Booking
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {upcomingSessions.length > 0 && (
                  <>
                    <h3 className="notification-section-title">
                      Upcoming Session Reminders
                    </h3>

                    <div className="booking-request-list">
                      {upcomingSessions.map((session) => {
                        const sessionDate = getSessionDateTime(session);
                        const today = new Date();

                        const tomorrow = new Date(today);
                        tomorrow.setDate(today.getDate() + 1);

                        const isToday =
                          sessionDate.toDateString() === today.toDateString();

                        const isTomorrow =
                          sessionDate.toDateString() ===
                          tomorrow.toDateString();

                        let reminderLabel = "Upcoming Session";

                        if (isToday) reminderLabel = "Session Today";
                        else if (isTomorrow) {
                          reminderLabel = "Session Tomorrow";
                        }

                        return (
                          <div
                            className="booking-request-card"
                            key={session.id}
                          >
                            <div className="booking-request-header">
                              <div>
                                <h3>🔔 {reminderLabel}</h3>
                                <p>Your tutoring session is approaching.</p>
                              </div>

                              <span className="booking-status accepted">
                                Confirmed
                              </span>
                            </div>

                            <div className="booking-request-details">
                              <p>
                                <strong>Student:</strong>{" "}
                                {session.studentName || "Student"}
                              </p>
                              <p>
                                <strong>Subject:</strong>{" "}
                                {session.subject || "Not specified"}
                              </p>
                              <p>
                                <strong>Teaching Mode:</strong>{" "}
                                {session.teachingMode || "Not specified"}
                              </p>
                              <p>
                                <strong>Session Date:</strong>{" "}
                                {sessionDate.toLocaleDateString()}
                              </p>
                              <p>
                                <strong>Session Time:</strong>{" "}
                                {sessionDate.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>

                            <small>
                              Reminder: This session is scheduled within the
                              next seven days.
                            </small>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        );

      // DASHBOARD
      default:
        return (
          <>
            <div className="tutor-welcome-banner">
              <div>
                <span className="welcome-label">TUTOR WORKSPACE</span>

                <h2>
                  Welcome, {currentUser.firstName || "Tutor"}!
                </h2>

                <p>
                  Manage your tutoring activities and help students achieve
                  their learning goals.
                </p>
              </div>

              <div className="welcome-icon">🎓</div>
            </div>

            <div className="tutor-stats-grid">
              <div className="tutor-stat-card">
                <span className="stat-icon">📩</span>
                <p>Pending Requests</p>
                <h3>{pendingBookings}</h3>
              </div>

              <div className="tutor-stat-card">
                <span className="stat-icon">📅</span>
                <p>Accepted Bookings</p>
                <h3>{acceptedBookings}</h3>
              </div>

              <div className="tutor-stat-card">
                <span className="stat-icon">🔔</span>
                <p>Unread Notifications</p>
                <h3>{unreadNotificationCount}</h3>
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
                  <button onClick={() => setActivePage("My Profile")}>
                    👤 View My Profile
                  </button>

                  <button onClick={() => setActivePage("Booking Requests")}>
                    📩 Check Booking Requests
                  </button>

                  <button onClick={() => setActivePage("My Sessions")}>
                    📅 View My Sessions
                  </button>

                  <button onClick={() => setActivePage("Messages")}>
                    💬 Open Messages
                  </button>

                  <button onClick={() => setActivePage("Notifications")}>
                    🔔 View Notifications
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
                    <strong className="active-status">Active</strong>
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
      {/* SIDEBAR */}
      <aside className="tutor-sidebar">
        <div className="tutor-brand">
          <span>📚</span>
          <h2>
            Peer<span>Tutor</span>
          </h2>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {profilePicture ? (
              <img src={profilePicture} alt="Tutor profile" />
            ) : (
              tutorName.charAt(0).toUpperCase()
            )}
          </div>

          <div>
            <strong>{tutorName}</strong>
            <span>Peer Tutor</span>
          </div>
        </div>

        <nav className="tutor-navigation">
          <div className="tutor-nav-group">
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
                <item.icon size={20} strokeWidth={1.8} />
                {item.name}

                {item.name === "Booking Requests" &&
                  pendingBookings > 0 && (
                    <span className="notification-count">
                      {pendingBookings}
                    </span>
                  )}

                {item.name === "Notifications" &&
                  unreadNotificationCount > 0 && (
                    <span className="notification-count">
                      {unreadNotificationCount}
                    </span>
                  )}
              </button>
            ))}
          </div>

          
<div className="tutor-nav-group tutor-account-group">
  <p className="sidebar-heading">ACCOUNT</p>

  {accountItems.map((item) => (
    <button
      key={item.name}
      className={
        activePage === item.name
          ? "sidebar-link active"
          : "sidebar-link"
      }
      onClick={() => setActivePage(item.name)}
    >
      <item.icon size={20} strokeWidth={1.8} />
      {item.name}
    </button>
  ))}

  <button
    className="sidebar-link tutor-sidebar-logout"
    onClick={() => setShowLogoutConfirm(true)}
  >
    <LogOut size={20} strokeWidth={1.8} />
    Logout
  </button>
</div>
        </nav>

      </aside>

      {/* MAIN CONTENT */}
      <main className="tutor-main">
        <header className="tutor-topbar">
          <div>
            <h1>{activePage}</h1>
            <p>PeerTutor / {activePage}</p>
          </div>

          <div className="topbar-user">
            <span className="topbar-avatar">
              {profilePicture ? (
                <img src={profilePicture} alt="Tutor profile" />
              ) : (
                tutorName.charAt(0).toUpperCase()
              )}
            </span>

            <span>{tutorName}</span>
          </div>
        </header>

        <div className="tutor-page-content">
          {renderContent()}
        </div>
      </main>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div
          className="logout-modal-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="logout-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="logout-modal-icon">
              <LogOut size={26} />
            </div>

            <h2>Confirm Logout</h2>
            <p>Are you sure you want to logout?</p>

            <div className="logout-modal-actions">
              <button
                type="button"
                className="logout-cancel-button"
                onClick={() => setShowLogoutConfirm(false)}
              >
                No, Stay
              </button>

              <button
                type="button"
                className="logout-confirm-button"
                onClick={handleLogout}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO CALL MODAL */}
      {activeVideoBooking && (
        <VideoCall
          booking={activeVideoBooking}
          currentUser={currentUser}
          onClose={() => setActiveVideoBooking(null)}
        />
      )}
    </div>
  );
}

export default TutorDashboard;
