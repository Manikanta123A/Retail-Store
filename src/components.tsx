import React from 'react';

/* ============================================================
   ANITHA JEWELLERS — REFINED COMPONENT PATTERNS
   Copy-paste these into your React/TSX files.
   Replace existing markup classNames with these patterns.
   ============================================================ */

// ============================================================
// 1. LAYOUT (App Shell)
// ============================================================
/* Remove the floating search bar from this layout entirely.
   If you have a <FloatingSearchBar /> or similar, delete it. */

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#F8F9FB]">
      {/* Sidebar — low contrast, quiet */}
      <aside className="sidebar w-64 flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-[#E5E7EB]">
          <span className="text-lg font-bold text-[#111827]">Anitha Jewellers</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <a href="/dashboard" className="sidebar-link active">
            Dashboard
          </a>
          <a href="/inventory" className="sidebar-link">
            Inventory
          </a>
          <a href="/sales" className="sidebar-link">
            Sales
          </a>
          <a href="/customers" className="sidebar-link">
            Customers
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}


// ============================================================
// 2. PAGE HEADER — One clear focal point
// ============================================================

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-header flex items-end justify-between gap-4">
      <div>
        <h1 className="h1">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}


// ============================================================
// 3. DASHBOARD / KPI CARDS
// ============================================================

export function KpiCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="stat-card">
        <div className="stat-label">Total Sales</div>
        <div className="stat-value">₹12,45,000</div>
        <div className="mt-2 flex items-center gap-1">
          <span className="stat-delta-positive">+12.5%</span>
          <span className="text-xs text-[#9CA3AF]">vs last month</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Pending Orders</div>
        <div className="stat-value">24</div>
        <div className="mt-2 flex items-center gap-1">
          <span className="stat-delta-negative">+3</span>
          <span className="text-xs text-[#9CA3AF]">since yesterday</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Low Stock Items</div>
        <div className="stat-value text-[#D97706]">8</div>
        <div className="mt-2 text-xs text-[#9CA3AF]">Requires attention</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Avg. Order Value</div>
        <div className="stat-value">₹8,420</div>
        <div className="mt-2 flex items-center gap-1">
          <span className="stat-delta-positive">+2.1%</span>
          <span className="text-xs text-[#9CA3AF]">vs last month</span>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// 4. TABLE — Clean, breathable, readable
// ============================================================

export function CleanTable() {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
        <h3 className="h3">Recent Transactions</h3>
        <button className="btn-ghost">View all</button>
      </div>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-medium text-[#111827]">#ORD-7842</td>
              <td>Rajesh Kumar</td>
              <td className="text-[#6B7280]">May 10, 2026</td>
              <td className="tabular-nums font-medium text-[#111827]">₹45,200</td>
              <td><span className="badge-success">Completed</span></td>
            </tr>
            <tr>
              <td className="font-medium text-[#111827]">#ORD-7841</td>
              <td>Priya Sharma</td>
              <td className="text-[#6B7280]">May 09, 2026</td>
              <td className="tabular-nums font-medium text-[#111827]">₹12,500</td>
              <td><span className="badge-warning">Pending</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ============================================================
// 5. MODAL — Airy, flat, clear action hierarchy
// ============================================================

export function CleanModal({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-panel relative z-10">
        <div className="modal-header">
          <h2 className="h2">{title}</h2>
        </div>
        <div className="modal-body text-sm text-[#374151]">
          {children}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// 6. FORM — Clean inputs, clear labels
// ============================================================

export function CleanForm() {
  return (
    <div className="card p-6 max-w-xl">
      <h3 className="h3 mb-6">Add New Product</h3>
      <div className="space-y-5">
        <div>
          <label className="label block mb-1.5">Product Name</label>
          <input className="input" placeholder="e.g. 22K Gold Necklace" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label block mb-1.5">Weight (grams)</label>
            <input className="input" type="number" placeholder="0.00" />
          </div>
          <div>
            <label className="label block mb-1.5">Price</label>
            <input className="input" type="number" placeholder="₹0" />
          </div>
        </div>
        <div className="pt-2 flex items-center justify-end gap-3">
          <button className="btn-secondary">Discard</button>
          <button className="btn-primary">Save Product</button>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// 7. SEARCH (REPLACING FLOATING SEARCH BAR)
// ============================================================

export function InlineSearch({ placeholder = "Search..." }: { placeholder?: string }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        className="input pl-9 w-64"
        placeholder={placeholder}
      />
    </div>
  );
}


// ============================================================
// 8. EMPTY STATE — Helpful, minimal
// ============================================================

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="card p-12 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-sm text-[#6B7280]">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}


// ============================================================
// 9. DASHBOARD PAGE EXAMPLE
// ============================================================

export function DashboardPage() {
  return (
    <div className="page-enter space-y-6">
      <KpiCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CleanTable />
        </div>
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="h3 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full btn-secondary justify-start">New Sale</button>
              <button className="w-full btn-secondary justify-start">Add Inventory</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
