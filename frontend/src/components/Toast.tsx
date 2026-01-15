import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/toast.css";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
      }, 300); // Время анимации исчезновения
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return createPortal(
    <div className={`toast toast-${type} ${isClosing ? "toast-closing" : ""}`}>
      <div className="toast-content">
        <span className="toast-message">{message}</span>
      </div>
    </div>,
    document.body
  );
};

export default Toast;
