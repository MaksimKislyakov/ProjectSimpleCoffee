import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from "react";
import "./styles/App.css";
import "./styles/fonts.css";
import Authorization from "./components/Authorization.tsx";
import ProfilePage from "./components/Profile.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import WorkSchedulePage from "./components/WorkSchedulePage.tsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Authorization />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Authorization />} />
        <Route path="/schedule" element={<WorkSchedulePage />} />
      </Routes>
    </Router>
  );
}

export default App;
