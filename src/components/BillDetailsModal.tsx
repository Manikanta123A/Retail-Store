import React, { useState, useEffect } from 'react';
import { X, Receipt, Printer, Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { billingService } from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';

interface BillDetailsModalProps {
  billId: string;
  onClose: () => void;
}

export default function BillDetailsModal({ billId, onClose }: BillDetailsModalProps) {
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillDetails();
  }, [billId]);

  const fetchBillDetails = async () => {
    try {
      const res = await billingService.getBill(billId);
      setBill(res.data);
    } catch (e) {
      console.error(e);
      alert('Failed to load bill details.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!bill) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white shadow-sm">
              <Receipt size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Bill #{bill.bill_number}</h2>
              <p className="text-xs text-slate-500">{format(new Date(bill.created_at), 'MMM dd, yyyy hh:mm a')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</p>
            <p className="font-bold text-gray-900 text-lg">{bill.customer_name}</p>
          </div>

          <div className="mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="text-left pb-2">Item</th>
                  <th className="text-center pb-2">Qty</th>
                  <th className="text-right pb-2">Price</th>
                  <th className="text-right pb-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bill.items?.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-3 font-medium">{item.name}</td>
                    <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-600">{formatCurrency(item.price)}</td>
                    <td className="py-3 text-right font-bold text-gray-900">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 border-t border-gray-200 pt-4 bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-gray-900">{formatCurrency(bill.total_amount)}</span>
            </div>
            {bill.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(bill.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-black border-t border-gray-200 pt-2 mt-2">
              <span>Total Amount</span>
              <span className="text-blue-600">{formatCurrency(bill.final_amount)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2">
              <span className="text-slate-500">Amount Paid</span>
              <span className="font-medium text-emerald-600">{formatCurrency(bill.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1">
              <span className="text-slate-500">Balance Due</span>
              <span className="text-red-600">{formatCurrency(bill.due_amount)}</span>
            </div>
            
            {bill.payments && bill.payments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payment History</p>
                <div className="space-y-2">
                  {bill.payments.map((p: any) => (
                    <div key={p.id} className="bg-white p-2 rounded border border-gray-100">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">{format(new Date(p.created_at), 'MMM dd, yyyy')} ({p.payment_mode})</span>
                        <span className="font-black text-emerald-600">+{formatCurrency(p.amount)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="font-bold">{formatCurrency(p.balance_before)}</span>
                        <ArrowRight size={10} />
                        <span className="font-bold text-slate-600">{formatCurrency(p.balance_after)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 mt-2 border-t border-gray-200">
                <span className={cn("px-2 py-1 rounded text-xs font-bold uppercase", 
                  bill.status === 'paid' ? 'bg-green-100 text-green-700' :
                  bill.status === 'unpaid' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                )}>
                  STATUS: {bill.status}
                </span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
            Close
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors flex items-center gap-2">
            <Printer size={16} /> Print Bill
          </button>
        </div>
      </div>
    </div>
  );
}
