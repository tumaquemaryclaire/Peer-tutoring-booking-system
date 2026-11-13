
// ===================================
// PEERTUTOR - MY BOOKINGS
// Student Booking Management
// ===================================


// ===================================
// CHECK STUDENT LOGIN
// ===================================

const currentUser = JSON.parse(
    sessionStorage.getItem("pt_current_user") || "null"
);

if (!currentUser || currentUser.role !== "student") {

    alert("Please log in using your student account.");

    window.location.href = "../login.html";

}


// ===================================
// GET HTML ELEMENTS
// ===================================

const myBookingList = document.getElementById("myBookingList");

const emptyBookings = document.getElementById("emptyBookings");

const bookingSearch = document.getElementById("bookingSearch");

const statusFilter = document.getElementById("statusFilter");

const bookingResultsCount = document.getElementById("bookingResultsCount");


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
// UPDATE BOOKING DATA
// ===================================

function saveBookings(bookings) {

    localStorage.setItem(
        "pt_bookings",
        JSON.stringify(bookings)
    );

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
// DISPLAY STUDENT INFORMATION
// ===================================

function displayStudentInfo() {

    const name = currentUser.name || "Student";

    document.getElementById("studentName").textContent = name;

    const initials = name
        .split(" ")
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    document.getElementById("userInitials").textContent =
        initials || "ST";

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

function displayBookingStatistics() {

    const bookings = getStudentBookings();

    const countStatus = function(status) {

        return bookings.filter(function(booking) {

            return String(booking.status).toLowerCase() ===
                   status.toLowerCase();

        }).length;

    };


    document.getElementById("totalCount").textContent =
        bookings.length;

    document.getElementById("pendingCount").textContent =
        countStatus("Pending");

    document.getElementById("approvedCount").textContent =
        countStatus("Approved");

    document.getElementById("completedCount").textContent =
        countStatus("Completed");

}


// ===================================
// FORMAT DATE
// ===================================

function formatBookingDate(date) {

    if (!date) return "Not specified";

    const parsedDate = new Date(date + "T00:00:00");

    if (Number.isNaN(parsedDate.getTime())) {
        return "Invalid date";
    }

    return parsedDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });

}


// ===================================
// DISPLAY STATUS STYLE
// ===================================

function getStatusClass(status) {

    const statuses = {
        pending: "my-status-pending",
        approved: "my-status-approved",
        rejected: "my-status-rejected",
        completed: "my-status-completed",
        cancelled: "my-status-cancelled"
    };

    return statuses[String(status).toLowerCase()] ||
           "my-status-pending";

}


// ===================================
// DISPLAY BOOKING CARDS
// ===================================

