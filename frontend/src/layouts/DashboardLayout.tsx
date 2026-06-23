import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Wrench,
  ShieldCheck,
  FileText,
  BarChart2,
  User,
  Settings,
  LogOut,
  Bell,
  Mail,
  Search,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSearchOpen: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  onSearchOpen,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { notifications, markAllAsRead } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format: "12:10 PM"
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      // Format: "Wednesday, 3 December 2025"
      setCurrentDate(now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Full set of sidebar items for DMS mapped to allowed roles
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['*'] },
    { id: 'leads', label: 'Leads', icon: Users, roles: ['Master Admin', 'Pre Sales Manager'] },
    { id: 'sales', label: 'Sales', icon: DollarSign, roles: ['Master Admin', 'Sales Manager', 'Finance Manager'] },
    { id: 'aftersales', label: 'After Sales', icon: TrendingUp, roles: ['Master Admin', 'After Sales Manager'] },
    { id: 'purchase', label: 'Purchase', icon: ShoppingCart, roles: ['Master Admin', 'Purchase Manager'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['Master Admin', 'Purchase Manager', 'Spare House Officer', 'Sales Manager'] },
    { id: 'service', label: 'Service', icon: Wrench, roles: ['Master Admin', 'Service Technician Officer', 'Spare House Officer'] },
    { id: 'warranty', label: 'Warranty', icon: ShieldCheck, roles: ['Master Admin', 'After Sales Manager', 'Legal Manager'] },
    { id: 'documents', label: 'Documents', icon: FileText, roles: ['*'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart2, roles: ['Master Admin', 'Pre Sales Manager', 'Sales Manager', 'Finance Manager'] },
    { id: 'profile', label: 'Profile', icon: User, roles: ['*'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Master Admin'] },
  ];

  const filteredSidebarItems = sidebarItems.filter(
    (item) => item.roles.includes('*') || (user?.role && item.roles.includes(user.role))
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex h-screen bg-[#F5F7FA] font-sans antialiased">
      {/* Sidebar (Dark Navy Blue #1F3B73) */}
      <aside className="w-64 bg-[#1F3B73] text-white flex flex-col justify-between shrink-0 shadow-lg">
        <div>
          {/* Logo Section */}
          <div className="h-16 flex items-center px-6 border-b border-white/10 justify-between">
            <span className="text-2xl font-bold tracking-wider text-white">SMG</span>
          </div>

          {/* Back Button */}
          <div className="px-4 py-2 border-b border-white/10">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="mt-4 px-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-180px)]">
            {filteredSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-4.5 py-2.5 text-xs font-semibold rounded transition-all ${
                    isActive
                      ? 'bg-white/15 text-white font-bold border-l-4 border-blue-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="mr-3 h-4.5 w-4.5 shrink-0 text-slate-300" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout Option */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-xs font-semibold text-red-300 hover:bg-white/5 hover:text-red-200 rounded transition-all"
          >
            <LogOut className="mr-3 h-4.5 w-4.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
          {/* Top Search bar */}
          <div className="w-80">
            <div className="relative">
              <input
                type="text"
                placeholder="search"
                onClick={onSearchOpen}
                className="w-full pl-3 pr-10 py-1.5 bg-[#F5F7FA] border border-slate-200 rounded-full text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1F3B73]"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Right Action Icons & Avatar */}
          <div className="flex items-center space-x-5">
            {/* Real-time Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) markAllAsRead();
                }}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-4 w-4 text-[9px] font-bold text-center leading-4 rounded-full bg-red-500 text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-[10px] text-slate-400 uppercase">Alert Inbox</span>
                    <button
                      onClick={() => {
                        markAllAsRead();
                        setShowNotifications(false);
                      }}
                      className="text-[10px] text-blue-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-3 text-slate-400 text-center">No alerts logged</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="px-4 py-2 border-b border-slate-50 hover:bg-slate-50">
                          <p className="font-bold text-[10px] text-blue-900 uppercase">{n.type}</p>
                          <p className="text-slate-600 mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mail icon */}
            <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors">
              <Mail className="h-5 w-5" />
            </button>

            {/* Profile Avatar / Dropdown */}
            <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"
                alt="Avatar"
                className="h-8 w-8 rounded-full border border-slate-300"
              />
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-slate-800">{user?.name || 'Pulkit Verma'}</p>
                <p className="text-[10px] text-slate-400 leading-none">{user?.role || 'IT Intern'}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

// No fallback icon needed
