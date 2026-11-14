
const USERS_KEY = "pt_users";

const searchInput = document.getElementById("searchUsers");
const roleFilter = document.getElementById("roleFilter");
const statusFilter = document.getElementById("statusFilter");
const usersTableBody = document.getElementById("usersTableBody");
const statusMessage = document.getElementById("statusMessage");

let allUsers = [];

function readUsers() {
    try {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
        return Array.isArray(users) ? users : [];
    } catch (error) {
        console.error("Unable to read users:", error);
        return [];
    }
}

function saveUsers() {
    localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
}

function isManagedUser(user) {
    const role = String(user.role || "").toLowerCase();
    return role === "student" || role === "tutor";
}

function getUserStatus(user) {
    return user.status === "inactive" ? "inactive" : "active";
}

function getUserName(user) {
    return user.fullName || user.name || "Unnamed User";
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
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

function showMessage(message, type = "success") {
    statusMessage.textContent = message;
    statusMessage.className = "status-message " + type;

    window.setTimeout(function () {
        statusMessage.textContent = "";
        statusMessage.className = "status-message";
    }, 3500);
}


// ADMIN ACCOUNT INFORMATION

function loadAdminInformation() {
    let currentAdmin = null;

    try {
        currentAdmin = JSON.parse(
            sessionStorage.getItem("pt_current_user")
        );
    } catch (error) {
        console.error("Unable to load admin information.");
    }

    if (currentAdmin) {
        const adminName = currentAdmin.name || "Administrator";
        const adminEmail = currentAdmin.email || "Admin Account";

        document.getElementById("sidebarAdminName").textContent = adminName;
        document.getElementById("headerAdminName").textContent = adminName;
        document.getElementById("headerAdminEmail").textContent = adminEmail;
    }
}


// SUMMARY CARDS

function updateSummary() {
    const managedUsers = allUsers.filter(isManagedUser);

    const students = managedUsers.filter(function (user) {
        return String(user.role).toLowerCase() === "student";
    });

    const tutors = managedUsers.filter(function (user) {
        return String(user.role).toLowerCase() === "tutor";
    });

    const inactive = managedUsers.filter(function (user) {
        return getUserStatus(user) === "inactive";
    });

    document.getElementById("totalUsers").textContent = managedUsers.length;
    document.getElementById("totalStudents").textContent = students.length;
    document.getElementById("totalTutors").textContent = tutors.length;
    document.getElementById("inactiveUsers").textContent = inactive.length;
}


// RENDER USER TABLE

function renderUsers() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedRole = roleFilter.value;
    const selectedStatus = statusFilter.value;

    const filteredUsers = allUsers
        .filter(isManagedUser)
        .filter(function (user) {
            const name = getUserName(user).toLowerCase();
            const email = String(user.email || "").toLowerCase();
            const contact = String(user.contactNumber || "").toLowerCase();

            const matchesSearch =
                name.includes(searchTerm) ||
                email.includes(searchTerm) ||
                contact.includes(searchTerm);

            const matchesRole =
                selectedRole === "all" ||
                String(user.role).toLowerCase() === selectedRole;

            const matchesStatus =
                selectedStatus === "all" ||
                getUserStatus(user) === selectedStatus;

            return matchesSearch && matchesRole && matchesStatus;
        })
        .sort(function (a, b) {
            return getUserName(a).localeCompare(getUserName(b));
        });

    document.getElementById("accountCount").textContent =
        filteredUsers.length + (filteredUsers.length === 1 ? " account" : " accounts");

    if (filteredUsers.length === 0) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-row">
                    No user accounts found.
                </td>
            </tr>
        `;
        return;
    }

    usersTableBody.innerHTML = filteredUsers.map(function (user) {
        const name = getUserName(user);
        const email = String(user.email || "");
        const contact = user.contactNumber || "Not provided";
        const role = String(user.role).toLowerCase();
        const status = getUserStatus(user);
        const initial = name.charAt(0).toUpperCase();

        const statusClass = status === "active" ? "active" : "inactive";

        const actionText = status === "active" ? "Deactivate" : "Activate";
        const actionClass = status === "active" ? "deactivate" : "activate";

        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">${escapeHTML(initial)}</div>
                        <div class="user-name">
                            <strong>${escapeHTML(name)}</strong>
                            <span>Registered Account</span>
                        </div>
                    </div>
                </td>

                <td>${escapeHTML(email || "Not provided")}</td>

                <td>${escapeHTML(contact)}</td>

                <td>
                    <span class="role-badge ${role}">
                        ${escapeHTML(role)}
                    </span>
                </td>

                <td>
                    <span class="status-badge ${statusClass}">
                        <span class="status-dot"></span>
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>
                    <div class="action-buttons">
                        <button
                            type="button"
                            class="action-button ${actionClass}"
                            data-action="toggle-status"
                            data-email="${escapeHTML(email)}"
                        >
                            ${actionText}
                        </button>

                        <button
                            type="button"
                            class="action-button delete"
                            data-action="delete-user"
                            data-email="${escapeHTML(email)}"
                        >
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}


// ACTIVATE / DEACTIVATE / DELETE

usersTableBody.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const email = button.dataset.email;

    const user = allUsers.find(function (item) {
        return String(item.email || "").toLowerCase() ===
            String(email || "").toLowerCase();
    });

    if (!user || !isManagedUser(user)) {
        showMessage("User account could not be found.", "error");
        return;
    }

    if (action === "toggle-status") {
        const currentStatus = getUserStatus(user);

        if (currentStatus === "active") {
            const confirmed = confirm(
                "Are you sure you want to deactivate this account?"
            );

            if (!confirmed) {
                return;
            }

            user.status = "inactive";
            showMessage("User account deactivated successfully.");
        } else {
            user.status = "active";
            showMessage("User account activated successfully.");
        }

        saveUsers();
        refreshPage();
    }

    if (action === "delete-user") {
        const confirmed = confirm(
            "Are you sure you want to permanently delete this user account? " +
            "Existing bookings and feedback history will be kept."
        );

        if (!confirmed) {
            return;
        }

        const deletedUserEmail = String(user.email || "").toLowerCase();
        const deletedUserId = user.id;

        allUsers = allUsers.filter(function (item) {
            return String(item.email || "").toLowerCase() !== deletedUserEmail;
        });

        saveUsers();

        // Remove the tutor profile connected to this account.
        
// Remove tutor-related data only when the deleted account is a tutor.
if (String(user.role).toLowerCase() === "tutor") {

    const tutorProfiles = JSON.parse(
        localStorage.getItem("pt_tutor_profiles") || "[]"
    );

    const updatedProfiles = tutorProfiles.filter(function (profile) {
        return String(profile.email || "").toLowerCase() !== deletedUserEmail;
    });

    localStorage.setItem(
        "pt_tutor_profiles",
        JSON.stringify(updatedProfiles)
    );

    const schedules = JSON.parse(
        localStorage.getItem("pt_schedules") || "[]"
    );

    const updatedSchedules = schedules.filter(function (schedule) {
        const sameEmail =
            String(schedule.tutorEmail || "").toLowerCase() === deletedUserEmail;

        const sameId =
            deletedUserId !== undefined &&
            String(schedule.tutorId) === String(deletedUserId);

        return !sameEmail && !sameId;
    });

    localStorage.setItem(
        "pt_schedules",
        JSON.stringify(updatedSchedules)
    );
}


        // Remove schedules connected to the deleted tutor.
        const schedules = JSON.parse(
            localStorage.getItem("pt_schedules") || "[]"
        );

        const updatedSchedules = schedules.filter(function (schedule) {
            const sameEmail =
                String(schedule.tutorEmail || "").toLowerCase() === deletedUserEmail;

            const sameId =
                deletedUserId !== undefined &&
                String(schedule.tutorId) === String(deletedUserId);

            return !sameEmail && !sameId;
        });

        localStorage.setItem(
            "pt_schedules",
            JSON.stringify(updatedSchedules)
        );

        showMessage("User account deleted successfully.");
        refreshPage();
    }
});


// SEARCH AND FILTERS

searchInput.addEventListener("input", renderUsers);
roleFilter.addEventListener("change", renderUsers);
statusFilter.addEventListener("change", renderUsers);

document.getElementById("resetFilters").addEventListener("click", function () {
    searchInput.value = "";
    roleFilter.value = "all";
    statusFilter.value = "all";

    renderUsers();
});


// REFRESH DATA

function refreshPage() {
    allUsers = readUsers();
    updateSummary();
    renderUsers();
}


// LOGOUT

document.getElementById("logoutButton").addEventListener("click", function () {
    const confirmed = confirm("Are you sure you want to log out?");

    if (confirmed) {
        sessionStorage.removeItem("pt_current_user");
        window.location.href = "login.html";
    }
});


// INITIALIZE PAGE

loadAdminInformation();
refreshPage();
