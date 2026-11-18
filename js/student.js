
// ===================================
// PEERTUTOR - STUDENT DASHBOARD
// ===================================


// GET CURRENT USER
const currentUser = JSON.parse(
    sessionStorage.getItem("pt_current_user") || "null"
);


// CHECK IF USER IS LOGGED IN
if (!currentUser || currentUser.role !== "student") {

    alert("Please log in using your student account.");

    window.location.href = "../login.html";

}


// ===================================
// DISPLAY STUDENT INFORMATION
// ===================================

function displayStudentInfo() {

    if (!currentUser) return;

    const studentName = currentUser.name || "Student";

    document.getElementById("studentName").textContent = studentName;

    document.getElementById("welcomeName").textContent =
        studentName.split(" ")[0];

    // Get student's initials
    const initials = studentName
        .split(" ")
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    document.getElementById("userInitials").textContent =
        initials || "ST";

}


// ===================================
// DISPLAY CURRENT DATE
// ===================================

function displayCurrentDate() {

    const today = new Date();

    const dateOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };

    document.getElementById("currentDate").textContent =
        today.toLocaleDateString("en-US", dateOptions);

}


// ===================================
// GET STUDENT BOOKINGS
// ===================================

function getStudentBookings() {

    const allBookings = JSON.parse(
        localStorage.getItem("pt_bookings") || "[]"
    );

    return allBookings.filter(function(booking) {

        return booking.studentEmail === currentUser.email;

    });

}


// ===================================
// DISPLAY BOOKING STATISTICS
// ===================================

function displayBookingStatistics() {

    const bookings = getStudentBookings();

    const total = bookings.length;

    const pending = bookings.filter(function(booking) {
        return booking.status.toLowerCase() === "pending";
    }).length;

    const approved = bookings.filter(function(booking) {
        return booking.status.toLowerCase() === "approved";
    }).length;

    const completed = bookings.filter(function(booking) {
        return booking.status.toLowerCase() === "completed";
    }).length;


    document.getElementById("totalBookings").textContent = total;

    document.getElementById("pendingBookings").textContent = pending;

    document.getElementById("approvedBookings").textContent = approved;

    document.getElementById("completedBookings").textContent = completed;

}


// ===================================
// PREVENT HTML INJECTION IN TABLE
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
// DISPLAY RECENT BOOKINGS
// ===================================

function displayRecentBookings() {

    const bookings = getStudentBookings();

    const recentBookings = document.getElementById("recentBookings");

    // Show empty message if no bookings exist
    if (bookings.length === 0) {

        recentBookings.innerHTML = `
            <tr>
                <td colspan="5" class="empty-booking">
                    You don't have any bookings yet.
                    Find a tutor to get started!
                </td>
            </tr>
        `;

        return;

    }


    // Show newest bookings first
    const sortedBookings = bookings
        .sort((a, b) => b.id - a.id)
        .slice(0, 5);


    recentBookings.innerHTML = sortedBookings.map(function(booking) {

        const status = String(booking.status || "Pending").toLowerCase();

        const allowedStatuses = [
            "pending",
            "approved",
            "completed",
            "rejected",
            "cancelled"
        ];

        const statusClass = allowedStatuses.includes(status)
            ? "status-" + status
            : "status-pending";

        return `
            <tr>
                <td>${escapeHTML(booking.tutorName)}</td>

                <td>${escapeHTML(booking.subject)}</td>

                <td>${escapeHTML(booking.date)}</td>

                <td>${escapeHTML(booking.mode)}</td>

                <td>
                    <span class="booking-status ${statusClass}">
                        ${escapeHTML(booking.status || "Pending")}
                    </span>
                </td>
            </tr>
        `;

    }).join("");

}


// ===================================
// LOGOUT FUNCTION
// ===================================

document.getElementById("logoutBtn").addEventListener("click", function() {

    const confirmLogout = confirm("Are you sure you want to log out?");

    if (confirmLogout) {

        sessionStorage.removeItem("pt_current_user");

        window.location.href = "../login.html";

    }

});


// ===================================
// INITIALIZE DASHBOARD
// ===================================

if (currentUser && currentUser.role === "student") {

    displayStudentInfo();

    displayCurrentDate();

    displayBookingStatistics();

    displayRecentBookings();

}

console.log("PeerTutor Student Dashboard Loaded Successfully!");
