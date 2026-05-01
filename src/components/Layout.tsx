import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

export function Layout() {
  const today = new Date();

  return (
    <div className="min-h-screen bg-slate-50 flex print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 ml-60 print:ml-0 flex flex-col">
        <header className="h-14 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-4 flex-1">
            <span className="text-xs text-slate-400 font-medium">
              {format(today, 'EEE, MMM dd yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/billing"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors active:scale-95"
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
