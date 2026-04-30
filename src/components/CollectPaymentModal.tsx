import React, { useState } from 'react';
import { X, CheckCircle, IndianRupee } from 'lucide-react';
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
        await customerService.collectDues(targetId, collectAmount);
      } else {
        await billingService.payBill(targetId, collectAmount);
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
          <h2 className="text-lg font-bold">Collect Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleCollect} className="p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Collecting From</p>
            <p className="font-bold text-gray-900">{customerName}</p>
            {type === 'customer' && <p className="text-[10px] text-slate-500 mt-1">This will automatically pay off oldest bills first.</p>}
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Amount (₹)</label>
              <span className="text-xs text-red-600 font-bold">Due: ₹{maxAmount.toLocaleString()}</span>
            </div>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="number" 
                step="0.01"
                min="0.01"
                max={maxAmount}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white border border-gray-300 rounded-md font-black text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {error && <p className="text-xs font-bold text-red-500">{error}</p>}

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
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
