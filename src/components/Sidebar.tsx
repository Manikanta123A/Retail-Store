import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  Package, 
  History, 
  BarChart3, 
  CreditCard, 
  LogOut,
  User as UserIcon,
  ChevronDown,
  Store,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navSections = [
  {
    label: null,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
      { icon: Receipt, label: 'New Bill', path: '/app/billing' },
    ]
  },
  {
    label: 'Manage',
    items: [
      { icon: Users, label: 'Customers', path: '/app/customers' },
      { icon: Package, label: 'Inventory', path: '/app/inventory' },
    ]
  },
  {
    label: 'Finance',
    items: [
      { icon: History, label: 'Due Management', path: '/app/dues' },
      { icon: CreditCard, label: 'Payments', path: '/app/payments' },
    ]
  },
  {
    label: 'Insights',
    items: [
      { icon: BarChart3, label: 'Reports', path: '/app/reports' },
      { icon: BarChart3, label: 'Analytics', path: '/app/analytics' },
    ]
  }
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    // Replace entire history so back-button cannot re-enter the app
    navigate('/', { replace: true });
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E40AF] flex items-center justify-center shadow-sm shadow-blue-500/20">
              <Store size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 tracking-tight">Retail Pro</h1>
              <p className="text-[10px] text-gray-400 font-medium">Billing & Dues</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto scrollbar-hide">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className={sIdx > 0 ? 'mt-2' : ''}>
            {section.label && (
              <p className="px-5 pt-3 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {section.label}
              </p>
            )}
            <div className="px-3 space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/app'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                      isActive
                        ? 'bg-blue-50 text-[#1E40AF] font-semibold'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                    )
                  }
                >
                  <item.icon size={17} className="flex-shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="relative border-t border-gray-100">
        {showAccountDetails && user && (
          <div className="absolute bottom-full left-0 mb-1 w-full px-3 pb-1">
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
              <div className="space-y-1.5 mb-3">
                <p className="text-sm font-semibold text-gray-900">{user.full_name || user.username}</p>
                {user.email && <p className="text-xs text-gray-500">{user.email}</p>}
                {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md transition-colors text-xs font-medium"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        )}
        
        <div 
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setShowAccountDetails(!showAccountDetails)}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
            {user?.full_name?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase() || <UserIcon size={14} />}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-gray-800 truncate">{user?.full_name || user?.username || 'Guest'}</p>
            <p className="text-[10px] text-gray-400 truncate capitalize">{user?.role || 'User'}</p>
          </div>
          <ChevronDown size={14} className={cn("text-gray-400 transition-transform", showAccountDetails && "rotate-180")} />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button — rendered in the header area */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel — off-canvas on mobile, fixed on desktop */}
      <div
        className={cn(
          "h-screen bg-white border-r border-[#E8ECF1] flex flex-col fixed left-0 top-0 z-50 w-60 transition-transform duration-300 ease-in-out",
          // Desktop: always visible
          "lg:translate-x-0",
          // Mobile: slide in/out
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
