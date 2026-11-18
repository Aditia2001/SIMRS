import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  Activity,
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardList,
  Stethoscope,
  Pill,
  FlaskConical,
  Receipt,
  LogOut,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { canAccess } from "../config/permissions";

const menus = [
  {
    label: "Dashboard",
    path: "/dashboard",
    module: "dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Pasien",
    path: "/patients",
    module: "patients",
    icon: Users,
  },
  {
    label: "Kunjungan & Antrean",
    path: "/visits",
    module: "visits",
    icon: CalendarDays,
  },
  {
    label: "Rekam Medis",
    path: "/medical-records",
    module: "medicalRecords",
    icon: ClipboardList,
  },
  {
    label: "Tindakan Medis",
    path: "/medical-actions",
    module: "medicalActions",
    icon: Stethoscope,
  },
  {
    label: "Farmasi",
    path: "/pharmacy",
    module: "pharmacy",
    icon: Pill,
  },
  {
    label: "Laboratorium",
    path: "/laboratory",
    module: "laboratory",
    icon: FlaskConical,
  },
  {
    label: "Keuangan",
    path: "/finance",
    module: "finance",
    icon: Receipt,
  },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleMenus = menus.filter((menu) => canAccess(user, menu.module));

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 shrink-0 bg-slate-900 text-white flex flex-col">
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-700">
          <Activity className="text-blue-400" size={30} />

          <div>
            <h1 className="font-bold text-xl">SIMRS</h1>
            <p className="text-xs text-slate-400">Hospital Management</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {visibleMenus.map((menu) => {
            const Icon = menu.icon;

            return (
              <NavLink
                key={menu.path}
                to={menu.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`
                }
              >
                <Icon size={19} />
                {menu.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-300 hover:bg-slate-800 rounded-lg"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="h-20 bg-white border-b flex items-center justify-between px-8">
          <div>
            <h2 className="font-semibold text-slate-800">
              Sistem Informasi Manajemen Rumah Sakit
            </h2>
            <p className="text-sm text-slate-500">SIMRS Administration Panel</p>
          </div>

          <div className="text-right">
            <p className="font-semibold text-sm">
              {user?.full_name || user?.username}
            </p>

            <p className="text-xs text-slate-500">
              {user?.role?.name || user?.role?.code}
            </p>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
