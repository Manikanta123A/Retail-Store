import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle } from 'lucide-react';
import { customerService, billingService } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';

interface CollectPaymentModalProps {
  type: 'customer' | 'bill';
  targetId: string;
  customerName: string;
  maxAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CollectPaymentModal({ type, targetId, customerName, maxAmount, onClose, onSuccess }: CollectPaymentModalProps) {
  const [amount, setAmount] = useState<string>(maxAmount.toString());
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    const collectAmount = parseFloat(amount);
    
    if (isNaN(collectAmount) || collectAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (collectAmount > maxAmount) {
      setError(`Cannot collect more than ₹${maxAmount.toLocaleString()}.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (type === 'customer') {
        await customerService.collectDues(targetId, collectAmount, paymentMode);
      } else {
        await billingService.payBill(targetId, collectAmount, paymentMode);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900">Collect Payment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-white hover:shadow-sm transition-all">
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleCollect} className="p-6 space-y-6 bg-white">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">Collecting from</p>
              <p className="font-bold text-gray-900 text-lg">{customerName}</p>
              {type === 'customer' && <p className="text-[11px] font-medium text-blue-600/70 mt-1">Applied to oldest bills first.</p>}
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Amount (₹)</label>
                <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md font-bold border border-rose-100 tabular-nums">Due: ₹{maxAmount.toLocaleString()}</span>
              </div>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium group-focus-within:text-emerald-500 transition-colors">₹</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  max={maxAmount}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-black text-xl text-gray-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 outline-none transition-all tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Payment mode</label>
              <div className="grid grid-cols-3 gap-2">
                {['Cash', 'UPI', 'Card'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-3 px-3 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                      paymentMode === mode 
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                {error}
              </motion.div>
            )}

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95"
              >
                {loading ? 'Processing...' : (
                  <>
                    <CheckCircle size={18} strokeWidth={2.5} /> Confirm Collection
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
