import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Search, Bell, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';

export function Layout() {
  const today = new Date();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col">
        <header className="h-16 bg-white border-b border-[#E5E7EB] px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search Bill #, Customer, or Product..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="hidden lg:block text-xs font-medium text-slate-500 ml-2">
              {format(today, 'MMM dd, yyyy | hh:mm a')}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/billing"
              className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-md text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Bill
            </Link>
          </div>
        </header>

        <main className="p-8 flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
