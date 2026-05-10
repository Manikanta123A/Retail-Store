import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import ChatAssistant from './ChatAssistant';
import GlobalSearch from './GlobalSearch';

export function Layout() {
  const today = new Date();
  const { user } = useAuth();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>
      {/* Main content: offset by sidebar width on desktop, full-width on mobile */}
      <div className="flex-1 lg:ml-60 print:ml-0 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[#E8ECF1] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 print:hidden">
          <div className="flex items-center gap-6 flex-1 ml-12 lg:ml-0">
            <div className="hidden md:block">
              <span className="text-xs text-gray-400 block mb-0.5">{greeting}</span>
              <span className="text-sm font-semibold text-gray-800">{user?.full_name || user?.username || 'Guest'}</span>
            </div>
            
            <div className="flex-1 max-w-md">
              <GlobalSearch />
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            <Link
              to="/app/billing"
              className="flex items-center gap-2 bg-[#1E40AF] text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors active:scale-[0.97] shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Bill</span>
            </Link>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto page-enter">
            <Outlet />
          </div>
        </main>
      </div>
      <ChatAssistant />
    </div>
  );
}
