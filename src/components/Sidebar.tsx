import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  Package, 
  History, 
  BarChart3, 
  CreditCard, 
  Mail, 
  Settings,
  PlusCircle,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: PlusCircle, label: 'New Bill', path: '/billing' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: Package, label: 'Inventory', path: '/inventory' },
  { icon: History, label: 'Due Management', path: '/dues' },
  { icon: CreditCard, label: 'Payments', path: '/payments' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Mail, label: 'Email Invoices', path: '/emails' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const [showAccountDetails, setShowAccountDetails] = useState(false);

  return (
    <div className="w-60 h-screen bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-40 text-slate-300">
      <div className="p-6 border-b border-slate-800">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-blue-400 tracking-tight truncate">RETAIL PRO</h1>
          <p className="text-[10px] text-slate-500 font-semibold uppercase mt-1 tracking-widest">Billing & Due System</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors group',
                isActive
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <item.icon size={18} className="flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="relative p-4 border-t border-slate-800 bg-slate-900/50">
        {showAccountDetails && user && (
          <div className="absolute bottom-full left-0 mb-2 w-full p-2">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
              <p className="text-xs font-semibold text-slate-400 mb-2 uppercase">Account Details</p>
              <div className="space-y-1 mb-3">
                <p className="text-sm font-medium text-white">{user.full_name || user.username}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
                <p className="text-xs text-slate-400">{user.phone}</p>
                <p className="text-xs text-slate-400 capitalize">Role: {user.role}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors text-xs font-medium"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        )}
        
        <div 
          className="flex items-center gap-3 cursor-pointer hover:bg-slate-800 p-2 -m-2 rounded-md transition-colors"
          onClick={() => setShowAccountDetails(!showAccountDetails)}
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {user?.full_name?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase() || <UserIcon size={16} />}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{user?.full_name || user?.username || 'Guest'}</p>
            <p className="text-[10px] text-slate-400 truncate capitalize">{user?.role || 'User'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
