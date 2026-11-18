
// ===================================
// PEERTUTOR - BOOKING REQUESTS
// Facebook-Style Notification System
// ===================================

// ===================================
// CHECK TUTOR LOGIN
// ===================================

const currentUser = JSON.parse(
    sessionStorage.getItem("pt_current_user") || "null"
);

if (!currentUser || currentUser.role !== "tutor") {
    alert("Please log in using your tutor account.");
    window.location.href = "../login.html";
}

// ===================================
// LOCAL STORAGE FUNCTIONS
// ===================================

function getSavedData(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Unable to read saved data:", error);
        return [];
    }
}

function saveSavedData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getAllBookings() {
    return getSavedData("pt_bookings");
}

// Add IDs to old bookings that do not have one
function ensureBookingIDs() {
    const bookings = getAllBookings();
    let changed = false;

    bookings.forEach(function(booking) {
        if (
            booking.id === undefined ||
            booking.id === null ||
            booking.id === ""
        ) {
            booking.id =
                "booking-" +
                Date.now() +
                "-" +
                Math.random().toString(36).slice(2, 8);

            changed = true;
        }
    });

    if (changed) {
        saveSavedData("pt_bookings", bookings);
    }
}

// ===================================
// GET TUTOR'S BOOKINGS
// ===================================

function getTutorRequests() {
    const tutorEmail = String(currentUser.email || "")
        .trim()
        .toLowerCase();

    const tutorName = String(currentUser.name || "")
        .trim()
        .toLowerCase();

    return getAllBookings().filter(function(booking) {
        if (booking.tutorEmail) {
            return String(booking.tutorEmail)
                .trim()
                .toLowerCase() === tutorEmail;
        }

        return String(booking.tutorName || "")
            .trim()
            .toLowerCase() === tutorName;
    });
}

function getTutorBookingById(bookingId) {
    return getTutorRequests().find(function(booking) {
        return String(booking.id) === String(bookingId);
    });
}

// ===================================
// TUTOR INFORMATION
// ===================================

function displayTutorInfo() {
    if (!currentUser) return;

    // Get the tutor's registered account
    const users = getSavedData("pt_users");

    const registeredUser = users.find(function(user) {
        return String(user.email || "").trim().toLowerCase() ===
            String(currentUser.email || "").trim().toLowerCase();
    });

    // Get the correct tutor name
    const name =
        (registeredUser && (
            registeredUser.fullName ||
            registeredUser.name
        )) ||
        currentUser.fullName ||
        currentUser.name ||
        "Tutor";

    document.getElementById("tutorName").textContent = name;

    const avatar = document.getElementById("userInitials");

    if (avatar) {
        // Generate initials
        const nameParts = name.trim().split(/\s+/).filter(Boolean);

        const suffixes = ["JR.", "JR", "SR.", "SR", "II", "III", "IV", "V"];

        const filteredParts = nameParts.filter(function(part) {
            return !suffixes.includes(part.toUpperCase());
        });

        let initials = "";

        if (filteredParts.length >= 2) {
            initials =
                filteredParts[0].charAt(0) +
                filteredParts[filteredParts.length - 1].charAt(0);
        } else if (filteredParts.length === 1) {
            initials = filteredParts[0].substring(0, 2);
        }

        initials = initials.toUpperCase() || "TU";

        // Find the tutor's saved profile
        const tutorProfiles = getSavedData("pt_tutor_profiles");

        const tutorProfile = tutorProfiles.find(function(profile) {
            return String(profile.email || "").trim().toLowerCase() ===
                String(currentUser.email || "").trim().toLowerCase();
        });

        // Display uploaded profile picture or initials
        avatar.innerHTML = "";

        if (tutorProfile && tutorProfile.profilePicture) {
            const image = document.createElement("img");

            image.src = tutorProfile.profilePicture;
            image.alt = name + " Profile Picture";

            image.onerror = function() {
                avatar.innerHTML = "";
                avatar.textContent = initials;
            };

            avatar.appendChild(image);
        } else {
            avatar.textContent = initials;
        }
    }

    // Display current date
    const currentDate = document.getElementById("currentDate");

    if (currentDate) {
        currentDate.textContent = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    }
}



// ===================================
// HELPER FUNCTIONS
// ===================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function(character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character];
    });
}

