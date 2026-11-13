
const adminLoginForm = document.getElementById("adminLoginForm");

adminLoginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document
        .getElementById("adminEmail")
        .value
        .trim()
        .toLowerCase();

    const password = document.getElementById("adminPassword").value;

    const message = document.getElementById("adminLoginMessage");
    const loginButton = document.getElementById("adminLoginButton");

    message.textContent = "";
    loginButton.disabled = false;
    loginButton.textContent = "Sign In to Admin Portal";

    let users = [];

    try {
        users = JSON.parse(localStorage.getItem("pt_users") || "[]");

        if (!Array.isArray(users)) {
            users = [];
        }
    } catch (error) {
        message.textContent = "Unable to load account information.";
        message.style.color = "#dc2626";
        return;
    }

    const admin = users.find(function (user) {
        return (
            String(user.email || "").trim().toLowerCase() === email &&
            String(user.role || "").toLowerCase() === "admin"
        );
    });

    if (!admin) {
        message.textContent =
            "Admin account not found. Please check your account setup.";

        message.style.color = "#dc2626";
        return;
    }

    if (String(admin.password || "") !== password) {
        message.textContent = "Incorrect administrator password.";
        message.style.color = "#dc2626";
        return;
    }

    if (admin.status === "inactive") {
        message.textContent =
            "Your administrator account is inactive.";

        message.style.color = "#dc2626";
        return;
    }

    const currentAdmin = {
        id: admin.id,
        name: admin.fullName || admin.name || "Administrator",
        email: admin.email,
        role: "admin"
    };

    sessionStorage.setItem(
        "pt_current_user",
        JSON.stringify(currentAdmin)
    );

    message.textContent = "Login successful! Opening dashboard...";
    message.style.color = "#059669";

    loginButton.disabled = true;
    loginButton.textContent = "Signing In...";

    setTimeout(function () {
        window.location.replace("dashboard.html");
    }, 1000);
});