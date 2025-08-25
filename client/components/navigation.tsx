import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

interface NavigationProps {
  user?: User;
}

export default function Navigation({ user }: NavigationProps) {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "fas fa-home" },
    { path: "/expenses", label: "Expenses", icon: "fas fa-list" },
    { path: "/budgets", label: "Budgets", icon: "fas fa-wallet" },
    { path: "/reports", label: "Reports", icon: "fas fa-chart-bar" },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-microphone-alt text-white text-sm"></i>
            </div>
            <h1 className="text-xl font-semibold text-text-dark" data-testid="text-app-title">VoiceTracker</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`pb-4 transition-colors ${
                    isActive 
                      ? 'text-primary font-medium border-b-2 border-primary' 
                      : 'text-secondary hover:text-text-dark'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-secondary hover:text-text-dark transition-colors" data-testid="button-notifications">
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"></span>
            </button>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="User avatar" 
                  className="w-8 h-8 rounded-full object-cover"
                  data-testid="img-user-avatar"
                />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-white text-sm"></i>
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium" data-testid="text-user-name">
                {user?.firstName || user?.email || 'User'}
              </span>
              
              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                className="text-secondary hover:text-text-dark"
                data-testid="button-logout"
              >
                <i className="fas fa-sign-out-alt text-sm"></i>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 text-secondary hover:text-text-dark" data-testid="button-mobile-menu">
              <i className="fas fa-bars text-lg"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
