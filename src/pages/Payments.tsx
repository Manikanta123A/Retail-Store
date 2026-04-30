import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Calendar, 
  User, 
  FileText,
  Filter,
  Download,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { billingService, customerService } from '@/services/api';

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await billingService.getBills();
      // Since we don't have a payments table, we extract payments from bills that have paid_amount > 0
      const billsWithPayments = response.data.filter((b: any) => b.paid_amount > 0);
      
      // Let's resolve customer names. For simplicity in UI, we fetch all customers and map them.
      const customersRes = await customerService.getCustomers();
      const customerMap: Record<string, string> = {};
      customersRes.data.forEach((c: any) => { customerMap[c.id] = c.name; });

      const formattedPayments = billsWithPayments.map((b: any) => ({
        id: b.id,
        customer_name: customerMap[b.customer_id] || 'Unknown',
        amount: b.paid_amount,
        payment_mode: 'Cash/Online', // Simplified
        bill_ref: `#${b.bill_number}`,
        date: b.created_at,
        notes: b.status === 'paid' ? 'Full settlement' : 'Partial payment'
      }));

      setPayments(formattedPayments);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => 
    p.customer_name.toLowerCase().includes(search.toLowerCase()) || 
    (p.bill_ref && p.bill_ref.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-sm text-gray-500">Log of all financial transactions and recoveries.</p>
        </div>
        <button className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-md text-sm font-semibold shadow-sm hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export History
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer or bill ref..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            Filter Mode
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-bold border-b border-gray-200">
                <th className="px-6 py-4">Transaction Details</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Mode</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
              ) : filteredPayments.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No payments found.</td></tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          <CreditCard size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{payment.customer_name}</p>
                          <p className="text-[10px] text-gray-500 italic truncate max-w-[200px]">{payment.notes || 'No notes'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900">
                      ₹{payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
                        {payment.payment_mode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-500">
                        <FileText size={14} />
                        <span className="font-medium">{payment.bill_ref || 'Direct Pay'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar size={14} />
                        <span>{format(new Date(payment.date), 'MMM dd, hh:mm a')}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