function formatDate(date) {
    if (!date) return "Not specified";

    const formattedDate = new Date(date + "T00:00:00");

    if (Number.isNaN(formattedDate.getTime())) {
        return "Invalid date";
    }

    return formattedDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

function formatTime(time) {
    if (!time) return "Not specified";

    const date = new Date(`2000-01-01T${time}:00`);

    if (Number.isNaN(date.getTime())) {
        return time;
    }

    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    });
}

function getStatusClass(status) {
    const classes = {
        pending: "request-pending",
        approved: "request-approved",
        rejected: "request-rejected",
        completed: "request-completed",
        cancelled: "request-cancelled"
    };

    return classes[String(status).toLowerCase()] ||
        "request-pending";
}

// ===================================
// UPDATE BOOKING
// ===================================

function updateBooking(bookingId, updates) {
    const allBookings = getAllBookings();

    const index = allBookings.findIndex(function(booking) {
        return String(booking.id) === String(bookingId);
    });

    if (index === -1) {
        return false;
    }

    // Confirm that this booking belongs to the logged-in tutor
    const tutorBooking = getTutorBookingById(bookingId);

    if (!tutorBooking) {
        return false;
    }

    allBookings[index] = {
        ...allBookings[index],
        ...updates
    };

    saveSavedData("pt_bookings", allBookings);

    return true;
}

// ===================================
// NOTIFICATION DROPDOWN
// ===================================

const notificationBell =
    document.getElementById("notificationBell");

const notificationDropdown =
    document.getElementById("notificationDropdown");

notificationBell.addEventListener("click", function(event) {
    event.stopPropagation();

    const isOpen =
        notificationDropdown.classList.toggle("show");

    notificationBell.setAttribute(
        "aria-expanded",
        String(isOpen)
    );
});

// Close dropdown when clicking outside
document.addEventListener("click", function(event) {
    if (!event.target.closest(".notification-wrapper")) {
        notificationDropdown.classList.remove("show");

        notificationBell.setAttribute(
            "aria-expanded",
            "false"
        );
    }
});

// ===================================
// DISPLAY NOTIFICATION COUNT
// ===================================

function displayNotificationCount() {
    const pendingBookings = getTutorRequests().filter(function(booking) {
        return String(booking.status || "Pending").toLowerCase() === "pending";
    });

    const badge = document.getElementById("notificationBadge");
    const headerCount = document.getElementById("notificationHeaderCount");

    const count = pendingBookings.length;

    if (count > 0) {
        badge.textContent = count > 99 ? "99+" : count;
        badge.classList.remove("hidden");
    } else {
        badge.textContent = "0";
        badge.classList.add("hidden");
    }

    headerCount.textContent = count + (count === 1 ? " new" : " new");
}

// ===================================
// DISPLAY NOTIFICATION ITEMS
// ===================================

function displayNotifications() {
    const pendingBookings = getTutorRequests().filter(function(booking) {
        return String(booking.status || "Pending").toLowerCase() === "pending";
    });

    const notificationItems =
        document.getElementById("notificationItems");

    pendingBookings.sort(function(a, b) {
        return new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0);
    });

    if (pendingBookings.length === 0) {
        notificationItems.innerHTML = `
            <div class="notification-empty">
                <div style="font-size:28px; margin-bottom:8px;">🔔</div>
                No new booking notifications.
            </div>
        `;

        return;
    }

    notificationItems.innerHTML = pendingBookings.map(function(booking) {
        return `
            <div class="notification-item">

                <div class="notification-item-title">
                    <strong>New Booking Request</strong>
                    <span class="notification-new-label">NEW</span>
                </div>

                <p>
                    <strong>${escapeHTML(booking.studentName || "Student")}</strong>
                    booked a tutoring session with you.
                </p>

                <p>
                    📚 ${escapeHTML(booking.subject || "Not specified")}
                </p>

                <p>
                    📅 ${escapeHTML(formatDate(booking.date))}
                </p>

                <p>
                    🕒 ${escapeHTML(formatTime(booking.time))}
                </p>

                <p>
                    💻 ${escapeHTML(booking.mode || "Not specified")}
                </p>

                <div class="notification-actions">

                    <button
                        type="button"
                        class="notification-approve"
                        data-action="approve"
                        data-id="${escapeHTML(booking.id)}"
                    >
                        ✓ Approve
                    </button>

                    <button
                        type="button"
                        class="notification-cancel"
                        data-action="cancel"
                        data-id="${escapeHTML(booking.id)}"
                    >
                        ✕ Cancel
                    </button>

                </div>

            </div>
        `;
    }).join("");
}

