import React, { useState, useEffect } from 'react';
import { X, Receipt, Printer, Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { billingService } from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/components/Toast';

interface BillDetailsModalProps {
  billId: string;
  onClose: () => void;
}

export default function BillDetailsModal({ billId, onClose }: BillDetailsModalProps) {
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBillDetails();
  }, [billId]);

  const fetchBillDetails = async () => {
    try {
      const res = await billingService.getBill(billId);
      setBill(res.data);
    } catch (e) {
      console.error(e);
      toast('Failed to load bill details.', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 modal-overlay">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!bill) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 modal-overlay">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden modal-enter flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1E40AF] rounded-lg flex items-center justify-center text-white shadow-sm">
              <Receipt size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Bill #{bill.bill_number}</h2>
              <p className="text-xs text-gray-400">{format(new Date(bill.created_at), 'MMM dd, yyyy hh:mm a')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-5">
            <p className="text-xs font-medium text-gray-400 mb-1">Customer</p>
            <p className="font-semibold text-gray-900">{bill.customer_name}</p>
          </div>

          <div className="mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-400 font-medium">
                  <th className="text-left pb-2">Item</th>
                  <th className="text-center pb-2">Qty</th>
                  <th className="text-right pb-2">Price</th>
                  <th className="text-right pb-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bill.items?.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-medium text-gray-700">{item.name}</td>
                    <td className="py-2.5 text-center text-gray-500 tabular-nums">{item.quantity}</td>
                    <td className="py-2.5 text-right text-gray-500 tabular-nums">{formatCurrency(item.price)}</td>
                    <td className="py-2.5 text-right font-medium text-gray-800 tabular-nums">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 border-t border-gray-100 pt-4 bg-gray-50 p-4 rounded-xl">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-800 tabular-nums">{formatCurrency(bill.total_amount)}</span>
            </div>
            {bill.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Discount</span>
                <span>-{formatCurrency(bill.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2 mt-2">
              <span className="text-gray-800">Total</span>
              <span className="text-[#1E40AF] tabular-nums">{formatCurrency(bill.final_amount)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2">
              <span className="text-gray-500">Paid</span>
              <span className="font-medium text-emerald-600 tabular-nums">{formatCurrency(bill.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium pt-1">
              <span className="text-gray-500">Balance Due</span>
              <span className="text-rose-600 tabular-nums">{formatCurrency(bill.due_amount)}</span>
            </div>
            
            {bill.payments && bill.payments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-400 mb-2">Payment History</p>
                <div className="space-y-2">
                  {bill.payments.map((p: any) => (
                    <div key={p.id} className="bg-white p-2.5 rounded-lg border border-gray-100">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{format(new Date(p.created_at), 'MMM dd, yyyy')} · {p.payment_mode}</span>
                        <span className="font-semibold text-emerald-600 tabular-nums">+{formatCurrency(p.amount)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="tabular-nums">{formatCurrency(p.balance_before)}</span>
                        <ArrowRight size={10} />
                        <span className="font-medium text-gray-600 tabular-nums">{formatCurrency(p.balance_after)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 mt-2 border-t border-gray-200">
                <span className={cn("px-2 py-1 rounded-md text-xs font-medium border", 
                  bill.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  bill.status === 'unpaid' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                )}>
                  {bill.status}
                </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Close
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 text-sm font-medium text-white bg-[#1E40AF] hover:bg-blue-800 rounded-lg shadow-sm transition-colors flex items-center gap-2">
            <Printer size={15} /> Print
          </button>
        </div>
      </div>
    </div>
  );
}
