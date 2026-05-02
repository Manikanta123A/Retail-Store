import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Trash2, Plus, Minus, Receipt, Printer, Check, ShoppingCart } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { itemService, customerService, billingService } from '@/services/api';
import { useToast } from '@/components/Toast';

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
  const [paidAmount, setPaidAmount] = useState<string>('0');
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

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
  const total = subtotal;

  useEffect(() => {
    if (paymentStatus === PaymentStatus.PAID) {
      setPaidAmount(total.toString());
    } else if (paymentStatus === PaymentStatus.DUE) {
      setPaidAmount('0');
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
      toast("Please select a customer first", "error");
      return;
    }
    if (cart.length === 0) {
      toast("Cart is empty — add items first", "error");
      return;
    }

    setIsSubmitting(true);
    const pAmount = parseFloat(paidAmount) || 0;
    try {
      const payload = {
        customer_id: selectedCustomer?.id,
        items: cart.map(i => ({ item_id: i.id, quantity: i.quantity })),
        total_amount: total,
        paid_amount: pAmount,
        payment_mode: paymentMode,
        status: pAmount >= total ? 'paid' : (pAmount > 0 ? 'partial' : 'unpaid')
      };
      await billingService.createBill(payload);
      toast("Bill saved successfully!", "success");
      setCart([]);
      setSelectedCustomer(null);
      setPaymentStatus(PaymentStatus.PAID);
    } catch (e) {
      console.error(e);
      toast("Failed to save bill. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:h-[calc(100vh-160px)] gap-6">
      {/* Left Column: Cart & Billing */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden min-h-[400px]">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1E40AF] rounded-lg flex items-center justify-center text-white shadow-sm">
              <Receipt size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">New Bill</h2>
              <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
          <button onClick={() => setCart([])} className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Clear cart">
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search items to add..."
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
            />
            {searchItem && items.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} onClick={() => addToCart(item)} className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-sm transition-colors">
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400">Stock: {item.stock_quantity}</p>
                    </div>
                    <span className="font-semibold text-[#1E40AF] tabular-nums">{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white sticky top-0 border-b border-gray-100">
                <tr className="text-xs text-gray-400 font-medium">
                  <th className="pb-2.5 px-2">Item</th>
                  <th className="text-center pb-2.5 px-2">Qty</th>
                  <th className="text-right pb-2.5 px-2">Price</th>
                  <th className="text-right pb-2.5 px-2">Total</th>
                  <th className="w-8 pb-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cart.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center">
                    <ShoppingCart size={32} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">Add items to get started</p>
                  </td></tr>
                ) : cart.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-2 font-medium text-gray-800">{item.name}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-1 bg-gray-50 rounded-lg border border-gray-200 p-0.5 w-fit mx-auto">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-white rounded text-gray-400 transition-colors"><Minus size={12} /></button>
                        <span className="text-sm font-semibold w-6 text-center tabular-nums">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-white rounded text-gray-400 transition-colors"><Plus size={12} /></button>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-gray-500 tabular-nums">{formatCurrency(item.price)}</td>
                    <td className="py-3 px-2 text-right font-semibold text-gray-900 tabular-nums">{formatCurrency(item.price * item.quantity)}</td>
                    <td className="py-3 px-1 text-right">
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-5 py-4 bg-gray-50/80 border-t border-gray-100">
          <div className="flex justify-end">
            <div className="space-y-1 w-full md:w-56">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Total</span>
                <span className="text-xl font-bold text-[#1E40AF] tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Customer & Actions */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 space-y-4">
           <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-400">Customer</h3>
            {!selectedCustomer && (
              <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <UserPlus size={16} />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {!selectedCustomer ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Find customer..."
                  value={searchCustomer}
                  onChange={e => setSearchCustomer(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                />
                {searchCustomer && customers.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                    {customers.map(c => (
                      <div key={c.id} onClick={() => { setSelectedCustomer(c); setSearchCustomer(''); }} className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer text-sm transition-colors">
                        <p className="font-medium text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-medium text-xs shadow-sm">
                      {selectedCustomer.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{selectedCustomer.name}</p>
                      <p className="text-xs text-gray-400">{selectedCustomer.phone}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 flex flex-col gap-5 flex-1 overflow-y-auto min-h-[300px]">
          <h3 className="text-xs font-medium text-gray-400">Settlement</h3>
          
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500">Payment Status</p>
            <div className="grid grid-cols-3 gap-2">
              {[PaymentStatus.PAID, PaymentStatus.PARTIAL, PaymentStatus.DUE].map((status) => (
                <button
                  key={status}
                  onClick={() => setPaymentStatus(status)}
                  className={cn(
                    "py-2.5 rounded-lg text-xs font-medium transition-all border",
                    paymentStatus === status 
                      ? "bg-[#1E40AF] text-white border-[#1E40AF] shadow-sm" 
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>

            {paymentStatus !== PaymentStatus.DUE && (
              <div className="space-y-4 pt-1">
                {paymentStatus === PaymentStatus.PARTIAL && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">Amount paid (₹)</label>
                    <input 
                      type="number" 
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-3 font-semibold text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none tabular-nums"
                      placeholder="0.00"
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Payment mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Cash', 'UPI', 'Card'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={cn(
                          "py-2 px-1 rounded-lg text-xs font-medium border transition-all",
                          paymentMode === mode 
                            ? 'bg-blue-50 border-blue-400 text-[#1E40AF]' 
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1" />

          <div className="space-y-2">
            <button 
              onClick={handleSaveBill} 
              disabled={isSubmitting}
              className="w-full bg-[#1E40AF] hover:bg-blue-800 text-white py-3 rounded-lg font-medium text-sm shadow-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Printer size={16} />
              {isSubmitting ? 'Saving...' : 'Save & Print'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