// ===================================
// APPROVE BOOKING
// ===================================

function approveBooking(bookingId) {
    const booking = getTutorBookingById(bookingId);

    if (!booking) {
        alert("Booking request not found.");
        return;
    }

    if (
        String(booking.status || "Pending").toLowerCase() !== "pending"
    ) {
        alert("This booking is no longer pending.");
        refreshRequests();
        return;
    }

    if (!confirm("Are you sure you want to approve this booking?")) {
        return;
    }

    const success = updateBooking(bookingId, {
        status: "Approved",
        approvedAt: new Date().toISOString(),
        cancellationReason: "",
        rejectionReason: ""
    });

    if (success) {
        alert("Booking approved successfully!");

        refreshRequests();
    } else {
        alert("Unable to approve this booking.");
    }
}

// ===================================
// CANCEL BOOKING MODAL
// ===================================

let selectedBookingId = null;

function openCancelModal(bookingId) {
    const booking = getTutorBookingById(bookingId);

    if (!booking) {
        alert("Booking request not found.");
        return;
    }

    if (
        String(booking.status || "Pending").toLowerCase() !== "pending"
    ) {
        alert("Only pending bookings can be cancelled.");
        return;
    }

    selectedBookingId = bookingId;

    document.getElementById("cancelReason").value = "";

    document.getElementById("cancelModal").classList.add("show");

    document.getElementById("cancelReason").focus();
}

function closeCancelModal() {
    document.getElementById("cancelModal").classList.remove("show");

    document.getElementById("cancelReason").value = "";

    selectedBookingId = null;
}

// ===================================
// SAVE CANCELLATION REASON
// ===================================

function submitCancellation() {
    if (!selectedBookingId) {
        alert("No booking selected.");
        return;
    }

    const reason = document
        .getElementById("cancelReason")
        .value
        .trim();

    if (!reason) {
        alert("Please enter the reason for cancelling.");
        document.getElementById("cancelReason").focus();
        return;
    }

    const booking = getTutorBookingById(selectedBookingId);

    if (
        !booking ||
        String(booking.status || "Pending").toLowerCase() !== "pending"
    ) {
        alert("This booking is no longer pending.");
        closeCancelModal();
        refreshRequests();
        return;
    }

    const success = updateBooking(selectedBookingId, {
        status: "Cancelled",
        cancellationReason: reason,
        cancelledBy: "Tutor",
        cancelledAt: new Date().toISOString(),
        scheduleId: null
    });

    if (success) {
        alert("Booking cancelled successfully.");

        closeCancelModal();

        refreshRequests();
    } else {
        alert("Unable to cancel this booking.");
    }
}

// ===================================
// MEETING LINK
// ===================================

function getSafeMeetingLink(link) {
    if (!link) return "";

    try {
        const url = new URL(link);

        if (
            url.protocol === "https:" ||
            url.protocol === "http:"
        ) {
            return url.href;
        }
    } catch (error) {
        return "";
    }

    return "";
}

function updateMeetingLink(bookingId) {
    const booking = getTutorBookingById(bookingId);

    if (!booking) {
        alert("Booking not found.");
        return;
    }

    if (
        booking.status !== "Approved" ||
        booking.mode !== "Online"
    ) {
        alert("Only approved online bookings can have a meeting link.");
        return;
    }

    const answer = prompt(
        "Enter your online meeting link:",
        booking.meetingLink || ""
    );

    if (answer === null) return;

    const link = answer.trim();

    if (!link || !getSafeMeetingLink(link)) {
        alert("Please enter a valid HTTP or HTTPS meeting link.");
        return;
    }

    if (updateBooking(bookingId, {
        meetingLink: link,
        meetingLinkUpdatedAt: new Date().toISOString()
    })) {
        alert("Meeting link saved successfully!");
        refreshRequests();
    }
}

// ===================================
// COMPLETE BOOKING
// ===================================

