
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
// GET REGISTERED TUTOR PROFILE
// ===================================

function getTutorProfile() {
    const profiles = JSON.parse(
        localStorage.getItem("pt_tutor_profiles") || "[]"
    );

    return profiles.find(function(profile) {
        return String(profile.email || "").trim().toLowerCase() ===
            String(currentUser.email || "").trim().toLowerCase();
    }) || null;
}


// ===================================
// GET TUTOR NAME
// ===================================

function getTutorName() {
    const users = JSON.parse(
        localStorage.getItem("pt_users") || "[]"
    );

    const account = users.find(function(user) {
        return String(user.email || "").trim().toLowerCase() ===
            String(currentUser.email || "").trim().toLowerCase();
    });

    if (account) {
        const composedName = [
            account.firstName,
            account.middleName,
            account.lastName,
            account.suffix
        ].filter(function(part) {
            return String(part || "").trim() !== "";
        }).join(" ");

        const name =
            composedName ||
            account.fullName ||
            account.name ||
            currentUser.name;

        if (name) {
            currentUser.name = name;
            currentUser.fullName = name;

            sessionStorage.setItem(
                "pt_current_user",
                JSON.stringify(currentUser)
            );

            return name;
        }
    }

    return currentUser.fullName || currentUser.name || "Tutor";
}


// ===================================
// GET TUTOR INITIALS
// ===================================

function getTutorInitials(name) {
    const parts = String(name || "Tutor")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length >= 2) {
        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();
    }

    return parts[0].substring(0, 2).toUpperCase();
}


// ===================================
// DISPLAY PROFILE PICTURE OR INITIALS
// ===================================

function displayTutorAvatar() {
    const avatar = document.getElementById("userInitials");

    if (!avatar) return;

    const name = getTutorName();
    const profile = getTutorProfile();

    const profilePicture = profile
        ? profile.profilePicture
        : "";

    avatar.replaceChildren();

    if (profilePicture) {
        const img = document.createElement("img");

        img.src = profilePicture;
        img.alt = "Tutor Profile Picture";

        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.borderRadius = "50%";

        avatar.appendChild(img);
    } else {
        avatar.textContent = getTutorInitials(name);
    }
}


// ===================================
// DISPLAY TUTOR INFORMATION
// ===================================

function displayTutorInfo() {
    const name = getTutorName();

    document.getElementById("tutorName").textContent = name;

    document.getElementById("welcomeName").textContent =
        name.split(" ")[0];

    displayTutorAvatar();
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
        const matchesEmail =
            booking.tutorEmail &&
            booking.tutorEmail.toLowerCase() ===
            currentUser.email.toLowerCase();

        const matchesId =
            String(booking.tutorId) === String(currentUser.id);

        const matchesName =
            String(booking.tutorName || "").trim().toLowerCase() ===
            String(currentUser.name || "").trim().toLowerCase();

        return matchesEmail || matchesId || matchesName;
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
