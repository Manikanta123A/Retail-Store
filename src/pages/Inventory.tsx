import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, Edit3, Trash2, AlertTriangle, Loader2, X
} from 'lucide-react';
import { itemService } from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/components/Toast';

interface Item {
  id: string;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
}

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: '', price: '', stock_quantity: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItemForm, setEditItemForm] = useState({ id: '', name: '', category: '', price: '', stock_quantity: '' });

  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, [searchTerm]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await itemService.getItems(searchTerm);
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await itemService.addItem({
        name: newItem.name,
        category: newItem.category || 'General',
        price: parseFloat(newItem.price),
        stock_quantity: parseInt(newItem.stock_quantity) || 0
      });
      setShowAddModal(false);
      setNewItem({ name: '', category: '', price: '', stock_quantity: '' });
      fetchItems();
      toast("Item added successfully", "success");
    } catch (error) {
      console.error('Failed to add item', error);
      toast('Failed to add item.', 'error');
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await itemService.updateItem(editItemForm.id, {
        name: editItemForm.name,
        category: editItemForm.category || 'General',
        price: parseFloat(editItemForm.price),
        stock_quantity: parseInt(editItemForm.stock_quantity) || 0
      });
      setShowEditModal(false);
      fetchItems();
      toast("Item updated", "success");
    } catch (error) {
      console.error('Failed to update item', error);
      toast('Failed to update item.', 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Delete this item?')) {
      try {
        await itemService.deleteItem(id);
        fetchItems();
        toast("Item deleted", "info");
      } catch (error) {
        console.error('Failed to delete item', error);
        toast('Failed to delete item.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage products, pricing, and stock levels.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#1E40AF] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-blue-800 transition-colors active:scale-[0.97] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatMini label="Total Items" value={items.length} color="blue" />
        <StatMini label="Low Stock" value={items.filter(i => i.stock_quantity <= 10 && i.stock_quantity > 0).length} color="amber" />
        <StatMini label="Out of Stock" value={items.filter(i => i.stock_quantity === 0).length} color="rose" />
        <StatMini label="Categories" value={new Set(items.map(i => i.category)).size} color="teal" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-gray-400 font-medium border-b border-gray-100">
                <th className="px-6 py-3">Item</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Stock</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                    <p className="text-sm">Loading inventory...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    <Package className="mx-auto mb-2 text-gray-200" size={32} />
                    <p className="text-sm">No items found.</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="px-6 py-3.5 font-medium text-gray-800">{item.name}</td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded-md text-xs font-medium border border-gray-200">
                        {item.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-gray-800 tabular-nums">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-medium tabular-nums", item.stock_quantity <= 10 ? 'text-amber-600' : 'text-emerald-600')}>
                          {item.stock_quantity}
                        </span>
                        {item.stock_quantity <= 10 && (
                          <AlertTriangle size={14} className="text-amber-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => {
                            setEditItemForm({ id: item.id, name: item.name, category: item.category, price: item.price.toString(), stock_quantity: item.stock_quantity.toString() });
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#1E40AF] hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
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

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden modal-enter">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Add item</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Item name</label>
                <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Price (₹)</label>
                  <input required type="number" min="0" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Initial stock</label>
                  <input required type="number" min="0" value={newItem.stock_quantity} onChange={e => setNewItem({...newItem, stock_quantity: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                <input type="text" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} placeholder="e.g. Groceries" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#1E40AF] text-white rounded-lg font-medium text-sm hover:bg-blue-800 transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden modal-enter">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Edit item</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Item name</label>
                <input required type="text" value={editItemForm.name} onChange={e => setEditItemForm({...editItemForm, name: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Price (₹)</label>
                  <input required type="number" min="0" step="0.01" value={editItemForm.price} onChange={e => setEditItemForm({...editItemForm, price: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Stock</label>
                  <input required type="number" min="0" value={editItemForm.stock_quantity} onChange={e => setEditItemForm({...editItemForm, stock_quantity: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                <input type="text" value={editItemForm.category} onChange={e => setEditItemForm({...editItemForm, category: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#1E40AF] text-white rounded-lg font-medium text-sm hover:bg-blue-800 transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const colorMap: Record<string, string> = {
  blue: 'border-l-[#1E40AF]',
  amber: 'border-l-amber-500',
  rose: 'border-l-rose-500',
  teal: 'border-l-teal-600',
};
const valueColorMap: Record<string, string> = {
  blue: 'text-[#1E40AF]',
  amber: 'text-amber-600',
  rose: 'text-rose-600',
  teal: 'text-teal-700',
};

function StatMini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={cn("bg-white p-4 rounded-xl border border-gray-100 border-l-[3px]", colorMap[color])}>
      <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums", valueColorMap[color])}>{value}</p>
    </div>
  );
}