function completeBooking(bookingId) {

    const booking = getTutorBookingById(bookingId);

    if (!booking) {
        alert("Booking not found.");
        return;
    }

    // Check booking status regardless of capitalization
    if (
        String(booking.status || "").toLowerCase() !== "approved"
    ) {
        alert("Only approved bookings can be marked as completed.");
        return;
    }

    const confirmed = confirm(
        "Have you already conducted this tutoring session?"
    );

    if (!confirmed) return;

    const success = updateBooking(bookingId, {
        status: "Completed",
        completedAt: new Date().toISOString()
    });

    if (success) {
        alert("Tutoring session marked as completed!");

        refreshRequests();
    } else {
        alert("Unable to complete this booking. Please try again.");
    }
}

// ===================================
// BOOKING STATISTICS
// ===================================

function displayRequestStatistics() {
    const requests = getTutorRequests();

    function countStatus(status) {
        return requests.filter(function(booking) {
            return String(booking.status || "Pending").toLowerCase() ===
                status.toLowerCase();
        }).length;
    }

    document.getElementById("totalRequests").textContent =
        requests.length;

    document.getElementById("pendingRequests").textContent =
        countStatus("Pending");

    document.getElementById("approvedRequests").textContent =
        countStatus("Approved");

    document.getElementById("completedRequests").textContent =
        countStatus("Completed");
}

// ===================================
// DISPLAY ALL BOOKING REQUESTS
// ===================================

