import { useLocation } from "wouter";

export default function MobileNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: "fas fa-home" },
    { path: "/expenses", label: "Expenses", icon: "fas fa-list" },
    { path: "/reports", label: "Reports", icon: "fas fa-chart-pie" },
    { path: "/budgets", label: "Budgets", icon: "fas fa-cog" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center py-2 transition-colors ${
                isActive ? 'text-primary' : 'text-secondary'
              }`}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <i className={`${item.icon} text-lg`}></i>
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
