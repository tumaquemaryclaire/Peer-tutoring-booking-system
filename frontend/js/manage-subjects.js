
// ===========================================
// PEERTUTOR - ADMIN MANAGE SUBJECTS
// Add, Search, Edit, and Delete Subjects
// ===========================================

const SUBJECTS_KEY = "pt_subjects";
const PROFILES_KEY = "pt_tutor_profiles";
const BOOKINGS_KEY = "pt_bookings";

const subjectsTableBody = document.getElementById("subjectsTableBody");
const subjectMessage = document.getElementById("subjectMessage");
const searchSubjects = document.getElementById("searchSubjects");

const addSubjectForm = document.getElementById("addSubjectForm");
const editSubjectForm = document.getElementById("editSubjectForm");
const editSubjectModal = document.getElementById("editSubjectModal");

let subjects = [];


// ===========================================
// STORAGE HELPERS
// ===========================================

function readArray(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Unable to read " + key, error);
        return [];
    }
}


function saveSubjects() {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
}


function createSubjectId() {
    return "subject-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 8);
}


function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function(character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}


// ===========================================
// SUBJECT NORMALIZATION
// ===========================================

function getProfileSubjects(profile) {
    let profileSubjects = profile.subjects || [];

    if (typeof profileSubjects === "string") {
        profileSubjects = profileSubjects.split(",");
    }

    if (!Array.isArray(profileSubjects)) {
        return [];
    }

    return profileSubjects
        .map(function(subject) {
            return String(subject || "").trim();
        })
        .filter(Boolean);
}


function initializeSubjects() {
    const storedSubjects = localStorage.getItem(SUBJECTS_KEY);

    // Convert an existing subject catalog into a consistent format.
    if (storedSubjects !== null) {
        let parsedSubjects = [];

        try {
            parsedSubjects = JSON.parse(storedSubjects);
        } catch (error) {
            console.error("Invalid subject catalog:", error);
        }

        if (Array.isArray(parsedSubjects)) {
            subjects = parsedSubjects
                .map(function(item, index) {
                    if (typeof item === "string") {
                        return {
                            id: createSubjectId() + "-" + index,
                            name: item.trim(),
                            description: "",
                            createdAt: new Date().toISOString()
                        };
                    }

                    if (item && typeof item === "object") {
                        return {
                            id: String(item.id || createSubjectId()),
                            name: String(item.name || item.subject || "").trim(),
                            description: String(item.description || ""),
                            createdAt: item.createdAt || new Date().toISOString()
                        };
                    }

                    return null;
                })
                .filter(function(item) {
                    return item && item.name;
                });
        }
    } else {
        // Starter subjects for a new catalog.
        const starterSubjects = [
            "Mathematics",
            "English",
            "Science",
            "Filipino",
            "Computer Studies",
            "Programming",
            "Social Studies",
            "Accounting"
        ];

        const profiles = readArray(PROFILES_KEY);

        profiles.forEach(function(profile) {
            getProfileSubjects(profile).forEach(function(name) {
                starterSubjects.push(name);
            });
        });

        const uniqueNames = [];

        starterSubjects.forEach(function(name) {
            const alreadyExists = uniqueNames.some(function(existingName) {
                return existingName.toLowerCase() === name.toLowerCase();
            });

            if (!alreadyExists) {
                uniqueNames.push(name);
            }
        });

        subjects = uniqueNames.map(function(name) {
            return {
                id: createSubjectId(),
                name: name,
                description: "",
                createdAt: new Date().toISOString()
            };
        });
    }

    // Remove duplicate subject names.
    const seenNames = new Set();

    subjects = subjects.filter(function(subject) {
        const key = subject.name.toLowerCase();

        if (seenNames.has(key)) {
            return false;
        }

        seenNames.add(key);
        return true;
    });

    saveSubjects();
}


// ===========================================
// ADMIN INFORMATION
// ===========================================

function loadAdminInformation() {
    let currentAdmin = null;

    try {
        currentAdmin = JSON.parse(
            sessionStorage.getItem("pt_current_user")
        );
    } catch (error) {
        currentAdmin = null;
    }

    if (currentAdmin) {
        const adminName = currentAdmin.name || "Administrator";
        const adminEmail = currentAdmin.email || "Admin Account";

        document.getElementById("sidebarAdminName").textContent = adminName;
        document.getElementById("headerAdminName").textContent = adminName;
        document.getElementById("headerAdminEmail").textContent = adminEmail;
    }
}


