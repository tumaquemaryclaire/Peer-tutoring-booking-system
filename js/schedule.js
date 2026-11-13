
// ===================================
// PEERTUTOR - MANAGE SCHEDULE
// Tutor Schedule Management
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
// GET HTML ELEMENTS
// ===================================

const scheduleForm = document.getElementById("scheduleForm");

const scheduleIdInput = document.getElementById("scheduleId");

const availableDateInput = document.getElementById("availableDate");

const startTimeInput = document.getElementById("startTime");

const endTimeInput = document.getElementById("endTime");

const scheduleModeInput = document.getElementById("scheduleMode");

const scheduleLocationInput = document.getElementById("scheduleLocation");

const scheduleLocationGroup =
    document.getElementById("scheduleLocationGroup");

const scheduleMessage = document.getElementById("scheduleMessage");

const scheduleList = document.getElementById("scheduleList");

const emptySchedules = document.getElementById("emptySchedules");

const scheduleFilter = document.getElementById("scheduleFilter");


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


// GET ALL SCHEDULES
function getAllSchedules() {

    return getSavedData("pt_schedules");

}


// SAVE SCHEDULES
function saveAllSchedules(schedules) {

    localStorage.setItem(
        "pt_schedules",
        JSON.stringify(schedules)
    );

}


// GET ALL BOOKINGS
function getAllBookings() {

    return getSavedData("pt_bookings");

}


// GET TUTOR PROFILES
function getAllTutorProfiles() {

    return getSavedData("pt_tutor_profiles");

}


// ===================================
// GET CURRENT TUTOR PROFILE
// ===================================

function getCurrentTutorProfile() {

    return getAllTutorProfiles().find(function(profile) {

        return String(profile.email).toLowerCase() ===
               String(currentUser.email).toLowerCase();

    });

}


const tutorProfile = getCurrentTutorProfile();

const allowedModes = tutorProfile &&
    Array.isArray(tutorProfile.modes)
        ? tutorProfile.modes
        : [];


// ===================================
// GET CURRENT TUTOR SCHEDULES
// ===================================

function getMySchedules() {

    return getAllSchedules().filter(function(schedule) {

        return (
            String(schedule.tutorEmail).toLowerCase() ===
            String(currentUser.email).toLowerCase()
        );

    });

}


// ===================================
// GET ACTIVE BOOKING FOR A SCHEDULE
// ===================================

function getActiveBooking(scheduleId) {

    return getAllBookings().find(function(booking) {

        const activeStatus = [
            "pending",
            "approved"
        ];

        return (
            String(booking.scheduleId) === String(scheduleId) &&
            activeStatus.includes(
                String(booking.status).toLowerCase()
            )
        );

    });

}


// ===================================
// DISPLAY TUTOR INFORMATION
// ===================================

function displayTutorInformation() {

    if (!currentUser) return;

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
// SET MINIMUM DATE
// ===================================

function getLocalDate() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, "0");

    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


availableDateInput.min = getLocalDate();


// ===================================
// DISPLAY PROFILE WARNING
// ===================================

function displayProfileWarning() {

    const warning = document.getElementById("profileWarning");

    if (!tutorProfile || allowedModes.length === 0) {

        warning.classList.remove("hidden");

    } else {

        warning.classList.add("hidden");

    }

}


// ===================================
// LOAD AVAILABLE TUTORING MODES
// ===================================

function loadTutoringModes() {

    scheduleModeInput.innerHTML = `
        <option value="">Select Tutoring Mode</option>
    `;


    const modesToDisplay = allowedModes.length > 0
        ? allowedModes
        : ["Online", "Face-to-Face"];


    modesToDisplay.forEach(function(mode) {

        const option = document.createElement("option");

        option.value = mode;

        option.textContent = mode;

        scheduleModeInput.appendChild(option);

    });

}


// ===================================
// SHOW LOCATION FIELD
// ===================================

function updateLocationField() {

    const mode = scheduleModeInput.value;

    if (mode === "Face-to-Face") {

        scheduleLocationGroup.classList.remove("hidden");

        scheduleLocationInput.required = true;

    } else {

        scheduleLocationGroup.classList.add("hidden");

        scheduleLocationInput.required = false;

        scheduleLocationInput.value = "";

    }

}


scheduleModeInput.addEventListener(
    "change",
    updateLocationField
);


// ===================================
// DISPLAY MESSAGE
// ===================================

function showScheduleMessage(message, success = false) {

    scheduleMessage.textContent = message;

    scheduleMessage.style.color =
        success ? "#16804a" : "#d92d20";

}


