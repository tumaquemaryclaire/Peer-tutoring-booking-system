
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
// SAMPLE TUTOR INFORMATION
// ===================================

const sampleTutors = [

    {
        id: 1,
        name: "Alex Santos",
        subject: "JavaScript Programming",
        expertise: "JavaScript, DOM, and Basic Programming",
        description: "Helps beginners understand JavaScript fundamentals, coding logic, and basic programming concepts.",
        rating: 4.9,
        initials: "AS",
        color: "tutor-blue",
        modes: ["Online", "Face-to-Face"]
    },

    {
        id: 2,
        name: "Jamie Cruz",
        subject: "Database Management",
        expertise: "MySQL, SQL Queries, and Database Design",
        description: "Helps students understand database concepts, SQL commands, table relationships, and MySQL.",
        rating: 4.8,
        initials: "JC",
        color: "tutor-green",
        modes: ["Face-to-Face"]
    },

    {
        id: 3,
        name: "Taylor Reyes",
        subject: "Web Development",
        expertise: "HTML, CSS, and Responsive Design",
        description: "Enjoys teaching students how to build websites using HTML, CSS, and JavaScript.",
        rating: 5.0,
        initials: "TR",
        color: "tutor-purple",
        modes: ["Online", "Face-to-Face"]
    },

    {
        id: 4,
        name: "Jordan Garcia",
        subject: "Java Programming",
        expertise: "Java Basics, OOP, and Programming Logic",
        description: "Can guide students in understanding Java syntax, object-oriented programming, and simple projects.",
        rating: 4.7,
        initials: "JG",
        color: "tutor-orange",
        modes: ["Online"]
    },

    {
        id: 5,
        name: "Morgan Dela Cruz",
        subject: "Python Programming",
        expertise: "Python Fundamentals and Basic Coding",
        description: "Helps beginners understand Python variables, conditions, loops, and functions.",
        rating: 4.9,
        initials: "MD",
        color: "tutor-pink",
        modes: ["Online", "Face-to-Face"]
    },

    {
        id: 6,
        name: "Casey Mendoza",
        subject: "Mathematics",
        expertise: "Algebra and Basic Mathematics",
        description: "Provides academic assistance with basic mathematics, problem-solving, and algebra.",
        rating: 4.8,
        initials: "CM",
        color: "tutor-teal",
        modes: ["Face-to-Face"]
    }

];


// ===================================
// SAFE LOCAL STORAGE READER
// ===================================

function getSavedArray(key) {

    try {

        const data = JSON.parse(
            localStorage.getItem(key) || "[]"
        );

        return Array.isArray(data) ? data : [];

    } catch (error) {

        console.error("Error reading localStorage:", error);

        return [];

    }

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


    // CHECK PROFILE INFORMATION
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

            // UNIQUE REGISTERED TUTOR ID
            id: `registered-${profile.id}-${index}`,

            // ORIGINAL TUTOR ACCOUNT INFORMATION
            accountId: profile.id,

            email: profile.email,

            name: name,

            subject: subject,

            expertise: profile.expertise || "No expertise provided",

            description: profile.bio || "No biography available.",

            rating: Number(profile.rating) || 0,

            initials: initials,

            color: profile.color || "tutor-blue",

            modes: modes

        };

    });

});


// ===================================
// COMBINE REGISTERED AND SAMPLE TUTORS
// ===================================

// Registered tutors have priority.
// Avoid showing the same tutor and subject twice.

const tutors = [

    ...registeredTutors,

    ...sampleTutors.filter(function(sampleTutor) {

        return !registeredTutors.some(function(registeredTutor) {

            return (

                sampleTutor.name.toLowerCase() ===
                registeredTutor.name.toLowerCase() &&

                sampleTutor.subject === registeredTutor.subject

            );

        });

    })

];


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
// DISPLAY TUTOR CARDS
// ===================================

function displayTutors(tutorData) {

    tutorList.innerHTML = "";


    // CHECK IF THERE ARE AVAILABLE TUTORS
    if (tutorData.length === 0) {

        noTutors.classList.remove("hidden");

        resultsCount.textContent = "No tutors available.";

        return;

    }


    noTutors.classList.add("hidden");

    resultsCount.textContent =
        `Showing ${tutorData.length} tutor(s)`;


    // DISPLAY EACH TUTOR
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


        // CREATE TUTOR CARD
        const tutorCard = document.createElement("article");

        tutorCard.className = "find-tutor-card";


        tutorCard.innerHTML = `

            <div class="find-card-top">

                <div class="find-tutor-avatar ${escapeHTML(tutor.color)}">

                    ${escapeHTML(tutor.initials)}

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


    // GET TUTOR ID AS STRING
    // Registered tutor IDs are not numbers.

    const tutorId = button.dataset.tutorId;


    // FIND SELECTED TUTOR
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


    // OPEN TUTOR PROFILE PAGE
    window.location.href = "tutor-profile.html";

});


// ===================================
// SEARCH AND FILTER TUTORS
// ===================================

function filterTutors() {

    const searchValue =
        tutorSearch.value.trim().toLowerCase();

    const selectedSubject =
        subjectFilter.value;

    const selectedMode =
        modeFilter.value;


    const filteredTutors = tutors.filter(function(tutor) {


        // SEARCH BY NAME, SUBJECT, OR EXPERTISE
        const matchesSearch =

            String(tutor.name || "")
                .toLowerCase()
                .includes(searchValue)

            ||

            String(tutor.subject || "")
                .toLowerCase()
                .includes(searchValue)

            ||

            String(tutor.expertise || "")
                .toLowerCase()
                .includes(searchValue);


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


        return (

            matchesSearch &&

            matchesSubject &&

            matchesMode

        );

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


    // DISPLAY ALL TUTORS AGAIN
    filterTutors();

}


// ===================================
// EVENT LISTENERS
// ===================================


// SEARCH WHILE TYPING
tutorSearch.addEventListener("input", filterTutors);


// FILTER BY SUBJECT
subjectFilter.addEventListener("change", filterTutors);


// FILTER BY TUTORING MODE
modeFilter.addEventListener("change", filterTutors);


// CLEAR FILTERS BUTTON
clearFiltersButton.addEventListener("click", clearFilters);


// RESET SEARCH BUTTON
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

    // DISPLAY STUDENT INFORMATION
    displayStudentInfo();


    // DISPLAY ALL AVAILABLE TUTORS
    displayTutors(tutors);


}


// ===================================
// CONSOLE MESSAGE
// ===================================

console.log("PeerTutor Find Tutors Loaded Successfully!");

console.log("Sample Tutors:", sampleTutors);

console.log("Registered Tutors:", registeredTutors);

console.log("All Available Tutors:", tutors);
