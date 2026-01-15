import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../styles/createCoffeeShopModal.css";
import * as Icons from "../icons/index.ts";

interface CreateCoffeeShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (coffeeShopData: { adress: string }) => Promise<void>;
}

const CreateCoffeeShopModal: React.FC<CreateCoffeeShopModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [formData, setFormData] = useState({
    adress: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      // Сброс формы при открытии
      setFormData({
        adress: "",
      });
    }
  }, [isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.adress.trim()) {
      setError("Адрес кофейни обязателен");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Отправляем только адрес, так как бэкенд не поддерживает остальные поля
      await onCreate({
        adress: formData.adress.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Ошибка при создании кофейни");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="create-coffee-shop-modal-overlay" onClick={onClose}>
      <div
        className="create-coffee-shop-modal"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <div className="create-coffee-shop-modal-header">
          <h2>Информация о филиале</h2>
          <div className="coffee-shop-icon-wrapper">
            <Icons.BriefcaseIcon className="coffee-shop-icon" />
          </div>
        </div>

        <form className="create-coffee-shop-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Адрес</label>
            <input
              type="text"
              value={formData.adress}
              onChange={(e) =>
                setFormData({ ...formData, adress: e.target.value })
              }
              placeholder="Адрес"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Отменить
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={isLoading}
            >
              {isLoading ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateCoffeeShopModal;

