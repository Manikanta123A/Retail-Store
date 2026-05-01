import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Calendar,
  User,
  FileText,
  Filter,
  Loader2,
  ArrowRight,
  Banknote
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

      // Group payments by bill_id
      const grouped: any = {};
      res.data.forEach((p: any) => {
        if (!grouped[p.bill_id]) {
          grouped[p.bill_id] = {
            ...p,
            total_paid_in_history: 0,
            transaction_count: 0,
            latest_date: p.created_at
          };
        }
        grouped[p.bill_id].total_paid_in_history += p.amount;
        grouped[p.bill_id].transaction_count += 1;
        if (new Date(p.created_at) > new Date(grouped[p.bill_id].latest_date)) {
          grouped[p.bill_id].latest_date = p.created_at;
          grouped[p.bill_id].payment_mode = p.payment_mode; // show latest mode
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-sm text-gray-500">View and track all incoming payments and collections.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col lg:flex-row gap-4 bg-gray-50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <select
              value={filterMode}
              onChange={e => setFilterMode(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="All">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Collection">Collection</option>
            </select>

            <div className="relative w-32 text-gray-400">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold">₹</span>
              <input
                type="number"
                placeholder="Min ₹"
                value={filterMinAmount}
                onChange={e => setFilterMinAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-bold border-b border-gray-200">
                <th className="px-6 py-4">Transaction Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Mode</th>
                <th className="px-6 py-4 text-right">Amount Paid</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
              ) : filteredPayments.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-gray-500 font-medium">No payments found.</td></tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-blue-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div
                        className="flex items-center gap-3 group cursor-pointer"
                        onClick={() => setSelectedBillId(payment.bill_id)}
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-blue-600">Bill #{payment.bill_number}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-gray-400 uppercase font-black">Latest Activity</p>
                            {payment.transaction_count > 1 && (
                              <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                                {payment.transaction_count} Transactions
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <User size={14} />
                        </div>
                        <span className="text-sm font-bold text-gray-700">{payment.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-full tracking-wider">
                        {payment.payment_mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-emerald-600 font-black text-base">+{formatCurrency(payment.total_paid_in_history)}</p>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 mt-1">
                        <span>Paid in Total</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                          <Calendar size={14} className="text-gray-400" />
                          {format(new Date(payment.latest_date), 'MMM dd, yyyy')}
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {format(new Date(payment.latest_date), 'hh:mm aa')}
                        </p>
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
        <BillDetailsModal
          billId={selectedBillId}
          onClose={() => setSelectedBillId(null)}
        />
      )}
    </div>
  );
}