function displayRequests() {
    const requests = getTutorRequests();

    const searchValue = document
        .getElementById("requestSearch")
        .value
        .trim()
        .toLowerCase();

    const selectedStatus =
        document.getElementById("requestStatusFilter").value;

    const filteredRequests = requests.filter(function(booking) {
        const studentName = String(booking.studentName || "").toLowerCase();
        const subject = String(booking.subject || "").toLowerCase();
        const status = String(booking.status || "Pending");

        const matchesSearch =
            studentName.includes(searchValue) ||
            subject.includes(searchValue);

        const matchesStatus =
            selectedStatus === "all" || status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    filteredRequests.sort(function(a, b) {
        return new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0);
    });

    document.getElementById("requestResults").textContent =
        `Showing ${filteredRequests.length} of ${requests.length} request(s)`;

    const requestList = document.getElementById("requestList");
    const emptyRequests = document.getElementById("emptyRequests");

    if (filteredRequests.length === 0) {
        requestList.innerHTML = "";
        emptyRequests.classList.remove("hidden");
        return;
    }

    emptyRequests.classList.add("hidden");

    requestList.innerHTML = filteredRequests.map(function(booking) {
        const status = booking.status || "Pending";
        const statusClass = getStatusClass(status);

        let meetingInformation = "";

        if (booking.mode === "Face-to-Face") {
            meetingInformation = `
                <div class="request-detail">
                    <span>📍 Meeting Location</span>
                    <strong>${escapeHTML(booking.location || "Not provided")}</strong>
                </div>
            `;
        } else {
            const safeLink = getSafeMeetingLink(booking.meetingLink);

            meetingInformation = `
                <div class="request-detail">
                    <span>💻 Online Meeting</span>
                    <strong>
                        ${
                            safeLink
                                ? `<a href="${escapeHTML(safeLink)}" target="_blank" rel="noopener noreferrer">Open Meeting Link</a>`
                                : "Meeting link not yet provided"
                        }
                    </strong>
                </div>
            `;
        }

        let actionButtons = "";

        if (status === "Approved" && booking.mode === "Online") {
            actionButtons += `
                <button
                    class="meeting-link-btn"
                    data-action="meeting-link"
                    data-id="${escapeHTML(booking.id)}"
                >
                    ${booking.meetingLink ? "Update Meeting Link" : "Add Meeting Link"}
                </button>
            `;
        }

        if (status === "Approved") {
            actionButtons += `
                <button
                    class="complete-request-btn"
                    data-action="complete"
                    data-id="${escapeHTML(booking.id)}"
                >
                    ✓ Mark as Completed
                </button>
            `;
        }

        const cancellationInformation =
            status === "Cancelled" && booking.cancellationReason
                ? `
                    <div class="request-cancel-reason">
                        <strong>Cancellation Reason:</strong>
                        <p>${escapeHTML(booking.cancellationReason)}</p>
                    </div>
                `
                : "";

        return `
            <article class="request-card">

                <div class="request-card-header">
                    <div class="request-student-information">
                        <div class="request-student-avatar">👤</div>

                        <div>
                            <h3>${escapeHTML(booking.studentName || "Student")}</h3>
                            <p>Student Booking Request</p>
                        </div>
                    </div>

                    <span class="request-status ${statusClass}">
                        ${escapeHTML(status)}
                    </span>
                </div>

                <div class="request-details-grid">

                    <div class="request-detail">
                        <span>📚 Subject</span>
                        <strong>${escapeHTML(booking.subject || "Not specified")}</strong>
                    </div>

                    <div class="request-detail">
                        <span>📅 Session Date</span>
                        <strong>${escapeHTML(formatDate(booking.date))}</strong>
                    </div>

                    <div class="request-detail">
                        <span>🕒 Start Time</span>
                        <strong>${escapeHTML(formatTime(booking.time))}</strong>
                    </div>

                    <div class="request-detail">
                        <span>🎓 Tutoring Mode</span>
                        <strong>${escapeHTML(booking.mode || "Not specified")}</strong>
                    </div>

                    ${meetingInformation}

                </div>

                ${
                    booking.notes
                        ? `
                            <div class="request-student-notes">
                                <strong>Student's Additional Notes</strong>
                                <p>${escapeHTML(booking.notes)}</p>
                            </div>
                        `
                        : ""
                }

                ${cancellationInformation}

                <div class="request-card-footer">
                    <span class="request-booking-id">
                        Booking ID: ${escapeHTML(booking.id)}
                    </span>

                    <div class="request-action-buttons">
                        ${actionButtons}
                    </div>
                </div>

            </article>
        `;
    }).join("");
}

// ===================================
// NOTIFICATION BUTTON EVENTS
// ===================================

document.getElementById("notificationItems")
    .addEventListener("click", function(event) {

        const button = event.target.closest("[data-action]");

        if (!button) return;

        const action = button.dataset.action;
        const bookingId = button.dataset.id;

        if (action === "approve") {
            approveBooking(bookingId);
        }

        if (action === "cancel") {
            openCancelModal(bookingId);
        }
    });

// ===================================
// BOOKING LIST BUTTON EVENTS
// ===================================

document.getElementById("requestList")
    .addEventListener("click", function(event) {

        const button = event.target.closest("[data-action]");

        if (!button) return;

        const action = button.dataset.action;
        const bookingId = button.dataset.id;

        if (action === "meeting-link") {
            updateMeetingLink(bookingId);
        }

        if (action === "complete") {
            completeBooking(bookingId);
        }
    });

// ===================================
// CANCEL MODAL EVENTS
// ===================================

document.getElementById("submitCancel")
    .addEventListener("click", submitCancellation);

document.getElementById("closeCancelModal")
    .addEventListener("click", closeCancelModal);

// ===================================
// SEARCH AND FILTER
// ===================================

document.getElementById("requestSearch")
    .addEventListener("input", displayRequests);

document.getElementById("requestStatusFilter")
    .addEventListener("change", displayRequests);

document.getElementById("clearRequestFilters")
    .addEventListener("click", function() {

        document.getElementById("requestSearch").value = "";
        document.getElementById("requestStatusFilter").value = "all";

        displayRequests();
    });

// ===================================
// LOGOUT
// ===================================

document.getElementById("logoutBtn")
    .addEventListener("click", function() {

        if (confirm("Are you sure you want to log out?")) {
            sessionStorage.removeItem("pt_current_user");
            sessionStorage.removeItem("pt_selected_tutor");

            window.location.href = "../login.html";
        }
    });

// ===================================
// REFRESH ALL PAGE DATA
// ===================================

function refreshRequests() {
    displayNotificationCount();
    displayNotifications();
    displayRequestStatistics();
    displayRequests();
}

// Update when another tab changes bookings
window.addEventListener("storage", function(event) {
    if (event.key === "pt_bookings") {
        ensureBookingIDs();
        refreshRequests();
    }
});

// Refresh periodically while page is open
setInterval(function() {
    refreshRequests();
}, 3000);

// ===================================
// INITIALIZE PAGE
// ===================================

if (currentUser && currentUser.role === "tutor") {
    ensureBookingIDs();
    displayTutorInfo();
    refreshRequests();
}

console.log("PeerTutor Notification System Loaded Successfully!");
