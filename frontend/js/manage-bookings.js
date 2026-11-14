
// ===========================================
// PEERTUTOR - ADMIN MANAGE BOOKINGS
// Search, Filter, View, and Update Bookings
// ===========================================

const BOOKINGS_KEY = "pt_bookings";

const bookingsTableBody = document.getElementById("bookingsTableBody");
const searchBookings = document.getElementById("searchBookings");
const statusFilter = document.getElementById("statusFilter");

const bookingDetailsModal = document.getElementById("bookingDetailsModal");
const bookingDetailsContent = document.getElementById("bookingDetailsContent");

let bookings = [];


// ===========================================
// STORAGE
// ===========================================

function getBookings() {
    try {
        const data = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Unable to load bookings:", error);
        return [];
    }
}


function saveBookings() {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}


function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function(character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}


function formatStatus(status) {
    return String(status || "Pending")
        .trim()
        .toLowerCase();
}


function capitalize(value) {
    const text = String(value || "");
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}


// ===========================================
// ADMIN INFORMATION
// ===========================================

function loadAdminInformation() {
    let currentAdmin = null;

    try {
        currentAdmin = JSON.parse(
            sessionStorage.getItem("pt_current_user")
        );
    } catch (error) {
        currentAdmin = null;
    }

    if (currentAdmin) {
        const name = currentAdmin.name || "Administrator";
        const email = currentAdmin.email || "Admin Account";

        document.getElementById("sidebarAdminName").textContent = name;
        document.getElementById("headerAdminName").textContent = name;
        document.getElementById("headerAdminEmail").textContent = email;
    }
}


// ===========================================
// SUMMARY CARDS
// ===========================================

function updateBookingSummary() {
    document.getElementById("totalBookings").textContent = bookings.length;

    document.getElementById("pendingBookings").textContent =
        bookings.filter(function(booking) {
            return formatStatus(booking.status) === "pending";
        }).length;

    document.getElementById("approvedBookings").textContent =
        bookings.filter(function(booking) {
            return formatStatus(booking.status) === "approved";
        }).length;

    document.getElementById("completedBookings").textContent =
        bookings.filter(function(booking) {
            return formatStatus(booking.status) === "completed";
        }).length;
}


// ===========================================
// STATUS BADGE
// ===========================================

function getStatusClass(status) {
    const normalized = formatStatus(status);

    const allowedStatuses = [
        "pending",
        "approved",
        "rejected",
        "completed",
        "cancelled"
    ];

    return allowedStatuses.includes(normalized)
        ? normalized
        : "unknown";
}


// ===========================================
// RENDER BOOKINGS TABLE
// ===========================================

