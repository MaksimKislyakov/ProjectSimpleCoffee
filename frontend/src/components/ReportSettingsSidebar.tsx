import React, { useState, useRef, useEffect } from "react";
import CreateUserModal from "./CreateUserModal.tsx";
import CreateCoffeeShopModal from "./CreateCoffeeShopModal.tsx";
import "../styles/reportPage.css";
import { useToastContext } from "../contexts/ToastContext.tsx";

interface ReportSettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  coffeeShops: any[];
  users: any[];
  token: string;
  onUserCreated?: () => void;
  onCoffeeShopCreated?: () => void;
}

const ReportSettingsSidebar: React.FC<ReportSettingsSidebarProps> = ({
  isOpen,
  onClose,
  coffeeShops,
  users,
  token,
  onUserCreated,
  onCoffeeShopCreated,
}) => {
  const { showToast } = useToastContext();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateCoffeeShopModal, setShowCreateCoffeeShopModal] = useState(false);

  // Refs для обработки свайпа
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);

  const handleCreateUser = async (userData: any) => {
    try {
      // Форматируем данные для отправки на бэкенд
      // Pydantic принимает hourly_rate как строку или число, конвертирует в Decimal
      // Если hourly_rate пустое, не отправляем поле вообще (или отправляем undefined)
      
      // Форматируем дату для бэкенда
      // Pydantic принимает ISO формат без временной зоны: YYYY-MM-DDTHH:mm:ss
      let formattedDate = userData.data_work_start;
      if (formattedDate) {
        try {
          // Если дата в формате YYYY-MM-DD, добавляем время 00:00:00
          if (typeof formattedDate === 'string' && formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = `${formattedDate}T00:00:00`;
          } else {
            // Если дата уже в ISO формате, убираем временную зону и миллисекунды
            const dateObj = new Date(formattedDate);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            const seconds = String(dateObj.getSeconds()).padStart(2, '0');
            formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
          }
        } catch (e) {
          throw new Error("Неверный формат даты начала работы");
        }
      }
      
      const formattedData: any = {
        first_name: userData.first_name.trim(),
        last_name: userData.last_name.trim(),
        patronymic: userData.patronymic ? userData.patronymic.trim() : null,
        email: userData.email.trim(),
        telephone: userData.telephone.trim(),
        role_id: Number(userData.role_id),
        coffee_shop_id: Number(userData.coffee_shop_id),
        assessment_rate: Number(userData.assessment_rate) || 0,
        work_experience: Number(userData.work_experience) || 0,
        hashed_password: userData.hashed_password,
        data_work_start: formattedDate
      };

      // Обрабатываем hourly_rate: если пустое, отправляем "0" по умолчанию
      // Это предотвращает ошибку при сериализации на бэкенде
      if (userData.hourly_rate !== null && userData.hourly_rate !== undefined && userData.hourly_rate !== "") {
        const hourlyRateValue = typeof userData.hourly_rate === 'string' 
          ? userData.hourly_rate.trim()
          : String(userData.hourly_rate);
        if (hourlyRateValue !== "") {
          formattedData.hourly_rate = hourlyRateValue;
        } else {
          formattedData.hourly_rate = "0";
        }
      } else {
        formattedData.hourly_rate = "0";
      }

      // Логируем данные перед отправкой для отладки
      
      const response = await fetch("http://localhost:8000/api/v1/user/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (e) {
          // Если не удалось распарсить JSON, используем текст ответа
          const text = await response.text().catch(() => '');
          errorData = { detail: text || `Ошибка ${response.status}` };
        }
        
        // Обрабатываем детали ошибки валидации
        let errorMessage = `Ошибка ${response.status}`;
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Pydantic validation errors
            errorMessage = errorData.detail.map((err: any) => {
              const field = err.loc?.slice(1).join('.') || 'unknown';
              return `${field}: ${err.msg}`;
            }).join(', ');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        throw new Error(errorMessage);
      }

      setShowCreateUserModal(false);
      if (onUserCreated) {
        onUserCreated();
      }
      showToast("Пользователь успешно создан!", "success");
    } catch (error: any) {
      throw new Error(error.message || "Ошибка при создании пользователя");
    }
  };

  const handleCreateCoffeeShop = async (coffeeShopData: { adress: string }) => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/coffee_shop/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adress: coffeeShopData.adress,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Ошибка при создании кофейни");
      }

      setShowCreateCoffeeShopModal(false);
      if (onCoffeeShopCreated) {
        onCoffeeShopCreated();
      }
      showToast("Кофейня успешно добавлена!", "success");
    } catch (error: any) {
      throw error;
    }
  };

  const handleCancel = () => {
    setShowCreateUserModal(false);
    setShowCreateCoffeeShopModal(false);
    onClose();
  };

  const handleSave = () => {
    onClose();
  };

  // Обработчики для свайпа вниз
  useEffect(() => {
    if (!isOpen || !sidebarRef.current) return;

    const sidebar = sidebarRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const sidebarTop = sidebar.getBoundingClientRect().top;
      const relativeY = touchY - sidebarTop;

      if (relativeY <= 80) {
        touchStartY.current = e.touches[0].clientY;
        touchStartTime.current = Date.now();
        e.stopPropagation();
      } else {
        touchStartY.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!sidebar || touchStartY.current === 0) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchStartY.current;

      if (deltaY > 0) {
        e.preventDefault();
        sidebar.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!sidebar || touchStartY.current === 0) return;

      const currentY = e.changedTouches[0].clientY;
      const deltaY = currentY - touchStartY.current;
      const deltaTime = Date.now() - touchStartTime.current;
      const velocity = deltaY / deltaTime;

      const threshold = 100;
      const minVelocity = 0.3;

      if (deltaY > threshold || (deltaY > 50 && velocity > minVelocity)) {
        sidebar.style.transition = "transform 0.3s ease-out";
        sidebar.style.transform = "translateY(100%)";
        setTimeout(() => {
          onClose();
        }, 300);
      } else {
        sidebar.style.transition = "transform 0.2s ease-out";
        sidebar.style.transform = "translateY(0)";
        setTimeout(() => {
          if (sidebar) {
            sidebar.style.transition = "";
          }
        }, 200);
      }

      touchStartY.current = 0;
    };

    sidebar.addEventListener("touchstart", handleTouchStart, { passive: false });
    sidebar.addEventListener("touchmove", handleTouchMove, { passive: false });
    sidebar.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      sidebar.removeEventListener("touchstart", handleTouchStart);
      sidebar.removeEventListener("touchmove", handleTouchMove);
      sidebar.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="sidebar-overlay" onClick={handleCancel} />
      <div className="schedule-settings-sidebar" ref={sidebarRef}>
        <div className="sidebar-drag-handle" />
        <h2 className="sidebar-title">Настройки</h2>

        <div className="settings-dynamic">
          {/* Кнопка добавления учетной записи */}
          <div className="settings-section">
            <button
              className="add-button add-user-button"
              onClick={() => setShowCreateUserModal(true)}
            >
              Добавить учетную запись
            </button>
          </div>

          {/* Кнопка добавления кофейни */}
          <div className="settings-section">
            <button
              className="add-button add-coffee-shop-button"
              onClick={() => setShowCreateCoffeeShopModal(true)}
            >
              Добавить кофейню
            </button>
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="sidebar-actions">
          <button className="cancel-button" onClick={handleCancel}>
            Отменить
          </button>
          <button className="save-button" onClick={handleSave}>
            Сохранить
          </button>
        </div>
      </div>

      {/* Modal для создания пользователя */}
      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onCreate={handleCreateUser}
        coffeeShops={coffeeShops}
      />

      {/* Modal для создания кофейни */}
      <CreateCoffeeShopModal
        isOpen={showCreateCoffeeShopModal}
        onClose={() => setShowCreateCoffeeShopModal(false)}
        onCreate={handleCreateCoffeeShop}
      />
    </>
  );
};

export default ReportSettingsSidebar;
