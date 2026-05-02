import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Zap,
  Users,
  BarChart2,
  Mail,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <Zap size={18} className="text-[#1E40AF]" />,
    title: 'Fast Billing',
    desc: 'Generate itemised bills in seconds with auto-calculated totals.',
  },
  {
    icon: <Users size={18} className="text-amber-600" />,
    title: 'Customer Due Tracking',
    desc: 'Track every pending balance and send instant reminders.',
  },
  {
    icon: <BarChart2 size={18} className="text-teal-600" />,
    title: 'Reports & Analytics',
    desc: 'Visual daily, weekly, and monthly sales & due reports.',
  },
  {
    icon: <Mail size={18} className="text-rose-500" />,
    title: 'Email Invoices',
    desc: 'Send professional PDF invoices directly to customers.',
  },
];

const values = [
  'Built for real store usage — not a demo',
  'Handles hundreds of daily customers efficiently',
  'Reduces billing errors with structured data entry',
  'Tracks complete transaction history',
];

// ── Component ────────────────────────────────────────────────────────────────

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-[#1A1D23]">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E40AF] flex items-center justify-center shadow-sm shadow-blue-500/20">
              <Store size={16} className="text-white" />
            </div>
            <span className="text-[15px] font-semibold text-gray-900 tracking-tight">Retail Pro</span>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-2">
            <button
              id="nav-login-btn"
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Login
            </button>
            <button
              id="nav-signup-btn"
              onClick={() => navigate('/login?tab=signup')}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1E40AF] hover:bg-blue-800 rounded-lg transition-colors shadow-sm"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-5 py-16 sm:py-24 max-w-3xl mx-auto w-full page-enter">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-5">
          Smart Billing &amp; Customer<br className="hidden sm:block" />
          {' '}<span className="text-[#1E40AF]">Due Management</span> for Retail Stores
        </h1>

        <p className="text-sm sm:text-base text-gray-500 max-w-xl leading-relaxed mb-8">
          Manage sales, track dues, and run your store efficiently — all from one clean, purpose-built dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <button
            id="hero-signup-btn"
            onClick={() => navigate('/login?tab=signup')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#1E40AF] hover:bg-blue-800 text-white text-sm font-medium rounded-lg shadow-sm transition-all active:scale-[0.98]"
          >
            Get Started
            <ArrowRight size={15} />
          </button>
          <button
            id="hero-login-btn"
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-200 hover:border-gray-300 text-sm font-medium text-gray-700 rounded-lg transition-all active:scale-[0.98] shadow-sm"
          >
            Login
          </button>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-12 sm:py-16 px-5 sm:px-6 border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Everything your store needs</h2>
            <p className="text-sm text-gray-400 mt-2">Four core features that cover your day-to-day operations.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-4 sm:p-5 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center mb-3 sm:mb-4 shadow-sm">
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Business Value ── */}
      <section className="py-12 sm:py-16 px-5 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Designed for real retail work</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Retail Pro isn't a demo — it's a production-ready tool used by store owners to manage billing, dues, and customers every single day.
            </p>
            <ul className="space-y-3">
              {values.map((v) => (
                <li key={v} className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 size={16} className="text-[#1E40AF] mt-0.5 flex-shrink-0" />
                  {v}
                </li>
              ))}
            </ul>
          </div>

          {/* Decorative stat card cluster */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Bills Generated', value: '1,200+', color: 'border-l-[#1E40AF]' },
              { label: 'Dues Collected', value: '₹4.8L+', color: 'border-l-teal-600' },
              { label: 'Customers Tracked', value: '300+', color: 'border-l-amber-500' },
              { label: 'Billing Errors', value: '~Zero', color: 'border-l-rose-500' },
            ].map((s) => (
              <div
                key={s.label}
                className={`bg-white border border-gray-100 border-l-[3px] ${s.color} rounded-xl p-5`}
              >
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-12 sm:py-14 px-5 sm:px-6 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Start managing your store better today
          </h2>
          <p className="text-sm text-gray-400">No complicated setup. Just sign up and go.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-6 px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#1E40AF] flex items-center justify-center">
              <Store size={11} className="text-white" />
            </div>
            <span className="font-medium text-gray-600">Retail Pro</span>
          </div>
          <span>Smart billing &amp; due management for retail stores.</span>
        </div>
      </footer>

    </div>
  );
}
