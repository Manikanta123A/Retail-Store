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
import { cn } from '@/lib/utils';

// ── Helpers ─────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <Zap size={18} className="text-[#1E40AF]" />,
    title: 'Fast Billing',
    desc: 'Generate itemised bills in seconds with auto-calculated totals.',
  },
  {
    icon: <Users size={18} className="text-[#F59E0B]" />,
    title: 'Customer Due Tracking',
    desc: 'Track every pending balance and send instant reminders.',
  },
  {
    icon: <BarChart2 size={18} className="text-[#10B981]" />,
    title: 'Reports & Analytics',
    desc: 'Visual daily, weekly, and monthly sales & due reports.',
  },
  {
    icon: <Mail size={18} className="text-[#EF4444]" />,
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
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col font-sans text-[#111827]">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E40AF] flex items-center justify-center">
              <Store size={16} className="text-white" />
            </div>
            <span className="text-[15px] font-bold text-[#111827] tracking-tight">Anitha Jewellers</span>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-2">
            <button
              id="nav-login-btn"
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] rounded-md hover:bg-[#F3F4F6] transition-colors"
            >
              Login
            </button>
            <button
              id="nav-signup-btn"
              onClick={() => navigate('/login?tab=signup')}
              className="btn-primary"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-5 py-16 sm:py-24 max-w-3xl mx-auto w-full page-enter">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#111827] leading-tight tracking-tight mb-6">
          Smart Billing &amp; Customer<br className="hidden sm:block" />
          {' '}<span className="text-[#1E40AF]">Due Management</span>
        </h1>

        <p className="text-sm sm:text-base text-[#6B7280] max-w-xl leading-relaxed mb-10">
          Manage sales, track dues, and run your store efficiently — all from one clean, purpose-built dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            id="hero-signup-btn"
            onClick={() => navigate('/login?tab=signup')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white text-sm font-bold rounded-lg shadow-md shadow-blue-500/10 transition-all active:scale-[0.98]"
          >
            Get Started
            <ArrowRight size={16} />
          </button>
          <button
            id="hero-login-btn"
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-8 py-3.5 bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] text-sm font-semibold text-[#374151] rounded-lg transition-all active:scale-[0.98]"
          >
            Login
          </button>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 sm:py-20 px-5 sm:px-6 border-t border-[#E5E7EB] bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="h2 text-[#111827]">Everything your store needs</h2>
            <p className="text-sm text-[#9CA3AF] mt-2">Four core features that cover your day-to-day operations.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="card p-6 hover:border-[#3B82F6] hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#F8F9FB] border border-[#E5E7EB] flex items-center justify-center mb-5 group-hover:bg-[#EFF6FF] group-hover:border-[#DBEAFE] transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-[#111827] mb-2">{f.title}</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Business Value ── */}
      <section className="py-16 sm:py-20 px-5 sm:px-6 bg-[#F8F9FB]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
          <div>
            <h2 className="h2 text-[#111827] mb-4">Designed for real retail work</h2>
            <p className="text-sm text-[#6B7280] leading-relaxed mb-8">
              Anitha Jewellers is a production-ready tool used by store owners to manage billing, dues, and customers every single day.
            </p>
            <ul className="space-y-4">
              {values.map((v) => (
                <li key={v} className="flex items-start gap-3 text-sm font-medium text-[#374151]">
                  <CheckCircle2 size={18} className="text-[#10B981] mt-0.5 flex-shrink-0" />
                  {v}
                </li>
              ))}
            </ul>
          </div>

          {/* Decorative stat card cluster */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Bills Generated', value: '1,200+', color: 'border-l-[#1E40AF]' },
              { label: 'Dues Collected', value: '₹4.8L+', color: 'border-l-[#10B981]' },
              { label: 'Customers Tracked', value: '300+', color: 'border-l-[#F59E0B]' },
              { label: 'Billing Errors', value: '~Zero', color: 'border-l-[#EF4444]' },
            ].map((s) => (
              <div
                key={s.label}
                className={cn("stat-card border-l-[3px] shadow-sm", s.color)}
              >
                <p className="text-2xl font-bold text-[#111827] tabular-nums">{s.value}</p>
                <p className="stat-label mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-20 px-5 sm:px-6 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="h2 text-[#111827] mb-3">
            Start managing your store better today
          </h2>
          <p className="text-sm text-[#9CA3AF] mb-8">No complicated setup. Just sign up and go.</p>
          <button
            onClick={() => navigate('/login?tab=signup')}
            className="btn-primary px-8 py-3 text-base"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9CA3AF]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#1E40AF] flex items-center justify-center">
              <Store size={12} className="text-white" />
            </div>
            <span className="font-bold text-[#111827]">Anitha Jewellers</span>
          </div>
          <span className="text-center sm:text-right font-medium">Smart billing &amp; due management. &copy; {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}
