
// ===================================
// PEERTUTOR - FEEDBACK SYSTEM
// Student Ratings and Comments
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

const feedbackForm = document.getElementById("feedbackForm");

const bookingSelect = document.getElementById("completedBooking");

const feedbackComment = document.getElementById("feedbackComment");

const feedbackMessage = document.getElementById("feedbackMessage");

const feedbackHistory = document.getElementById("feedbackHistory");

const noCompletedSessions = document.getElementById("noCompletedSessions");

const feedbackFormSection = document.getElementById("feedbackFormSection");

const selectedSessionDetails = document.getElementById("selectedSessionDetails");

const feedbackSuccess = document.getElementById("feedbackSuccess");

let selectedRating = 0;


// ===================================
// GET SAVED BOOKINGS
// ===================================

function getAllBookings() {

    return JSON.parse(
        localStorage.getItem("pt_bookings") || "[]"
    );

}


// GET ONLY CURRENT STUDENT BOOKINGS
function getStudentBookings() {

    return getAllBookings().filter(function(booking) {

        return booking.studentEmail === currentUser.email;

    });

}


// ===================================
// GET SAVED FEEDBACK
// ===================================

function getAllFeedback() {

    return JSON.parse(
        localStorage.getItem("pt_feedback") || "[]"
    );

}


// GET CURRENT STUDENT FEEDBACK
function getStudentFeedback() {

    return getAllFeedback().filter(function(feedback) {

        return feedback.studentEmail === currentUser.email;

    });

}


// ===================================
// SAVE FEEDBACK
// ===================================

function saveAllFeedback(feedbackData) {

    localStorage.setItem(
        "pt_feedback",
        JSON.stringify(feedbackData)
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

    if (!currentUser) return;

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
// FORMAT DATE
// ===================================

function formatDate(date) {

    if (!date) return "Not specified";

    const formattedDate = new Date(date + "T00:00:00");

    if (Number.isNaN(formattedDate.getTime())) {
        return "Invalid date";
    }

    return formattedDate.toLocaleDateString("en-US", {

        month: "long",

        day: "numeric",

        year: "numeric"

    });

}


// ===================================
// GET COMPLETED BOOKINGS
// ===================================

function getEligibleBookings() {

    const bookings = getStudentBookings();

    const submittedFeedback = getStudentFeedback();

    const reviewedBookingIds = submittedFeedback.map(function(feedback) {

        return String(feedback.bookingId);

    });


    return bookings.filter(function(booking) {

        const isCompleted =
            String(booking.status).toLowerCase() === "completed";

        const hasNoFeedback =
            !reviewedBookingIds.includes(String(booking.id));

        return isCompleted && hasNoFeedback;

    });

}


// ===================================
// DISPLAY COMPLETED BOOKING OPTIONS
// ===================================

function displayCompletedBookings() {

    const completedBookings = getEligibleBookings();

    bookingSelect.innerHTML = `
        <option value="">Choose a completed session</option>
    `;


    completedBookings.forEach(function(booking) {

        const option = document.createElement("option");

        option.value = String(booking.id);

        option.textContent =
            `${booking.tutorName} - ${booking.subject} (${formatDate(booking.date)})`;

        bookingSelect.appendChild(option);

    });


    if (completedBookings.length === 0) {

        feedbackFormSection.classList.add("hidden");

        noCompletedSessions.classList.remove("hidden");

    } else {

        feedbackFormSection.classList.remove("hidden");

        noCompletedSessions.classList.add("hidden");

    }


    // OPEN THE SPECIFIC BOOKING FROM MY BOOKINGS
    const requestedBookingId =
        new URLSearchParams(window.location.search).get("bookingId");

    if (requestedBookingId) {

        const matchingBooking = completedBookings.find(function(booking) {

            return String(booking.id) === String(requestedBookingId);

        });

        if (matchingBooking) {

            bookingSelect.value = String(matchingBooking.id);

            displaySelectedSession();

        }

    }

}


// ===================================
// DISPLAY SELECTED SESSION DETAILS
// ===================================

function displaySelectedSession() {

    const selectedId = bookingSelect.value;

    const booking = getEligibleBookings().find(function(item) {

        return String(item.id) === String(selectedId);

    });


    if (!booking) {

        selectedSessionDetails.classList.add("hidden");

        return;

    }


    selectedSessionDetails.innerHTML = `

        <h3>Selected Tutoring Session</h3>

        <div class="feedback-session-details">

            <div>
                <span>Tutor</span>
                <strong>${escapeHTML(booking.tutorName)}</strong>
            </div>

            <div>
                <span>Subject</span>
                <strong>${escapeHTML(booking.subject)}</strong>
            </div>

            <div>
                <span>Date</span>
                <strong>${escapeHTML(formatDate(booking.date))}</strong>
            </div>

            <div>
                <span>Tutoring Mode</span>
                <strong>${escapeHTML(booking.mode)}</strong>
            </div>

        </div>

    `;

    selectedSessionDetails.classList.remove("hidden");

}


bookingSelect.addEventListener("change", function() {

    displaySelectedSession();

});


// ===================================
// STAR RATING FUNCTION
// ===================================

const starButtons = document.querySelectorAll(".star-button");

const ratingLabel = document.getElementById("ratingLabel");

function updateStarRating(rating) {

    selectedRating = rating;

    starButtons.forEach(function(button) {

        const buttonRating = Number(button.dataset.rating);

        if (buttonRating <= rating) {
            button.classList.add("selected");
        } else {
            button.classList.remove("selected");
        }

        button.setAttribute(
            "aria-pressed",
            buttonRating === rating ? "true" : "false"
        );

    });

    const ratingDescriptions = {
        1: "Poor - Needs improvement",
        2: "Fair - Below expectations",
        3: "Good - Satisfactory experience",
        4: "Very Good - Great experience",
        5: "Excellent - Outstanding experience"
    };

    ratingLabel.textContent =
        ratingDescriptions[rating] || "Please select a rating.";

}


starButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        const rating = Number(this.dataset.rating);

        updateStarRating(rating);

    });

});


