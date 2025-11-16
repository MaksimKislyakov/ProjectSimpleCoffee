import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Authorization from "./components/Authorization.tsx";
import ProfilePage from "./components/Profile.tsx";
import "./styles/App.css";
import "./styles/authorization.css";
import "./styles/fonts.css";

function App() {
  const token = localStorage.getItem("token");

  return (
    <Router>
      <Routes>
        {/* Авторизация */}
        <Route
          path="/"
          element={
            token ? <Navigate to="/profile" replace /> : <Authorization />
          }
        />

        {/* Профиль — только при наличии токена */}
        <Route
          path="/profile"
          element={
            token ? <ProfilePage /> : <Navigate to="/" replace />
          }
        />

        {/* Редирект всех неизвестных маршрутов */}
        <Route
          path="*"
          element={<Navigate to={token ? "/profile" : "/"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;