import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../styles/employeeInfoModal.css";
import * as Icons from "../icons/index.ts";
import { useToastContext } from "../contexts/ToastContext.tsx";

interface EmployeeInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any | null;
  onDelete?: (userId: number) => Promise<void>;
  onUpdate?: (userId: number, data: any) => Promise<void>;
  coffeeShops?: Array<{ id: number; adress: string }>;
}

const EmployeeInfoModal: React.FC<EmployeeInfoModalProps> = ({
  isOpen,
  onClose,
  employee,
  onDelete,
  onUpdate,
  coffeeShops = [],
}) => {
  const { showToast } = useToastContext();
  const [isEditing, setIsEditing] = useState<{ [key: string]: boolean }>({});
  const [formData, setFormData] = useState<any>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (employee) {
      const fullName = `${employee.last_name || ""} ${employee.first_name || ""} ${employee.patronymic || ""}`.trim();
      setFormData({
        fullName: fullName,
        telephone: employee.telephone || "",
        email: employee.email || "",
        role_id: employee.role_id || 3,
        coffee_shop_id: employee.coffee_shop_id || null,
        data_work_start: employee.data_work_start 
          ? new Date(employee.data_work_start).toISOString().split('T')[0]
          : "",
        hourly_rate: employee.hourly_rate || "",
      });
    }
  }, [employee]);

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

  const handleEdit = (field: string) => {
    setIsEditing({ ...isEditing, [field]: true });
  };

  const handleSave = async (field: string) => {
    if (onUpdate && employee) {
      try {
        // Для coffee_shop_id обрабатываем null значение
        const value = field === "coffee_shop_id" 
          ? (formData[field] === "" || formData[field] === null ? null : formData[field])
          : formData[field];
        
        await onUpdate(employee.id, { [field]: value });
        
        // Обновляем локальное состояние сотрудника
        if (field === "coffee_shop_id") {
          employee.coffee_shop_id = value;
        }
        
        // Закрываем режим редактирования для соответствующего поля
        if (field === "role_id") {
          setIsEditing({ ...isEditing, role: false });
        } else {
          setIsEditing({ ...isEditing, [field]: false });
        }
      } catch (error) {
        console.error("Ошибка обновления:", error);
        showToast("Ошибка при сохранении изменений", "error");
      }
    } else {
      // Закрываем режим редактирования для соответствующего поля
      if (field === "role_id") {
        setIsEditing({ ...isEditing, role: false });
      } else {
        setIsEditing({ ...isEditing, [field]: false });
      }
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

  const handleCancel = (field: string) => {
    if (employee) {
      if (field === "fullName") {
        const fullName = `${employee.last_name || ""} ${employee.first_name || ""} ${employee.patronymic || ""}`.trim();
        setFormData({
          ...formData,
          fullName: fullName,
        });
        setIsEditing({ ...isEditing, fullName: false });
      } else if (field === "role_id") {
        setFormData({ ...formData, role_id: employee.role_id });
        setIsEditing({ ...isEditing, role: false });
      } else if (field === "coffee_shop_id") {
        setFormData({ ...formData, coffee_shop_id: employee.coffee_shop_id || null });
        setIsEditing({ ...isEditing, coffee_shop_id: false });
      } else {
        const originalValue = employee[field];
        setFormData({ ...formData, [field]: originalValue });
        setIsEditing({ ...isEditing, [field]: false });
      }
    } else {
      if (field === "role_id") {
        setIsEditing({ ...isEditing, role: false });
      } else {
        setIsEditing({ ...isEditing, [field]: false });
      }
    }
  };

  const handleDelete = async () => {
    if (!employee || !onDelete) return;
    
    const confirmed = window.confirm("Вы уверены, что хотите удалить учетную запись этого сотрудника?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(employee.id);
      onClose();
      showToast("Учетная запись успешно удалена", "success");
    } catch (error) {
      console.error("Ошибка удаления:", error);
      showToast("Ошибка при удалении учетной записи", "error");
    } finally {
      setIsDeleting(false);
    }
  };

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

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  if (!isOpen || !employee) return null;

  const fullName = `${employee.last_name || ""} ${employee.first_name || ""} ${employee.patronymic || ""}`.trim();

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
              {isEditing.telephone ? (
                <div className="edit-field-group">
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="edit-input"
                    autoFocus
                  />
                  <button
                    className="save-edit-btn"
                    onClick={() => handleSave("telephone")}
                  >
                    ✓
                  </button>
                  <button
                    className="cancel-edit-btn"
                    onClick={() => handleCancel("telephone")}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <span className="contact-value">{employee.telephone || "Не указан"}</span>
                  <Icons.EditIcon
                    className="edit-icon"
                    onClick={() => handleEdit("telephone")}
                  />
                </>
              )}
            </div>
            <div className="contact-item">
              {isEditing.email ? (
                <div className="edit-field-group">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="edit-input"
                    autoFocus
                  />
                  <button
                    className="save-edit-btn"
                    onClick={() => handleSave("email")}
                  >
                    ✓
                  </button>
                  <button
                    className="cancel-edit-btn"
                    onClick={() => handleCancel("email")}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <span className="contact-value">{employee.email || "Не указан"}</span>
                  <Icons.EditIcon
                    className="edit-icon"
                    onClick={() => handleEdit("email")}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="employee-info-section">
          <h2 className="info-title">Информация о сотруднике</h2>
          
          <div className="info-item">
            <span className="info-label">ФИО:</span>
            {isEditing.fullName ? (
              <div className="edit-field-group">
                <input
                  type="text"
                  placeholder="Фамилия Имя Отчество"
                  value={formData.fullName || ""}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="edit-input"
                  autoFocus
                />
                <button
                  className="save-edit-btn"
                  onClick={async () => {
                    if (onUpdate && employee) {
                      try {
                        const nameParts = parseFullName(formData.fullName);
                        await onUpdate(employee.id, {
                          first_name: nameParts.first_name,
                          last_name: nameParts.last_name,
                          patronymic: nameParts.patronymic,
                        });
                        setIsEditing({ ...isEditing, fullName: false });
                        showToast("Данные успешно сохранены", "success");
                      } catch (error) {
                        console.error("Ошибка обновления:", error);
                        showToast("Ошибка при сохранении изменений", "error");
                      }
                    } else {
                      setIsEditing({ ...isEditing, fullName: false });
                    }
                  }}
                >
                  ✓
                </button>
                <button
                  className="cancel-edit-btn"
                  onClick={() => handleCancel("fullName")}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <span className="info-value">{fullName || "Не указано"}</span>
                <Icons.EditIcon
                  className="edit-icon"
                  onClick={() => handleEdit("fullName")}
                />
              </>
            )}
          </div>

          <div className="info-item">
            <span className="info-label">Должность:</span>
            {isEditing.role ? (
              <div className="edit-field-group">
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                  className="edit-input"
                  autoFocus
                >
                  <option value={1}>Администратор</option>
                  <option value={2}>Управляющий</option>
                  <option value={3}>Бариста</option>
                </select>
                <button
                  className="save-edit-btn"
                  onClick={() => handleSave("role_id")}
                >
                  ✓
                </button>
                <button
                  className="cancel-edit-btn"
                  onClick={() => handleCancel("role_id")}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <span className="info-value">{getRoleText(employee.role_id)}</span>
                <Icons.EditIcon
                  className="edit-icon"
                  onClick={() => handleEdit("role")}
                />
              </>
            )}
          </div>

          <div className="info-item">
            <span className="info-label">Начало работы:</span>
            {isEditing.data_work_start ? (
              <div className="edit-field-group">
                <input
                  type="date"
                  value={formData.data_work_start || ""}
                  onChange={(e) => setFormData({ ...formData, data_work_start: e.target.value })}
                  className="edit-input"
                  autoFocus
                />
                <button
                  className="save-edit-btn"
                  onClick={() => handleSave("data_work_start")}
                >
                  ✓
                </button>
                <button
                  className="cancel-edit-btn"
                  onClick={() => handleCancel("data_work_start")}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <span className="info-value">
                  {employee.data_work_start ? formatDate(employee.data_work_start) : "Не указано"}
                </span>
                <Icons.EditIcon
                  className="edit-icon"
                  onClick={() => handleEdit("data_work_start")}
                />
              </>
            )}
          </div>

          <div className="info-item">
            <span className="info-label">Ставка в час:</span>
            {isEditing.hourly_rate ? (
              <div className="edit-field-group">
                <input
                  type="number"
                  value={formData.hourly_rate || ""}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                  className="edit-input"
                  autoFocus
                />
                <span className="currency">руб.</span>
                <button
                  className="save-edit-btn"
                  onClick={() => handleSave("hourly_rate")}
                >
                  ✓
                </button>
                <button
                  className="cancel-edit-btn"
                  onClick={() => handleCancel("hourly_rate")}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <span className="info-value">
                  {employee.hourly_rate ? `${employee.hourly_rate} руб.` : "Не указано"}
                </span>
                <Icons.EditIcon
                  className="edit-icon"
                  onClick={() => handleEdit("hourly_rate")}
                />
              </>
            )}
          </div>

          <div className="info-item">
            <span className="info-label">Филиал:</span>
            {isEditing.coffee_shop_id ? (
              <div className="edit-field-group">
                <select
                  value={formData.coffee_shop_id || ""}
                  onChange={(e) => setFormData({ ...formData, coffee_shop_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="edit-input"
                  autoFocus
                >
                  <option value="">Не выбран</option>
                  {coffeeShops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.adress}
                    </option>
                  ))}
                </select>
                <button
                  className="save-edit-btn"
                  onClick={() => handleSave("coffee_shop_id")}
                >
                  ✓
                </button>
                <button
                  className="cancel-edit-btn"
                  onClick={() => handleCancel("coffee_shop_id")}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <span className="info-value">
                  {employee.coffee_shop_id 
                    ? coffeeShops.find((s) => s.id === employee.coffee_shop_id)?.adress || `Филиал #${employee.coffee_shop_id}`
                    : "Не указано"}
                </span>
                <Icons.EditIcon
                  className="edit-icon"
                  onClick={() => handleEdit("coffee_shop_id")}
                />
              </>
            )}
          </div>
        </div>

        <div className="employee-info-footer">
          <button
            className="delete-account-btn"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Удаление..." : "Удалить учетную запись"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EmployeeInfoModal;

