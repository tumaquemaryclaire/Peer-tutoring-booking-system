
// ===================================
// PEERTUTOR - BOOKING REQUESTS
// Tutor Booking Management
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
// SAFE LOCAL STORAGE FUNCTIONS
// ===================================

function getSavedData(key) {

    try {

        const data = JSON.parse(
            localStorage.getItem(key) || "[]"
        );

        return Array.isArray(data) ? data : [];

    } catch (error) {

        console.error("Unable to read saved data:", error);

        return [];

    }

}


function saveSavedData(key, data) {

    localStorage.setItem(
        key,
        JSON.stringify(data)
    );

}


// ===================================
// GET ALL DATA
// ===================================

function getAllBookings() {

    return getSavedData("pt_bookings");

}


function getAllSchedules() {

    return getSavedData("pt_schedules");

}


// ===================================
// GET TUTOR'S BOOKING REQUESTS
// ===================================

function getTutorRequests() {

    const allBookings = getAllBookings();

    const tutorEmail = String(currentUser.email || "")
        .trim()
        .toLowerCase();

    const tutorName = String(currentUser.name || "")
        .trim()
        .toLowerCase();


    return allBookings.filter(function(booking) {

        // Prefer registered tutor email
        if (booking.tutorEmail) {

            return String(booking.tutorEmail)
                .trim()
                .toLowerCase() === tutorEmail;

        }


        // Fallback for older sample-tutor bookings
        return String(booking.tutorName || "")
            .trim()
            .toLowerCase() === tutorName;

    });

}


// ===================================
// GET ONE BOOKING
// ===================================

function getTutorBookingById(bookingId) {

    return getTutorRequests().find(function(booking) {

        return String(booking.id) === String(bookingId);

    });

}


// ===================================
// DISPLAY TUTOR INFORMATION
// ===================================