function displayBookings() {

    const searchValue =
        bookingSearch.value.trim().toLowerCase();

    const selectedStatus = statusFilter.value;

    const bookings = getStudentBookings();


    // SORT NEWEST FIRST
    bookings.sort(function(a, b) {

        return Number(b.id) - Number(a.id);

    });


    // FILTER BOOKINGS
    const filteredBookings = bookings.filter(function(booking) {

        const tutorName = String(booking.tutorName || "").toLowerCase();

        const subject = String(booking.subject || "").toLowerCase();

        const matchesSearch =
            tutorName.includes(searchValue) ||
            subject.includes(searchValue);

        const matchesStatus =
            selectedStatus === "all" ||
            booking.status === selectedStatus;

        return matchesSearch && matchesStatus;

    });


    // DISPLAY RESULTS COUNT
    bookingResultsCount.textContent =
        `Showing ${filteredBookings.length} of ${bookings.length} booking(s)`;


    // SHOW EMPTY MESSAGE
    if (filteredBookings.length === 0) {

        myBookingList.innerHTML = "";

        emptyBookings.classList.remove("hidden");

        if (bookings.length === 0) {

            document.getElementById("emptyBookingMessage").textContent =
                "You haven't booked a tutoring session yet. Find a tutor to get started!";

        } else {

            document.getElementById("emptyBookingMessage").textContent =
                "No bookings match your search or selected status. Try changing your filters.";

        }

        return;

    }


    emptyBookings.classList.add("hidden");


    // CREATE BOOKING CARDS
    myBookingList.innerHTML = filteredBookings.map(function(booking) {

        const status = booking.status || "Pending";

        const statusClass = getStatusClass(status);

        const isPending =
            status.toLowerCase() === "pending";

        const isCompleted =
            status.toLowerCase() === "completed";

        let meetingInformation = "";

        if (booking.mode === "Face-to-Face") {

            meetingInformation = `
                <div class="my-booking-detail">
                    <span>📍 Meeting Location</span>
                    <strong>
                        ${escapeHTML(booking.location || "Not provided")}
                    </strong>
                </div>
            `;

        } 
else {

    const link = String(booking.meetingLink || "");

    let safeLink = "";

    try {

        const parsedLink = new URL(link);

        if (
            parsedLink.protocol === "https:" ||
            parsedLink.protocol === "http:"
        ) {

            safeLink = parsedLink.href;

        }

    } catch (error) {

        safeLink = "";

    }


    meetingInformation = `

        <div class="my-booking-detail">

            <span>💻 Online Meeting</span>

            <strong>

                ${
                    safeLink && booking.status === "Approved"

                    ? `<a href="${escapeHTML(safeLink)}" target="_blank" rel="noopener noreferrer" class="student-meeting-link">Join Online Session →</a>`

                    : safeLink

                    ? "Meeting link saved. Waiting for approval."

                    : "Waiting for tutor to provide the meeting link."
                }

            </strong>

        </div>

    `;

}



        return `

            <article class="my-booking-card">

                <div class="my-booking-card-header">

                    <div class="my-booking-tutor">

                        <div class="my-booking-avatar">
                            👩‍🏫
                        </div>

                        <div>
                            <h3>${escapeHTML(booking.tutorName)}</h3>

                            <p>${escapeHTML(booking.subject)}</p>
                        </div>

                    </div>

                    <span class="my-booking-status ${statusClass}">
                        ${escapeHTML(status)}
                    </span>

                </div>


                <div class="my-booking-details">

                    <div class="my-booking-detail">
                        <span>📅 Session Date</span>
                        <strong>${escapeHTML(formatBookingDate(booking.date))}</strong>
                    </div>

                    <div class="my-booking-detail">
                        <span>🕒 Start Time</span>
                        <strong>${escapeHTML(booking.time)}</strong>
                    </div>

                    <div class="my-booking-detail">
                        <span>📚 Subject</span>
                        <strong>${escapeHTML(booking.subject)}</strong>
                    </div>

                    <div class="my-booking-detail">
                        <span>🎓 Tutoring Mode</span>
                        <strong>${escapeHTML(booking.mode)}</strong>
                    </div>

                    ${meetingInformation}

                </div>


                ${booking.notes ? `
                    <div class="my-booking-notes">
                        <strong>Additional Notes:</strong>
                        <p>${escapeHTML(booking.notes)}</p>
                    </div>
                ` : ""}


                <div class="my-booking-card-footer">

                    <span class="booking-id">
                        Booking ID: ${escapeHTML(booking.id)}
                    </span>

                    <div class="booking-actions">

                        ${isPending ? `
                            <button
                                class="cancel-booking-btn"
                                data-cancel-id="${escapeHTML(booking.id)}"
                            >
                                Cancel Booking
                            </button>
                        ` : ""}

                        ${isCompleted ? `
                            <a
                                href="feedback.html?bookingId=${encodeURIComponent(booking.id)}"
                                class="give-feedback-btn"
                            >
                                Give Feedback →
                            </a>
                        ` : ""}

                    </div>

                </div>

            </article>

        `;

    }).join("");

}


// ===================================
// CANCEL PENDING BOOKING
// ===================================

function cancelBooking(bookingId) {

    const confirmation = confirm(
        "Are you sure you want to cancel this booking request?"
    );

    if (!confirmation) return;


    const allBookings = JSON.parse(
        localStorage.getItem("pt_bookings") || "[]"
    );


    const bookingIndex = allBookings.findIndex(function(booking) {

        return (
            String(booking.id) === String(bookingId) &&
            booking.studentEmail === currentUser.email
        );

    });


    if (bookingIndex === -1) {

        alert("Booking not found.");

        return;

    }


    // ONLY CANCEL PENDING BOOKINGS
    if (allBookings[bookingIndex].status !== "Pending") {

        alert("Only pending bookings can be cancelled.");

        return;

    }


    // UPDATE STATUS
    allBookings[bookingIndex].status = "Cancelled";

    saveBookings(allBookings);


    alert("Your booking has been cancelled successfully.");


    // REFRESH THE PAGE CONTENT
    updateDashboard();

}


// ===================================
// BOOKING BUTTON EVENTS
// ===================================

myBookingList.addEventListener("click", function(event) {

    const button = event.target.closest("[data-cancel-id]");

    if (!button) return;

    const bookingId = button.dataset.cancelId;

    cancelBooking(bookingId);

});


// ===================================
// SEARCH AND FILTER EVENTS
// ===================================

bookingSearch.addEventListener("input", displayBookings);

statusFilter.addEventListener("change", displayBookings);


document.getElementById("clearBookingFilters")
    .addEventListener("click", function() {

        bookingSearch.value = "";

        statusFilter.value = "all";

        displayBookings();

    });


// ===================================
// LOGOUT
// ===================================

document.getElementById("logoutBtn").addEventListener("click", function() {

    if (confirm("Are you sure you want to log out?")) {

        sessionStorage.removeItem("pt_current_user");

        sessionStorage.removeItem("pt_selected_tutor");

        window.location.href = "../login.html";

    }

});


// ===================================
// UPDATE ALL BOOKING INFORMATION
// ===================================

function updateDashboard() {

    displayBookingStatistics();

    displayBookings();

}


// ===================================
// INITIALIZE MY BOOKINGS PAGE
// ===================================

if (currentUser && currentUser.role === "student") {

    displayStudentInfo();

    updateDashboard();

}

console.log("PeerTutor My Bookings Loaded Successfully!");
