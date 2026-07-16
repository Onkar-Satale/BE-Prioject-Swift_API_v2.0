const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Signup user
export const signup = async ({ firstName, lastName, email, password }) => {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstName, lastName, email, password }),
  });
  return res.json();
};

// Login user
export const login = async ({ email, password }) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

// Save auth token and userId along with profile details
export const saveAuthData = ({ token, email, firstName, lastName, createdAt }) => {
  localStorage.setItem("authToken", token);
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.userId || payload.id || payload._id;
    if (userId) {
      localStorage.setItem("userId", userId);
    }
  } catch (e) {
    // Ignore decoding issues
  }
  const fullName = lastName ? `${firstName} ${lastName}`.trim() : (firstName || "");
  localStorage.setItem("username", fullName);
  localStorage.setItem("email", email || "");
  if (createdAt) {
    localStorage.setItem("createdAt", createdAt);
  }
};

// Get token
export const getToken = () => localStorage.getItem("authToken");

// Get userId
export const getUserId = () => localStorage.getItem("userId");

// Logout
export const logout = () => {
  // Fire-and-forget backend logout request to clear HTTPOnly cookie and DB token
  fetch(`${API_URL}/logout`, { method: "POST" }).catch(() => {});
  
  localStorage.removeItem("authToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("username");
  localStorage.removeItem("email");
  localStorage.removeItem("createdAt");
  sessionStorage.removeItem("postmanCloneState");
  sessionStorage.removeItem("lastRequest");
  sessionStorage.removeItem("lastResponse");
  sessionStorage.removeItem("activePanel");
  sessionStorage.removeItem("showBot");
};
