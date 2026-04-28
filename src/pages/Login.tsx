import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Package, LogIn, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-600/20">
            <Package size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">RetailPOS Pro</h1>
          <p className="text-gray-500 text-sm mb-10 leading-relaxed">
            Professional Billing & Inventory Management System. Please sign in to access the store dashboard.
          </p>

          <button 
            onClick={() => login()}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-bold py-3.5 px-6 rounded-xl border border-gray-200 shadow-sm transition-all active:scale-95 group"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Continue with Google
          </button>

          <div className="mt-10 flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck size={14} />
            Secure Enterprise Encryption
          </div>
        </div>
        
        <div className="bg-gray-50 px-10 py-6 border-t border-gray-100 flex flex-col gap-3">
          <p className="text-xs text-gray-400 text-center">
            Authorized Personnel Only • Standard Audit Logging Enabled
          </p>
        </div>
      </div>
    </div>
  );
}
