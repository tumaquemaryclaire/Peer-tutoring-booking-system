
// ===================================
// PEERTUTOR - BOOKING SYSTEM
// Book a Tutoring Session
// ===================================


// ===================================
// CHECK STUDENT LOGIN
// ===================================

const currentUser = JSON.parse(
    sessionStorage.getItem("pt_current_user") || "null"
);

const selectedTutor = JSON.parse(
    sessionStorage.getItem("pt_selected_tutor") || "null"
);


if (!currentUser || currentUser.role !== "student") {

    alert("Please log in using your student account.");

    window.location.href = "../login.html";

} else if (!selectedTutor) {

    alert("Please select a tutor first.");

    window.location.href = "find-tutors.html";

}


// ===================================
// GET HTML ELEMENTS
// ===================================

const bookingForm = document.getElementById("bookingForm");

const tutoringMode = document.getElementById("tutoringMode");

const locationGroup = document.getElementById("locationGroup");

const meetingLocation = document.getElementById("meetingLocation");

const onlineNotice = document.getElementById("onlineNotice");

const bookingMessage = document.getElementById("bookingMessage");

const bookingSuccess = document.getElementById("bookingSuccess");


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
// DISPLAY SELECTED TUTOR
// ===================================

function displaySelectedTutor() {

    if (!selectedTutor) return;

    document.getElementById("bookingTutorName").textContent =
        selectedTutor.name;

    document.getElementById("bookingTutorSubject").textContent =
        selectedTutor.subject;

    document.getElementById("bookingTutorRating").textContent =
        Number(selectedTutor.rating || 0).toFixed(1);

    document.getElementById("bookingTutorAvatar").textContent =
        selectedTutor.initials || selectedTutor.name
            .split(" ")
            .map(part => part.charAt(0).toUpperCase())
            .slice(0, 2)
            .join("");

    document.getElementById("bookingSubject").value =
        selectedTutor.subject;

    document.getElementById("bookingTutorAvatar").classList.add(
        selectedTutor.color || "tutor-blue"
    );

}


// ===================================
// SET AVAILABLE TUTORING MODES
// ===================================

function displayTutoringModes() {

    const modes = Array.isArray(selectedTutor.modes)
        ? selectedTutor.modes
        : ["Online", "Face-to-Face"];

    tutoringMode.innerHTML =
        '<option value="">Select Tutoring Mode</option>';

    modes.forEach(function(mode) {

        const option = document.createElement("option");

        option.value = mode;

        option.textContent = mode;

        tutoringMode.appendChild(option);

    });

}


// ===================================
// SET MINIMUM BOOKING DATE
// ===================================

function getLocalDate() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, "0");

    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


document.getElementById("sessionDate").min = getLocalDate();


// ===================================
// SHOW LOCATION OR ONLINE INFORMATION
// ===================================

function updateTutoringMode() {

    const selectedMode = tutoringMode.value;

    if (selectedMode === "Face-to-Face") {

        locationGroup.classList.remove("hidden");

        onlineNotice.classList.add("hidden");

        meetingLocation.required = true;

    } else if (selectedMode === "Online") {

        locationGroup.classList.add("hidden");

        onlineNotice.classList.remove("hidden");

        meetingLocation.required = false;

        meetingLocation.value = "";

    } else {

        locationGroup.classList.remove("hidden");

        onlineNotice.classList.add("hidden");

        meetingLocation.required = false;

    }

}


tutoringMode.addEventListener("change", updateTutoringMode);


// ===================================
// DISPLAY BOOKING ERROR
// ===================================

