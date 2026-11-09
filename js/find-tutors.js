
// ===================================
// PEERTUTOR - FIND TUTORS
// Search and Filter Functions
// ===================================


// CHECK STUDENT LOGIN
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

const tutors = [

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
// GET HTML ELEMENTS
// ===================================

const tutorList = document.getElementById("tutorList");

const tutorSearch = document.getElementById("tutorSearch");

const subjectFilter = document.getElementById("subjectFilter");

const modeFilter = document.getElementById("modeFilter");

const resultsCount = document.getElementById("resultsCount");

const noTutors = document.getElementById("noTutors");


// ===================================
// ESCAPE HTML CONTENT
// ===================================

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, function(character) {

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

    if (tutorData.length === 0) {

        noTutors.classList.remove("hidden");

        resultsCount.textContent = "No tutors available.";

        return;

    }

    noTutors.classList.add("hidden");

    resultsCount.textContent =
        `Showing ${tutorData.length} tutor(s)`;


    tutorData.forEach(function(tutor) {

        const modeBadges = tutor.modes.map(function(mode) {

            const modeClass = mode === "Online"
                ? "online-badge"
                : "face-badge";

            return `
                <span class="mode-badge ${modeClass}">
                    ${escapeHTML(mode)}
                </span>
            `;

        }).join("");


        const tutorCard = document.createElement("article");

        tutorCard.className = "find-tutor-card";

        tutorCard.innerHTML = `

            <div class="find-card-top">

                <div class="find-tutor-avatar ${escapeHTML(tutor.color)}">
                    ${escapeHTML(tutor.initials)}
                </div>

                <span class="peer-label">Peer Tutor</span>

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
                ⭐ ${escapeHTML(tutor.rating)}
                <span>Sample Rating</span>
            </div>

            <div class="tutor-modes">
                ${modeBadges}
            </div>

            <button
                class="view-profile-button"
                data-tutor-id="${tutor.id}"
            >
                View Profile →
            </button>

        `;

        tutorList.appendChild(tutorCard);

    });


    // ADD PROFILE BUTTON EVENTS
    document.querySelectorAll(".view-profile-button").forEach(function(button) {

        button.addEventListener("click", function() {

            const tutorId = Number(this.dataset.tutorId);

            const selectedTutor = tutors.find(function(tutor) {

                return tutor.id === tutorId;

            });

            if (selectedTutor) {

                sessionStorage.setItem(
                    "pt_selected_tutor",
                    JSON.stringify(selectedTutor)
                );

                window.location.href = "tutor-profile.html";

            }

        });

    });

}


// ===================================
// SEARCH AND FILTER TUTORS
// ===================================

function filterTutors() {

    const searchValue = tutorSearch.value.trim().toLowerCase();

    const selectedSubject = subjectFilter.value;

    const selectedMode = modeFilter.value;


    const filteredTutors = tutors.filter(function(tutor) {

        const matchesSearch =
            tutor.name.toLowerCase().includes(searchValue) ||
            tutor.subject.toLowerCase().includes(searchValue) ||
            tutor.expertise.toLowerCase().includes(searchValue);

        const matchesSubject =
            selectedSubject === "all" ||
            tutor.subject === selectedSubject;

        const matchesMode =
            selectedMode === "all" ||
            tutor.modes.includes(selectedMode);

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

document.getElementById("clearFilters")
    .addEventListener("click", clearFilters);

document.getElementById("resetSearch")
    .addEventListener("click", clearFilters);


// ===================================
// STUDENT INFORMATION
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
// INITIALIZE FIND TUTORS PAGE
// ===================================

if (currentUser && currentUser.role === "student") {

    displayStudentInfo();

    displayTutors(tutors);

}

console.log("Find Tutors Page Loaded Successfully!");
