import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PostmanClone from "./components/PostmanClone";
import AccountPage from "./components/AccountPage";
import LoginPage from "./components/LoginPage";
import Signup from "./components/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import Documentation from "./components/Documentation";
import ContactSupport from "./components/ContactSupport";
import { PostmanProvider } from "./context/PostmanContext"; // 🔹 add this


export default function App() {
  return (
      <PostmanProvider>  {/* 🔹 wrap here */}

        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PostmanClone />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/contact-support" element={<ContactSupport />} />

            {/* Protected routes */}
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </PostmanProvider>
  );
}