// ===================================
// DISPLAY FEEDBACK MESSAGE
// ===================================

function showFeedbackMessage(message, success = false) {

    feedbackMessage.textContent = message;

    feedbackMessage.style.color =
        success ? "#16804a" : "#d92d20";

}


// ===================================
// SUBMIT FEEDBACK
// ===================================

feedbackForm.addEventListener("submit", function(event) {

    event.preventDefault();

    showFeedbackMessage("");

    const bookingId = bookingSelect.value;

    const comment = feedbackComment.value.trim();


    // VALIDATE BOOKING
    if (!bookingId) {

        showFeedbackMessage(
            "Please select a completed tutoring session."
        );

        return;

    }


    // VALIDATE RATING
    if (selectedRating < 1 || selectedRating > 5) {

        showFeedbackMessage(
            "Please select a rating from 1 to 5 stars."
        );

        return;

    }


    // VALIDATE COMMENT
    if (comment.length < 5) {

        showFeedbackMessage(
            "Please write at least 5 characters in your feedback."
        );

        return;

    }


    if (comment.length > 500) {

        showFeedbackMessage(
            "Your feedback must not exceed 500 characters."
        );

        return;

    }


    // CHECK SELECTED COMPLETED BOOKING AGAIN
    const booking = getEligibleBookings().find(function(item) {

        return String(item.id) === String(bookingId);

    });


    if (!booking) {

        showFeedbackMessage(
            "This session is not eligible for feedback or has already been reviewed."
        );

        return;

    }


    // CHECK DUPLICATE FEEDBACK
    const allFeedback = getAllFeedback();

    const duplicateFeedback = allFeedback.some(function(feedback) {

        return (
            String(feedback.bookingId) === String(bookingId) &&
            feedback.studentEmail === currentUser.email
        );

    });


    if (duplicateFeedback) {

        showFeedbackMessage(
            "You have already submitted feedback for this session."
        );

        return;

    }


    // CREATE FEEDBACK RECORD
    const newFeedback = {

        id: Date.now(),

        bookingId: booking.id,

        studentId: currentUser.id,

        studentName: currentUser.name,

        studentEmail: currentUser.email,

        tutorId: booking.tutorId,

        tutorName: booking.tutorName,

        subject: booking.subject,

        rating: selectedRating,

        comment: comment,

        createdAt: new Date().toISOString()

    };


    // SAVE FEEDBACK
    allFeedback.push(newFeedback);

    saveAllFeedback(allFeedback);


    // DISPLAY SUCCESS MESSAGE
    feedbackSuccess.classList.remove("hidden");

    feedbackSuccess.textContent =
        "✓ Your feedback has been submitted successfully!";


    // RESET FORM
    feedbackForm.reset();

    selectedRating = 0;

    updateStarRating(0);

    selectedSessionDetails.classList.add("hidden");


    // REFRESH ELIGIBLE SESSIONS AND HISTORY
    displayCompletedBookings();

    displayFeedbackHistory();


    // SCROLL TO SUCCESS MESSAGE
    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

});


// ===================================
// DISPLAY FEEDBACK HISTORY
// ===================================

function displayFeedbackHistory() {

    const feedbackData = getStudentFeedback();

    const emptyHistory =
        document.getElementById("emptyFeedbackHistory");


    document.getElementById("feedbackCount").textContent =
        `${feedbackData.length} Feedback`;


    if (feedbackData.length === 0) {

        feedbackHistory.innerHTML = "";

        emptyHistory.classList.remove("hidden");

        return;

    }


    emptyHistory.classList.add("hidden");


    // DISPLAY NEWEST FEEDBACK FIRST
    feedbackData.sort(function(a, b) {

        return new Date(b.createdAt) - new Date(a.createdAt);

    });


    feedbackHistory.innerHTML = feedbackData.map(function(feedback) {

        const rating = Math.min(
            5,
            Math.max(0, Math.floor(Number(feedback.rating) || 0))
        );

        const stars = "★".repeat(rating) + "☆".repeat(5 - rating);


        return `

            <article class="feedback-history-card">

                <div class="feedback-history-top">

                    <div>
                        <h3>${escapeHTML(feedback.tutorName)}</h3>

                        <p>${escapeHTML(feedback.subject)}</p>
                    </div>

                    <span class="feedback-history-date">
                        ${escapeHTML(formatDate(
                            feedback.createdAt
                                ? feedback.createdAt.substring(0, 10)
                                : ""
                        ))}
                    </span>

                </div>


                <div class="feedback-history-stars">
                    ${stars}
                    <span>${rating}.0 / 5.0</span>
                </div>


                <div class="feedback-comment-box">

                    <strong>Your Comment</strong>

                    <p>${escapeHTML(feedback.comment)}</p>

                </div>


                <span class="feedback-submitted-label">
                    ✓ Feedback Submitted
                </span>

            </article>

        `;

    }).join("");

}


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
// INITIALIZE FEEDBACK PAGE
// ===================================

if (currentUser && currentUser.role === "student") {

    displayStudentInfo();

    displayCompletedBookings();

    displayFeedbackHistory();

}

console.log("PeerTutor Feedback Page Loaded Successfully!");
