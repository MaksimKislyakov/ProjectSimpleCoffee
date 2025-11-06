import React, {useState} from "react";
import "../styles/authorization.css";
//import fox from "../images/fox.png";
//import { API_URL } from "../Global.tsx";

const Authorization: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(false);
        setError("");
        if (!username.trim() || !password.trim()) {
            setError("Пожалуйста заполните все поля");
            return;
        }
        
        try {
            const response = await fetch(`/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: Number(username), 
                    password}),
            })
            if (!response.ok) {
                throw new Error("Неверный логин или пароль");
            }

            const data = await response.json();
            // Сохранение токена в localStorage
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("token_type", data.token_type);
            
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);

            console.log("Авторизация успешна:", data.access_token);
        } catch (err: any) {
            setError(err.message || "Ошибка при авторизации");
        }
        
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <h2 className="auth-title">Авторизация</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <input 
                        type="text"
                        placeholder="Логин"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="login-input"
                    /> 
                    <input 
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="login-input"
                    />
                    {error && <div className="login-error">{error}</div>}
                    <button type="submit" className="login-button">
                        Войти
                    </button>
                    {success && <div className="login-success">Успешная авторизация!</div>}
                </form>
            </div>
            <img className="auth-img" src="/fox.png" alt="маскот" />
        </div>
    );
};

export default Authorization;