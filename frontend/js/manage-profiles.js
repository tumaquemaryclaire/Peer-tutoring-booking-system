
// ===================================
// PEERTUTOR - MANAGE TUTOR PROFILE
// ===================================


// ===================================
// CHECK CURRENT TUTOR
// ===================================

const currentUser = JSON.parse(
    sessionStorage.getItem("pt_current_user") || "null"
);

if (!currentUser || currentUser.role !== "tutor") {
    alert("Please log in using your tutor account.");
    window.location.href = "../login.html";
}


// ===================================
// GET REGISTERED ACCOUNT INFORMATION
// ===================================

function getRegisteredTutor() {
    const users = JSON.parse(
        localStorage.getItem("pt_users") || "[]"
    );

    const email = String(currentUser.email || "").trim().toLowerCase();

    const account = users.find(function(user) {
        return String(user.email || "").trim().toLowerCase() === email;
    });

    console.log("Current Session:", currentUser);
    console.log("Registered Tutor Account:", account);

    return account;
}


// ===================================
// GET COMPLETE TUTOR NAME
// ===================================

function getCompleteTutorName() {
    const account = getRegisteredTutor();

    if (account) {
        const composedName = [
            account.firstName,
            account.middleName,
            account.lastName,
            account.suffix
        ]
        .filter(function(part) {
            return String(part || "").trim() !== "";
        })
        .join(" ");

        const completeName =
            composedName ||
            account.fullName ||
            account.name ||
            currentUser.fullName ||
            currentUser.name;

        if (completeName && completeName.trim()) {
            currentUser.name = completeName.trim();
            currentUser.fullName = completeName.trim();

            currentUser.firstName =
                account.firstName || currentUser.firstName || "";

            currentUser.middleName =
                account.middleName || currentUser.middleName || "";

            currentUser.lastName =
                account.lastName || currentUser.lastName || "";

            currentUser.suffix =
                account.suffix || currentUser.suffix || "";

            sessionStorage.setItem(
                "pt_current_user",
                JSON.stringify(currentUser)
            );

            return completeName.trim();
        }
    }

    return (
        currentUser.fullName ||
        currentUser.name ||
        "Tutor"
    );
}


// ===================================
// GET TUTOR INITIALS
// ===================================

function getTutorInitials() {
    const fullName = getCompleteTutorName();

    const nameParts = fullName
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (nameParts.length >= 2) {
        return (
            nameParts[0].charAt(0) +
            nameParts[nameParts.length - 1].charAt(0)
        ).toUpperCase();
    }

    if (nameParts.length === 1) {
        return nameParts[0].substring(0, 2).toUpperCase();
    }

    return "TU";
}

// ===================================
// GET HTML ELEMENTS
// ===================================

const profileForm = document.getElementById("tutorProfileForm");

const profileMessage = document.getElementById("profileMessage");

const pictureInput = document.getElementById("tutorProfilePicture");

const picturePreview = document.getElementById("tutorPicturePreview");

const removePictureBtn = document.getElementById("removeTutorPicture");

let selectedProfilePicture = "";


// ===================================
// GET SAVED TUTOR PROFILES
// ===================================

function getTutorProfiles() {

    try {

        const profiles = JSON.parse(
            localStorage.getItem("pt_tutor_profiles") || "[]"
        );

        return Array.isArray(profiles) ? profiles : [];

    } catch (error) {

        console.error("Unable to load tutor profiles:", error);
        return [];

    }
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

        return String(profile.email || "").toLowerCase() ===
               String(currentUser.email || "").toLowerCase();

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

    const name = getCompleteTutorName();

    document.getElementById("tutorName").textContent = name;

    document.getElementById("tutorFullName").value = name;

    document.getElementById("tutorEmail").value =
        currentUser.email || "";

    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });

    displayProfilePicture(selectedProfilePicture);

}


// ===================================
// DISPLAY PROFILE PICTURE
// ===================================