function showBookingMessage(message) {

    bookingMessage.textContent = message;

    bookingMessage.style.color = "#d92d20";

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
// SUBMIT BOOKING REQUEST
// ===================================

bookingForm.addEventListener("submit", function(event) {

    event.preventDefault();

    bookingMessage.textContent = "";


    // GET FORM VALUES
    const subject = document.getElementById("bookingSubject").value;

    const date = document.getElementById("sessionDate").value;

    const time = document.getElementById("sessionTime").value;

    const mode = tutoringMode.value;

    const location = meetingLocation.value.trim();

    const notes = document.getElementById("sessionNotes").value.trim();


    // VALIDATE SELECTED TUTOR
    if (!selectedTutor) {

        showBookingMessage("Please select a tutor first.");

        return;

    }


    // VALIDATE SUBJECT
    if (!subject) {

        showBookingMessage("Please select a tutoring subject.");

        return;

    }


    // VALIDATE DATE
    if (!date) {

        showBookingMessage("Please select your preferred date.");

        return;

    }


    // VALIDATE TIME
    if (!time) {

        showBookingMessage("Please select your preferred start time.");

        return;

    }


    // VALIDATE TUTORING MODE
    if (!mode) {

        showBookingMessage("Please select a tutoring mode.");

        return;

    }


    // VALIDATE MODE AVAILABILITY
    if (
        !Array.isArray(selectedTutor.modes) ||
        !selectedTutor.modes.includes(mode)
    ) {

        showBookingMessage(
            "The selected tutor does not offer this tutoring mode."
        );

        return;

    }


    // VALIDATE FACE-TO-FACE LOCATION
    if (mode === "Face-to-Face" && location === "") {

        showBookingMessage(
            "Please enter your preferred face-to-face meeting location."
        );

        return;

    }


    // VALIDATE FUTURE DATE AND TIME
    const bookingDateTime = new Date(`${date}T${time}`);

    if (
        Number.isNaN(bookingDateTime.getTime()) ||
        bookingDateTime <= new Date()
    ) {

        showBookingMessage(
            "Please select a future date and time."
        );

        return;

    }


    // GET EXISTING BOOKINGS
    const allBookings = JSON.parse(
        localStorage.getItem("pt_bookings") || "[]"
    );


    // CHECK IF THE SAME TUTOR ALREADY HAS A REQUEST
    const existingBooking = allBookings.find(function(booking) {

        const activeStatus = ["Pending", "Approved"];

        return (
            Number(booking.tutorId) === Number(selectedTutor.id) &&
            booking.date === date &&
            booking.time === time &&
            activeStatus.includes(booking.status)
        );

    });


    if (existingBooking) {

        showBookingMessage(
            "This tutor already has a booking request at that date and time. Please choose another time."
        );

        return;

    }


    // CREATE BOOKING RECORD
    const newBooking = {

        id: Date.now(),

        studentId: currentUser.id,

        studentName: currentUser.name,

        studentEmail: currentUser.email,

        tutorId: selectedTutor.id,

        tutorName: selectedTutor.name,

        subject: subject,

        date: date,

        time: time,

        mode: mode,

        location: mode === "Face-to-Face" ? location : "",

        meetingLink: "",

        notes: notes,

        status: "Pending",

        createdAt: new Date().toISOString()

    };


    // SAVE BOOKING
    allBookings.push(newBooking);

    localStorage.setItem(
        "pt_bookings",
        JSON.stringify(allBookings)
    );


    // DISPLAY SUCCESS MESSAGE
    displayBookingSuccess(newBooking);

});


// ===================================
// DISPLAY BOOKING CONFIRMATION
// ===================================

function displayBookingSuccess(booking) {

    document.querySelector(".booking-page-layout").classList.add("hidden");

    const dateFormatted = new Date(
        booking.date + "T00:00:00"
    ).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    const modeDetails = booking.mode === "Face-to-Face"
        ? booking.location
        : "Meeting link will be provided by the tutor after approval.";

    document.getElementById("successDetails").innerHTML = `

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
            <strong>${escapeHTML(dateFormatted)}</strong>
        </div>

        <div>
            <span>Start Time</span>
            <strong>${escapeHTML(booking.time)}</strong>
        </div>

        <div>
            <span>Tutoring Mode</span>
            <strong>${escapeHTML(booking.mode)}</strong>
        </div>

        <div>
            <span>${booking.mode === "Face-to-Face" ? "Meeting Location" : "Online Meeting"}</span>
            <strong>${escapeHTML(modeDetails)}</strong>
        </div>

    `;

    bookingSuccess.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

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
// INITIALIZE BOOKING PAGE
// ===================================

if (currentUser && currentUser.role === "student" && selectedTutor) {

    displayStudentInfo();

    displaySelectedTutor();

    displayTutoringModes();

    updateTutoringMode();

}

console.log("PeerTutor Booking Page Loaded Successfully!");