// ===========================================
// MESSAGE DISPLAY
// ===========================================

function showSubjectMessage(message, type = "success") {
    subjectMessage.textContent = message;
    subjectMessage.className = "subject-message " + type;

    window.setTimeout(function() {
        subjectMessage.textContent = "";
        subjectMessage.className = "subject-message";
    }, 3500);
}


// ===========================================
// SUBJECT INFORMATION
// ===========================================

function countTutorsForSubject(subjectName) {
    const profiles = readArray(PROFILES_KEY);

    return profiles.filter(function(profile) {
        return getProfileSubjects(profile).some(function(name) {
            return name.toLowerCase() === subjectName.toLowerCase();
        });
    }).length;
}


function countBookingsForSubject(subjectName) {
    const bookings = readArray(BOOKINGS_KEY);

    return bookings.filter(function(booking) {
        return String(booking.subject || "").trim().toLowerCase() ===
            subjectName.toLowerCase();
    }).length;
}


// ===========================================
// SUMMARY CARDS
// ===========================================

function updateSummary() {
    const profiles = readArray(PROFILES_KEY);

    const tutors = readArray("pt_users").filter(function(user) {
        return String(user.role || "").toLowerCase() === "tutor";
    });

    const bookings = readArray(BOOKINGS_KEY);

    const subjectsWithTutors = subjects.filter(function(subject) {
        return countTutorsForSubject(subject.name) > 0;
    });

    document.getElementById("totalSubjects").textContent = subjects.length;

    document.getElementById("subjectsWithTutors").textContent =
        subjectsWithTutors.length;

    document.getElementById("registeredTutors").textContent = tutors.length;

    document.getElementById("totalSubjectBookings").textContent =
        bookings.length;
}


// ===========================================
// RENDER SUBJECT TABLE
// ===========================================

function renderSubjects() {
    const searchTerm = searchSubjects.value.trim().toLowerCase();

    const filteredSubjects = subjects
        .filter(function(subject) {
            return subject.name.toLowerCase().includes(searchTerm) ||
                subject.description.toLowerCase().includes(searchTerm);
        })
        .sort(function(a, b) {
            return a.name.localeCompare(b.name);
        });

    document.getElementById("subjectCount").textContent =
        filteredSubjects.length +
        (filteredSubjects.length === 1 ? " subject" : " subjects");

    if (filteredSubjects.length === 0) {
        subjectsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-row">
                    No subjects found. Add a new subject to get started.
                </td>
            </tr>
        `;
        return;
    }

    subjectsTableBody.innerHTML = filteredSubjects.map(function(subject) {
        const tutorCount = countTutorsForSubject(subject.name);
        const bookingCount = countBookingsForSubject(subject.name);

        return `
            <tr>
                <td>
                    <div class="subject-name-cell">
                        <div class="subject-icon">▤</div>
                        <strong>${escapeHTML(subject.name)}</strong>
                    </div>
                </td>

                <td>
                    ${escapeHTML(subject.description || "No description")}
                </td>

                <td>
                    <span class="subject-number">${tutorCount}</span>
                </td>

                <td>
                    <span class="subject-number">${bookingCount}</span>
                </td>

                <td>
                    <div class="action-buttons">
                        <button
                            type="button"
                            class="action-button activate"
                            data-action="edit"
                            data-subject-id="${escapeHTML(subject.id)}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="action-button delete"
                            data-action="delete"
                            data-subject-id="${escapeHTML(subject.id)}"
                        >
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}


// ===========================================
// ADD SUBJECT
// ===========================================

addSubjectForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("newSubjectName").value.trim();

    const description = document
        .getElementById("newSubjectDescription")
        .value.trim();

    if (!name) {
        showSubjectMessage("Please enter a subject name.", "error");
        return;
    }

    const duplicate = subjects.some(function(subject) {
        return subject.name.toLowerCase() === name.toLowerCase();
    });

    if (duplicate) {
        showSubjectMessage("This subject already exists.", "error");
        return;
    }

    subjects.push({
        id: createSubjectId(),
        name: name,
        description: description,
        createdAt: new Date().toISOString()
    });

    saveSubjects();
    addSubjectForm.reset();

    updateSummary();
    renderSubjects();

    showSubjectMessage("Subject added successfully!");
});


// ===========================================
// EDIT SUBJECT MODAL
// ===========================================

function openEditModal(subject) {
    document.getElementById("editSubjectId").value = subject.id;
    document.getElementById("editSubjectName").value = subject.name;
    document.getElementById("editSubjectDescription").value =
        subject.description || "";

    editSubjectModal.classList.add("show");
    editSubjectModal.setAttribute("aria-hidden", "false");
}