function displayProfilePicture(image) {

    const preview = document.getElementById("previewInitials");

    const topAvatar = document.getElementById("userInitials");

    const uploadPreview = picturePreview;

    const initials = getTutorInitials();

    const avatarElements = [
        preview,
        topAvatar,
        uploadPreview
    ];

    avatarElements.forEach(function(element) {

        if (!element) return;

        element.replaceChildren();

        if (image) {

            const img = document.createElement("img");

            img.src = image;
            img.alt = "Tutor Profile Picture";

            element.appendChild(img);

        } else {

            if (element === uploadPreview) {

                const placeholder = document.createElement("span");

                placeholder.textContent = "👤";

                element.appendChild(placeholder);

            } else {

                element.textContent = initials;

            }

        }

    });

}


// ===================================
// PROFILE PICTURE UPLOAD
// ===================================

pictureInput.addEventListener("change", function() {

    const file = this.files[0];

    if (!file) return;


    // CHECK IMAGE FILE

    if (!file.type.startsWith("image/")) {

        alert("Please select a valid image.");

        this.value = "";

        return;

    }


    // CHECK FILE SIZE (1 MB)

    if (file.size > 1024 * 1024) {

        alert("Image must not exceed 1 MB.");

        this.value = "";

        return;

    }


    const reader = new FileReader();

    reader.onload = function(event) {

        selectedProfilePicture = event.target.result;

        displayProfilePicture(selectedProfilePicture);

    };

    reader.onerror = function() {

        alert("Unable to read the selected image.");

        pictureInput.value = "";

    };

    reader.readAsDataURL(file);

});


// ===================================
// REMOVE PROFILE PICTURE
// ===================================

removePictureBtn.addEventListener("click", function() {

    selectedProfilePicture = "";

    pictureInput.value = "";

    displayProfilePicture("");

});


// ===================================
// DISPLAY PROFILE PREVIEW
// ===================================

function updateProfilePreview() {

    const name = getCompleteTutorName();

    const expertise =
        document.getElementById("tutorExpertise").value.trim();

    const bio =
        document.getElementById("tutorBio").value.trim();

    const subjects = getCheckedValues("tutorSubjects");

    const modes = getCheckedValues("tutorModes");


    // PROFILE NAME

    document.getElementById("previewName").textContent = name;


    // PROFILE PICTURE

    displayProfilePicture(selectedProfilePicture);


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

        selectedProfilePicture = "";

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

        selectedProfilePicture = profile.profilePicture || "";

    }

    pictureInput.value = "";

    displayTutorInformation();

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

    const existingProfile = getCurrentProfile();


    // GET COMPLETE NAME

    const fullName = getCompleteTutorName();


    // GET INITIALS

    const initials = getTutorInitials();


    // CREATE PROFILE DATA

    const newProfile = {

        id: currentUser.id,

        email: currentUser.email,

        name: fullName,

        expertise: expertise,

        subjects: subjects,

        modes: modes,

        bio: bio,

        rating: existingProfile?.rating || 0,

        initials: initials,

        color: existingProfile?.color || "tutor-blue",

        profilePicture: selectedProfilePicture,

        updatedAt: new Date().toISOString()

    };


    // CHECK IF PROFILE ALREADY EXISTS

    const existingIndex = profiles.findIndex(function(profile) {

        return String(profile.email || "").toLowerCase() ===
               String(currentUser.email || "").toLowerCase();

    });


    if (existingIndex !== -1) {

        // UPDATE EXISTING PROFILE

        profiles[existingIndex] = newProfile;

    } else {

        // ADD NEW PROFILE

        profiles.push(newProfile);

    }


    // SAVE TO LOCAL STORAGE

    try {

        saveTutorProfiles(profiles);

    } catch (error) {

        console.error("Profile saving error:", error);

        showProfileMessage(
            "Unable to save profile. Your browser storage may be full."
        );

        return;

    }


    // DISPLAY SUCCESS

    showProfileMessage(
        "Your tutor profile has been saved successfully!",
        true
    );

    displayTutorInformation();

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
    .addEventListener("click", function(event) {

        event.preventDefault();

        loadProfile();

        showProfileMessage(
            "Profile form restored to saved information.",
            true
        );

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
