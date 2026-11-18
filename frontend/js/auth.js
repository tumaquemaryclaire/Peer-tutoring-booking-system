
// ===================================
// PEERTUTOR - FIREBASE AUTHENTICATION
// Login and Registration
// ===================================

import { auth, db } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";


// ===================================
// LOCAL USER DATA
// Keep compatibility with existing features
// ===================================

function getUsers() {
    try {
        const users = JSON.parse(
            localStorage.getItem("pt_users") || "[]"
        );

        return Array.isArray(users) ? users : [];

    } catch (error) {
        console.error("Unable to load local users:", error);
        return [];
    }
}


function saveUsers(users) {
    localStorage.setItem("pt_users", JSON.stringify(users));
}


// ===================================
// DISPLAY MESSAGES
// ===================================

function showMessage(elementId, message, success = false) {
    const messageElement = document.getElementById(elementId);

    if (!messageElement) return;

    messageElement.textContent = message;
    messageElement.style.color = success ? "#16804a" : "#d92d20";
}


// ===================================
// EMAIL VALIDATION
// ===================================

function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}


// ===================================
// FIREBASE ERROR MESSAGES
// ===================================

function getFirebaseError(error) {

    switch (error.code) {

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/weak-password":
            return "Your password is too weak. Use at least 8 characters.";

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/user-not-found":
            return "No account found with this email.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        case "permission-denied":
            return "Database permission denied. Please check Firestore rules.";

        default:
            console.error("Firebase error:", error);
            return "Something went wrong. Please try again.";
    }
}


// ===================================
// REGISTRATION
// ===================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const firstName = document.getElementById("firstName").value.trim();
        const middleName = document.getElementById("middleName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const suffix = document.getElementById("suffix").value.trim();

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


        // VALIDATION

        if (!firstName || !lastName) {
            showMessage("registerMessage", "First name and last name are required.");
            return;
        }

        if (!/^\d{11}$/.test(contactNumber)) {
            showMessage("registerMessage", "Contact number must contain exactly 11 digits.");
            return;
        }

        if (!isValidEmail(email)) {
            showMessage("registerMessage", "Please enter a valid email address.");
            return;
        }

        if (password.length < 8) {
            showMessage("registerMessage", "Password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            showMessage("registerMessage", "Passwords do not match.");
            return;
        }

        if (!["student", "tutor"].includes(role)) {
            showMessage("registerMessage", "Please select a valid account role.");
            return;
        }


        try {

            showMessage("registerMessage", "Creating your account...", true);

            // CREATE FIREBASE ACCOUNT

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const firebaseUser = userCredential.user;

            // CHECK EXISTING LOCAL RECORD TO PRESERVE OLD ID

            const users = getUsers();

            const oldUser = users.find(
                user => String(user.email || "").toLowerCase() === email
            );

            const userProfile = {
                uid: firebaseUser.uid,

                firstName,
                middleName,
                lastName,
                suffix,

                fullName,
                name: fullName,

                contactNumber,
                email,
                role,

                status: "active",

                createdAt: serverTimestamp()
            };


            // SAVE PROFILE TO FIRESTORE

            await setDoc(
                doc(db, "users", firebaseUser.uid),
                userProfile
            );


            // SAVE A PASSWORD-FREE LOCAL RECORD
            // Existing local records are preserved.

            if (!oldUser) {

                users.push({
                    id: firebaseUser.uid,
                    uid: firebaseUser.uid,
                    firstName,
                    middleName,
                    lastName,
                    suffix,
                    fullName,
                    name: fullName,
                    contactNumber,
                    email,
                    role,
                    status: "active"
                });

                saveUsers(users);
            }


            // SIGN OUT AFTER REGISTRATION

            await signOut(auth);

            showMessage(
                "registerMessage",
                "Registration successful! Redirecting to login...",
                true
            );

            registerForm.reset();

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);


        } catch (error) {

            showMessage(
                "registerMessage",
                getFirebaseError(error)
            );

        }

    });

}


// ===================================
// LOGIN
// ===================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim().toLowerCase();

        const password = document.getElementById("loginPassword").value;


        if (!isValidEmail(email)) {
            showMessage("loginMessage", "Please enter a valid email address.");
            return;
        }


        try {

            showMessage("loginMessage", "Logging in...", true);

            // FIREBASE LOGIN

            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const firebaseUser = userCredential.user;


            // GET USER PROFILE FROM FIRESTORE

            const userDocument = await getDoc(
                doc(db, "users", firebaseUser.uid)
            );

            if (!userDocument.exists()) {

                await signOut(auth);

                showMessage(
                    "loginMessage",
                    "Account profile not found. Please contact the administrator."
                );

                return;
            }


            const userData = userDocument.data();


            // CHECK ACCOUNT ROLE

            if (!["student", "tutor"].includes(userData.role)) {

                await signOut(auth);

                showMessage(
                    "loginMessage",
                    "This account does not have student or tutor access."
                );

                return;
            }


            // CHECK ACCOUNT STATUS

            if (userData.status !== "active") {

                await signOut(auth);

                showMessage(
                    "loginMessage",
                    "Your account is inactive. Please contact the administrator."
                );

                return;
            }


            // PRESERVE LEGACY ID IF AVAILABLE

            const users = getUsers();

            const oldUser = users.find(
                user => String(user.email || "").toLowerCase() === email
            );


            // CURRENT LOGGED-IN USER

            const currentUser = {

                id: oldUser?.id || firebaseUser.uid,

                uid: firebaseUser.uid,

                name: userData.fullName || userData.name,

                fullName: userData.fullName || userData.name,

                firstName: userData.firstName || "",
                middleName: userData.middleName || "",
                lastName: userData.lastName || "",
                suffix: userData.suffix || "",

                email: userData.email,

                contactNumber: userData.contactNumber || "",

                role: userData.role

            };


            sessionStorage.setItem(
                "pt_current_user",
                JSON.stringify(currentUser)
            );


            showMessage(
                "loginMessage",
                "Login successful! Redirecting...",
                true
            );


            // ROLE-BASED REDIRECTION

            setTimeout(() => {

                if (userData.role === "student") {
                    window.location.href = "student/dashboard.html";
                }

                if (userData.role === "tutor") {
                    window.location.href = "tutor/dashboard.html";
                }

            }, 1000);


        } catch (error) {

            showMessage(
                "loginMessage",
                getFirebaseError(error)
            );

        }

    });

}


console.log("PeerTutor Firebase Authentication Loaded Successfully!");
