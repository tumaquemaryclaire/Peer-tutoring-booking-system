
// ===================================
// PEERTUTOR - AUTHENTICATION
// Login and Registration
// ===================================


// GET REGISTERED USERS

function getUsers() {
    try {
        const users = JSON.parse(localStorage.getItem("pt_users") || "[]");
        return Array.isArray(users) ? users : [];
    } catch (error) {
        console.error("Unable to load users:", error);
        return [];
    }
}


// SAVE REGISTERED USERS

function saveUsers(users) {
    localStorage.setItem("pt_users", JSON.stringify(users));
}


// DISPLAY MESSAGES

function showMessage(elementId, message, success = false) {
    const messageElement = document.getElementById(elementId);

    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;
    messageElement.style.color = success ? "#16804a" : "#d92d20";
}


// EMAIL VALIDATION

function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}


// ===================================
// REGISTRATION
// ===================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", function(event) {

        event.preventDefault();

        // GET NAME COMPONENTS

        const firstName = document.getElementById("firstName").value.trim();

        const middleName = document.getElementById("middleName").value.trim();

        const lastName = document.getElementById("lastName").value.trim();

        const suffix = document.getElementById("suffix").value.trim();

        // COMBINE NAME COMPONENTS

        const fullName = [
            firstName,
            middleName,
            lastName,
            suffix
        ].filter(Boolean).join(" ");

        const contactNumber = document.getElementById("contactNumber").value.trim();

        const email = document.getElementById("registerEmail").value.trim().toLowerCase();

        const password = document.getElementById("registerPassword").value;

        const confirmPassword = document.getElementById("confirmPassword").value;

        const role = document.getElementById("userRole").value;


        // VALIDATE FIRST NAME

        if (firstName === "") {
            showMessage("registerMessage", "Please enter your first name.");
            return;
        }


        // VALIDATE LAST NAME

        if (lastName === "") {
            showMessage("registerMessage", "Please enter your last name.");
            return;
        }


        // VALIDATE CONTACT NUMBER

        const numberPattern = /^[0-9]{11}$/;

        if (!numberPattern.test(contactNumber)) {
            showMessage(
                "registerMessage",
                "Invalid contact number! Please enter exactly 11 digits."
            );
            return;
        }


        // VALIDATE EMAIL

        if (!isValidEmail(email)) {
            showMessage(
                "registerMessage",
                "Invalid email! Please enter a valid email address."
            );
            return;
        }


        // VALIDATE PASSWORD

        if (password.length < 8) {
            showMessage(
                "registerMessage",
                "Password must contain at least 8 characters."
            );
            return;
        }


        // VALIDATE CONFIRM PASSWORD

        if (password !== confirmPassword) {
            showMessage(
                "registerMessage",
                "Passwords do not match."
            );
            return;
        }


        // VALIDATE USER ROLE

        if (role !== "student" && role !== "tutor") {
            showMessage(
                "registerMessage",
                "Please select Student or Tutor."
            );
            return;
        }


        // GET EXISTING USERS

        const users = getUsers();


        // CHECK DUPLICATE EMAIL

        const existingUser = users.find(function(user) {
            return String(user.email || "").toLowerCase() === email;
        });

        if (existingUser) {
            showMessage(
                "registerMessage",
                "This email is already registered."
            );
            return;
        }


        // CREATE NEW USER ACCOUNT

        const newUser = {
            id: Date.now(),

            // SEPARATE NAME COMPONENTS
            firstName: firstName,
            middleName: middleName,
            lastName: lastName,
            suffix: suffix,

            // COMPLETE NAME FOR EXISTING SYSTEM FEATURES
            fullName: fullName,
            name: fullName,

            contactNumber: contactNumber,
            email: email,
            password: password,
            role: role,
            status: "active"
        };


        // SAVE USER ACCOUNT

        users.push(newUser);
        saveUsers(users);


        // SUCCESS MESSAGE

        showMessage(
            "registerMessage",
            "Account created successfully! Redirecting to login...",
            true
        );


        registerForm.reset();


        // REDIRECT TO LOGIN

        setTimeout(function() {
            window.location.href = "login.html";
        }, 1500);

    });

}


// ===================================
// LOGIN
// STUDENT AND TUTOR ONLY
// ===================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim().toLowerCase();

        const password = document.getElementById("loginPassword").value;


        // CHECK EMAIL FORMAT

        if (!isValidEmail(email)) {
            showMessage(
                "loginMessage",
                "Please enter a valid email address."
            );
            return;
        }


        // GET REGISTERED USERS

        const users = getUsers();


        // FIND ACCOUNT

        const loggedInUser = users.find(function(user) {
            return String(user.email || "").toLowerCase() === email &&
                   user.password === password;
        });


        // CHECK ACCOUNT

        if (!loggedInUser) {
            showMessage(
                "loginMessage",
                "Invalid email or password. Please try again."
            );
            return;
        }


        // CHECK ACCOUNT ROLE

        if (loggedInUser.role !== "student" &&
            loggedInUser.role !== "tutor") {

            showMessage(
                "loginMessage",
                "Admin accounts must use the separate Admin Login page."
            );

            return;
        }


        // CHECK ACCOUNT STATUS

        if (loggedInUser.status === "inactive") {
            showMessage(
                "loginMessage",
                "Your account has been deactivated. Please contact the administrator."
            );

            return;
        }


        // SAVE CURRENT USER SESSION

        const currentUser = {
            id: loggedInUser.id,
            name: loggedInUser.fullName || loggedInUser.name,
            email: loggedInUser.email,
            role: loggedInUser.role,

            firstName: loggedInUser.firstName || "",
            middleName: loggedInUser.middleName || "",
            lastName: loggedInUser.lastName || "",
            suffix: loggedInUser.suffix || ""
        };

        sessionStorage.setItem(
            "pt_current_user",
            JSON.stringify(currentUser)
        );


        // SUCCESS MESSAGE

        showMessage(
            "loginMessage",
            "Login successful! Welcome, " +
            (loggedInUser.fullName || loggedInUser.name) + ".",
            true
        );


        // REDIRECT BASED ON USER ROLE

        setTimeout(function() {

            if (loggedInUser.role === "student") {

                window.location.href = "student/dashboard.html";

            } else if (loggedInUser.role === "tutor") {

                window.location.href = "tutor/dashboard.html";

            }

        }, 1200);

    });

}


console.log("PeerTutor Authentication Loaded Successfully!");
