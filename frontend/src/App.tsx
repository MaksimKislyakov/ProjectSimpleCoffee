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
        {/* Страница авторизации */}
        <Route path="/" element={<Authorization />} />

        {/* Страница профиля — доступна только при наличии токена */}
        <Route
          path="/profile" 
          element={<ProfilePage />} // Убрал проверку токена для тестирования
        />
      </Routes>
    </Router>
  );
}

export default App;