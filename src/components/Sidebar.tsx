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
      <div className="px-5 py-5 border-b border-[#E5E7EB]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E40AF] flex items-center justify-center">
              <Store size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#111827] tracking-tight">Anitha Jewellers</h1>
              <p className="text-[10px] text-[#9CA3AF] font-medium">Billing & Dues</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] rounded-lg transition-colors"
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
              <p className="px-5 pt-3 pb-1.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
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
                        ? 'bg-[#E0E7FF] text-[#1E40AF] font-semibold'
                        : 'text-[#4B5563] hover:bg-[#E5E7EB] hover:text-[#111827]'
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
      <div className="relative border-t border-[#E5E7EB] mt-auto">
        {showAccountDetails && user && (
          <div className="absolute bottom-full left-0 mb-1 w-full px-3 pb-1">
            <div className="card p-3 shadow-lg">
              <div className="space-y-1.5 mb-3">
                <p className="text-sm font-semibold text-[#111827]">{user.full_name || user.username}</p>
                {user.email && <p className="text-xs text-[#6B7280]">{user.email}</p>}
                {user.phone && <p className="text-xs text-[#6B7280]">{user.phone}</p>}
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] rounded-md transition-colors text-xs font-medium"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between px-4 py-3">
          <div 
            className="flex items-center gap-3 cursor-pointer overflow-hidden flex-1"
            onClick={() => setShowAccountDetails(!showAccountDetails)}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
              {user?.full_name?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase() || <UserIcon size={14} />}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-[#111827] truncate">{user?.full_name || user?.username || 'Guest'}</p>
              <p className="text-[10px] text-[#9CA3AF] truncate capitalize">{user?.role || 'User'}</p>
            </div>
          </div>
          
          {/* Direct logout for mobile, chevron for desktop */}
          <div className="flex items-center">
            <button
              onClick={(e) => { e.stopPropagation(); handleLogout(); }}
              className="lg:hidden p-2 text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
            <button 
              onClick={() => setShowAccountDetails(!showAccountDetails)}
              className="hidden lg:block p-1 text-[#9CA3AF] hover:text-[#374151]"
            >
              <ChevronDown size={14} className={cn("transition-transform", showAccountDetails && "rotate-180")} />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button — rendered in the header area */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-white border border-[#E5E7EB] rounded-lg shadow-sm hover:bg-[#F9FAFB] transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-[#374151]" />
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
          "h-[100dvh] bg-[#F3F4F6] border-r border-[#E5E7EB] flex flex-col fixed left-0 top-0 z-50 w-60 transition-transform duration-300 ease-in-out",
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
