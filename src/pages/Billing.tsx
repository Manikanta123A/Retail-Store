import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Trash2, Plus, Minus, Receipt, Send, Printer, Check } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { itemService, customerService, billingService } from '@/services/api';

enum PaymentStatus {
  PAID = 'Paid',
  PARTIAL = 'Partial',
  DUE = 'Due'
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  max_quantity: number;
}

export default function Billing() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchItem, setSearchItem] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PAID);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchItems();
  }, [searchItem]);

  useEffect(() => {
    fetchCustomers();
  }, [searchCustomer]);

  const fetchItems = async () => {
    try {
      const res = await itemService.getItems(searchItem);
      setItems(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await customerService.getCustomers(searchCustomer);
      setCustomers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = 0; // Set to 0 or calculate as needed
  const total = subtotal + tax;

  useEffect(() => {
    if (paymentStatus === PaymentStatus.PAID) {
      setPaidAmount(total);
    } else if (paymentStatus === PaymentStatus.DUE) {
      setPaidAmount(0);
    } else if (paymentStatus === PaymentStatus.PARTIAL && paidAmount >= total) {
      setPaidAmount(0); // Reset if it was previously set higher
    }
  }, [paymentStatus, total]);

  const addToCart = (item: any) => {
    if (item.stock_quantity <= 0) return;
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      if (existing.quantity < existing.max_quantity) {
        setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
    } else {
      setCart([...cart, { id: item.id, name: item.name, price: item.price, quantity: 1, max_quantity: item.stock_quantity }]);
    }
    setSearchItem('');
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQ = c.quantity + delta;
        if (newQ > 0 && newQ <= c.max_quantity) return { ...c, quantity: newQ };
        return c;
      }
      return c;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const handleSaveBill = async () => {
    if (!selectedCustomer) {
      alert("Please select a customer");
      return;
    }
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer_id: selectedCustomer.id,
        items: cart.map(c => ({ item_id: c.id, quantity: c.quantity })),
        discount_amount: 0,
        paid_amount: paidAmount
      };
      await billingService.createBill(payload);
      setSuccessMessage("Bill saved successfully!");
      setCart([]);
      setSelectedCustomer(null);
      setPaymentStatus(PaymentStatus.PAID);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e) {
      console.error(e);
      alert("Failed to save bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      {/* Left Column: Cart & Billing */}
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white shadow-sm">
              <Receipt size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide">New Bill Generation</h2>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <button onClick={() => setCart([])} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition-all">
            <Trash2 size={18} />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search items by name to add..."
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            {searchItem && items.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} onClick={() => addToCart(item)} className="p-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-slate-400">Stock: {item.stock_quantity}</p>
                    </div>
                    <span className="font-bold text-blue-600">{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto">
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
                {cart.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">Cart is empty</td></tr>
                ) : cart.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="font-bold text-gray-900">{item.name}</div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-2 bg-white rounded border border-gray-200 p-0.5 w-fit mx-auto shadow-sm">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-50 text-slate-400"><Minus size={12} /></button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-50 text-slate-400"><Plus size={12} /></button>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="font-medium text-slate-600">{formatCurrency(item.price)}</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="font-bold text-[#111827]">{formatCurrency(item.price * item.quantity)}</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-[#E5E7EB]">
          <div className="flex justify-end">
            <div className="space-y-2 w-full md:w-56">
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                <span className="text-xs font-black text-gray-900 uppercase">Total Amount</span>
                <span className="text-lg font-black text-[#2563EB]">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Customer & Actions */}
      <div className="w-full md:w-80 flex flex-col gap-6">
        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm space-y-4">
           <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer Info</h3>
            {!selectedCustomer && (
              <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                <UserPlus size={16} />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {!selectedCustomer ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Find customer..."
                  value={searchCustomer}
                  onChange={e => setSearchCustomer(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-100 rounded-md text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
                {searchCustomer && customers.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                    {customers.map(c => (
                      <div key={c.id} onClick={() => { setSelectedCustomer(c); setSearchCustomer(''); }} className="p-2 hover:bg-blue-50 cursor-pointer text-sm">
                        <p className="font-bold">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-[#F8FAFC] rounded-md border border-slate-100 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
                      {selectedCustomer.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#111827]">{selectedCustomer.name}</p>
                      <p className="text-[10px] text-slate-400">{selectedCustomer.phone}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
              </div>
            )}
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

            {paymentStatus === PaymentStatus.PARTIAL && (
              <div className="mt-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount Paid</label>
                <input type="number" value={paidAmount} onChange={e => setPaidAmount(parseFloat(e.target.value))} className="mt-1 w-full p-2 text-sm border rounded" />
              </div>
            )}
          </div>

          <div className="flex-1" />

          {successMessage && (
            <div className="p-2 bg-green-100 text-green-800 text-xs text-center rounded flex items-center justify-center gap-1 font-bold">
              <Check size={14} /> {successMessage}
            </div>
          )}

          <div className="space-y-2">
            <button 
              onClick={handleSaveBill} 
              disabled={isSubmitting}
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white py-3 rounded-md font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Printer size={16} />
              {isSubmitting ? 'SAVING...' : 'SAVE & PRINT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
