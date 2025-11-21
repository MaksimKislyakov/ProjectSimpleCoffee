<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Authorization from "./components/Authorization";
import ProfilePage from "./components/Profile";
import "./styles/App.css";
import "./styles/authorization.css";
import "./styles/fonts.css";

function App() {
  const token = localStorage.getItem("token");

  return (
    <Router>
      <Routes>
        {/* Страница авторизации */}
        <Route path="/" element={<Authorization />} />

        {/* Страница профиля — доступна только при наличии токена */}
        
        {/* ИЗМЕНИТЬ */}
        <Route
          path="/profile" 
          element={token ? <ProfilePage /> : <Navigate to="/" />}
        />
=======
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
>>>>>>> frontend
      </Routes>
    </Router>
  );
}

export default App;
