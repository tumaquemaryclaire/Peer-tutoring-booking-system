
// ===================================
// PEERTUTOR - MANAGE TUTOR PROFILE
// ===================================


// CHECK CURRENT TUTOR
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

const profileForm = document.getElementById("tutorProfileForm");

const profileMessage = document.getElementById("profileMessage");


// ===================================
// GET SAVED TUTOR PROFILES
// ===================================

function getTutorProfiles() {

    return JSON.parse(
        localStorage.getItem("pt_tutor_profiles") || "[]"
    );

}


// ===================================
// SAVE TUTOR PROFILES
// ===================================

function saveTutorProfiles(profiles) {

    localStorage.setItem(
        "pt_tutor_profiles",
        JSON.stringify(profiles)
    );

}


// ===================================
// GET CURRENT TUTOR PROFILE
// ===================================

function getCurrentProfile() {

    const profiles = getTutorProfiles();

    return profiles.find(function(profile) {

        return profile.email.toLowerCase() ===
               currentUser.email.toLowerCase();

    });

}


// ===================================
// GET CHECKED SUBJECTS AND MODES
// ===================================

function getCheckedValues(name) {

    return Array.from(
        document.querySelectorAll(`input[name="${name}"]:checked`)
    ).map(function(input) {

        return input.value;

    });

}


// ===================================
// SET CHECKED VALUES
// ===================================

function setCheckedValues(name, values) {

    document.querySelectorAll(`input[name="${name}"]`)
        .forEach(function(input) {

            input.checked = values.includes(input.value);

        });

}


// ===================================
// DISPLAY TUTOR INFORMATION
// ===================================

function displayTutorInformation() {

    const name = currentUser.name || "Tutor";

    document.getElementById("tutorName").textContent = name;

    document.getElementById("tutorFullName").value = name;

    document.getElementById("tutorEmail").value =
        currentUser.email;

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
// DISPLAY PROFILE PREVIEW
// ===================================

function updateProfilePreview() {

    const name = currentUser.name || "Tutor";

    const expertise =
        document.getElementById("tutorExpertise").value.trim();

    const bio =
        document.getElementById("tutorBio").value.trim();

    const subjects = getCheckedValues("tutorSubjects");

    const modes = getCheckedValues("tutorModes");


    // PROFILE NAME
    document.getElementById("previewName").textContent = name;


    // PROFILE INITIALS
    const initials = name
        .split(" ")
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    document.getElementById("previewInitials").textContent =
        initials || "TU";


    // EXPERTISE
    document.getElementById("previewExpertise").textContent =
        expertise || "Your skills will appear here.";


    // BIOGRAPHY
    document.getElementById("previewBio").textContent =
        bio || "Your biography will appear here.";


    // DISPLAY SUBJECTS
    const previewSubjects =
        document.getElementById("previewSubjects");

    previewSubjects.replaceChildren();

    if (subjects.length === 0) {

        const placeholder = document.createElement("span");

        placeholder.className = "preview-placeholder";

        placeholder.textContent = "No subjects selected.";

        previewSubjects.appendChild(placeholder);

    } else {

        subjects.forEach(function(subject) {

            const badge = document.createElement("span");

            badge.className = "preview-badge";

            badge.textContent = subject;

            previewSubjects.appendChild(badge);

        });

    }


    // DISPLAY TUTORING MODES
    const previewModes =
        document.getElementById("previewModes");

    previewModes.replaceChildren();

    if (modes.length === 0) {

        const placeholder = document.createElement("span");

        placeholder.className = "preview-placeholder";

        placeholder.textContent = "No tutoring mode selected.";

        previewModes.appendChild(placeholder);

    } else {

        modes.forEach(function(mode) {

            const badge = document.createElement("span");

            badge.className = "preview-badge";

            badge.textContent = mode;

            previewModes.appendChild(badge);

        });

    }

}


// ===================================
// LOAD EXISTING PROFILE
// ===================================

function loadProfile() {

    const profile = getCurrentProfile();

    if (!profile) {

        document.getElementById("tutorExpertise").value = "";

        document.getElementById("tutorBio").value = "";

        setCheckedValues("tutorSubjects", []);

        setCheckedValues("tutorModes", []);

    } else {

        document.getElementById("tutorExpertise").value =
            profile.expertise || "";

        document.getElementById("tutorBio").value =
            profile.bio || "";

        setCheckedValues(
            "tutorSubjects",
            Array.isArray(profile.subjects) ? profile.subjects : []
        );

        setCheckedValues(
            "tutorModes",
            Array.isArray(profile.modes) ? profile.modes : []
        );

    }

    updateProfilePreview();

}


// ===================================
// SHOW PROFILE MESSAGE
// ===================================

function showProfileMessage(message, success = false) {

    profileMessage.textContent = message;

    profileMessage.style.color =
        success ? "#16804a" : "#d92d20";

}


// ===================================
// SAVE PROFILE
// ===================================

profileForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const expertise =
        document.getElementById("tutorExpertise").value.trim();

    const bio =
        document.getElementById("tutorBio").value.trim();

    const subjects = getCheckedValues("tutorSubjects");

    const modes = getCheckedValues("tutorModes");


    // VALIDATE EXPERTISE
    if (!expertise) {

        showProfileMessage("Please enter your skills and expertise.");

        return;

    }


    // VALIDATE SUBJECTS
    if (subjects.length === 0) {

        showProfileMessage("Please select at least one subject.");

        return;

    }


    // VALIDATE TUTORING MODES
    if (modes.length === 0) {

        showProfileMessage("Please select at least one tutoring mode.");

        return;

    }


    // VALIDATE BIOGRAPHY
    if (bio.length < 20) {

        showProfileMessage(
            "Your biography must contain at least 20 characters."
        );

        return;

    }


    // GET EXISTING PROFILES
    const profiles = getTutorProfiles();


    // GET INITIALS
    const initials = (currentUser.name || "Tutor")
        .split(" ")
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");


    // CREATE PROFILE DATA
    const newProfile = {

        id: currentUser.id,

        email: currentUser.email,

        name: currentUser.name,

        expertise: expertise,

        subjects: subjects,

        modes: modes,

        bio: bio,

        rating: 0,

        initials: initials,

        color: "tutor-blue",

        updatedAt: new Date().toISOString()

    };


    // CHECK IF PROFILE ALREADY EXISTS
    const existingIndex = profiles.findIndex(function(profile) {

        return profile.email.toLowerCase() ===
               currentUser.email.toLowerCase();

    });


    if (existingIndex !== -1) {

        // UPDATE EXISTING PROFILE
        profiles[existingIndex] = newProfile;

    } else {

        // ADD NEW PROFILE
        profiles.push(newProfile);

    }


    // SAVE TO LOCAL STORAGE
    saveTutorProfiles(profiles);


    // DISPLAY SUCCESS
    showProfileMessage(
        "Your tutor profile has been saved successfully!",
        true
    );

    updateProfilePreview();

    console.log("Tutor profile saved successfully!", newProfile);

});


// ===================================
// LIVE PROFILE PREVIEW
// ===================================

profileForm.addEventListener("input", updateProfilePreview);

profileForm.addEventListener("change", updateProfilePreview);


// ===================================
// RESET BUTTON
// ===================================

document.getElementById("resetProfileBtn")
    .addEventListener("click", function() {

        loadProfile();

        showProfileMessage("Profile form restored to saved information.", true);

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

if (currentUser && currentUser.role === "tutor") {

    displayTutorInformation();

    loadProfile();

}

console.log("Tutor Profile Management Loaded Successfully!");
