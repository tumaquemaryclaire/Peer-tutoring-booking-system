
// ===================================
// PEERTUTOR - SHARED TUTOR NOTIFICATIONS
// Used by Dashboard, Profile, and Schedule
// ===================================

const notificationUser = JSON.parse(
    sessionStorage.getItem("pt_current_user") || "null"
);

if (!notificationUser || notificationUser.role !== "tutor") {
    window.location.href = "../login.html";
}

// ===================================
// STORAGE HELPERS
// ===================================

function notificationGetBookings() {
    try {
        const bookings = JSON.parse(
            localStorage.getItem("pt_bookings") || "[]"
        );

        return Array.isArray(bookings) ? bookings : [];
    } catch (error) {
        console.error("Unable to load bookings:", error);
        return [];
    }
}

function notificationSaveBookings(bookings) {
    localStorage.setItem("pt_bookings", JSON.stringify(bookings));
}

function notificationEscape(value) {
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

function notificationGetTutorBookings() {
    const tutorEmail = String(notificationUser.email || "")
        .trim()
        .toLowerCase();

    const tutorName = String(notificationUser.name || "")
        .trim()
        .toLowerCase();

    return notificationGetBookings().filter(function(booking) {
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

function notificationGetPendingBookings() {
    return notificationGetTutorBookings().filter(function(booking) {
        return String(booking.status || "Pending").toLowerCase() === "pending";
    });
}

// ===================================
// FORMAT DATE AND TIME
// ===================================

function notificationFormatDate(date) {
    if (!date) return "Not specified";

    const parsedDate = new Date(date + "T00:00:00");

    if (Number.isNaN(parsedDate.getTime())) {
        return "Not specified";
    }

    return parsedDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

function notificationFormatTime(time) {
    if (!time) return "Not specified";

    const parsedTime = new Date(`2000-01-01T${time}:00`);

    if (Number.isNaN(parsedTime.getTime())) {
        return time;
    }

    return parsedTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    });
}

// ===================================
// CREATE NOTIFICATION BELL
// ===================================

function setupTutorNotifications() {
    const topbar = document.querySelector(".dashboard-topbar");
    const userInformation = topbar?.querySelector(".user-information");

    if (!topbar || !userInformation) {
        console.error("Tutor notification area could not be found.");
        return;
    }

    // Do not create a duplicate bell
    if (document.getElementById("notificationBell")) {
        return;
    }

    const topbarRight = document.createElement("div");
    topbarRight.className = "topbar-right";

    const notificationWrapper = document.createElement("div");
    notificationWrapper.className = "notification-wrapper";

    notificationWrapper.innerHTML = `
        <button
            type="button"
            class="notification-bell"
            id="notificationBell"
            aria-label="Open notifications"
            aria-expanded="false"
        >
            🔔
            <span
                class="notification-badge hidden"
                id="notificationBadge"
            >0</span>
        </button>

        <div
            class="notification-dropdown"
            id="notificationDropdown"
        >
            <div class="notification-dropdown-header">
                <h3>Notifications</h3>
                <span id="notificationHeaderCount">0 new</span>
            </div>

            <div
                class="notification-items"
                id="notificationItems"
            >
                <div class="notification-empty">
                    No new booking notifications.
                </div>
            </div>
        </div>
    `;

    // Move profile information into the shared topbar group
    topbarRight.appendChild(notificationWrapper);
    topbarRight.appendChild(userInformation);
    topbar.appendChild(topbarRight);

    // Create cancellation modal
    const modal = document.createElement("div");
    modal.className = "cancel-modal";
    modal.id = "sharedCancelModal";

    modal.innerHTML = `
        <div class="cancel-modal-content" role="dialog" aria-modal="true">
            <h2>Cancel Booking Request</h2>

            <p>
                Please provide a reason for cancelling this booking.
                The student will be able to see your explanation.
            </p>

            <textarea
                id="sharedCancelReason"
                maxlength="500"
                placeholder="Enter your reason for cancelling..."
            ></textarea>

            <div class="cancel-modal-actions">
                <button
                    type="button"
                    class="cancel-close-btn"
                    id="sharedCloseCancel"
                >
                    Go Back
                </button>

                <button
                    type="button"
                    class="cancel-submit-btn"
                    id="sharedSubmitCancel"
                >
                    Confirm Cancellation
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    setupNotificationEvents();
    refreshTutorNotifications();
}

// ===================================
// UPDATE NOTIFICATION BADGE
// ===================================

function updateNotificationBadge() {
    const pending = notificationGetPendingBookings();

    const badge = document.getElementById("notificationBadge");
    const headerCount = document.getElementById("notificationHeaderCount");

    if (!badge || !headerCount) return;

    const count = pending.length;

    if (count > 0) {
        badge.textContent = count > 99 ? "99+" : count;
        badge.classList.remove("hidden");
    } else {
        badge.textContent = "0";
        badge.classList.add("hidden");
    }

    headerCount.textContent =
        count + (count === 1 ? " new" : " new");
}

// ===================================
// DISPLAY NOTIFICATION LIST
// ===================================

function displayTutorNotifications() {
    const container = document.getElementById("notificationItems");

    if (!container) return;

    const pending = notificationGetPendingBookings();

    pending.sort(function(a, b) {
        return new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0);
    });

    if (pending.length === 0) {
        container.innerHTML = `
            <div class="notification-empty">
                <div style="font-size:28px; margin-bottom:8px;">🔔</div>
                No new booking notifications.
            </div>
        `;

        return;
    }

    container.innerHTML = pending.map(function(booking) {
        return `
            <div class="notification-item">

                <div class="notification-item-title">
                    <strong>New Booking Request</strong>
                    <span class="notification-new-label">NEW</span>
                </div>

                <p>
                    <strong>${notificationEscape(booking.studentName || "Student")}</strong>
                    booked a tutoring session with you.
                </p>

                <p>📚 ${notificationEscape(booking.subject || "Not specified")}</p>
                <p>📅 ${notificationEscape(notificationFormatDate(booking.date))}</p>
                <p>🕒 ${notificationEscape(notificationFormatTime(booking.time))}</p>
                <p>💻 ${notificationEscape(booking.mode || "Not specified")}</p>

                <div class="notification-actions">
                    <button
                        type="button"
                        class="notification-approve"
                        data-notification-action="approve"
                        data-booking-id="${notificationEscape(booking.id)}"
                    >
                        ✓ Approve
                    </button>

                    <button
                        type="button"
                        class="notification-cancel"
                        data-notification-action="cancel"
                        data-booking-id="${notificationEscape(booking.id)}"
                    >
                        ✕ Cancel
                    </button>
                </div>

            </div>
        `;
    }).join("");
}

// ===================================
// UPDATE BOOKING STATUS
// ===================================

function updateTutorBooking(bookingId, updates) {
    const bookings = notificationGetBookings();

    const index = bookings.findIndex(function(booking) {
        return String(booking.id) === String(bookingId);
    });

    if (index === -1) {
        return false;
    }

    const tutorBooking = notificationGetTutorBookings().find(function(booking) {
        return String(booking.id) === String(bookingId);
    });

    if (!tutorBooking) {
        return false;
    }

    bookings[index] = {
        ...bookings[index],
        ...updates
    };

    notificationSaveBookings(bookings);

    return true;
}

// ===================================
// APPROVE BOOKING
// ===================================

function approveTutorBooking(bookingId) {
    const booking = notificationGetTutorBookings().find(function(item) {
        return String(item.id) === String(bookingId);
    });

    if (!booking) {
        alert("Booking request not found.");
        return;
    }

    if (
        String(booking.status || "Pending").toLowerCase() !== "pending"
    ) {
        alert("This booking is no longer pending.");
        refreshTutorNotifications();
        return;
    }

    if (!confirm("Are you sure you want to approve this booking?")) {
        return;
    }

    const success = updateTutorBooking(bookingId, {
        status: "Approved",
        approvedAt: new Date().toISOString(),
        cancellationReason: "",
        rejectionReason: ""
    });

    if (success) {
        alert("Booking approved successfully!");
        refreshTutorNotifications();
    } else {
        alert("Unable to approve this booking.");
    }
}

// ===================================
// CANCEL BOOKING
// ===================================

let sharedSelectedBookingId = null;

function openSharedCancelModal(bookingId) {
    const booking = notificationGetTutorBookings().find(function(item) {
        return String(item.id) === String(bookingId);
    });

    if (
        !booking ||
        String(booking.status || "Pending").toLowerCase() !== "pending"
    ) {
        alert("This booking is no longer pending.");
        refreshTutorNotifications();
        return;
    }

    sharedSelectedBookingId = bookingId;

    document.getElementById("sharedCancelReason").value = "";

    document.getElementById("sharedCancelModal").classList.add("show");

    document.getElementById("sharedCancelReason").focus();
}

function closeSharedCancelModal() {
    const modal = document.getElementById("sharedCancelModal");

    if (modal) {
        modal.classList.remove("show");
    }

    const reason = document.getElementById("sharedCancelReason");

    if (reason) {
        reason.value = "";
    }

    sharedSelectedBookingId = null;
}

function submitSharedCancellation() {
    if (!sharedSelectedBookingId) {
        alert("No booking selected.");
        return;
    }

    const reason = document
        .getElementById("sharedCancelReason")
        .value
        .trim();

    if (!reason) {
        alert("Please enter the reason for cancelling.");
        document.getElementById("sharedCancelReason").focus();
        return;
    }

    const booking = notificationGetTutorBookings().find(function(item) {
        return String(item.id) === String(sharedSelectedBookingId);
    });

    if (
        !booking ||
        String(booking.status || "Pending").toLowerCase() !== "pending"
    ) {
        alert("This booking is no longer pending.");
        closeSharedCancelModal();
        refreshTutorNotifications();
        return;
    }

    const success = updateTutorBooking(sharedSelectedBookingId, {
        status: "Cancelled",
        cancellationReason: reason,
        cancelledBy: "Tutor",
        cancelledAt: new Date().toISOString(),
        scheduleId: null
    });

    if (success) {
        alert("Booking cancelled successfully.");
        closeSharedCancelModal();
        refreshTutorNotifications();
    } else {
        alert("Unable to cancel this booking.");
    }
}

// ===================================
// EVENT LISTENERS
// ===================================

function setupNotificationEvents() {
    const bell = document.getElementById("notificationBell");
    const dropdown = document.getElementById("notificationDropdown");
    const items = document.getElementById("notificationItems");

    bell.addEventListener("click", function(event) {
        event.stopPropagation();

        const isOpen = dropdown.classList.toggle("show");

        bell.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", function(event) {
        if (!event.target.closest(".notification-wrapper")) {
            dropdown.classList.remove("show");
            bell.setAttribute("aria-expanded", "false");
        }
    });

    items.addEventListener("click", function(event) {
        const button = event.target.closest("[data-notification-action]");

        if (!button) return;

        const action = button.dataset.notificationAction;
        const bookingId = button.dataset.bookingId;

        if (action === "approve") {
            approveTutorBooking(bookingId);
        }

        if (action === "cancel") {
            openSharedCancelModal(bookingId);
        }
    });

    document.getElementById("sharedCloseCancel")
        .addEventListener("click", closeSharedCancelModal);

    document.getElementById("sharedSubmitCancel")
        .addEventListener("click", submitSharedCancellation);

    document.getElementById("sharedCancelModal")
        .addEventListener("click", function(event) {
            if (event.target.id === "sharedCancelModal") {
                closeSharedCancelModal();
            }
        });

    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            dropdown.classList.remove("show");
            bell.setAttribute("aria-expanded", "false");
            closeSharedCancelModal();
        }
    });
}

// ===================================
// REFRESH NOTIFICATIONS
// ===================================

function refreshTutorNotifications() {
    updateNotificationBadge();
    displayTutorNotifications();
}

// Listen for changes made in other browser tabs
window.addEventListener("storage", function(event) {
    if (event.key === "pt_bookings") {
        refreshTutorNotifications();
    }
});

// Poll to detect new bookings while this page is open
setInterval(refreshTutorNotifications, 3000);

// ===================================
// START
// ===================================

if (notificationUser && notificationUser.role === "tutor") {
    setupTutorNotifications();
}
