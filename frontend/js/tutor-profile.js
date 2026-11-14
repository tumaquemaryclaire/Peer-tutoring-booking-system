
// ===================================
// PEERTUTOR - TUTOR PROFILE
// Display Tutor Information and Profile Picture
// ===================================

// Get current logged-in student
const currentUser = JSON.parse(
    sessionStorage.getItem("pt_current_user") || "null"
);

// Get selected tutor
const selectedTutor = JSON.parse(
    sessionStorage.getItem("pt_selected_tutor") || "null"
);

// Check student login
if (!currentUser || currentUser.role !== "student") {
    alert("Please log in using your student account.");
    window.location.href = "../login.html";
}

// Check selected tutor
else if (!selectedTutor) {
    alert("Please select a tutor first.");
    window.location.href = "find-tutors.html";
}

// ===================================
// DISPLAY TUTOR PROFILE
// ===================================

function displayTutorProfile() {
    if (!selectedTutor || !currentUser) return;

    // Student information
    document.getElementById("studentName").textContent =
        currentUser.name || "Student";

    const studentInitials = (currentUser.name || "Student")
        .split(" ")
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    document.getElementById("userInitials").textContent =
        studentInitials || "ST";

    // Current date
    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });

    // Tutor information
    document.getElementById("profileName").textContent =
        selectedTutor.name || "Tutor";

    document.getElementById("profileSubject").textContent =
        selectedTutor.subject || "No subject";

    document.getElementById("profileRating").textContent =
        Number(selectedTutor.rating || 0).toFixed(1);

    document.getElementById("profileDescription").textContent =
        selectedTutor.description || selectedTutor.bio || "No description available.";

    document.getElementById("profileExpertise").textContent =
        selectedTutor.expertise || "Not specified";

    // ===================================
    // DISPLAY TUTOR PROFILE PICTURE
    // ===================================

    const avatar = document.getElementById("profileAvatar");

    // Get updated tutor profiles from localStorage
    const savedProfiles = JSON.parse(
        localStorage.getItem("pt_tutor_profiles") || "[]"
    );

    // Find the latest saved profile using tutor email
    const latestProfile = savedProfiles.find(function(profile) {
        return (
            profile.email?.toLowerCase() ===
            selectedTutor.email?.toLowerCase()
        );
    });

    // Get uploaded picture
    const tutorPicture =
        latestProfile?.profilePicture ||
        selectedTutor.profilePicture ||
        "";

    // Clear old avatar content
    avatar.replaceChildren();

    // Apply tutor avatar class
    avatar.className =
        "profile-avatar " + (latestProfile?.color || selectedTutor.color || "");

    if (tutorPicture) {
        const image = document.createElement("img");

        image.src = tutorPicture;
        image.alt = "Tutor Profile Picture";

        image.style.width = "100%";
        image.style.height = "100%";
        image.style.objectFit = "cover";
        image.style.borderRadius = "50%";

        avatar.appendChild(image);
    } else {
        avatar.textContent =
            latestProfile?.initials ||
            selectedTutor.initials ||
            "TU";
    }

    // ===================================
    // DISPLAY TUTOR MODES
    // ===================================

    const profileModes = document.getElementById("profileModes");

    const tutorModes =
        latestProfile?.modes ||
        selectedTutor.modes ||
        [];

    profileModes.innerHTML = tutorModes.map(function(mode) {
        const modeClass =
            mode === "Online" ? "online-badge" : "face-badge";

        const modeIcon =
            mode === "Online" ? "💻" : "🤝";

        return `
            <span class="profile-mode ${modeClass}">
                ${modeIcon} ${mode}
            </span>
        `;
    }).join("");
}

// ===================================
// BOOK SESSION BUTTON
// ===================================

document.getElementById("bookSessionBtn").addEventListener("click", function() {
    if (!selectedTutor) return;

    sessionStorage.setItem(
        "pt_selected_tutor",
        JSON.stringify(selectedTutor)
    );

    window.location.href = "book-session.html";
});

// ===================================
// LOGOUT BUTTON
// ===================================

document.getElementById("logoutBtn").addEventListener("click", function() {
    if (confirm("Are you sure you want to log out?")) {
        sessionStorage.removeItem("pt_current_user");
        sessionStorage.removeItem("pt_selected_tutor");

        window.location.href = "../login.html";
    }
});

// ===================================
// INITIALIZE
// ===================================

if (currentUser && currentUser.role === "student" && selectedTutor) {
    displayTutorProfile();
}

console.log("Tutor Profile Loaded Successfully!");
