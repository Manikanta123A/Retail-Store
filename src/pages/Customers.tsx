import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Phone, Mail, ArrowUpRight, MoreVertical, Filter, Loader2, X, FileText, Trash2, Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import { customerService, billingService } from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import BillDetailsModal from '@/components/BillDetailsModal';
import CollectPaymentModal from '@/components/CollectPaymentModal';

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDue, setFilterDue] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState({ id: '', name: '', phone: '', email: '' });

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
    } catch (error) {
      console.error('Failed to add customer', error);
      alert('Failed to add customer. Ensure phone number is unique.');
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
    } catch (error) {
      console.error('Failed to update customer', error);
      alert('Failed to update customer.');
    }
  };

  const handleDeleteCustomer = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this customer? This may fail if they have associated bills.')) {
      try {
        await customerService.deleteCustomer(id);
        fetchCustomers();
      } catch (error) {
        console.error('Failed to delete customer', error);
        alert('Failed to delete customer. They might have existing bills.');
      }
    }
  };

  const filteredCustomers = customers.filter(c => 
    filterDue ? c.outstanding_due > 0 : true
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">Manage your store's customer database and purchase history.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-md text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Customer
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => setFilterDue(!filterDue)}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2 border rounded-md text-sm font-medium transition-colors",
              filterDue ? "border-amber-500 text-amber-700 bg-amber-50" : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            )}
          >
            <Filter className="w-4 h-4" />
            {filterDue ? 'Dues Only' : 'All Customers'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-bold border-b border-gray-200">
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Outstanding Due</th>
                <th className="px-6 py-4">Last Purchase</th>
                <th className="px-6 py-4 text-right">Total Business</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      Loading customers...
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-medium">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    onClick={() => setSelectedCustomer(customer)}
                    className="hover:bg-blue-50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{customer.name}</span>
                        <div className="flex items-center gap-3 mt-1 text-gray-500 text-xs">
                          <span className="flex items-center gap-1"><Phone size={12} /> {customer.phone}</span>
                          {customer.email && <span className="flex items-center gap-1"><Mail size={12} /> {customer.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={customer.outstanding_due > 0 ? 'text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded' : 'text-green-600 font-medium'}>
                        {customer.outstanding_due > 0 ? formatCurrency(customer.outstanding_due) : 'Settled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {customer.last_purchase_date 
                        ? format(new Date(customer.last_purchase_date), 'MMM dd, yyyy')
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {formatCurrency(customer.total_purchases)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditCustomer({ id: customer.id, name: customer.name, phone: customer.phone, email: customer.email || '' });
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-gray-200 rounded-md shadow-sm"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteCustomer(customer.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-600 bg-white border border-gray-200 rounded-md shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold">Add New Customer</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Name</label>
                <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone</label>
                <input required type="text" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email (Optional)</label>
                <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-md font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold">Edit Customer</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateCustomer} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Name</label>
                <input required type="text" value={editCustomer.name} onChange={e => setEditCustomer({...editCustomer, name: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone</label>
                <input required type="text" value={editCustomer.phone} onChange={e => setEditCustomer({...editCustomer, phone: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email (Optional)</label>
                <input type="email" value={editCustomer.email} onChange={e => setEditCustomer({...editCustomer, email: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-md font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700">Save Changes</button>
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
        />
      )}
    </div>
  );
}

function CustomerDetailsModal({ customer, onClose }: { customer: any, onClose: () => void }) {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [collectBill, setCollectBill] = useState<any>(null);
  const [collectCustomerModal, setCollectCustomerModal] = useState(false);

  useEffect(() => {
    fetchBills();
  }, [customer.id]);

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
    if (confirm('Are you sure you want to delete this bill? Stock and dues will be reverted.')) {
      try {
        await billingService.deleteBill(id);
        fetchBills();
      } catch (error) {
        console.error('Failed to delete bill', error);
        alert('Failed to delete bill.');
      }
    }
  };

  const filteredBills = bills.filter(b => statusFilter ? b.status === statusFilter : true);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Phone size={12} /> {customer.phone}</span>
              {customer.email && <span className="flex items-center gap-1"><Mail size={12} /> {customer.email}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full border shadow-sm">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-5">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
              <p className="text-xs uppercase font-bold text-blue-600 mb-1">Total Business</p>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(customer.total_purchases)}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg">
              <p className="text-xs uppercase font-bold text-amber-600 mb-1">Pending Due</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-amber-900">{formatCurrency(customer.outstanding_due)}</p>
                {customer.outstanding_due > 0 && (
                  <button 
                    onClick={() => setCollectCustomerModal(true)}
                    className="bg-amber-600 text-white text-[10px] px-2 py-1 rounded font-bold hover:bg-amber-700 transition-colors shadow-sm"
                  >
                    COLLECT ALL
                  </button>
                )}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <p className="text-xs uppercase font-bold text-slate-600 mb-1">Last Purchase</p>
              <p className="text-xl font-bold text-slate-900">
                {customer.last_purchase_date ? format(new Date(customer.last_purchase_date), 'dd MMM yyyy') : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Billing History</h3>
            <select 
              className="border border-gray-300 rounded-md text-sm p-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid / Due</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-3 font-semibold text-gray-600">Bill No.</th>
                    <th className="p-3 font-semibold text-gray-600">Date</th>
                    <th className="p-3 font-semibold text-gray-600">Total</th>
                    <th className="p-3 font-semibold text-gray-600">Paid</th>
                    <th className="p-3 font-semibold text-gray-600">Status</th>
                    <th className="p-3 font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBills.length > 0 ? filteredBills.map(b => (
                    <tr key={b.id} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => setSelectedBillId(b.id)}>
                      <td className="p-3 font-mono">#{b.bill_number}</td>
                      <td className="p-3">{format(new Date(b.created_at), 'dd MMM yyyy')}</td>
                      <td className="p-3 font-bold">{formatCurrency(b.final_amount)}</td>
                      <td className="p-3">{formatCurrency(b.paid_amount)}</td>
                      <td className="p-3">
                        <span className={cn("px-2 py-1 rounded text-xs font-bold uppercase", 
                          b.status === 'paid' ? 'bg-green-100 text-green-700' :
                          b.status === 'unpaid' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        )}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          {b.due_amount > 0 && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollectBill(b);
                              }}
                              className="px-2 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded text-xs font-bold transition-colors"
                            >
                              Collect
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBill(b.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 bg-white border border-gray-200 rounded-md shadow-sm"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">No bills found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {selectedBillId && (
        <BillDetailsModal
          billId={selectedBillId}
          onClose={() => setSelectedBillId(null)}
        />
      )}

      {collectBill && (
        <CollectPaymentModal
          type="bill"
          targetId={collectBill.id}
          customerName={`Bill #${collectBill.bill_number}`}
          maxAmount={collectBill.due_amount}
          onClose={() => setCollectBill(null)}
          onSuccess={() => {
            setCollectBill(null);
            fetchBills();
          }}
        />
      )}

      {collectCustomerModal && (
        <CollectPaymentModal
          type="customer"
          targetId={customer.id}
          customerName={customer.name}
          maxAmount={customer.outstanding_due}
          onClose={() => setCollectCustomerModal(false)}
          onSuccess={() => {
            setCollectCustomerModal(false);
            onClose(); // Refresh the list by closing and requiring reopen
          }}
        />
      )}
    </div>
  );
}