// ===================================
// FORMAT DATE
// ===================================

function formatScheduleDate(date) {

    const parsedDate = new Date(date + "T00:00:00");

    if (Number.isNaN(parsedDate.getTime())) {

        return "Invalid date";

    }

    return parsedDate.toLocaleDateString("en-US", {

        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric"

    });

}


// ===================================
// FORMAT TIME
// ===================================

function formatScheduleTime(time) {

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
// CHECK IF SCHEDULE IS BOOKED
// ===================================

function isScheduleBooked(schedule) {

    const activeBooking = getActiveBooking(schedule.id);

    return Boolean(activeBooking);

}


// ===================================
// DISPLAY SCHEDULE STATISTICS
// ===================================

function displayScheduleStatistics() {

    const schedules = getMySchedules();

    const total = schedules.length;

    const booked = schedules.filter(function(schedule) {

        return isScheduleBooked(schedule);

    }).length;

    const available = total - booked;


    document.getElementById("totalSchedules").textContent = total;

    document.getElementById("availableSchedules").textContent = available;

    document.getElementById("bookedSchedules").textContent = booked;

}


// ===================================
// DISPLAY SAVED SCHEDULES
// ===================================

function displaySchedules() {

    const schedules = getMySchedules();

    const selectedMode = scheduleFilter.value;


    // FILTER SCHEDULES BY MODE
    const filteredSchedules = schedules.filter(function(schedule) {

        return (
            selectedMode === "all" ||
            schedule.mode === selectedMode
        );

    });


    // SORT BY DATE AND START TIME
    filteredSchedules.sort(function(a, b) {

        const first = `${a.date}T${a.startTime}`;

        const second = `${b.date}T${b.startTime}`;

        return first.localeCompare(second);

    });


    document.getElementById("scheduleResults").textContent =
        `Showing ${filteredSchedules.length} of ${schedules.length} schedule(s)`;


    // DISPLAY EMPTY STATE
    if (filteredSchedules.length === 0) {

        scheduleList.innerHTML = "";

        emptySchedules.classList.remove("hidden");

        if (schedules.length > 0) {

            emptySchedules.querySelector("h3").textContent =
                "No Matching Schedules";

            emptySchedules.querySelector("p").textContent =
                "No schedules match your selected tutoring mode.";

        } else {

            emptySchedules.querySelector("h3").textContent =
                "No Schedules Available";

            emptySchedules.querySelector("p").textContent =
                "You have not added any tutoring schedules yet. Add your first available schedule above.";

        }

        return;

    }


    emptySchedules.classList.add("hidden");


    // CREATE SCHEDULE CARDS
    scheduleList.innerHTML = filteredSchedules.map(function(schedule) {

        const booked = isScheduleBooked(schedule);

        const statusText = booked ? "Booked" : "Available";

        const statusClass = booked
            ? "schedule-status-booked"
            : "schedule-status-available";

        const modeIcon = schedule.mode === "Online"
            ? "💻"
            : "🤝";

        const locationInfo = schedule.mode === "Face-to-Face"
            ? `
                <div class="schedule-detail">
                    <span>📍 Location</span>
                    <strong>${escapeHTML(schedule.location || "Not provided")}</strong>
                </div>
            `
            : `
                <div class="schedule-detail">
                    <span>💻 Meeting Mode</span>
                    <strong>Online session</strong>
                </div>
            `;


        return `

            <article class="schedule-card">

                <div class="schedule-card-header">

                    <div class="schedule-mode-title">

                        <div class="schedule-mode-icon">
                            ${modeIcon}
                        </div>

                        <div>
                            <h3>${escapeHTML(schedule.mode)} Tutoring</h3>

                            <p>Available Time Slot</p>
                        </div>

                    </div>

                    <span class="schedule-status ${statusClass}">
                        ${statusText}
                    </span>

                </div>


                <div class="schedule-details">

                    <div class="schedule-detail">
                        <span>📅 Available Date</span>

                        <strong>
                            ${escapeHTML(formatScheduleDate(schedule.date))}
                        </strong>
                    </div>

                    <div class="schedule-detail">
                        <span>🕒 Available Time</span>

                        <strong>
                            ${escapeHTML(formatScheduleTime(schedule.startTime))}
                            -
                            ${escapeHTML(formatScheduleTime(schedule.endTime))}
                        </strong>
                    </div>

                    ${locationInfo}

                </div>


                <div class="schedule-card-footer">

                    <span>
                        ID: ${escapeHTML(schedule.id)}
                    </span>

                    <div class="schedule-actions">

                        ${
                            booked
                            ? `
                                <span class="schedule-locked-label">
                                    🔒 Reserved by a student
                                </span>
                            `
                            : `
                                <button
                                    type="button"
                                    class="schedule-edit-btn"
                                    data-edit-id="${escapeHTML(schedule.id)}"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="schedule-delete-btn"
                                    data-delete-id="${escapeHTML(schedule.id)}"
                                >
                                    Delete
                                </button>
                            `
                        }

                    </div>

                </div>

            </article>

        `;

    }).join("");

}


// ===================================
// CHECK OVERLAPPING SCHEDULES
// ===================================

function hasScheduleConflict(date, startTime, endTime, editId = "") {

    const mySchedules = getMySchedules();

    return mySchedules.some(function(schedule) {

        // IGNORE CURRENT SCHEDULE DURING EDIT
        if (String(schedule.id) === String(editId)) {

            return false;

        }


        // CHECK SAME DATE
        if (schedule.date !== date) {

            return false;

        }


        // CHECK TIME OVERLAP
        const overlaps =

            startTime < schedule.endTime &&

            endTime > schedule.startTime;


        return overlaps;

    });

}


// ===================================
// RESET SCHEDULE FORM
// ===================================

function resetScheduleForm() {

    scheduleForm.reset();

    scheduleIdInput.value = "";

    scheduleForm.classList.remove("editing-schedule");

    document.getElementById("scheduleFormTitle").textContent =
        "Add Available Schedule";

    document.getElementById("saveScheduleBtn").textContent =
        "+ Add Schedule";

    document.getElementById("cancelEditBtn").classList.add("hidden");

    availableDateInput.min = getLocalDate();

    updateLocationField();

    scheduleMessage.textContent = "";

}


// ===================================
// EDIT SCHEDULE
// ===================================

function editSchedule(scheduleId) {

    const schedule = getMySchedules().find(function(item) {

        return String(item.id) === String(scheduleId);

    });


    if (!schedule) {

        alert("Schedule not found.");

        return;

    }


    // DO NOT EDIT BOOKED SCHEDULES
    if (isScheduleBooked(schedule)) {

        alert("This schedule already has an active booking and cannot be edited.");

        return;

    }


    // LOAD SCHEDULE DATA
    scheduleIdInput.value = schedule.id;

    availableDateInput.value = schedule.date;

    startTimeInput.value = schedule.startTime;

    endTimeInput.value = schedule.endTime;

    scheduleModeInput.value = schedule.mode;

    scheduleLocationInput.value = schedule.location || "";


    // SHOW LOCATION FIELD
    updateLocationField();


    // UPDATE FORM TITLE
    document.getElementById("scheduleFormTitle").textContent =
        "Edit Available Schedule";


    document.getElementById("saveScheduleBtn").textContent =
        "Save Changes";


    document.getElementById("cancelEditBtn").classList.remove("hidden");


    scheduleMessage.textContent =
        "You are currently editing an existing schedule.";

    scheduleMessage.style.color = "#2563a6";


    scheduleForm.classList.add("editing-schedule");


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// ===================================
// DELETE SCHEDULE
// ===================================

function deleteSchedule(scheduleId) {

    const schedules = getMySchedules();

    const schedule = schedules.find(function(item) {

        return String(item.id) === String(scheduleId);

    });


    if (!schedule) {

        alert("Schedule not found.");

        return;

    }


    // CHECK ACTIVE BOOKING
    if (isScheduleBooked(schedule)) {

        alert("This schedule has an active booking and cannot be deleted.");

        return;

    }


    if (!confirm("Are you sure you want to delete this schedule?")) {

        return;

    }


    const allSchedules = getAllSchedules();

    const updatedSchedules = allSchedules.filter(function(item) {

        return !(
            String(item.id) === String(scheduleId) &&
            String(item.tutorEmail).toLowerCase() ===
            String(currentUser.email).toLowerCase()
        );

    });


    saveAllSchedules(updatedSchedules);


    alert("Schedule deleted successfully!");


    displayDashboard();

}


// ===================================
// SAVE OR UPDATE SCHEDULE
// ===================================

scheduleForm.addEventListener("submit", function(event) {

    event.preventDefault();


    const editId = scheduleIdInput.value;

    const date = availableDateInput.value;

    const startTime = startTimeInput.value;

    const endTime = endTimeInput.value;

    const mode = scheduleModeInput.value;

    const location = scheduleLocationInput.value.trim();


    // VALIDATE DATE
    if (!date || date < getLocalDate()) {

        showScheduleMessage(
            "Please select today or a future date."
        );

        return;

    }


    // VALIDATE TIME
    if (!startTime || !endTime) {

        showScheduleMessage(
            "Please enter both starting and ending times."
        );

        return;

    }


    // VALIDATE END TIME
    if (endTime <= startTime) {

        showScheduleMessage(
            "Ending time must be later than starting time."
        );

        return;

    }


    // VALIDATE SAME-DAY TIME
    if (date === getLocalDate()) {

        const now = new Date();

        const currentTime =
            String(now.getHours()).padStart(2, "0") +
            ":" +
            String(now.getMinutes()).padStart(2, "0");

        if (startTime <= currentTime) {

            showScheduleMessage(
                "Please select a starting time later than the current time."
            );

            return;

        }

    }


    // VALIDATE TUTORING MODE
    if (!mode) {

        showScheduleMessage(
            "Please select a tutoring mode."
        );

        return;

    }


    // VALIDATE PROFILE MODES
    if (
        allowedModes.length > 0 &&
        !allowedModes.includes(mode)
    ) {

        showScheduleMessage(
            "This tutoring mode is not available in your tutor profile."
        );

        return;

    }


    // VALIDATE FACE-TO-FACE LOCATION
    if (mode === "Face-to-Face" && !location) {

        showScheduleMessage(
            "Please enter your face-to-face meeting location."
        );

        return;

    }


    // CHECK OVERLAPPING SCHEDULES
    if (hasScheduleConflict(date, startTime, endTime, editId)) {

        showScheduleMessage(
            "You already have a schedule that overlaps with this time. Please choose another time."
        );

        return;

    }


    // GET ALL SAVED SCHEDULES
    const allSchedules = getAllSchedules();


    // CREATE SCHEDULE RECORD
    const newSchedule = {

        id: editId || Date.now(),

        tutorId: currentUser.id,

        tutorEmail: currentUser.email,

        tutorName: currentUser.name,

        date: date,

        startTime: startTime,

        endTime: endTime,

        mode: mode,

        location: mode === "Face-to-Face" ? location : "",

        status: "Available",

        updatedAt: new Date().toISOString()

    };


    if (editId) {

        // UPDATE EXISTING SCHEDULE
        const index = allSchedules.findIndex(function(schedule) {

            return (
                String(schedule.id) === String(editId) &&
                String(schedule.tutorEmail).toLowerCase() ===
                String(currentUser.email).toLowerCase()
            );

        });


        if (index === -1) {

            showScheduleMessage(
                "Unable to find the schedule you want to edit."
            );

            return;

        }


        allSchedules[index] = {

            ...allSchedules[index],

            ...newSchedule

        };

    } else {

        // ADD NEW SCHEDULE
        allSchedules.push(newSchedule);

    }


    // SAVE SCHEDULE
    saveAllSchedules(allSchedules);


    // SUCCESS MESSAGE
    showScheduleMessage(

        editId
            ? "Schedule updated successfully!"
            : "New schedule added successfully!",

        true

    );


    // RESET AND REFRESH
    resetScheduleForm();

    displayDashboard();

});


// ===================================
// SCHEDULE LIST BUTTON EVENTS
// ===================================

scheduleList.addEventListener("click", function(event) {

    const editButton = event.target.closest("[data-edit-id]");

    const deleteButton = event.target.closest("[data-delete-id]");


    if (editButton) {

        editSchedule(editButton.dataset.editId);

    }


    if (deleteButton) {

        deleteSchedule(deleteButton.dataset.deleteId);

    }

});


// ===================================
// FILTER SCHEDULES
// ===================================

scheduleFilter.addEventListener("change", function() {

    displaySchedules();

});


document.getElementById("clearScheduleFilter")
    .addEventListener("click", function() {

        scheduleFilter.value = "all";

        displaySchedules();

    });


// ===================================
// RESET FORM BUTTON
// ===================================

document.getElementById("resetScheduleBtn")
    .addEventListener("click", function() {

        resetScheduleForm();

    });


document.getElementById("cancelEditBtn")
    .addEventListener("click", function() {

        resetScheduleForm();

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
// UPDATE DASHBOARD
// ===================================

function displayDashboard() {

    displayScheduleStatistics();

    displaySchedules();

}


// ===================================
// INITIALIZE MANAGE SCHEDULE PAGE
// ===================================

if (currentUser && currentUser.role === "tutor") {

    displayTutorInformation();

    displayProfileWarning();

    loadTutoringModes();

    updateLocationField();

    displayDashboard();

}


console.log("PeerTutor Manage Schedule Loaded Successfully!");
