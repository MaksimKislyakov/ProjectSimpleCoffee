import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from "react";
import "./styles/App.css";
import "./styles/fonts.css";
import Authorization from "./components/Authorization.tsx";
import ProfilePage from "./components/Profile.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import WorkSchedulePage from "./components/WorkSchedulePage.tsx";
import ManagerPage from "./components/ReportPage.tsx";

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
        <Route path="/manager" element={<ManagerPage />} />
      </Routes>
    </Router>
  );
}

export default App;
