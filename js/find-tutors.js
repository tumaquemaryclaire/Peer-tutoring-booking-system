
// ===================================
// PEERTUTOR - FIND TUTORS
// Search and Filter Functions
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
// SAFE LOCAL STORAGE READER
// ===================================

function getSavedArray(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Error reading localStorage:", error);
        return [];
    }
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
// LOAD REGISTERED TUTOR PROFILES
// ===================================

const savedTutorProfiles = getSavedArray("pt_tutor_profiles");

const registeredTutors = savedTutorProfiles.flatMap(function(profile) {

    const subjects = Array.isArray(profile.subjects)
        ? profile.subjects
        : [];

    const modes = Array.isArray(profile.modes)
        ? profile.modes
        : [];

    if (
        !profile.id ||
        !profile.email ||
        !profile.name ||
        subjects.length === 0 ||
        modes.length === 0
    ) {
        return [];
    }

    // CREATE A TUTOR CARD FOR EACH SUBJECT
    return subjects.map(function(subject, index) {

        const name = String(profile.name);

        const initials = profile.initials ||
            name.split(" ")
                .filter(Boolean)
                .map(part => part.charAt(0).toUpperCase())
                .slice(0, 2)
                .join("");

        return {
            id: `registered-${profile.id}-${index}`,
            accountId: profile.id,
            email: profile.email,
            name: name,
            subject: subject,
            expertise: profile.expertise || "No expertise provided",
            description: profile.bio || "No biography available.",
            rating: Number(profile.rating) || 0,
            initials: initials,
            color: profile.color || "tutor-blue",
            modes: modes,

            // TUTOR PROFILE PICTURE
            profilePicture: profile.profilePicture || ""
        };
    });
});


// ===================================
// AVAILABLE TUTORS
// Registered tutor accounts only
// ===================================

const tutors = [...registeredTutors];


// ===================================
// GET HTML ELEMENTS
// ===================================

const tutorList = document.getElementById("tutorList");
const tutorSearch = document.getElementById("tutorSearch");
const subjectFilter = document.getElementById("subjectFilter");
const modeFilter = document.getElementById("modeFilter");
const resultsCount = document.getElementById("resultsCount");
const noTutors = document.getElementById("noTutors");
const clearFiltersButton = document.getElementById("clearFilters");
const resetSearchButton = document.getElementById("resetSearch");
const logoutButton = document.getElementById("logoutBtn");


// ===================================
// DISPLAY TUTOR CARDS
// ===================================

function displayTutors(tutorData) {

    tutorList.innerHTML = "";

    if (tutorData.length === 0) {
        noTutors.classList.remove("hidden");
        resultsCount.textContent = "No tutors available.";
        return;
    }

    noTutors.classList.add("hidden");

    resultsCount.textContent =
        `Showing ${tutorData.length} tutor(s)`;

    tutorData.forEach(function(tutor) {

        // GET TUTORING MODES
        const tutorModes = Array.isArray(tutor.modes)
            ? tutor.modes
            : [];

        // CREATE MODE BADGES
        const modeBadges = tutorModes.map(function(mode) {

            const modeClass = mode === "Online"
                ? "online-badge"
                : "face-badge";

            return `
                <span class="mode-badge ${modeClass}">
                    ${escapeHTML(mode)}
                </span>
            `;

        }).join("");

        // DISPLAY RATING
        const rating = Number(tutor.rating) || 0;

        const ratingText = rating > 0
            ? rating.toFixed(1)
            : "New";

        const ratingDescription = rating > 0
            ? "Tutor Rating"
            : "No ratings yet";

        // DISPLAY PROFILE PICTURE OR INITIALS
        const avatarContent = tutor.profilePicture
            ? `
                <img
                    src="${escapeHTML(tutor.profilePicture)}"
                    alt="${escapeHTML(tutor.name)}"
                    class="tutor-card-picture"
                >
              `
            : escapeHTML(tutor.initials);

        // CREATE TUTOR CARD
        const tutorCard = document.createElement("article");

        tutorCard.className = "find-tutor-card";

        tutorCard.innerHTML = `
            <div class="find-card-top">

                <div class="find-tutor-avatar ${escapeHTML(tutor.color)}">
                    ${avatarContent}
                </div>

                <span class="peer-label">
                    Peer Tutor
                </span>

            </div>

            <h3>${escapeHTML(tutor.name)}</h3>

            <p class="find-tutor-subject">
                ${escapeHTML(tutor.subject)}
            </p>

            <p class="tutor-expertise">
                ${escapeHTML(tutor.expertise)}
            </p>

            <p class="find-tutor-description">
                ${escapeHTML(tutor.description)}
            </p>

            <div class="find-tutor-rating">
                ⭐ ${escapeHTML(ratingText)}
                <span>${ratingDescription}</span>
            </div>

            <div class="tutor-modes">
                ${modeBadges}
            </div>

            <button
                class="view-profile-button"
                data-tutor-id="${escapeHTML(tutor.id)}"
            >
                View Profile →
            </button>
        `;

        tutorList.appendChild(tutorCard);

    });
}


