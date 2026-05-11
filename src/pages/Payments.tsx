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
      {/* Page Header */}
      <div>
        <h1 className="h1">Payment History</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Track all incoming payments and collections.</p>
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="input pl-10 w-auto"
              />
            </div>
            <select
              value={filterMode}
              onChange={e => setFilterMode(e.target.value)}
              className="input w-auto"
            >
              <option value="All">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Collection">Collection</option>
            </select>
            <div className="relative w-28">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#9CA3AF]">₹</span>
              <input
                type="number"
                placeholder="Min"
                value={filterMinAmount}
                onChange={e => setFilterMinAmount(e.target.value)}
                className="input pl-7 w-full"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Customer</th>
                <th>Mode</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[#1E40AF]" /></td></tr>
              ) : filteredPayments.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-[#9CA3AF] text-sm">No payments found.</td></tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="cursor-pointer" onClick={() => setSelectedBillId(payment.bill_id)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#059669]">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-[#111827] hover:text-[#1E40AF] transition-colors">
                            Bill #{payment.bill_number}
                          </p>
                          {payment.transaction_count > 1 && (
                            <span className="badge-neutral mt-0.5 inline-flex">
                              {payment.transaction_count} txns
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#6B7280]">
                          <User size={12} />
                        </div>
                        <span className="text-sm font-medium text-[#374151]">{payment.customer_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge-neutral">{payment.payment_mode}</span>
                    </td>
                    <td className="text-right">
                      <p className="text-[#059669] font-semibold tabular-nums">+{formatCurrency(payment.total_paid_in_history)}</p>
                    </td>
                    <td className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-[#374151]">{format(new Date(payment.latest_date), 'MMM dd, yyyy')}</span>
                        <span className="text-xs text-[#9CA3AF]">{format(new Date(payment.latest_date), 'hh:mm aa')}</span>
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
