import React, {useState} from "react";
import "../styles/authorization.css";
//import fox from "../images/fox.png";
//import { API_URL } from "../Global.tsx";

const Authorization: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
                    telephone: Number(username),
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
                     {/* Поле с глазом */}
                    <div className="password-wrapper">
                        <input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login-input"
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                        >
                            {showPassword ? (
                                // SVG "глаз с перечёркиванием"
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M2 4.27 3.28 3 21 20.72 19.73 22l-2.63-2.63A11.69 11.69 0 0 1 12 19.5c-5 0-9.27-3.11-11-7.5a11.5 11.5 0 0 1 4.58-5.34L2 4.27zM12 6.5c5 0 9.27 3.11 11 7.5a11.46 11.46 0 0 1-3.93 4.56L17 16.48A8.94 8.94 0 0 0 21 14c-1.73-4.39-6-7.5-11-7.5a8.94 8.94 0 0 0-2.89.48L9.76 7A11.52 11.52 0 0 1 12 6.5z"/>
                                </svg>

                            ) : (
                                // SVG "открытый глаз"
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22">
                                    <path fill="currentColor" d="M12 4.5c4.97 0 9.16 3.11 11 7.5-1.84 4.39-6.03 7.5-11 7.5-4.97 0-9.16-3.11-11-7.5 1.84-4.39 6.03-7.5 11-7.5m0-1.5C6.48 3 1.73 6.61 0 12c1.73 5.39 6.48 9 12 9 5.52 0 10.27-3.61 12-9-1.73-5.39-6.48-9-12-9zm0 4.5a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 1 0-9z"/>
                                </svg>
                            )}
                        </button>
                    </div>
                    {error && <div className="login-error">{error}</div>}
                    <button type="submit" className="login-button">
                        Войти
                    </button>
                    {success && <div className="login-success">Успешная авторизация!</div>}
                </form>
            </div>
            <img className="auth-img" src="/foxx.png" alt="маскот" />
        </div>
    );
};

export default Authorization;