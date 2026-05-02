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
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Due Management</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track and recover outstanding credit.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 border-l-[3px] border-l-rose-500">
          <p className="text-xs font-medium text-gray-400 mb-1">Total Outstanding</p>
          <p className="text-2xl font-semibold text-rose-600 tabular-nums">{formatCurrency(totalOutstanding)}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <AlertCircle size={12} className="text-rose-400" />
            <span>Across {customers.length} customers</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 border-l-[3px] border-l-amber-500">
          <p className="text-xs font-medium text-gray-400 mb-1">High Risk</p>
          <p className="text-2xl font-semibold text-amber-600 tabular-nums">{formatCurrency(highRiskDues)}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <Clock size={12} className="text-amber-400" />
            <span>Older than 60 days</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 border-l-[3px] border-l-emerald-600">
          <p className="text-xs font-medium text-gray-400 mb-1">Recovered this Month</p>
          <p className="text-2xl font-semibold text-emerald-600 tabular-nums">{formatCurrency(recoveryThisMonth)}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>From recent payments</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
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
              className="bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-gray-400 font-medium border-b border-gray-100">
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Total Due</th>
                <th className="px-6 py-3">Due Since</th>
                <th className="px-6 py-3">Risk</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600" /></td></tr>
              ) : filteredDues.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-gray-400 text-sm">No dues found.</td></tr>
              ) : (
                filteredDues.map((due) => {
                  const daysOld = Math.floor((new Date().getTime() - new Date(due.last_purchase_date || due.created_at).getTime()) / (1000 * 3600 * 24));
                  const risk_level = daysOld > 60 ? 'High' : daysOld > 30 ? 'Medium' : 'Low';

                  return (
                    <tr key={due.id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{due.name}</p>
                            <p className="text-xs text-gray-400">{due.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-rose-600 font-semibold tabular-nums">{formatCurrency(due.outstanding_due)}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-gray-700 font-medium">{format(new Date(due.last_purchase_date || due.created_at), 'MMM dd, yyyy')}</span>
                        <span className="text-xs text-gray-400 block mt-0.5">{daysOld} days ago</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-xs font-medium border",
                          risk_level === 'High' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                          risk_level === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-blue-50 text-blue-600 border-blue-200'
                        )}>
                          {risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => { setSelectedCustomer(due); setCollectModalOpen(true); }}
                          className="flex items-center gap-1.5 text-[#1E40AF] font-medium text-xs hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all ml-auto"
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
