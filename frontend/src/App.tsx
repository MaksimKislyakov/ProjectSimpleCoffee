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
        <Route path="/" element={<ProfilePage />} />

        {/* Страница профиля — доступна только при наличии токена */}
        
        {/* ИЗМЕНИТЬ */}
        <Route
          path="/profile" 
          element={/*token ? */ <ProfilePage /> /*: <Navigate to="/" />*/}
        />
      </Routes>
    </Router>
  );
}

export default App;
