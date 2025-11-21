import React from "react";

const NavBar: React.FC = () => {
  return (
    <div className="navbar">
      <div className="navbar-left">
        <button className="nav-btn">График работы</button>
        <button className="nav-btn">Отчёт</button>
        <button className="nav-btn active">Профиль</button>
      </div>
      <div className="navbar-right">
        <select className="nav-select">
          <option>ул. Улица, д. 1</option>
          <option>пр. Победы, д. 15</option>
        </select>
      </div>
    </div>
  );
};

export default NavBar;
