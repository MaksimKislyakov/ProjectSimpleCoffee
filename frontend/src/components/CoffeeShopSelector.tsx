import React, { useState, useEffect, useRef } from "react";
import "../styles/coffeeShopSelector.css";

interface CoffeeShop {
  id: number;
  adress: string;
}

interface CoffeeShopSelectorProps {
  selectedShopId: number | null;
  onShopChange: (shopId: number) => void;
  roleId: number;
  coffeeShops?: CoffeeShop[]; // Опциональный проп для передачи уже загруженных филиалов
}

const CoffeeShopSelector: React.FC<CoffeeShopSelectorProps> = ({
  selectedShopId,
  onShopChange,
  roleId,
  coffeeShops: externalCoffeeShops,
}) => {
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<CoffeeShop | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Используем переданные филиалы или загружаем их
  useEffect(() => {
    // Показываем только для ролей 1 и 2
    if (roleId !== 1 && roleId !== 2) {
      return;
    }

    // Если филиалы переданы извне, используем их
    if (externalCoffeeShops && externalCoffeeShops.length > 0) {
      setCoffeeShops(externalCoffeeShops);
      
      // Устанавливаем выбранный филиал
      if (selectedShopId) {
        const shop = externalCoffeeShops.find((s: CoffeeShop) => s.id === selectedShopId);
        if (shop) {
          setSelectedShop(shop);
        }
      } else if (externalCoffeeShops.length > 0) {
        // Если нет выбранного филиала, проверяем localStorage
        const saved = localStorage.getItem("selectedCoffeeShopId");
        if (saved) {
          const savedId = parseInt(saved, 10);
          const shop = externalCoffeeShops.find((s: CoffeeShop) => s.id === savedId);
          if (shop) {
            setSelectedShop(shop);
          }
        }
      }
      return;
    }

    // Если филиалы не переданы, загружаем их
    const fetchCoffeeShops = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:8000/api/v1/coffee_shop/get_coffee_shops", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const shops = Array.isArray(data) ? data : [];
          setCoffeeShops(shops);
          
          // Устанавливаем выбранный филиал
          if (selectedShopId && shops.length > 0) {
            const shop = shops.find((s: CoffeeShop) => s.id === selectedShopId);
            if (shop) {
              setSelectedShop(shop);
            } else if (shops.length > 0 && !selectedShopId) {
              // Если выбранный филиал не найден и нет сохраненного, выбираем первый
              setSelectedShop(shops[0]);
              onShopChange(shops[0].id);
            }
          } else if (shops.length > 0 && !selectedShopId) {
            // Если нет выбранного филиала, выбираем первый только если нет сохраненного
            const saved = localStorage.getItem("selectedCoffeeShopId");
            if (!saved) {
              setSelectedShop(shops[0]);
              onShopChange(shops[0].id);
            }
          }
        }
      } catch (e) {
      }
    };

    fetchCoffeeShops();
  }, [selectedShopId, roleId, onShopChange, externalCoffeeShops]);

  // Обновляем выбранный филиал при изменении selectedShopId без перезагрузки данных
  useEffect(() => {
    if (coffeeShops.length > 0 && selectedShopId) {
      const shop = coffeeShops.find((s: CoffeeShop) => s.id === selectedShopId);
      if (shop) {
        setSelectedShop(shop);
      }
    }
  }, [selectedShopId, coffeeShops]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleShopSelect = (shop: CoffeeShop) => {
    setSelectedShop(shop);
    onShopChange(shop.id);
    setIsOpen(false);
  };

  // Показываем только для ролей 1 и 2
  if (roleId !== 1 && roleId !== 2) {
    return null;
  }

  if (coffeeShops.length === 0) {
    return null;
  }

  return (
    <div className="coffee-shop-selector">
      <button
        ref={buttonRef}
        className="coffee-shop-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="coffee-shop-selector-text">
          {selectedShop ? selectedShop.adress : "Выберите филиал"}
        </span>
        <svg
          className={`coffee-shop-selector-arrow ${isOpen ? "open" : ""}`}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 1L6 6L11 1"
            stroke="#3F3932"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && (
        <div ref={dropdownRef} className="coffee-shop-selector-dropdown">
          {coffeeShops.map((shop) => (
            <div
              key={shop.id}
              className={`coffee-shop-selector-item ${
                selectedShop?.id === shop.id ? "selected" : ""
              }`}
              onClick={() => handleShopSelect(shop)}
            >
              {shop.adress}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoffeeShopSelector;

