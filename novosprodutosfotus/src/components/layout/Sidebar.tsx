import { NavLink } from "react-router-dom";
import { LayoutDashboard, CheckSquare, Calendar, BarChart2, Target, Palmtree, Users, Settings, HelpCircle, LogOut } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard Novos Produtos", path: "/dashboard" },
  { icon: CheckSquare, label: "Projetos", path: "/projects" },
  { icon: Calendar, label: "Calendário", path: "/calendar" },
  { icon: BarChart2, label: "Analytics", path: "/analytics" },
  { icon: Target, label: "Métricas", path: "/metrics" },
  { icon: Palmtree, label: "Férias", path: "/vacations" },
  { icon: Users, label: "Time", path: "/team" },
];

const generalItems = [
  { icon: Settings, label: "Configurações", path: "/settings" },
  { icon: HelpCircle, label: "Versão 1.0 Beta", path: "/help" },
];

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const { signOut } = useAuth();

  return (
    <aside className={cn(
      "fixed left-4 top-4 bottom-4 transition-all duration-300 z-30",
      isOpen ? "w-64 opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-full overflow-hidden"
    )}>
      <div className="glass h-full rounded-[2rem] border border-white/50 flex flex-col shadow-2xl shadow-black/10 overflow-hidden">
        <div className="p-6 flex items-center justify-center border-b border-white/10">
          <img 
            src="https://res.cloudinary.com/ddtpuucfi/image/upload/v1776262898/LOGO_Fotus_1A_r2m41s.png" 
            alt="Fotus Logo" 
            className="h-7 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-8">
          <div>
            <p className="text-[10px] font-bold text-gray-400 mb-4 px-3 uppercase tracking-[0.2em]">Menu</p>
            <nav className="flex flex-col gap-1.5">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-secondary text-white shadow-lg shadow-secondary/30 scale-[1.02]" 
                      : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-500")} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 mb-4 px-3 uppercase tracking-[0.2em]">Geral</p>
            <nav className="flex flex-col gap-1.5">
              {generalItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-secondary text-white shadow-lg shadow-secondary/30 scale-[1.02]" 
                      : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-500")} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
              <button 
                onClick={signOut}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-50/50 transition-all mt-2"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}
