
// ===================================
// PEERTUTOR - TUTOR DASHBOARD
// ===================================


// GET CURRENT USER
const currentUser = JSON.parse(
    sessionStorage.getItem("pt_current_user") || "null"
);


// CHECK TUTOR ACCOUNT
if (!currentUser || currentUser.role !== "tutor") {

    alert("Please log in using your tutor account.");

    window.location.href = "../login.html";

}


// ===================================
// GET ALL SAVED BOOKINGS
// ===================================

function getAllBookings() {

    return JSON.parse(
        localStorage.getItem("pt_bookings") || "[]"
    );

}


// ===================================
// GET BOOKINGS FOR CURRENT TUTOR
// ===================================

function getTutorBookings() {

    const allBookings = getAllBookings();

    return allBookings.filter(function(booking) {

        // Direct account matching for future backend integration
        const matchesEmail =
            booking.tutorEmail &&
            booking.tutorEmail.toLowerCase() ===
            currentUser.email.toLowerCase();

        const matchesId =
            String(booking.tutorId) === String(currentUser.id);

        // Temporary matching for our sample tutor profiles
        const matchesName =
            String(booking.tutorName || "").trim().toLowerCase() ===
            String(currentUser.name || "").trim().toLowerCase();

        return matchesEmail || matchesId || matchesName;

    });

}


// ===================================
// DISPLAY TUTOR INFORMATION
// ===================================

function displayTutorInfo() {

    const name = currentUser.name || "Tutor";

    document.getElementById("tutorName").textContent = name;

    document.getElementById("welcomeName").textContent =
        name.split(" ")[0];

    const initials = name
        .split(" ")
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    document.getElementById("userInitials").textContent =
        initials || "TU";

}


// ===================================
// DISPLAY CURRENT DATE
// ===================================

function displayCurrentDate() {

    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString("en-US", {

            weekday: "long",

            month: "long",

            day: "numeric",

            year: "numeric"

        });

}


// ===================================
// DISPLAY BOOKING STATISTICS
// ===================================

function displayTutorStatistics() {

    const bookings = getTutorBookings();


    const countStatus = function(status) {

        return bookings.filter(function(booking) {

            return String(booking.status).toLowerCase() ===
                   status.toLowerCase();

        }).length;

    };


    document.getElementById("tutorTotalBookings").textContent =
        bookings.length;

    document.getElementById("tutorPendingBookings").textContent =
        countStatus("Pending");

    document.getElementById("tutorApprovedBookings").textContent =
        countStatus("Approved");

    document.getElementById("tutorCompletedBookings").textContent =
        countStatus("Completed");

}


// ===================================
// ESCAPE HTML CONTENT
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


// ===================================
// DISPLAY BOOKING STATUS
// ===================================

function getStatusClass(status) {

    const statuses = {

        pending: "status-pending",

        approved: "status-approved",

        completed: "status-completed",

        rejected: "status-rejected",

        cancelled: "status-cancelled"

    };

    return statuses[String(status).toLowerCase()] ||
           "status-pending";

}


// ===================================
// DISPLAY RECENT BOOKING REQUESTS
// ===================================

function displayRecentBookings() {

    const bookings = getTutorBookings();

    const bookingTable =
        document.getElementById("tutorRecentBookings");


    if (bookings.length === 0) {

        bookingTable.innerHTML = `

            <tr>
                <td colspan="5" class="empty-booking">

                    No booking requests yet.

                </td>
            </tr>

        `;

        return;

    }


    // SHOW NEWEST BOOKINGS FIRST
    const recentBookings = bookings
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 5);


    bookingTable.innerHTML = recentBookings.map(function(booking) {

        const status = booking.status || "Pending";

        const statusClass = getStatusClass(status);


        return `

            <tr>

                <td>${escapeHTML(booking.studentName)}</td>

                <td>${escapeHTML(booking.subject)}</td>

                <td>${escapeHTML(booking.date)}</td>

                <td>${escapeHTML(booking.mode)}</td>

                <td>

                    <span class="booking-status ${statusClass}">

                        ${escapeHTML(status)}

                    </span>

                </td>

            </tr>

        `;

    }).join("");

}


// ===================================
// LOGOUT FUNCTION
// ===================================

document.getElementById("logoutBtn")
    .addEventListener("click", function() {

        const confirmLogout = confirm(
            "Are you sure you want to log out?"
        );

        if (confirmLogout) {

            sessionStorage.removeItem("pt_current_user");

            sessionStorage.removeItem("pt_selected_tutor");

            window.location.href = "../login.html";

        }

    });


// ===================================
// INITIALIZE TUTOR DASHBOARD
// ===================================

if (currentUser && currentUser.role === "tutor") {

    displayTutorInfo();

    displayCurrentDate();

    displayTutorStatistics();

    displayRecentBookings();

}


console.log("PeerTutor Tutor Dashboard Loaded Successfully!");
