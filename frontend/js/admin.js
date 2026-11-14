
// ===================================
// PEERTUTOR - ADMIN DASHBOARD
// System Overview and Monitoring
// ===================================


// ===================================
// CHECK ADMIN LOGIN
// ===================================

const currentUser = JSON.parse(
    sessionStorage.getItem("pt_current_user") || "null"
);


if (!currentUser || currentUser.role !== "admin") {

    alert("Access denied. Please log in using an administrator account.");

    window.location.href = "../login.html";

}


// ===================================
// SAFE LOCAL STORAGE READER
// ===================================

function getSavedData(key) {

    try {

        const data = JSON.parse(
            localStorage.getItem(key) || "[]"
        );

        return Array.isArray(data) ? data : [];

    } catch (error) {

        console.error("Unable to read " + key, error);

        return [];

    }

}


// ===================================
// GET SYSTEM DATA
// ===================================

function getAllUsers() {

    return getSavedData("pt_users");

}


function getAllBookings() {

    return getSavedData("pt_bookings");

}


function getAllTutorProfiles() {

    return getSavedData("pt_tutor_profiles");

}


function getAllFeedback() {

    return getSavedData("pt_feedback");

}


function getAllSchedules() {

    return getSavedData("pt_schedules");

}


// ===================================
// ESCAPE HTML
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
// DISPLAY ADMIN INFORMATION
// ===================================

function displayAdminInfo() {

    if (!currentUser) return;

    const name = currentUser.name || "Administrator";

    document.getElementById("adminName").textContent = name;

    document.getElementById("welcomeAdminName").textContent =
        name.split(" ")[0];

    const initials = name
        .split(" ")
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    document.getElementById("adminInitials").textContent =
        initials || "AD";

    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString("en-US", {

            weekday: "long",

            month: "long",

            day: "numeric",

            year: "numeric"

        });

}


// ===================================
// DISPLAY USER STATISTICS
// ===================================

function displayUserStatistics() {

    const users = getAllUsers();

    const students = users.filter(function(user) {

        return user.role === "student";

    });

    const tutors = users.filter(function(user) {

        return user.role === "tutor";

    });

    const admins = users.filter(function(user) {

        return user.role === "admin";

    });


    document.getElementById("adminTotalUsers").textContent =
        users.length;

    document.getElementById("adminTotalStudents").textContent =
        students.length;

    document.getElementById("adminTotalTutors").textContent =
        tutors.length;

    document.getElementById("adminTotalAdmins").textContent =
        admins.length;

}


// ===================================
// DISPLAY BOOKING STATISTICS
// ===================================

function displayBookingStatistics() {

    const bookings = getAllBookings();


    function countStatus(status) {

        return bookings.filter(function(booking) {

            return String(booking.status).toLowerCase() ===
                   status.toLowerCase();

        }).length;

    }


    document.getElementById("adminTotalBookings").textContent =
        bookings.length;

    document.getElementById("adminPendingBookings").textContent =
        countStatus("Pending");

    document.getElementById("adminApprovedBookings").textContent =
        countStatus("Approved");

    document.getElementById("adminCompletedBookings").textContent =
        countStatus("Completed");

}


// ===================================
// DISPLAY SYSTEM INFORMATION
// ===================================

function displaySystemInformation() {

    const tutorProfiles = getAllTutorProfiles();

    const feedback = getAllFeedback();

    const schedules = getAllSchedules();


    // GET UNIQUE SUBJECTS FROM TUTOR PROFILES
    const subjects = tutorProfiles.flatMap(function(profile) {

        return Array.isArray(profile.subjects)
            ? profile.subjects
            : [];

    });


    const uniqueSubjects = [
        ...new Set(subjects)
    ];


    document.getElementById("adminTotalSubjects").textContent =
        uniqueSubjects.length;

    document.getElementById("adminTotalFeedback").textContent =
        feedback.length;

    document.getElementById("adminTotalSchedules").textContent =
        schedules.length;

}


// ===================================
// FORMAT BOOKING STATUS
// ===================================

function getStatusClass(status) {

    const classes = {

        pending: "status-pending",

        approved: "status-approved",

        rejected: "status-rejected",

        completed: "status-completed",

        cancelled: "status-cancelled"

    };

    return classes[String(status).toLowerCase()] ||
           "status-pending";

}


// ===================================
// DISPLAY RECENT BOOKINGS
// ===================================

function displayRecentBookings() {

    const bookings = getAllBookings();

    const recentBookings =
        document.getElementById("adminRecentBookings");


    if (bookings.length === 0) {

        recentBookings.innerHTML = `

            <tr>

                <td colspan="5" class="empty-booking">

                    No booking records available.

                </td>

            </tr>

        `;

        return;

    }


    // SORT NEWEST BOOKINGS FIRST
    const sortedBookings = [...bookings]

        .sort(function(a, b) {

            return Number(b.id) - Number(a.id);

        })

        .slice(0, 5);


    recentBookings.innerHTML = sortedBookings.map(function(booking) {

        const status = booking.status || "Pending";

        const statusClass = getStatusClass(status);


        return `

            <tr>

                <td>${escapeHTML(booking.studentName || "Student")}</td>

                <td>${escapeHTML(booking.tutorName || "Tutor")}</td>

                <td>${escapeHTML(booking.subject || "Not specified")}</td>

                <td>${escapeHTML(booking.mode || "Not specified")}</td>

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

        if (confirm("Are you sure you want to log out?")) {

            sessionStorage.removeItem("pt_current_user");

            sessionStorage.removeItem("pt_selected_tutor");

            window.location.href = "../login.html";

        }

    });


// ===================================
// INITIALIZE ADMIN DASHBOARD
// ===================================

function initializeAdminDashboard() {

    displayAdminInfo();

    displayUserStatistics();

    displayBookingStatistics();

    displaySystemInformation();

    displayRecentBookings();

}


if (currentUser && currentUser.role === "admin") {

    initializeAdminDashboard();

}


console.log("PeerTutor Admin Dashboard Loaded Successfully!");
