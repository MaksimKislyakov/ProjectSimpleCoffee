import React, {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import "../styles/authorization.css";
//import fox from "../images/fox.png";
//import { API_URL } from "../Global.tsx";
import * as Icons from "../icons/index.ts";
import "../styles/fonts.css";


const Authorization: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const isValid = username.trim().length > 5 && password.trim().length > 3 && /^\d+$/.test(username.trim());
        setIsFormValid(isValid);
    }, [username, password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(false);
        setError("");
        if (!username.trim() || !password.trim()) {
            setError("Пожалуйста заполните все поля");
            return;
        }
        
        try {
            const response = await fetch('http://localhost:8000/api/v1/auth/login', {
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

            // Получаем информацию о пользователе, чтобы узнать role_id
            try {
                const meRes = await fetch(`http://localhost:8000/api/v1/user/me`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${data.access_token}`,
                    },
                });

                if (!meRes.ok) {
                    throw new Error("Не удалось получить информацию о пользователе");
                }

                const user = await meRes.json();
                localStorage.setItem("role_id", String(user.role_id));
                localStorage.setItem("user_id", String(user.id));

                setSuccess(true);
                setTimeout(() => {
                    // Всех сначала перенаправляем на профиль; роль оставляем в localStorage
                    navigate("/profile");
                }, 300);

                setTimeout(() => setSuccess(false), 2000);
            } catch (err2: any) {
                // Если не удалось получить /me — всё равно сохранить токен и показать ошибку
                setError(err2.message || "Ошибка при получении данных пользователя");
                setSuccess(false);
            }

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
                        className={`login-input ${username ? "filled" : ""}`}
                    /> 
                     {/* Поле с глазом */}
                    <div className="password-wrapper">
                        <input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`login-input ${password ? "filled" : ""}`}
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                        >
                            {showPassword ? (
                                // SVG "глаз с перечёркиванием"
                                <Icons.EyeClosedIcon title="eye-closed" />

                            ) : (
                                // SVG "открытый глаз"
                                <Icons.EyeOpenIcon title="eye-open" />
                            )}
                        </button>
                    </div>
                    {error && <div className="login-error">{error}</div>}
                    {<button 
                        type="submit"
                        disabled={!isFormValid} 
                        className={`login-button ${isFormValid ? "active" : ""}`}>
                            Войти
                        </button>
                    }
                </form>
            </div>
            <img className="auth-img" src="/foxx.png" alt="маскот" />
        </div>
    );
};

export default Authorization;