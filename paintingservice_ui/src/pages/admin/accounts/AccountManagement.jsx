import { useState } from "react";
import EmployeeManagement from "../employees/EmployeeManagement";
import CustomerManagement from "../customers/CustomerManagement";

export default function AccountManagement() {
  const [tab, setTab] = useState("employees");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Quản lý tài khoản</h1>
        <p className="text-sm text-slate-500 mt-1">
          CRUD tài khoản nhân viên, khách hàng và phân quyền
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <TabButton
          active={tab === "employees"}
          onClick={() => setTab("employees")}
          label="Nhân viên"
        />
        <TabButton
          active={tab === "customers"}
          onClick={() => setTab("customers")}
          label="Khách hàng"
        />
      </div>

      {tab === "employees" ? <EmployeeManagement /> : <CustomerManagement />}
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
        active
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}
