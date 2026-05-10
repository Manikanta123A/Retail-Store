import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Receipt, Printer, Loader2, ArrowRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { billingService } from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

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

  const getStatusConfig = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'paid': return { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 };
      case 'unpaid': return { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: AlertCircle };
      default: return { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock };
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden border border-gray-100"
        >
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !bill ? (
            <div className="h-64 flex items-center justify-center text-gray-500">Bill not found</div>
          ) : (
            <>
              {/* Header - Fixed */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-white z-10 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-md">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900 tracking-tight">Invoice #{bill.bill_number}</h2>
                      {(() => {
                        const StatusIcon = getStatusConfig(bill.status).icon;
                        return (
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1", getStatusConfig(bill.status).bg, getStatusConfig(bill.status).color, getStatusConfig(bill.status).border)}>
                            <StatusIcon size={10} />
                            {bill.status}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-sm text-gray-500 font-medium">{format(new Date(bill.created_at), 'MMM dd, yyyy • hh:mm a')}</p>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 space-y-6 scroll-smooth custom-scrollbar">
                
                {/* Customer Info Card */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Billed To</p>
                    <p className="text-base font-bold text-gray-900">{bill.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Amount</p>
                    <p className="text-xl font-black text-blue-700 tabular-nums">{formatCurrency(bill.final_amount)}</p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                    <h3 className="text-sm font-bold text-gray-700">Order Items</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white border-b border-gray-100 text-xs text-gray-400 font-bold uppercase tracking-wider">
                        <th className="text-left py-3 px-5">Item</th>
                        <th className="text-center py-3 px-5">Qty</th>
                        <th className="text-right py-3 px-5">Rate</th>
                        <th className="text-right py-3 px-5">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bill.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-5 font-semibold text-gray-800">{item.name}</td>
                          <td className="py-3 px-5 text-center font-medium text-gray-600 tabular-nums">{item.quantity}</td>
                          <td className="py-3 px-5 text-right text-gray-500 tabular-nums">{formatCurrency(item.price)}</td>
                          <td className="py-3 px-5 text-right font-bold text-gray-900 tabular-nums">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Two Column Layout for Summary & Payments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Payment History */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-700 pl-1">Payment History</h3>
                    {bill.payments && bill.payments.length > 0 ? (
                      <div className="space-y-3">
                        {bill.payments.map((p: any) => (
                          <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 group-hover:bg-emerald-400 transition-colors" />
                            <div className="flex justify-between items-start mb-2 pl-2">
                              <div>
                                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider mb-1">
                                  {p.payment_mode}
                                </span>
                                <p className="text-xs text-gray-500 font-medium">{format(new Date(p.created_at), 'MMM dd, yyyy')}</p>
                              </div>
                              <span className="font-bold text-emerald-600 tabular-nums text-base">+{formatCurrency(p.amount)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400 pl-2 mt-2 pt-2 border-t border-gray-50">
                              <span className="tabular-nums font-medium">Bal: {formatCurrency(p.balance_before)}</span>
                              <ArrowRight size={12} className="text-gray-300" />
                              <span className="font-bold text-gray-700 tabular-nums">{formatCurrency(p.balance_after)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white p-6 rounded-xl border border-dashed border-gray-200 text-center flex flex-col items-center justify-center">
                        <AlertCircle className="text-gray-300 w-8 h-8 mb-2" />
                        <p className="text-sm text-gray-400 font-medium">No payments recorded</p>
                      </div>
                    )}
                  </div>

                  {/* Financial Summary */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-700 pl-1">Summary</h3>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-gray-500 font-medium">Subtotal</span>
                        <span className="font-semibold text-gray-800 tabular-nums">{formatCurrency(bill.total_amount)}</span>
                      </div>
                      {bill.discount_amount > 0 && (
                        <div className="flex justify-between text-sm items-center text-emerald-600">
                          <span className="font-medium">Discount</span>
                          <span className="font-bold tabular-nums">-{formatCurrency(bill.discount_amount)}</span>
                        </div>
                      )}
                      
                      <div className="h-px bg-gray-100 my-2" />
                      
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-gray-500 font-medium">Total Paid</span>
                        <span className="font-bold text-emerald-600 tabular-nums">{formatCurrency(bill.paid_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-gray-500 font-medium">Balance Due</span>
                        <span className="font-bold text-rose-600 tabular-nums">{formatCurrency(bill.due_amount)}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Footer - Fixed */}
              <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3 z-10 shrink-0">
                <button 
                  onClick={onClose} 
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => window.print()} 
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
                >
                  <Printer size={16} /> Print Invoice
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

