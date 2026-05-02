import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 modal-overlay">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden modal-enter">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Collect Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleCollect} className="p-6 space-y-5">
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1">Collecting from</p>
            <p className="font-semibold text-gray-900">{customerName}</p>
            {type === 'customer' && <p className="text-xs text-gray-400 mt-1">Applied to oldest bills first.</p>}
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">Amount (₹)</label>
              <span className="text-xs text-rose-600 font-medium tabular-nums">Due: ₹{maxAmount.toLocaleString()}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
              <input 
                type="number" 
                step="0.01"
                min="0.01"
                max={maxAmount}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-lg font-semibold text-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">Payment mode</label>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'UPI', 'Card'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                    paymentMode === mode 
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700' 
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs font-medium text-rose-500 bg-rose-50 p-2.5 rounded-lg border border-rose-100">{error}</p>}

          <div className="pt-1">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.97]"
            >
              {loading ? 'Processing...' : (
                <>
                  <CheckCircle size={16} /> Confirm Collection
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
