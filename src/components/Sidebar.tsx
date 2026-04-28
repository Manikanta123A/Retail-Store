import React from 'react';
import { NavLink } from 'react-router-dom';
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
  PlusCircle
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
  return (
    <div className="w-60 h-screen bg-white border-r border-[#E5E7EB] flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-[#E5E7EB]">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-[#2563EB] tracking-tight truncate">RETAIL PRO</h1>
          <p className="text-[10px] text-slate-400 font-semibold uppercase mt-1 tracking-widest">Billing & Due System</p>
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
                  ? 'bg-blue-50 text-[#2563EB]'
                  : 'text-slate-600 hover:bg-slate-50'
              )
            }
          >
            <item.icon size={18} className="flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[#E5E7EB] bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            JS
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-[#111827] truncate">John Storeowner</p>
            <p className="text-[10px] text-slate-500 truncate">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}