function displayTutorInfo() {

    const name = currentUser.name || "Tutor";

    document.getElementById("tutorName").textContent = name;


    const initials = name
        .split(" ")
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");


    document.getElementById("userInitials").textContent =
        initials || "TU";


    document.getElementById("currentDate").textContent =

        new Date().toLocaleDateString("en-US", {

            weekday: "long",

            month: "long",

            day: "numeric",

            year: "numeric"

        });

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
// FORMAT DATE
// ===================================

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


// ===================================
// FORMAT TIME
// ===================================

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


// ===================================
// GET STATUS CLASS
// ===================================

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
// DISPLAY BOOKING STATISTICS
// ===================================

function displayRequestStatistics() {

    const requests = getTutorRequests();


    function countStatus(status) {

        return requests.filter(function(booking) {

            return String(booking.status).toLowerCase() ===
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
// FIND MATCHING AVAILABLE SCHEDULE
// ===================================

function findMatchingSchedule(booking) {

    const schedules = getAllSchedules();

    const tutorEmail = String(currentUser.email)
        .trim()
        .toLowerCase();


    return schedules.find(function(schedule) {

        const sameTutor =
            String(schedule.tutorEmail || "")
                .trim()
                .toLowerCase() === tutorEmail;

        const sameDate =
            schedule.date === booking.date;

        const sameTime =
            schedule.startTime === booking.time;

        const sameMode =
            schedule.mode === booking.mode;

        const sameLocation =
            booking.mode !== "Face-to-Face" ||
            String(schedule.location || "").trim().toLowerCase() ===
            String(booking.location || "").trim().toLowerCase();


        // CHECK IF SLOT IS ALREADY RESERVED
        const alreadyReserved = getAllBookings().some(function(otherBooking) {

            const isAnotherBooking =
                String(otherBooking.id) !== String(booking.id);

            const sameSchedule =
                String(otherBooking.scheduleId) === String(schedule.id);

            const active =
                ["Pending", "Approved"].includes(
                    String(otherBooking.status).toLowerCase()
                );

            return isAnotherBooking && sameSchedule && active;

        });


        return (
            sameTutor &&
            sameDate &&
            sameTime &&
            sameMode &&
            sameLocation &&
            !alreadyReserved
        );

    });

}


// ===================================
// SAVE UPDATED BOOKING
// ===================================

function updateBooking(bookingId, updates) {

    const allBookings = getAllBookings();

    const index = allBookings.findIndex(function(booking) {

        return String(booking.id) === String(bookingId);

    });


    if (index === -1) {

        return false;

    }


    const booking = allBookings[index];

    const tutorBooking = getTutorBookingById(bookingId);


    if (!tutorBooking) {

        return false;

    }


    allBookings[index] = {

        ...booking,

        ...updates

    };


    saveSavedData("pt_bookings", allBookings);

    return true;

}


// ===================================
// APPROVE BOOKING REQUEST
// ===================================

function approveBooking(bookingId) {

    const booking = getTutorBookingById(bookingId);

    if (!booking) {

        alert("Booking request not found.");

        return;

    }


    if (booking.status !== "Pending") {

        alert("Only pending bookings can be approved.");

        return;

    }


    // FIND EXACT MATCHING TUTOR SCHEDULE
    const matchingSchedule = findMatchingSchedule(booking);


    if (!matchingSchedule) {

        alert(
            "No matching available schedule was found.\n\n" +
            "Please make sure that the student's booking matches your saved:\n" +
            "- Available date\n" +
            "- Starting time\n" +
            "- Tutoring mode\n" +
            "- Meeting location (for Face-to-Face)\n\n" +
            "The schedule may also already be reserved."
        );

        return;

    }


    // CONFIRM APPROVAL
    if (!confirm("Are you sure you want to approve this booking request?")) {

        return;

    }


    const success = updateBooking(bookingId, {

        status: "Approved",

        scheduleId: matchingSchedule.id,

        approvedAt: new Date().toISOString()

    });


    if (success) {

        alert("Booking request approved successfully!");

        refreshRequests();

    } else {

        alert("Unable to update booking. Please try again.");

    }

}


// ===================================
// REJECT BOOKING REQUEST
// ===================================

function rejectBooking(bookingId) {

    const booking = getTutorBookingById(bookingId);

    if (!booking) {

        alert("Booking request not found.");

        return;

    }


    if (booking.status !== "Pending") {

        alert("Only pending bookings can be rejected.");

        return;

    }


    if (!confirm("Are you sure you want to reject this booking request?")) {

        return;

    }


    const success = updateBooking(bookingId, {

        status: "Rejected",

        rejectionReason: "Booking request was rejected by the tutor.",

        rejectedAt: new Date().toISOString(),

        scheduleId: null

    });


    if (success) {

        alert("Booking request rejected successfully!");

        refreshRequests();

    } else {

        alert("Unable to reject booking. Please try again.");

    }

}


// ===================================
// ADD OR UPDATE ONLINE MEETING LINK
// ===================================

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


    const currentLink = booking.meetingLink || "";

    const meetingLink = prompt(
        "Enter your online meeting link:",
        currentLink
    );


    if (meetingLink === null) return;


    const link = meetingLink.trim();

    if (!link) {

        alert("Please enter a meeting link.");

        return;

    }


    // VALIDATE URL
    let parsedURL;

    try {

        parsedURL = new URL(link);

    } catch (error) {

        alert("Invalid meeting link. Please enter a complete URL.");

        return;

    }


    if (
        parsedURL.protocol !== "https:" &&
        parsedURL.protocol !== "http:"
    ) {

        alert("Only HTTP or HTTPS meeting links are allowed.");

        return;

    }


    const success = updateBooking(bookingId, {

        meetingLink: link,

        meetingLinkUpdatedAt: new Date().toISOString()

    });


    if (success) {

        alert("Online meeting link saved successfully!");

        refreshRequests();

    }

}


// ===================================
// MARK BOOKING AS COMPLETED
// ===================================

function completeBooking(bookingId) {

    const booking = getTutorBookingById(bookingId);

    if (!booking) {

        alert("Booking not found.");

        return;

    }


    if (booking.status !== "Approved") {

        alert("Only approved bookings can be marked as completed.");

        return;

    }


    if (
        !confirm(
            "Have you already conducted this tutoring session?\n\n" +
            "Click OK only if the tutoring session has been completed."
        )
    ) {

        return;

    }


    const success = updateBooking(bookingId, {

        status: "Completed",

        completedAt: new Date().toISOString()

    });


    if (success) {

        alert(
            "Tutoring session marked as completed! " +
            "The student can now submit feedback."
        );

        refreshRequests();

    }

}


// ===================================
// DISPLAY BOOKING CARDS
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


    // FILTER REQUESTS
    const filteredRequests = requests.filter(function(booking) {

        const studentName = String(booking.studentName || "")
            .toLowerCase();

        const subject = String(booking.subject || "")
            .toLowerCase();

        const matchesSearch =
            studentName.includes(searchValue) ||
            subject.includes(searchValue);

        const matchesStatus =
            selectedStatus === "all" ||
            booking.status === selectedStatus;

        return matchesSearch && matchesStatus;

    });


    // SORT NEWEST FIRST
    filteredRequests.sort(function(a, b) {

        return Number(b.id) - Number(a.id);

    });


    document.getElementById("requestResults").textContent =

        `Showing ${filteredRequests.length} of ${requests.length} request(s)`;


    const requestList = document.getElementById("requestList");

    const emptyRequests = document.getElementById("emptyRequests");


    // DISPLAY EMPTY STATE
    if (filteredRequests.length === 0) {

        requestList.innerHTML = "";

        emptyRequests.classList.remove("hidden");

        return;

    }


    emptyRequests.classList.add("hidden");


    // CREATE REQUEST CARDS
    requestList.innerHTML = filteredRequests.map(function(booking) {

        const status = booking.status || "Pending";

        const statusClass = getStatusClass(status);


        // MEETING INFORMATION
        let meetingInformation = "";


        if (booking.mode === "Face-to-Face") {

            meetingInformation = `

                <div class="request-detail">

                    <span>📍 Meeting Location</span>

                    <strong>
                        ${escapeHTML(booking.location || "Not provided")}
                    </strong>

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


        // ACTION BUTTONS
        let actionButtons = "";


        if (status === "Pending") {

            actionButtons = `

                <button
                    class="approve-request-btn"
                    data-action="approve"
                    data-id="${escapeHTML(booking.id)}"
                >
                    ✓ Accept Request
                </button>


                <button
                    class="reject-request-btn"
                    data-action="reject"
                    data-id="${escapeHTML(booking.id)}"
                >
                    ✕ Reject Request
                </button>

            `;

        }


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


        return `

            <article class="request-card">

                <div class="request-card-header">

                    <div class="request-student-information">

                        <div class="request-student-avatar">
                            👤
                        </div>

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

                        <strong>${escapeHTML(booking.subject)}</strong>

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

                        <strong>${escapeHTML(booking.mode)}</strong>

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
// VALIDATE ONLINE MEETING LINK FOR DISPLAY
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


// ===================================
// HANDLE REQUEST BUTTONS
// ===================================

document.getElementById("requestList")
    .addEventListener("click", function(event) {

        const button = event.target.closest("[data-action]");

        if (!button) return;


        const action = button.dataset.action;

        const bookingId = button.dataset.id;


        if (action === "approve") {

            approveBooking(bookingId);

        }


        if (action === "reject") {

            rejectBooking(bookingId);

        }


        if (action === "complete") {

            completeBooking(bookingId);

        }


        if (action === "meeting-link") {

            updateMeetingLink(bookingId);

        }

    });


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
// REFRESH BOOKING REQUESTS
// ===================================

function refreshRequests() {

    displayRequestStatistics();

    displayRequests();

}


// ===================================
// INITIALIZE BOOKING REQUESTS PAGE
// ===================================

if (currentUser && currentUser.role === "tutor") {

    displayTutorInfo();

    refreshRequests();

}


console.log("PeerTutor Booking Requests Loaded Successfully!");
