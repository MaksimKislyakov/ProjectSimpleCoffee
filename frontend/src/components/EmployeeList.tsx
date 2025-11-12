import React from "react";

const employees = [
  { name: "Иванов Иван", position: "Бариста" },
  { name: "Петров Петр", position: "Бариста" },
  { name: "Сидорова Анна", position: "Менеджер" },
];

const EmployeeList: React.FC = () => {
  return (
    <aside className="employee-list">
      {employees.map((emp, i) => (
        <div key={i} className="employee-card">
          <div className="employee-name">{emp.name}</div>
          <div className="employee-position">{emp.position}</div>
        </div>
      ))}
    </aside>
  );
};

export default EmployeeList;
