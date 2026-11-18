
// ===================================
// PEERTUTOR - TUTOR PROFILE
// ===================================


// CHECK STUDENT LOGIN
const currentUser = JSON.parse(
    sessionStorage.getItem("pt_current_user") || "null"
);


// GET SELECTED TUTOR
const selectedTutor = JSON.parse(
    sessionStorage.getItem("pt_selected_tutor") || "null"
);


// CHECK LOGIN AND SELECTED TUTOR
if (!currentUser || currentUser.role !== "student") {

    alert("Please log in using your student account.");

    window.location.href = "../login.html";

} else if (!selectedTutor) {

    alert("Please select a tutor first.");

    window.location.href = "find-tutors.html";

}


// ===================================
// DISPLAY TUTOR PROFILE
// ===================================

function displayTutorProfile() {

    if (!selectedTutor || !currentUser) return;


    // DISPLAY STUDENT INFORMATION
    document.getElementById("studentName").textContent =
        currentUser.name || "Student";


    const initials = (currentUser.name || "Student")
        .split(" ")
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    document.getElementById("userInitials").textContent =
        initials || "ST";


    // DISPLAY CURRENT DATE
    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });


    // DISPLAY TUTOR INFORMATION
    document.getElementById("profileName").textContent =
        selectedTutor.name;

    document.getElementById("profileSubject").textContent =
        selectedTutor.subject;

    document.getElementById("profileRating").textContent =
        selectedTutor.rating.toFixed(1);

    document.getElementById("profileDescription").textContent =
        selectedTutor.description;

    document.getElementById("profileExpertise").textContent =
        selectedTutor.expertise;


    // DISPLAY TUTOR INITIALS
    const avatar = document.getElementById("profileAvatar");

    avatar.textContent = selectedTutor.initials;

    avatar.className =
        "profile-avatar " + selectedTutor.color;


    // DISPLAY AVAILABLE TUTORING MODES
    const profileModes = document.getElementById("profileModes");

    profileModes.innerHTML = selectedTutor.modes.map(function(mode) {

        const modeClass = mode === "Online"
            ? "online-badge"
            : "face-badge";

        const modeIcon = mode === "Online"
            ? "💻"
            : "🤝";

        return `
            <span class="profile-mode ${modeClass}">
                ${modeIcon} ${mode}
            </span>
        `;

    }).join("");

}


// ===================================
// BOOKING BUTTON
// ===================================


document.getElementById("bookSessionBtn")
    .addEventListener("click", function() {

        if (!selectedTutor) return;

        sessionStorage.setItem(
            "pt_selected_tutor",
            JSON.stringify(selectedTutor)
        );

        window.location.href = "book-session.html";

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
// INITIALIZE PROFILE PAGE
// ===================================

if (currentUser && currentUser.role === "student" && selectedTutor) {

    displayTutorProfile();

}

console.log("Tutor Profile Loaded Successfully!");
