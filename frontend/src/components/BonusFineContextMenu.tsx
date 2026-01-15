import React, { useRef, useEffect } from "react";
import "../styles/bonusFineContextMenu.css";

interface BonusFineContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: "bonus" | "fine") => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

const BonusFineContextMenu: React.FC<BonusFineContextMenuProps> = ({
  isOpen,
  onClose,
  onSelect,
  buttonRef,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !buttonRef.current || !menuRef.current) return;

    const button = buttonRef.current;
    const menu = menuRef.current;
    const rect = button.getBoundingClientRect();

    // Позиционируем меню справа от кнопки
    menu.style.top = `${rect.top}px`;
    menu.style.left = `${rect.right + 8}px`;

    // Обработчик клика вне меню
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !button.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, buttonRef, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={menuRef} className="bonus-fine-context-menu">
      <button
        className="context-menu-item"
        onClick={() => {
          onSelect("fine");
          onClose();
        }}
      >
        Назначить штраф
      </button>
      <div className="context-menu-divider"></div>
      <button
        className="context-menu-item"
        onClick={() => {
          onSelect("bonus");
          onClose();
        }}
      >
        Назначить премию
      </button>
    </div>
  );
};

export default BonusFineContextMenu;