function renderBookings() {
    const searchTerm = searchBookings.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    const filteredBookings = bookings.filter(function(booking) {
        const studentName = String(booking.studentName || "").toLowerCase();
        const tutorName = String(booking.tutorName || "").toLowerCase();
        const subject = String(booking.subject || "").toLowerCase();
        const studentEmail = String(booking.studentEmail || "").toLowerCase();
        const tutorEmail = String(booking.tutorEmail || "").toLowerCase();

        const matchesSearch =
            studentName.includes(searchTerm) ||
            tutorName.includes(searchTerm) ||
            subject.includes(searchTerm) ||
            studentEmail.includes(searchTerm) ||
            tutorEmail.includes(searchTerm);

        const currentStatus = formatStatus(booking.status);

        const matchesStatus =
            selectedStatus === "all" ||
            currentStatus === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    // Sort newest booking first when creation dates are available.
    filteredBookings.sort(function(a, b) {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    document.getElementById("bookingCount").textContent =
        filteredBookings.length +
        (filteredBookings.length === 1 ? " booking" : " bookings");

    if (filteredBookings.length === 0) {
        bookingsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-row">
                    No bookings found.
                </td>
            </tr>
        `;
        return;
    }

    bookingsTableBody.innerHTML = filteredBookings.map(function(booking) {
        const status = getStatusClass(booking.status);

        return `
            <tr>
                <td>
                    <div class="booking-person">
                        <strong>${escapeHTML(booking.studentName || "Unknown Student")}</strong>
                        <span>${escapeHTML(booking.studentEmail || "")}</span>
                    </div>
                </td>

                <td>
                    <div class="booking-person">
                        <strong>${escapeHTML(booking.tutorName || "Unknown Tutor")}</strong>
                        <span>${escapeHTML(booking.tutorEmail || "")}</span>
                    </div>
                </td>

                <td>${escapeHTML(booking.subject || "Not specified")}</td>

                <td>${escapeHTML(booking.date || "Not specified")}</td>

                <td>${escapeHTML(booking.time || "Not specified")}</td>

                <td>
                    <span class="booking-status ${status}">
                        ${escapeHTML(capitalize(booking.status || "Pending"))}
                    </span>
                </td>

                <td>
                    <div class="action-buttons">
                        <button
                            type="button"
                            class="action-button view"
                            data-action="view"
                            data-booking-id="${escapeHTML(booking.id)}"
                        >
                            View
                        </button>

                        <button
                            type="button"
                            class="action-button activate"
                            data-action="update"
                            data-booking-id="${escapeHTML(booking.id)}"
                        >
                            Update
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}


// ===========================================
// FIND BOOKING
// ===========================================

function findBooking(bookingId) {
    return bookings.find(function(booking) {
        return String(booking.id) === String(bookingId);
    });
}


// ===========================================
// VIEW BOOKING DETAILS
// ===========================================

function openBookingDetails(booking) {
    const details = [
        ["Booking ID", booking.id],
        ["Student Name", booking.studentName],
        ["Student Email", booking.studentEmail],
        ["Tutor Name", booking.tutorName],
        ["Tutor Email", booking.tutorEmail],
        ["Subject", booking.subject],
        ["Session Date", booking.date],
        ["Session Time", booking.time],
        ["Mode", booking.mode],
        ["Location", booking.location],
        ["Meeting Link", booking.meetingLink],
        ["Notes", booking.notes],
        ["Status", capitalize(booking.status || "Pending")],
        ["Date Created", booking.createdAt]
    ];

    bookingDetailsContent.innerHTML = details.map(function(item) {
        const value = item[1] || "Not provided";

        if (item[0] === "Meeting Link" && value !== "Not provided") {
            const safeUrl = String(value).trim();

            if (/^https?:\/\/\S+$/i.test(safeUrl)) {
                return `
                    <div class="detail-row">
                        <span>${escapeHTML(item[0])}</span>
                        <a href="${escapeHTML(safeUrl)}"
                           target="_blank"
                           rel="noopener noreferrer">
                            Open Meeting Link
                        </a>
                    </div>
                `;
            }
        }

        return `
            <div class="detail-row">
                <span>${escapeHTML(item[0])}</span>
                <strong>${escapeHTML(value)}</strong>
            </div>
        `;
    }).join("");

    bookingDetailsModal.classList.add("show");
    bookingDetailsModal.setAttribute("aria-hidden", "false");
}


function closeBookingDetails() {
    bookingDetailsModal.classList.remove("show");
    bookingDetailsModal.setAttribute("aria-hidden", "true");
}


document.getElementById("closeBookingModal")
    .addEventListener("click", closeBookingDetails);

document.getElementById("closeBookingDetails")
    .addEventListener("click", closeBookingDetails);

bookingDetailsModal.addEventListener("click", function(event) {
    if (event.target === bookingDetailsModal) {
        closeBookingDetails();
    }
});


// ===========================================
// UPDATE BOOKING STATUS
// ===========================================

function updateBookingStatus(booking) {
    const currentStatus = formatStatus(booking.status);

    const allowedStatuses = [
        "pending",
        "approved",
        "rejected",
        "completed",
        "cancelled"
    ];

    const newStatus = prompt(
        "Update booking status:\n\n" +
        "Type one of the following:\n" +
        "Pending\nApproved\nRejected\nCompleted\nCancelled\n\n" +
        "Current status: " + capitalize(currentStatus),
        capitalize(currentStatus)
    );

    if (newStatus === null) {
        return;
    }

    const normalizedStatus = newStatus.trim().toLowerCase();

    if (!allowedStatuses.includes(normalizedStatus)) {
        alert("Invalid status. Please enter Pending, Approved, Rejected, Completed, or Cancelled.");
        return;
    }

    if (normalizedStatus === currentStatus) {
        alert("The booking already has this status.");
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to change this booking status from " +
        capitalize(currentStatus) + " to " +
        capitalize(normalizedStatus) + "?"
    );

    if (!confirmed) {
        return;
    }

    booking.status = capitalize(normalizedStatus);
    booking.updatedAt = new Date().toISOString();

    // If a booking is no longer approved, clear any old meeting link
    // only when the booking is rejected or cancelled.
    if (
        normalizedStatus === "rejected" ||
        normalizedStatus === "cancelled"
    ) {
        booking.meetingLink = "";
    }

    saveBookings();
    updateBookingSummary();
    renderBookings();

    alert("Booking status updated successfully!");
}


// ===========================================
// TABLE ACTIONS
// ===========================================

bookingsTableBody.addEventListener("click", function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const booking = findBooking(button.dataset.bookingId);

    if (!booking) {
        alert("Booking record could not be found.");
        return;
    }

    if (button.dataset.action === "view") {
        openBookingDetails(booking);
    }

    if (button.dataset.action === "update") {
        updateBookingStatus(booking);
    }
});


// ===========================================
// SEARCH AND FILTER
// ===========================================

searchBookings.addEventListener("input", renderBookings);
statusFilter.addEventListener("change", renderBookings);


// ===========================================
// LOGOUT
// ===========================================

document.getElementById("logoutButton").addEventListener("click", function() {
    const confirmed = confirm("Are you sure you want to log out?");

    if (confirmed) {
        sessionStorage.removeItem("pt_current_user");
        window.location.href = "login.html";
    }
});


// ===========================================
// INITIALIZE PAGE
// ===========================================

function initializeManageBookings() {
    loadAdminInformation();

    bookings = getBookings();

    updateBookingSummary();
    renderBookings();
}

initializeManageBookings();

console.log("PeerTutor Manage Bookings Loaded Successfully!");
