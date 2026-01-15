import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../styles/createUserModal.css";
import * as Icons from "../icons/index.ts";
import { useToastContext } from "../contexts/ToastContext.tsx";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (userData: any) => Promise<void>;
  coffeeShops: any[];
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  coffeeShops
}) => {
  const { showToast } = useToastContext();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    telephone: "",
    role_id: 3,
    coffee_shop_id: coffeeShops.length > 0 ? coffeeShops[0].id : (null as any),
    hourly_rate: "",
    hashed_password: "",
    data_work_start: new Date().toISOString().split('T')[0]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setFormData({
        fullName: "",
        email: "",
        telephone: "",
        role_id: 3,
        coffee_shop_id: coffeeShops.length > 0 ? coffeeShops[0].id : (null as any),
        hourly_rate: "",
        hashed_password: "",
        data_work_start: new Date().toISOString().split('T')[0]
      });
    }
  }, [isOpen, coffeeShops]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const getRoleText = (roleId: number): string => {
    switch (roleId) {
      case 1:
        return "Администратор";
      case 2:
        return "Управляющий";
      case 3:
        return "Бариста";
      default:
        return "Бариста";
    }
  };

  const parseFullName = (fullName: string): { first_name: string; last_name: string; patronymic: string | null } => {
    const parts = fullName.trim().split(/\s+/).filter(part => part.length > 0);
    
    if (parts.length === 0) {
      return { first_name: "", last_name: "", patronymic: null };
    }
    
    if (parts.length === 1) {
      return { first_name: parts[0], last_name: "", patronymic: null };
    }
    
    if (parts.length === 2) {
      return { first_name: parts[1], last_name: parts[0], patronymic: null };
    }
    
    // Если 3 и более слов: первое - фамилия, второе - имя, остальное - отчество
    return {
      first_name: parts[1],
      last_name: parts[0],
      patronymic: parts.slice(2).join(" ") || null
    };
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      setError("ФИО обязательно для заполнения");
      return false;
    }
    
    const nameParts = parseFullName(formData.fullName);
    if (!nameParts.first_name || !nameParts.last_name) {
      setError("Введите фамилию и имя");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email обязателен для заполнения");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Некорректный формат email");
      return false;
    }
    if (!formData.telephone.trim()) {
      setError("Телефон обязателен для заполнения");
      return false;
    }
    if (!/^\+?\d{10,15}$/.test(formData.telephone.replace(/\s/g, ""))) {
      setError("Некорректный формат телефона");
      return false;
    }
    if (!formData.hashed_password || formData.hashed_password.length < 4) {
      setError("Пароль должен содержать минимум 4 символа");
      return false;
    }
    if (!formData.role_id || (formData.role_id < 1 || formData.role_id > 3)) {
      setError("Выберите корректную роль");
      return false;
    }
    if (!formData.coffee_shop_id) {
      setError("Выберите кофейню");
      return false;
    }
    if (!formData.data_work_start) {
      setError("Дата начала работы обязательна для заполнения");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const coffeeShopId = Number(formData.coffee_shop_id);
      if (isNaN(coffeeShopId) || coffeeShopId === 0) {
        setError("Выберите кофейню");
        setIsLoading(false);
        return;
      }

      const nameParts = parseFullName(formData.fullName);
      
      const userData = {
        first_name: nameParts.first_name,
        last_name: nameParts.last_name,
        patronymic: nameParts.patronymic,
        email: formData.email.trim(),
        telephone: formData.telephone.trim(),
        role_id: formData.role_id,
        coffee_shop_id: coffeeShopId,
        hourly_rate: formData.hourly_rate || "0",
        assessment_rate: 0,
        work_experience: 0,
        hashed_password: formData.hashed_password,
        data_work_start: formData.data_work_start
      };

      await onCreate(userData);
      onClose();
      showToast("Пользователь успешно создан!", "success");
    } catch (err: any) {
      const errorMessage = err.message || "Ошибка при создании пользователя";
      setError(errorMessage);
      showToast(errorMessage, "error");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="employee-info-modal-overlay" onClick={onClose}>
      <div
        className="employee-info-modal"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <div className="employee-info-header">
          <div className="employee-photo-placeholder"></div>
          <div className="employee-contacts-section">
            <h2 className="contacts-title">Контакты</h2>
            <div className="contact-item">
              <input
                type="tel"
                placeholder="Телефон"
                value={formData.telephone}
                onChange={(e) => {
                  setFormData({ ...formData, telephone: e.target.value });
                  setError(null);
                }}
                className="create-user-input"
                required
              />
            </div>
            <div className="contact-item">
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setError(null);
                }}
                className="create-user-input"
                required
              />
            </div>
            <div className="contact-item">
              <input
                type="password"
                placeholder="Пароль"
                value={formData.hashed_password}
                onChange={(e) => {
                  setFormData({ ...formData, hashed_password: e.target.value });
                  setError(null);
                }}
                className="create-user-input"
                required
                minLength={4}
              />
            </div>
          </div>
        </div>

        <div className="employee-info-section">
          <h2 className="info-title">Информация о сотруднике</h2>
          
          <div className="info-item">
            <span className="info-label">ФИО:</span>
            <input
              type="text"
              placeholder="Фамилия Имя Отчество"
              value={formData.fullName}
              onChange={(e) => {
                setFormData({ ...formData, fullName: e.target.value });
                setError(null);
              }}
              className="create-user-input"
              required
            />
          </div>

          <div className="info-item">
            <span className="info-label">Должность:</span>
            <select
              value={formData.role_id}
              onChange={(e) => {
                setFormData({ ...formData, role_id: parseInt(e.target.value) });
                setError(null);
              }}
              className="create-user-input"
              required
            >
              <option value={1}>Администратор</option>
              <option value={2}>Управляющий</option>
              <option value={3}>Бариста</option>
            </select>
          </div>

          <div className="info-item">
            <span className="info-label">Начало работы:</span>
            <input
              type="date"
              value={formData.data_work_start}
              onChange={(e) => {
                setFormData({ ...formData, data_work_start: e.target.value });
                setError(null);
              }}
              className="create-user-input"
              required
            />
          </div>

          <div className="info-item">
            <span className="info-label">Ставка в час:</span>
            <div className="edit-field-group">
              <input
                type="number"
                placeholder="0"
                value={formData.hourly_rate}
                onChange={(e) => {
                  setFormData({ ...formData, hourly_rate: e.target.value });
                  setError(null);
                }}
                className="create-user-input"
                step="0.01"
                min="0"
              />
              <span className="currency">руб.</span>
            </div>
          </div>

          <div className="info-item">
            <span className="info-label">Кофейня:</span>
            {coffeeShops.length > 0 ? (
              <select
                value={formData.coffee_shop_id || ""}
                onChange={(e) => {
                  setFormData({ ...formData, coffee_shop_id: parseInt(e.target.value) });
                  setError(null);
                }}
                className="create-user-input"
                required
              >
                {coffeeShops.map(shop => (
                  <option key={shop.id} value={shop.id}>
                    {shop.adress || `Кофейня #${shop.id}`}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                placeholder="ID кофейни"
                value={formData.coffee_shop_id || ""}
                onChange={(e) => {
                  setFormData({ ...formData, coffee_shop_id: parseInt(e.target.value) });
                  setError(null);
                }}
                className="create-user-input"
                required
              />
            )}
          </div>
        </div>

        {error && <div className="create-user-error">{error}</div>}

        <div className="employee-info-footer">
          <button
            type="button"
            className="create-user-cancel-btn"
            onClick={onClose}
            disabled={isLoading}
          >
            Отменить
          </button>
          <button
            type="button"
            className="create-user-submit-btn"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Создание..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreateUserModal;
