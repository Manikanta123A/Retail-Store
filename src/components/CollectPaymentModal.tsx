import React, { useState } from 'react';
import { X, CheckCircle, CreditCard } from 'lucide-react';
import { customerService, billingService } from '@/services/api';

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
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (collectAmount > maxAmount) {
      setError(`Cannot collect more than the due amount (₹${maxAmount}).`);
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

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Collect Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full border shadow-sm">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleCollect} className="p-5 space-y-5">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Collecting From</p>
            <p className="font-bold text-gray-900">{customerName}</p>
            {type === 'customer' && <p className="text-[10px] text-slate-500 mt-1">Applying to oldest bills first (FCFS).</p>}
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Amount (₹)</label>
              <span className="text-xs text-red-600 font-bold">Due: ₹{maxAmount.toLocaleString()}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
              <input 
                type="number" 
                step="0.01"
                min="0.01"
                max={maxAmount}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white border border-gray-300 rounded-md font-black text-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-widest block mb-2">Payment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'UPI', 'Card'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 px-3 rounded-md text-xs font-bold border transition-all ${
                    paymentMode === mode 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20' 
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs font-bold text-red-500 bg-red-50 p-2 rounded border border-red-100">{error}</p>}

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-black text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (
                <>
                  <CheckCircle size={18} /> Confirm Collection
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
