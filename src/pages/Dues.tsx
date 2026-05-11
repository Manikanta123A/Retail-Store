import React, { useState, useEffect } from 'react';
import {
  Search, AlertCircle, Clock, CheckCircle2, Loader2, User, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { customerService, billingService } from '@/services/api';
import CollectPaymentModal from '@/components/CollectPaymentModal';
import { cn, formatCurrency } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';

export default function Dues() {
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('');
  const [recoveryThisMonth, setRecoveryThisMonth] = useState(0);

  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null) setSearch(s);
  }, [searchParams]);

  useEffect(() => {
    fetchDues();
    fetchMonthlyRecovery();
  }, []);

  const fetchMonthlyRecovery = async () => {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const res = await billingService.getPayments({ start_date: firstDay });
      const total = res.data.reduce((sum: number, p: any) => sum + p.amount, 0);
      setRecoveryThisMonth(total);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDues = async () => {
    try {
      const response = await customerService.getCustomers();
      const duesOnly = response.data.filter((c: any) => c.outstanding_due > 0);
      setCustomers(duesOnly);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDues = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const daysOld = Math.floor((new Date().getTime() - new Date(c.last_purchase_date || c.created_at).getTime()) / (1000 * 3600 * 24));
    const risk = daysOld > 60 ? 'High' : daysOld > 30 ? 'Medium' : 'Low';
    const matchesRisk = filterRisk === 'All' || risk === filterRisk;
    let matchesDate = true;
    if (filterDate) {
      const customerDate = new Date(c.last_purchase_date || c.created_at).toISOString().split('T')[0];
      matchesDate = customerDate === filterDate;
    }
    return matchesSearch && matchesRisk && matchesDate;
  });

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding_due, 0);
  const highRiskDues = customers.reduce((sum, c) => {
    const daysOld = Math.floor((new Date().getTime() - new Date(c.last_purchase_date || c.created_at).getTime()) / (1000 * 3600 * 24));
    if (daysOld > 60 && c.outstanding_due > 0) return sum + c.outstanding_due;
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="h1">Due Management</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Track and recover outstanding credit.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="stat-card border-l-[3px] border-l-[#EF4444]">
          <p className="stat-label">Total Outstanding</p>
          <p className="text-2xl font-bold text-[#DC2626] tabular-nums">{formatCurrency(totalOutstanding)}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-[#9CA3AF]">
            <AlertCircle size={12} className="text-[#EF4444]" />
            <span>Across {customers.length} customers</span>
          </div>
        </div>
        <div className="stat-card border-l-[3px] border-l-[#F59E0B]">
          <p className="stat-label">High Risk</p>
          <p className="text-2xl font-bold text-[#D97706] tabular-nums">{formatCurrency(highRiskDues)}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-[#9CA3AF]">
            <Clock size={12} className="text-[#F59E0B]" />
            <span>Older than 60 days</span>
          </div>
        </div>
        <div className="stat-card border-l-[3px] border-l-[#10B981]">
          <p className="stat-label">Recovered this Month</p>
          <p className="text-2xl font-bold text-[#059669] tabular-nums">{formatCurrency(recoveryThisMonth)}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-[#9CA3AF]">
            <CheckCircle2 size={12} className="text-[#10B981]" />
            <span>From recent payments</span>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 sm:w-72"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="input w-auto"
            >
              <option value="All">All Risks</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="input w-auto"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Total Due</th>
                <th>Due Since</th>
                <th>Risk</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[#1E40AF]" /></td></tr>
              ) : filteredDues.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-[#9CA3AF] text-sm">No dues found.</td></tr>
              ) : (
                filteredDues.map((due) => {
                  const daysOld = Math.floor((new Date().getTime() - new Date(due.last_purchase_date || due.created_at).getTime()) / (1000 * 3600 * 24));
                  const risk_level = daysOld > 60 ? 'High' : daysOld > 30 ? 'Medium' : 'Low';

                  return (
                    <tr key={due.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#6B7280]">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="font-medium text-[#111827]">{due.name}</p>
                            <p className="text-xs text-[#9CA3AF]">{due.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="text-[#DC2626] font-semibold tabular-nums">{formatCurrency(due.outstanding_due)}</p>
                      </td>
                      <td>
                        <span className="text-[#374151] font-medium">{format(new Date(due.last_purchase_date || due.created_at), 'MMM dd, yyyy')}</span>
                        <span className="text-xs text-[#9CA3AF] block mt-0.5">{daysOld} days ago</span>
                      </td>
                      <td>
                        <span className={cn(
                          risk_level === 'High' ? 'badge-danger' :
                          risk_level === 'Medium' ? 'badge-warning' :
                          'badge-neutral'
                        )}>
                          {risk_level}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => { setSelectedCustomer(due); setCollectModalOpen(true); }}
                          className="flex items-center gap-1.5 text-[#1E40AF] font-medium text-xs hover:bg-[#EFF6FF] px-3 py-1.5 rounded-lg transition-all ml-auto"
                        >
                          Collect
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {collectModalOpen && selectedCustomer && (
        <CollectPaymentModal
          type="customer"
          targetId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          maxAmount={selectedCustomer.outstanding_due}
          onClose={() => setCollectModalOpen(false)}
          onSuccess={() => { setCollectModalOpen(false); fetchDues(); }}
        />
      )}
    </div>
  );
}
