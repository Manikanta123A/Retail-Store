import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Dues from './pages/Dues';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Initializing System...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Placeholder components for other pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm animate-in fade-in duration-500">
    <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
    <p className="text-gray-500">This module is part of the operational roadmap and will be populated with business analytics shortly.</p>
    <div className="mt-8 border-2 border-dashed border-gray-100 rounded-xl h-64 flex items-center justify-center text-gray-300 italic">
      Module Workspace
    </div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="billing" element={<Billing />} />
            <Route path="customers" element={<Customers />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="dues" element={<Dues />} />
            <Route path="payments" element={<Payments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="analytics" element={<Placeholder title="Business Analytics" />} />
            <Route path="emails" element={<Placeholder title="Email Invoices" />} />
            <Route path="settings" element={<Placeholder title="System Settings" />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
