import React, { useState } from 'react';
import { Search, UserPlus, Trash2, Plus, Minus, Receipt, Send, Printer } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { PaymentStatus } from '@/types';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function Billing() {
  const [cart, setCart] = useState<CartItem[]>([
    { id: '1', name: 'Nike Air Zoom', price: 2450, quantity: 2 },
    { id: '2', name: 'Titan Edge 4', price: 1890, quantity: 1 },
  ]);
  const [customer, setCustomer] = useState({ name: 'Walk-in Customer', phone: '', email: '' });
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PAID);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      {/* Left Column: Cart & Billing */}
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white shadow-sm">
              <Receipt size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide">New Bill Generation</h2>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Bill ID: #TS-10425 • {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <button className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition-all">
            <Trash2 size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search items by name, barcode or SKU..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <table className="w-full text-xs text-left">
            <thead className="bg-white sticky top-0 border-b border-gray-100">
              <tr className="text-slate-500 font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">Description</th>
                <th className="text-center pb-3 px-2">Qty</th>
                <th className="text-right pb-3 px-2">Unit Price</th>
                <th className="text-right pb-3 px-2">Total</th>
                <th className="w-10 pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cart.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-2">
                    <div className="font-bold text-gray-900">{item.name}</div>
                    <div className="text-[10px] text-slate-400">SKU: HW-9021</div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-center gap-2 bg-white rounded border border-gray-200 p-0.5 w-fit mx-auto shadow-sm">
                      <button className="w-6 h-6 flex items-center justify-center hover:bg-slate-50 text-slate-400"><Minus size={12} /></button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button className="w-6 h-6 flex items-center justify-center hover:bg-slate-50 text-slate-400"><Plus size={12} /></button>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="font-medium text-slate-600">{formatCurrency(item.price)}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="font-bold text-[#111827]">{formatCurrency(item.price * item.quantity)}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-[#E5E7EB]">
          <div className="flex justify-end">
            <div className="space-y-2 w-56">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase">
                <span>Subtotal</span>
                <span className="text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase">
                <span>Tax (GST 18%)</span>
                <span className="text-slate-900">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                <span className="text-xs font-black text-gray-900 uppercase">Total Amount</span>
                <span className="text-lg font-black text-[#2563EB]">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Customer & Actions */}
      <div className="w-80 flex flex-col gap-6">
        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm space-y-4">
           <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer Info</h3>
            <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors">
              <UserPlus size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Find customer..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-100 rounded-md text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-md border border-slate-100">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">WC</div>
                  <div>
                    <p className="text-xs font-bold text-[#111827]">Walk-in Customer</p>
                    <p className="text-[10px] text-slate-400">Regular Session</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm flex flex-col gap-6 flex-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Settlement Info</h3>
          
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bill Status</p>
            <div className="grid grid-cols-1 gap-2">
              {[PaymentStatus.PAID, PaymentStatus.PARTIAL, PaymentStatus.DUE].map((status) => (
                <button
                  key={status}
                  onClick={() => setPaymentStatus(status)}
                  className={cn(
                    "w-full py-2.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all border",
                    paymentStatus === status 
                      ? "bg-[#2563EB] text-white border-[#2563EB] shadow-md" 
                      : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1" />

          <div className="space-y-2">
            <button className="w-full bg-[#2563EB] hover:bg-blue-700 text-white py-3 rounded-md font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
              <Printer size={16} />
              SAVE & PRINT
            </button>
            <button className="w-full bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-md font-bold text-xs border border-slate-200 transition-all flex items-center justify-center gap-2">
              <Send size={16} />
              EMAIL INVOICE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
