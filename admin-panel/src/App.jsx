
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "./services/firebase";
import AdminLogin from "./pages/AdminLogin";
import "./App.css";

function AdminDashboard({ admin }) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h2>PeerTutor Admin</h2>
          <p>Administrator Dashboard</p>
        </div>

        <button onClick={handleLogout}>Logout</button>
      </header>

      <main className="admin-main">
        <h1>Welcome, Administrator!</h1>
        <p>You are successfully logged in.</p>

        <div className="admin-welcome-card">
          <h3>Admin Account</h3>
          <p>Email: {admin.email}</p>
          <p>Role: Administrator</p>
        </div>

        <h2 className="admin-section-title">Dashboard Overview</h2>

        <div className="admin-stats">
          <div className="admin-stat-card">
            <h3>Students</h3>
            <p>0</p>
          </div>

          <div className="admin-stat-card">
            <h3>Tutors</h3>
            <p>0</p>
          </div>

          <div className="admin-stat-card">
            <h3>Total Bookings</h3>
            <p>0</p>
          </div>

          <div className="admin-stat-card">
            <h3>Pending Bookings</h3>
            <p>0</p>
          </div>
        </div>

        <p className="admin-note">
          Dashboard statistics and management features will be connected
          to Firestore in the next steps.
        </p>
      </main>
    </div>
  );
}

function App() {
  const [admin, setAdmin] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAdmin(null);
        setCheckingAuth(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().role === "admin") {
          setAdmin({
            uid: user.uid,
            email: user.email,
            role: "admin",
          });
        } else {
          setAdmin(null);
          await signOut(auth);
        }
      } catch (error) {
        console.error("Admin verification failed:", error);
        setAdmin(null);
        await signOut(auth);
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (checkingAuth) {
    return (
      <div className="admin-loading">
        Checking administrator access...
      </div>
    );
  }

  return admin ? (
    <AdminDashboard admin={admin} />
  ) : (
    <AdminLogin onLogin={setAdmin} />
  );
}

export default App;