function closeEditModal() {
    editSubjectModal.classList.remove("show");
    editSubjectModal.setAttribute("aria-hidden", "true");
    editSubjectForm.reset();
}


document.getElementById("closeEditModal").addEventListener("click", closeEditModal);

document.getElementById("cancelEditSubject").addEventListener("click", closeEditModal);

editSubjectModal.addEventListener("click", function(event) {
    if (event.target === editSubjectModal) {
        closeEditModal();
    }
});


// ===========================================
// UPDATE TUTOR PROFILES AFTER RENAME
// ===========================================

function updateTutorProfiles(oldName, newName) {
    const profiles = readArray(PROFILES_KEY);

    const updatedProfiles = profiles.map(function(profile) {
        const names = getProfileSubjects(profile);

        const updatedNames = names.map(function(name) {
            return name.toLowerCase() === oldName.toLowerCase()
                ? newName
                : name;
        });

        profile.subjects = [...new Set(updatedNames)];
        return profile;
    });

    localStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));
}


// ===========================================
// REMOVE SUBJECT FROM TUTOR PROFILES
// ===========================================

function removeSubjectFromTutorProfiles(subjectName) {
    const profiles = readArray(PROFILES_KEY);

    const updatedProfiles = profiles.map(function(profile) {
        profile.subjects = getProfileSubjects(profile).filter(function(name) {
            return name.toLowerCase() !== subjectName.toLowerCase();
        });

        return profile;
    });

    localStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));
}


// ===========================================
// SAVE EDITED SUBJECT
// ===========================================

editSubjectForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const subjectId = document.getElementById("editSubjectId").value;

    const newName = document.getElementById("editSubjectName").value.trim();

    const newDescription = document
        .getElementById("editSubjectDescription")
        .value.trim();

    if (!newName) {
        alert("Please enter a subject name.");
        return;
    }

    const subject = subjects.find(function(item) {
        return String(item.id) === String(subjectId);
    });

    if (!subject) {
        showSubjectMessage("Subject could not be found.", "error");
        closeEditModal();
        return;
    }

    const duplicate = subjects.some(function(item) {
        return String(item.id) !== String(subjectId) &&
            item.name.toLowerCase() === newName.toLowerCase();
    });

    if (duplicate) {
        alert("A subject with this name already exists.");
        return;
    }

    const oldName = subject.name;

    subject.name = newName;
    subject.description = newDescription;

    if (oldName.toLowerCase() !== newName.toLowerCase()) {
        updateTutorProfiles(oldName, newName);
    }

    saveSubjects();
    closeEditModal();

    updateSummary();
    renderSubjects();

    showSubjectMessage("Subject updated successfully!");
});


// ===========================================
// DELETE SUBJECT
// ===========================================

subjectsTableBody.addEventListener("click", function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const subjectId = button.dataset.subjectId;

    const subject = subjects.find(function(item) {
        return String(item.id) === String(subjectId);
    });

    if (!subject) {
        showSubjectMessage("Subject could not be found.", "error");
        return;
    }

    if (action === "edit") {
        openEditModal(subject);
        return;
    }

    if (action === "delete") {
        const confirmed = confirm(
            "Are you sure you want to delete '" + subject.name + "'?\n\n" +
            "This will remove it from tutor profiles. " +
            "Existing bookings and feedback records will be preserved."
        );

        if (!confirmed) {
            return;
        }

        subjects = subjects.filter(function(item) {
            return String(item.id) !== String(subjectId);
        });

        removeSubjectFromTutorProfiles(subject.name);

        saveSubjects();

        updateSummary();
        renderSubjects();

        showSubjectMessage("Subject deleted successfully.");
    }
});


// ===========================================
// SEARCH SUBJECTS
// ===========================================

searchSubjects.addEventListener("input", renderSubjects);


// ===========================================
// LOGOUT
// ===========================================

document.getElementById("logoutButton").addEventListener("click", function() {
    const confirmed = confirm("Are you sure you want to log out?");

    if (confirmed) {
        sessionStorage.removeItem("pt_current_user");
        window.location.href = "login.html";
    }
});


// ===========================================
// INITIALIZE PAGE
// ===========================================

loadAdminInformation();
initializeSubjects();
updateSummary();
renderSubjects();

console.log("PeerTutor Manage Subjects Loaded Successfully!");

