
(function () {
    let currentUser = null;
    let users = [];

    try {
        currentUser = JSON.parse(
            sessionStorage.getItem("pt_current_user")
        );

        users = JSON.parse(
            localStorage.getItem("pt_users") || "[]"
        );
    } catch (error) {
        currentUser = null;
    }

    const validAdmin = users.find(function (user) {
        return (
            currentUser &&
            user.email === currentUser.email &&
            user.role === "admin" &&
            user.status !== "inactive"
        );
    });

    if (!currentUser || currentUser.role !== "admin" || !validAdmin) {
        sessionStorage.removeItem("pt_current_user");
        window.location.replace("login.html");
    }
})();
