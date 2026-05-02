import React, { useState, useEffect } from 'react';
import {
  Search, Calendar, User, FileText, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { billingService } from '@/services/api';
import BillDetailsModal from '@/components/BillDetailsModal';
import { formatCurrency, cn } from '@/lib/utils';

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMode, setFilterMode] = useState('All');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [search, filterDate]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params: any = { search };
      if (filterDate) params.start_date = filterDate;
      const res = await billingService.getPayments(params);

      const grouped: any = {};
      res.data.forEach((p: any) => {
        if (!grouped[p.bill_id]) {
          grouped[p.bill_id] = { ...p, total_paid_in_history: 0, transaction_count: 0, latest_date: p.created_at };
        }
        grouped[p.bill_id].total_paid_in_history += p.amount;
        grouped[p.bill_id].transaction_count += 1;
        if (new Date(p.created_at) > new Date(grouped[p.bill_id].latest_date)) {
          grouped[p.bill_id].latest_date = p.created_at;
          grouped[p.bill_id].payment_mode = p.payment_mode;
        }
      });

      setPayments(Object.values(grouped));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesMode = filterMode === 'All' || p.payment_mode === filterMode;
    const matchesMinAmount = !filterMinAmount || p.amount >= parseFloat(filterMinAmount);
    return matchesMode && matchesMinAmount;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Payment History</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track all incoming payments and collections.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <select
              value={filterMode}
              onChange={e => setFilterMode(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              <option value="All">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Collection">Collection</option>
            </select>
            <div className="relative w-28">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">₹</span>
              <input
                type="number"
                placeholder="Min"
                value={filterMinAmount}
                onChange={e => setFilterMinAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-gray-400 font-medium border-b border-gray-100">
                <th className="px-6 py-3">Transaction</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Mode</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600" /></td></tr>
              ) : filteredPayments.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-gray-400 text-sm">No payments found.</td></tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="px-6 py-3.5">
                      <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => setSelectedBillId(payment.bill_id)}
                      >
                        <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 group-hover:text-[#1E40AF] transition-colors">Bill #{payment.bill_number}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {payment.transaction_count > 1 && (
                              <span className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-md font-medium border border-blue-200">
                                {payment.transaction_count} txns
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <User size={12} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{payment.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-md border border-gray-200">
                        {payment.payment_mode}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <p className="text-emerald-600 font-semibold tabular-nums">+{formatCurrency(payment.total_paid_in_history)}</p>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-gray-700">{format(new Date(payment.latest_date), 'MMM dd, yyyy')}</span>
                        <span className="text-xs text-gray-400">{format(new Date(payment.latest_date), 'hh:mm aa')}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBillId && (
        <BillDetailsModal billId={selectedBillId} onClose={() => setSelectedBillId(null)} />
      )}
    </div>
  );
}
