import React, { useState, useEffect } from 'react';
import {
  Users, Search, Plus, Phone, Mail, Loader2, X, Trash2, Edit3, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { customerService, billingService } from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import BillDetailsModal from '@/components/BillDetailsModal';
import CollectPaymentModal from '@/components/CollectPaymentModal';
import { useToast } from '@/components/Toast';

// Hash a string to pick from a palette of avatar colors
const avatarColors = [
  'from-blue-500 to-blue-700',
  'from-teal-500 to-teal-700',
  'from-violet-500 to-violet-700',
  'from-rose-500 to-rose-700',
  'from-amber-500 to-amber-700',
  'from-emerald-500 to-emerald-700',
];
function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDue, setFilterDue] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState({ id: '', name: '', phone: '', email: '' });

  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await customerService.getCustomers(searchTerm);
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await customerService.addCustomer(newCustomer);
      setShowAddModal(false);
      setNewCustomer({ name: '', phone: '', email: '' });
      fetchCustomers();
      toast("Customer added successfully", "success");
    } catch (error) {
      console.error('Failed to add customer', error);
      toast('Failed to add customer. Ensure phone number is unique.', 'error');
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await customerService.updateCustomer(editCustomer.id, {
        name: editCustomer.name,
        phone: editCustomer.phone,
        email: editCustomer.email
      });
      setShowEditModal(false);
      fetchCustomers();
      toast("Customer updated", "success");
    } catch (error) {
      console.error('Failed to update customer', error);
      toast('Failed to update customer.', 'error');
    }
  };

  const handleDeleteCustomer = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this customer? This may fail if they have bills.')) {
      try {
        await customerService.deleteCustomer(id);
        fetchCustomers();
        toast("Customer deleted", "info");
      } catch (error) {
        console.error('Failed to delete customer', error);
        toast('Cannot delete — customer has existing bills.', 'error');
      }
    }
  };

  const filteredCustomers = customers.filter(c =>
    filterDue ? c.outstanding_due > 0 : true
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your customer database and history.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#1E40AF] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-blue-800 transition-colors active:scale-[0.97] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setFilterDue(!filterDue)}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm font-medium transition-colors",
              filterDue ? "border-amber-400 text-amber-700 bg-amber-50" : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
            )}
          >
            {filterDue ? 'Dues Only' : 'All Customers'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-gray-400 font-medium border-b border-gray-100">
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Outstanding</th>
                <th className="px-6 py-3">Last Purchase</th>
                <th className="px-6 py-3 text-right">Total Business</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                    <p className="text-sm">Loading customers...</p>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    <Users className="mx-auto mb-2 text-gray-200" size={32} />
                    <p className="text-sm">No customers found.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-medium text-xs shadow-sm", getAvatarColor(customer.name))}>
                          {customer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-gray-800 group-hover:text-[#1E40AF] transition-colors">{customer.name}</span>
                          <div className="flex items-center gap-3 mt-0.5 text-gray-400 text-xs">
                            <span className="flex items-center gap-1"><Phone size={11} /> {customer.phone}</span>
                            {customer.email && <span className="flex items-center gap-1"><Mail size={11} /> {customer.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={customer.outstanding_due > 0 
                        ? 'text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded-md text-sm border border-amber-200 tabular-nums' 
                        : 'text-emerald-600 font-medium text-sm'
                      }>
                        {customer.outstanding_due > 0 ? formatCurrency(customer.outstanding_due) : 'Settled'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 text-sm">
                      {customer.last_purchase_date
                        ? format(new Date(customer.last_purchase_date), 'MMM dd, yyyy')
                        : 'Never'}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-gray-800 tabular-nums">
                      {formatCurrency(customer.total_purchases)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditCustomer({ id: customer.id, name: customer.name, phone: customer.phone, email: customer.email || '' });
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#1E40AF] hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteCustomer(customer.id, e)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden modal-enter">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Add customer</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Name</label>
                <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
                <input required type="text" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Email (optional)</label>
                <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#1E40AF] text-white rounded-lg font-medium text-sm hover:bg-blue-800 transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden modal-enter">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Edit customer</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Name</label>
                <input required type="text" value={editCustomer.name} onChange={e => setEditCustomer({ ...editCustomer, name: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
                <input required type="text" value={editCustomer.phone} onChange={e => setEditCustomer({ ...editCustomer, phone: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Email (optional)</label>
                <input type="email" value={editCustomer.email} onChange={e => setEditCustomer({ ...editCustomer, email: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#1E40AF] text-white rounded-lg font-medium text-sm hover:bg-blue-800 transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={fetchCustomers}
        />
      )}
    </div>
  );
}

function CustomerDetailsModal({ customer, onClose, onUpdate }: { customer: any, onClose: () => void, onUpdate: () => void }) {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [collectBill, setCollectBill] = useState<any>(null);
  const [collectCustomerModal, setCollectCustomerModal] = useState(false);
  const [quickAmount, setQuickAmount] = useState<string>(customer.outstanding_due.toString());
  const [quickMode, setQuickMode] = useState<string>('Cash');
  const [isCollecting, setIsCollecting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchBills();
  }, [customer.id]);

  const handleQuickCollect = async () => {
    const amount = parseFloat(quickAmount);
    if (isNaN(amount) || amount <= 0) { toast('Enter a valid amount', 'error'); return; }
    if (amount > customer.outstanding_due) { toast('Amount exceeds due', 'error'); return; }

    setIsCollecting(true);
    try {
      await customerService.collectDues(customer.id, amount, quickMode);
      setQuickAmount('0');
      fetchBills();
      onUpdate();
      toast(`₹${amount.toLocaleString()} collected from ${customer.name}`, 'success');
    } catch (e) {
      console.error(e);
      toast('Failed to collect payment', 'error');
    } finally {
      setIsCollecting(false);
    }
  };

  const fetchBills = async () => {
    setLoading(true);
    try {
      const response = await billingService.getBills('', customer.id);
      setBills(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBill = async (id: string) => {
    if (confirm('Delete this bill? Stock and dues will be reverted.')) {
      try {
        await billingService.deleteBill(id);
        fetchBills();
        toast("Bill deleted", "info");
      } catch (error) {
        console.error('Failed to delete bill', error);
        toast('Failed to delete bill.', 'error');
      }
    }
  };

  const filteredBills = bills.filter(b => statusFilter ? b.status === statusFilter : true);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 modal-overlay">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden modal-enter">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{customer.name}</h2>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Phone size={11} /> {customer.phone}</span>
              {customer.email && <span className="flex items-center gap-1"><Mail size={11} /> {customer.email}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <p className="text-xs font-medium text-blue-600 mb-1">Total Business</p>
              <p className="text-lg font-semibold text-blue-900 tabular-nums">{formatCurrency(customer.total_purchases)}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
              <p className="text-xs font-medium text-amber-600 mb-1">Pending Due</p>
              <p className="text-lg font-semibold text-amber-900 tabular-nums">{formatCurrency(customer.outstanding_due)}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
              <p className="text-xs font-medium text-gray-500 mb-1">Last Purchase</p>
              <p className="text-lg font-semibold text-gray-800">
                {customer.last_purchase_date ? format(new Date(customer.last_purchase_date), 'dd MMM yyyy') : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4 mb-4">
            <h3 className="text-sm font-medium text-gray-600">Billing History</h3>

            <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">₹</span>
                <input
                  type="number"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-24 pl-5 pr-2 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 outline-none tabular-nums"
                  placeholder="Amount"
                />
              </div>
              <select
                value={quickMode}
                onChange={(e) => setQuickMode(e.target.value)}
                className="text-xs font-medium bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
              <button
                onClick={handleQuickCollect}
                disabled={isCollecting || parseFloat(quickAmount) <= 0}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium rounded-md shadow-sm transition-all flex items-center gap-1.5"
              >
                {isCollecting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                Collect
              </button>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Due</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-400 font-medium">
                    <th className="p-3">Bill No.</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Paid</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredBills.length > 0 ? filteredBills.map(b => (
                    <tr key={b.id} className="hover:bg-blue-50/40 cursor-pointer transition-colors" onClick={() => setSelectedBillId(b.id)}>
                      <td className="p-3 font-mono text-xs text-gray-500">#{b.bill_number}</td>
                      <td className="p-3 text-gray-600">{format(new Date(b.created_at), 'dd MMM yyyy')}</td>
                      <td className="p-3 font-medium tabular-nums">{formatCurrency(b.final_amount)}</td>
                      <td className="p-3 tabular-nums text-gray-500">{formatCurrency(b.paid_amount)}</td>
                      <td className="p-3">
                        <span className={cn("px-2 py-1 rounded-md text-xs font-medium border",
                          b.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          b.status === 'unpaid' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        )}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {b.due_amount > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setCollectBill(b); }}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md text-xs font-medium transition-colors border border-emerald-200"
                            >
                              Collect
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteBill(b.id); }}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400 text-sm">No bills found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedBillId && (
        <BillDetailsModal billId={selectedBillId} onClose={() => setSelectedBillId(null)} />
      )}

      {collectBill && (
        <CollectPaymentModal
          type="bill"
          targetId={collectBill.id}
          customerName={`Bill #${collectBill.bill_number}`}
          maxAmount={collectBill.due_amount}
          onClose={() => setCollectBill(null)}
          onSuccess={() => { setCollectBill(null); fetchBills(); }}
        />
      )}

      {collectCustomerModal && (
        <CollectPaymentModal
          type="customer"
          targetId={customer.id}
          customerName={customer.name}
          maxAmount={customer.outstanding_due}
          onClose={() => setCollectCustomerModal(false)}
          onSuccess={() => { setCollectCustomerModal(false); onUpdate(); onClose(); }}
        />
      )}
    </div>
  );
}
