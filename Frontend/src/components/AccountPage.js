// frontend/src/pages/AccountPage.jsx
import "./accountPage.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { getToken, logout } from "../services/authService";
import { showToast } from "../utils/toast";
import { PostmanContext } from "../context/PostmanContext";

export default function AccountPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [requestsCount, setRequestsCount] = useState(0); // local state for per-user count

  const capitalizeFirstChar = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fetch logged-in user info
  const fetchUser = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      navigate("/login");
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const res = await fetch(`${backendUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.user) {
        setUser(data.user);
      } else {
        logout();
        navigate("/login");
      }
    } catch (err) {
      logout();
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user history for stats
  const fetchHistory = async () => {
    if (!getToken()) return; // guest users have no backend history
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const res = await fetch(`${backendUrl}/api/history`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        setHistory(data);
      } else {
        console.error("Failed to fetch history:", data);
      }
    } catch (err) {
      console.error("History fetch error:", err.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const res = await fetch(`${backendUrl}/api/auth/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (res.ok) {
        setShowDeleteConfirm(false);
        // Do NOT show toast on account deletion as requested
        setTimeout(() => {
          logout();
          navigate("/");
        }, 100);
      } else {
        console.error("Failed to delete account");
      }
    } catch (err) {
      console.error(err);
    }
  };


  const { resetContext } = useContext(PostmanContext);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    showToast("🚪 Successfully logged out.");
    resetContext();
    logout();
    navigate("/login");
  };

  const openDocumentation = () => {
    navigate("/documentation"); // navigate to Documentation page
  };

  const contactSupport = () => {
    navigate("/contact-support"); // navigate to Contact Support page
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Removed redundant fetchRequestCount

  useEffect(() => {
    if (user) {
      fetchHistory();
      // Set the requests count based entirely on history length so it syncs with deletions
      setRequestsCount(history.length);
    }
  }, [user, history.length]);

  if (loading) return <p>Loading user data...</p>;
  if (errorMsg) return <p style={{ color: "red" }}>{errorMsg}</p>;

  // Stats: dynamic if user logged in, else 0
  const collectionsCount = user?.collections?.length || 0;
  const workspacesCount = user?.workspaces?.length || 0;

  // Remove useContext entirely
  return (
    <div className="account-page">

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>⚠️ Delete Account</h3>
            <p>Do you really want to delete this account? This will permanently erase your profile and all related history data.</p>
            <div className="modal-actions">
              <button className="btn-no" onClick={() => setShowDeleteConfirm(false)}>No, Cancel</button>
              <button className="btn-yes" onClick={handleDeleteAccount}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>⚠️ Logout</h3>
            <p>Do you really want to logout?</p>
            <div className="modal-actions">
              <button className="btn-no" onClick={() => setShowLogoutConfirm(false)}>No, Cancel</button>
              <button className="btn-yes" onClick={handleLogout}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="account-header">
        <h2>⚙️ My Account</h2>
        <div className="header-actions">
          <button onClick={() => navigate("/")} className="back-btn">
            ← Back
          </button>
          {!isGuest && (
            <>
              <button onClick={() => setShowDeleteConfirm(true)} className="delete-account-btn" style={{ padding: '6px 12px', border: '1px solid #ff4d4f', cursor: 'pointer', background: 'rgba(255, 77, 79, 0.1)', color: '#ff4d4f', borderRadius: '6px', fontWeight: '600' }}>
                Delete Account
              </button>
              <button onClick={() => setShowLogoutConfirm(true)} className="logout-btn">
                ⎋ Logout
              </button>
            </>
          )}
        </div>
      </header>

      {/* Welcome Banner */}
      <div style={{ padding: "10px 0 20px 0", textAlign: "center" }}>
        <h1 style={{ fontSize: "48px", color: "#ffffff", margin: 0, fontWeight: "bold" }}>
          Welcome, <span style={{ color: "#ffffffff" }}>{user?.username ? capitalizeFirstChar(user.username) : "Guest"}</span> !
        </h1>
      </div>

      {/* Content */}
      <div className="account-content">
        {/* Profile Card */}
        <div className="info-card profile-card">
          <div className="avatar">{user?.username ? user.username.charAt(0).toUpperCase() : "G"}</div>
          <div>
            <h3>{user?.username ? capitalizeFirstChar(user.username) : "Guest User"}</h3>
            <p>Email: {user?.email || "N/A"}</p>
            <p>
              Member since:{" "}
              {user
                ? new Date(user.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Preferences */}
        <div className="info-card">
          <h3>Preferences</h3>
          <p>Theme: Dark</p>
          <p>Language: English</p>
          <button
            className="edit-btn"
            disabled={isGuest}
            title={isGuest ? "Login to edit preferences" : ""}
          >
            ✏️ Edit Preferences
          </button>
        </div>

        {/* Usage Stats */}
        <div className="info-card">
          <h3>Usage Stats</h3>
          <p>
            Requests Sent: <strong>{requestsCount}</strong>
          </p>
          <p>
            Collections Created: <strong>{collectionsCount}</strong>
          </p>
          <p>
            Workspaces: <strong>{workspacesCount}</strong>
          </p>
        </div>

        {/* Workspaces */}
        <div className="info-card">
          <h3>Workspaces</h3>
          <ul>
            {user?.workspaces?.map((ws, idx) => (
              <li key={idx}>{ws}</li>
            )) || <li>Personal Workspace</li>}
          </ul>
          <button
            className="create-btn"
            disabled={isGuest}
            title={isGuest ? "Login to create workspace" : ""}
          >
            ➕ Create Workspace
          </button>
        </div>

        {/* Support */}
        <div className="info-card">
          <h3>Support & Help</h3>
          <p>
            📖{" "}
            <button className="link-btn" onClick={openDocumentation}>
              Documentation
            </button>
          </p>
          <p>
            📩{" "}
            <button className="link-btn" onClick={contactSupport}>
              Contact Support
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="account-footer">
        <p>© 2025 YourApp. All rights reserved.</p>
        <div className="footer-links">
          <button className="link-btn" onClick={openDocumentation}>
            Documentation
          </button>
          <button className="link-btn" onClick={contactSupport}>
            Support
          </button>
        </div>
      </footer>
    </div>
  );
}



































