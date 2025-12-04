import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../styles/createUserModal.css";

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
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    patronymic: "",
    email: "",
    telephone: "",
    role_id: 3,
    coffee_shop_id: coffeeShops.length > 0 ? coffeeShops[0].id : (null as any),
    hourly_rate: "",
    assessment_rate: 0,
    work_experience: 0,
    hashed_password: "",
    data_work_start: new Date().toISOString().split('T')[0]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      // Сброс формы при открытии
      setFormData({
        first_name: "",
        last_name: "",
        patronymic: "",
        email: "",
        telephone: "",
        role_id: 3,
        coffee_shop_id: coffeeShops.length > 0 ? coffeeShops[0].id : (null as any),
        hourly_rate: "",
        assessment_rate: 0,
        work_experience: 0,
        hashed_password: "",
        data_work_start: new Date().toISOString().split('T')[0]
      });
    }
  }, [isOpen, coffeeShops]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "role_id" || name === "coffee_shop_id" || name === "assessment_rate" || name === "work_experience"
        ? parseInt(value) || 0
        : value
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.first_name.trim()) {
      setError("Имя обязательно для заполнения");
      return false;
    }
    if (!formData.last_name.trim()) {
      setError("Фамилия обязательна для заполнения");
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
      // Форматируем данные для отправки на бэкенд
      const userData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        patronymic: formData.patronymic.trim() || null,
        email: formData.email.trim(),
        telephone: formData.telephone.trim(),
        role_id: formData.role_id,
        coffee_shop_id: Number(formData.coffee_shop_id),
        hourly_rate: formData.hourly_rate || "", // Оставляем как строку или пустую строку
        assessment_rate: formData.assessment_rate || 0,
        work_experience: formData.work_experience || 0,
        hashed_password: formData.hashed_password,
        data_work_start: formData.data_work_start // Оставляем как есть, форматирование будет в WorkSchedulePage
      };

      await onCreate(userData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Ошибка при создании пользователя");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div
      className="create-user-modal-overlay"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={modalRef}
        className="create-user-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="create-user-modal-header">
          <h2>Создать пользователя</h2>
          <button className="create-user-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="create-user-form">
          <div className="create-user-form-row">
            <div className="create-user-form-group">
              <label>Имя *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="create-user-form-group">
              <label>Фамилия *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="create-user-form-row">
            <div className="create-user-form-group">
              <label>Отчество</label>
              <input
                type="text"
                name="patronymic"
                value={formData.patronymic}
                onChange={handleChange}
              />
            </div>

            <div className="create-user-form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="create-user-form-row">
            <div className="create-user-form-group">
              <label>Телефон *</label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="+79991234567"
                required
              />
            </div>

            <div className="create-user-form-group">
              <label>Пароль *</label>
              <input
                type="password"
                name="hashed_password"
                value={formData.hashed_password}
                onChange={handleChange}
                required
                minLength={4}
              />
            </div>
          </div>

          <div className="create-user-form-row">
            <div className="create-user-form-group">
              <label>Роль *</label>
              <select
                name="role_id"
                value={formData.role_id}
                onChange={handleChange}
                required
              >
                <option value={1}>Администратор</option>
                <option value={2}>Менеджер</option>
                <option value={3}>Бариста</option>
              </select>
            </div>

            <div className="create-user-form-group">
              <label>Кофейня *</label>
              {coffeeShops.length > 0 ? (
                <select
                  name="coffee_shop_id"
                  value={formData.coffee_shop_id}
                  onChange={handleChange}
                  required
                >
                  {coffeeShops.map(shop => (
                    <option key={shop.id} value={shop.id}>
                      Кофейня #{shop.id} {shop.adress ? `(${shop.adress})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  name="coffee_shop_id"
                  value={formData.coffee_shop_id || ""}
                  onChange={handleChange}
                  placeholder="ID кофейни"
                  required
                />
              )}
            </div>
          </div>

          <div className="create-user-form-row">
            <div className="create-user-form-group">
              <label>Почасовая ставка</label>
              <input
                type="number"
                name="hourly_rate"
                value={formData.hourly_rate}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>

            <div className="create-user-form-group">
              <label>Дата начала работы</label>
              <input
                type="date"
                name="data_work_start"
                value={formData.data_work_start}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="create-user-form-row">
            <div className="create-user-form-group">
              <label>Оценка</label>
              <input
                type="number"
                name="assessment_rate"
                value={formData.assessment_rate}
                onChange={handleChange}
                min="0"
                max="5"
              />
            </div>

            <div className="create-user-form-group">
              <label>Опыт работы (месяцы)</label>
              <input
                type="number"
                name="work_experience"
                value={formData.work_experience}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          {error && <div className="create-user-error">{error}</div>}

          <div className="create-user-modal-actions">
            <button
              type="button"
              className="create-user-cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Отменить
            </button>
            <button
              type="submit"
              className="create-user-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? "Создание..." : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CreateUserModal;

