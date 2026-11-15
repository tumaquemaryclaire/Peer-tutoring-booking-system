
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { logoutUser } from "../services/auth";

function TutorDashboard() {
  const navigate = useNavigate();

  const currentUser = JSON.parse(
    sessionStorage.getItem("pt_current_user") || "null"
  );

  // CHECK TUTOR LOGIN
  useEffect(() => {
    if (!currentUser || currentUser.role !== "tutor") {
      navigate("/login", { replace: true });
    }
  }, [currentUser, navigate]);

  // LOGOUT
  async function handleLogout() {
    try {
      await logoutUser();
      sessionStorage.removeItem("pt_current_user");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Unable to log out. Please try again.");
    }
  }

  if (!currentUser || currentUser.role !== "tutor") {
    return null;
  }

  // COMPLETE TUTOR NAME
  const firstName = currentUser.firstName || "Tutor";

  const fullName =
    currentUser.fullName ||
    currentUser.name ||
    [
      currentUser.firstName || "",
      currentUser.middleName || "",
      currentUser.lastName || ""
    ].filter(Boolean).join(" ") +
    (currentUser.suffix ? `, ${currentUser.suffix}` : "");

  const initials = firstName.charAt(0).toUpperCase();

  return (
    <div className="dashboard-placeholder">
      <div className="dashboard-placeholder-card">

        <span className="brand-icon">P</span>
        <span className="eyebrow">PEERTUTOR TUTOR PORTAL</span>

        <h1>Welcome, {firstName}!</h1>

        <p>
          Hello, {fullName}. Welcome to your Tutor Dashboard.
          You can manage your tutoring activities here.
        </p>

        <div className="tutor-account-info">
          <div className="sidebar-avatar">
            {initials}
          </div>

          <div>
            <strong>{fullName}</strong>
            <p>Tutor Account</p>
            <span>{currentUser.email}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="auth-submit"
        >
          Log Out
        </button>

      </div>
    </div>
  );
}

export default TutorDashboard;
