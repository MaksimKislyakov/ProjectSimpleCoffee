import React, { useState } from "react";
import "../styles/bonusFineFormModal.css";

interface BonusFineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, reason: string) => Promise<void>;
  type: "bonus" | "fine";
  employeeName: string;
}

const BonusFineFormModal: React.FC<BonusFineFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  type,
  employeeName,
}) => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Введите корректную сумму");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(numAmount, reason);
      setAmount("");
      setReason("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Ошибка при назначении");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setAmount("");
    setReason("");
    setError(null);
    onClose();
  };

  return (
    <div className="bonus-fine-form-overlay" onClick={handleCancel}>
      <div className="bonus-fine-form-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="bonus-fine-form-title">
          {type === "bonus" ? "Премия" : "Штраф"}
        </h2>
        
        <p className="bonus-fine-form-employee-name">{employeeName}</p>

        <div className="bonus-fine-form-content">
          <div className="bonus-fine-form-input-group">
            <label>
              {type === "bonus" ? "Сумма премии:" : "Сумма штрафа:"}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              className="bonus-fine-form-input"
            />
          </div>

          <div className="bonus-fine-form-input-group">
            <label>Причина:</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              placeholder="Введите причину (необязательно)"
              className="bonus-fine-form-input"
            />
          </div>

          {error && <div className="bonus-fine-form-error">{error}</div>}
        </div>

        <div className="bonus-fine-form-actions">
          <button
            className="bonus-fine-form-cancel-btn"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Отменить
          </button>
          <button
            className="bonus-fine-form-save-btn"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default BonusFineFormModal;