// ===================================
// VIEW TUTOR PROFILE
// ===================================

tutorList.addEventListener("click", function(event) {

    const button = event.target.closest(".view-profile-button");

    if (!button) return;

    const tutorId = button.dataset.tutorId;

    const selectedTutor = tutors.find(function(tutor) {
        return String(tutor.id) === String(tutorId);
    });

    if (!selectedTutor) {
        alert("Tutor profile not found. Please try again.");
        return;
    }

    // SAVE SELECTED TUTOR
    sessionStorage.setItem(
        "pt_selected_tutor",
        JSON.stringify(selectedTutor)
    );

    // OPEN ACTUAL TUTOR PROFILE PAGE
    window.location.href = "tutor-profile.html";

});


// ===================================
// SEARCH AND FILTER TUTORS
// ===================================

function filterTutors() {

    const searchValue = tutorSearch.value.trim().toLowerCase();
    const selectedSubject = subjectFilter.value;
    const selectedMode = modeFilter.value;

    const filteredTutors = tutors.filter(function(tutor) {

        // SEARCH BY NAME, SUBJECT, OR EXPERTISE
        const matchesSearch =
            String(tutor.name || "").toLowerCase().includes(searchValue) ||
            String(tutor.subject || "").toLowerCase().includes(searchValue) ||
            String(tutor.expertise || "").toLowerCase().includes(searchValue);

        // FILTER BY SUBJECT
        const matchesSubject =
            selectedSubject === "all" ||
            tutor.subject === selectedSubject;

        // FILTER BY TUTORING MODE
        const matchesMode =
            selectedMode === "all" ||
            (
                Array.isArray(tutor.modes) &&
                tutor.modes.includes(selectedMode)
            );

        return matchesSearch && matchesSubject && matchesMode;

    });

    displayTutors(filteredTutors);

}


// ===================================
// CLEAR SEARCH AND FILTERS
// ===================================

function clearFilters() {

    tutorSearch.value = "";
    subjectFilter.value = "all";
    modeFilter.value = "all";

    filterTutors();

}


// ===================================
// EVENT LISTENERS
// ===================================

tutorSearch.addEventListener("input", filterTutors);
subjectFilter.addEventListener("change", filterTutors);
modeFilter.addEventListener("change", filterTutors);

clearFiltersButton.addEventListener("click", clearFilters);
resetSearchButton.addEventListener("click", clearFilters);


// ===================================
// DISPLAY STUDENT INFORMATION
// ===================================

function displayStudentInfo() {

    if (!currentUser) return;

    const name = currentUser.name || "Student";

    // STUDENT NAME
    document.getElementById("studentName").textContent = name;

    // STUDENT INITIALS
    const initials = name
        .split(" ")
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    document.getElementById("userInitials").textContent =
        initials || "ST";

    // CURRENT DATE
    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });

}


// ===================================
// LOGOUT FUNCTION
// ===================================

logoutButton.addEventListener("click", function() {

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
// INITIALIZE FIND TUTORS PAGE
// ===================================

if (currentUser && currentUser.role === "student") {

    displayStudentInfo();
    displayTutors(tutors);

}


// ===================================
// CONSOLE MESSAGE
// ===================================

console.log("PeerTutor Find Tutors Loaded Successfully!");
console.log("Registered Tutors:", registeredTutors);
console.log("All Available Tutors:", tutors);
