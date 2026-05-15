import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Search, Plus, Phone, Mail, Loader2, X, Trash2, Edit3, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { customerService, billingService } from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import BillDetailsModal from '@/components/BillDetailsModal';
import CollectPaymentModal from '@/components/CollectPaymentModal';
import { useToast } from '@/components/Toast';

const avatarColors = [
  'from-[#3B82F6] to-[#1E40AF]',
  'from-[#0D9488] to-[#0F766E]',
  'from-[#7C3AED] to-[#6D28D9]',
  'from-[#EF4444] to-[#DC2626]',
  'from-[#F59E0B] to-[#D97706]',
  'from-[#10B981] to-[#059669]',
];
function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function Customers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDue, setFilterDue] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState({ id: '', name: '', phone: '', email: '' });

  const { toast } = useToast();

  const { data: customers = [], isLoading: loading } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: async () => {
      const response = await customerService.getCustomers(searchTerm);
      return response.data;
    }
  });

  const addMutation = useMutation({
    mutationFn: (newCust: any) => customerService.addCustomer(newCust),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowAddModal(false);
      setNewCustomer({ name: '', phone: '', email: '' });
      toast("Customer added successfully", "success");
    },
    onError: () => toast('Failed to add customer. Ensure phone number is unique.', 'error')
  });

  const updateMutation = useMutation({
    mutationFn: (data: {id: string, payload: any}) => customerService.updateCustomer(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowEditModal(false);
      toast("Customer updated", "success");
    },
    onError: () => toast('Failed to update customer.', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast("Customer deleted", "info");
    },
    onError: () => toast('Cannot delete — customer has existing bills.', 'error')
  });

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(newCustomer);
  };

  const handleUpdateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: editCustomer.id,
      payload: { name: editCustomer.name, phone: editCustomer.phone, email: editCustomer.email }
    });
  };

  const handleDeleteCustomer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this customer? This may fail if they have bills.')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCustomers = customers.filter(c =>
    filterDue ? c.outstanding_due > 0 : true
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="h1">Customers</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Manage your customer database and history.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary gap-2 active:scale-[0.97] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <button
            onClick={() => setFilterDue(!filterDue)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium transition-colors",
              filterDue
                ? "border-[#F59E0B] text-[#D97706] bg-[#FFFBEB]"
                : "btn-secondary"
            )}
          >
            {filterDue ? 'Dues Only' : 'All Customers'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Outstanding</th>
                <th>Last Purchase</th>
                <th className="text-right">Total Business</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#9CA3AF]">
                    <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                    <p className="text-sm">Loading customers...</p>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#9CA3AF]">
                    <Users className="mx-auto mb-2 text-[#E5E7EB]" size={32} />
                    <p className="text-sm">No customers found.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className="cursor-pointer"
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-medium text-xs", getAvatarColor(customer.name))}>
                          {customer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-[#111827] hover:text-[#1E40AF] transition-colors">{customer.name}</span>
                          <div className="flex items-center gap-3 mt-0.5 text-[#9CA3AF] text-xs">
                            <span className="flex items-center gap-1"><Phone size={11} /> {customer.phone}</span>
                            {customer.email && <span className="flex items-center gap-1"><Mail size={11} /> {customer.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {customer.outstanding_due > 0
                        ? <span className="badge-warning tabular-nums">{formatCurrency(customer.outstanding_due)}</span>
                        : <span className="badge-success">Settled</span>
                      }
                    </td>
                    <td className="text-[#6B7280]">
                      {customer.last_purchase_date
                        ? format(new Date(customer.last_purchase_date), 'MMM dd, yyyy')
                        : 'Never'}
                    </td>
                    <td className="text-right font-medium text-[#111827] tabular-nums">
                      {formatCurrency(customer.total_purchases)}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditCustomer({ id: customer.id, name: customer.name, phone: customer.phone, email: customer.email || '' });
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-[#9CA3AF] hover:text-[#1E40AF] hover:bg-[#EFF6FF] rounded-md transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteCustomer(customer.id, e)}
                          className="p-1.5 text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-md transition-colors"
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
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center modal-overlay">
          <div className="modal-panel">
            <div className="modal-header flex justify-between items-center">
              <h2 className="h2">Add Customer</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddCustomer}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label block mb-1.5">Name</label>
                  <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label block mb-1.5">Phone</label>
                  <input required type="text" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label block mb-1.5">Email (optional)</label>
                  <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} className="input" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Customer Modal */}
      {showEditModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center modal-overlay">
          <div className="modal-panel">
            <div className="modal-header flex justify-between items-center">
              <h2 className="h2">Edit Customer</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateCustomer}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label block mb-1.5">Name</label>
                  <input required type="text" value={editCustomer.name} onChange={e => setEditCustomer({ ...editCustomer, name: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label block mb-1.5">Phone</label>
                  <input required type="text" value={editCustomer.phone} onChange={e => setEditCustomer({ ...editCustomer, phone: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label block mb-1.5">Email (optional)</label>
                  <input type="email" value={editCustomer.email} onChange={e => setEditCustomer({ ...editCustomer, email: e.target.value })} className="input" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          customer={customers.find((c: any) => c.id === selectedCustomer.id) || selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}

function CustomerDetailsModal({ customer, onClose }: { customer: any, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [collectBill, setCollectBill] = useState<any>(null);
  const [collectCustomerModal, setCollectCustomerModal] = useState(false);
  const [quickAmount, setQuickAmount] = useState<string>(customer.outstanding_due.toString());
  const [quickMode, setQuickMode] = useState<string>('Cash');

  const { toast } = useToast();

  const { data: bills = [], isLoading: loading } = useQuery({
    queryKey: ['bills', customer.id],
    queryFn: async () => {
      const response = await billingService.getBills('', customer.id);
      return response.data;
    }
  });

  const collectMutation = useMutation({
    mutationFn: (data: {amount: number, mode: string}) => customerService.collectDues(customer.id, data.amount, data.mode),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bills', customer.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setQuickAmount('0');
      toast(`₹${variables.amount.toLocaleString()} collected from ${customer.name}`, 'success');
    },
    onError: () => toast('Failed to collect payment', 'error')
  });

  const deleteBillMutation = useMutation({
    mutationFn: (id: string) => billingService.deleteBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills', customer.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast("Bill deleted", "info");
    },
    onError: () => toast('Failed to delete bill.', 'error')
  });

  const handleQuickCollect = () => {
    const amount = parseFloat(quickAmount);
    if (isNaN(amount) || amount <= 0) { toast('Enter a valid amount', 'error'); return; }
    if (amount > customer.outstanding_due) { toast('Amount exceeds due', 'error'); return; }

    collectMutation.mutate({ amount, mode: quickMode });
  };

  const handleDeleteBill = (id: string) => {
    if (confirm('Delete this bill? Stock and dues will be reverted.')) {
      deleteBillMutation.mutate(id);
    }
  };

  const filteredBills = bills.filter(b => statusFilter ? b.status === statusFilter : true);

  const modalContent = (
    <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center sm:p-4 modal-overlay">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-lg w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden modal-enter">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E7EB]">
          <div>
            <h2 className="h2">{customer.name}</h2>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-[#9CA3AF]">
              <span className="flex items-center gap-1"><Phone size={11} /> {customer.phone}</span>
              {customer.email && <span className="flex items-center gap-1"><Mail size={11} /> {customer.email}</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="stat-card border-l-[3px] border-l-[#1E40AF]">
              <p className="stat-label">Total Business</p>
              <p className="text-lg font-semibold text-[#111827] tabular-nums">{formatCurrency(customer.total_purchases)}</p>
            </div>
            <div className="stat-card border-l-[3px] border-l-[#F59E0B]">
              <p className="stat-label">Pending Due</p>
              <p className="text-lg font-semibold text-[#D97706] tabular-nums">{formatCurrency(customer.outstanding_due)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Last Purchase</p>
              <p className="text-lg font-semibold text-[#111827]">
                {customer.last_purchase_date ? format(new Date(customer.last_purchase_date), 'dd MMM yyyy') : 'N/A'}
              </p>
            </div>
          </div>

          {/* Quick Collect Bar */}
          <div>
            <h3 className="h3 mb-3">Quick Collect</h3>
            <div className="flex flex-wrap items-center gap-2 bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-xs font-medium">₹</span>
                <input
                  type="number"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="input w-28 pl-6 py-1.5 text-sm tabular-nums"
                  placeholder="Amount"
                />
              </div>
              <select
                value={quickMode}
                onChange={(e) => setQuickMode(e.target.value)}
                className="input w-auto py-1.5 text-xs"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
              <button
                onClick={handleQuickCollect}
                disabled={collectMutation.isPending || parseFloat(quickAmount) <= 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-colors"
              >
                {collectMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                Collect
              </button>
            </div>
          </div>

          {/* Bills Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="h3">Billing History</h3>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-auto text-xs py-1.5"
              >
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="due">Due</option>
                <option value="partial">Partial</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#1E40AF]" /></div>
            ) : (
              <div className="card overflow-hidden">
                <table>
                  <thead>
                    <tr>
                      <th>Bill No.</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBills.length > 0 ? filteredBills.map(b => (
                      <tr key={b.id} className="cursor-pointer" onClick={() => setSelectedBillId(b.id)}>
                        <td className="font-mono text-xs text-[#6B7280]">#{b.bill_number}</td>
                        <td className="text-[#6B7280]">{format(new Date(b.created_at), 'dd MMM yyyy')}</td>
                        <td className="font-medium tabular-nums">{formatCurrency(b.final_amount)}</td>
                        <td className="tabular-nums text-[#6B7280]">{formatCurrency(b.paid_amount)}</td>
                        <td>
                          <span className={cn(
                            b.status === 'paid' ? 'badge-success' :
                            b.status === 'unpaid' ? 'badge-danger' :
                            'badge-warning'
                          )}>
                            {b.status}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {b.due_amount > 0 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setCollectBill(b); }}
                                className="badge-success cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                Collect
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteBill(b.id); }}
                              className="p-1.5 text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-md transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className="p-8 text-center text-[#9CA3AF] text-sm">No bills found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
          onSuccess={() => { setCollectBill(null); queryClient.invalidateQueries({ queryKey: ['bills', customer.id] }); queryClient.invalidateQueries({ queryKey: ['customers'] }); }}
        />
      )}

      {collectCustomerModal && (
        <CollectPaymentModal
          type="customer"
          targetId={customer.id}
          customerName={customer.name}
          maxAmount={customer.outstanding_due}
          onClose={() => setCollectCustomerModal(false)}
          onSuccess={() => { setCollectCustomerModal(false); queryClient.invalidateQueries({ queryKey: ['customers'] }); onClose(); }}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
