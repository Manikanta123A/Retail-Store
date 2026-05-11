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
  description: string;
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
  const [newItem, setNewItem] = useState({ name: '', description: '', category: '', price: '', stock_quantity: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItemForm, setEditItemForm] = useState({ id: '', name: '', description: '', category: '', price: '', stock_quantity: '' });

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
        description: newItem.description,
        category: newItem.category || 'General',
        price: parseFloat(newItem.price),
        stock_quantity: parseInt(newItem.stock_quantity) || 0
      });
      setShowAddModal(false);
      setNewItem({ name: '', description: '', category: '', price: '', stock_quantity: '' });
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
        description: editItemForm.description,
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="h1">Inventory</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Manage products, pricing, and stock levels.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary gap-2 active:scale-[0.97] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatMini label="Total Items" value={items.length} color="blue" />
        <StatMini label="Low Stock" value={items.filter(i => i.stock_quantity <= 10 && i.stock_quantity > 0).length} color="amber" />
        <StatMini label="Out of Stock" value={items.filter(i => i.stock_quantity === 0).length} color="rose" />
        <StatMini label="Categories" value={new Set(items.map(i => i.category)).size} color="teal" />
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#9CA3AF]">
                    <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                    <p className="text-sm">Loading inventory...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#9CA3AF]">
                    <Package className="mx-auto mb-2 text-[#E5E7EB]" size={32} />
                    <p className="text-sm">No items found.</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium text-[#111827]">{item.name}</td>
                    <td>
                      <span className="badge-neutral">{item.category || 'General'}</span>
                    </td>
                    <td className="font-medium text-[#111827] tabular-nums">
                      {formatCurrency(item.price)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={cn("font-medium tabular-nums", item.stock_quantity === 0 ? 'text-[#DC2626]' : item.stock_quantity <= 10 ? 'text-[#D97706]' : 'text-[#059669]')}>
                          {item.stock_quantity}
                        </span>
                        {item.stock_quantity <= 10 && item.stock_quantity > 0 && (
                          <AlertTriangle size={14} className="text-[#F59E0B]" />
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditItemForm({
                              id: item.id,
                              name: item.name,
                              description: item.description,
                              category: item.category,
                              price: item.price.toString(),
                              stock_quantity: item.stock_quantity.toString()
                            });
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-[#9CA3AF] hover:text-[#1E40AF] hover:bg-[#EFF6FF] rounded-md transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
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

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
          <div className="modal-panel">
            <div className="modal-header flex justify-between items-center">
              <h2 className="h2">Add Item</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddItem}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label block mb-1.5">Item Name</label>
                  <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="input" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label block mb-1.5">Price (₹)</label>
                    <input required type="number" min="0" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="label block mb-1.5">Initial Stock</label>
                    <input required type="number" min="0" value={newItem.stock_quantity} onChange={e => setNewItem({...newItem, stock_quantity: e.target.value})} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label block mb-1.5">Description (Mandatory)</label>
                  <textarea
                    required
                    value={newItem.description}
                    onChange={e => setNewItem({...newItem, description: e.target.value})}
                    placeholder="Appearance (color, type) and characteristics (material, usage, style)..."
                    className="input min-h-[100px] resize-none"
                  />
                </div>
                <div>
                  <label className="label block mb-1.5">Category</label>
                  <input type="text" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} placeholder="e.g. Groceries" className="input" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
          <div className="modal-panel">
            <div className="modal-header flex justify-between items-center">
              <h2 className="h2">Edit Item</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateItem}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label block mb-1.5">Item Name</label>
                  <input required type="text" value={editItemForm.name} onChange={e => setEditItemForm({...editItemForm, name: e.target.value})} className="input" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label block mb-1.5">Price (₹)</label>
                    <input required type="number" min="0" step="0.01" value={editItemForm.price} onChange={e => setEditItemForm({...editItemForm, price: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="label block mb-1.5">Stock</label>
                    <input required type="number" min="0" value={editItemForm.stock_quantity} onChange={e => setEditItemForm({...editItemForm, stock_quantity: e.target.value})} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label block mb-1.5">Description (Mandatory)</label>
                  <textarea
                    required
                    value={editItemForm.description}
                    onChange={e => setEditItemForm({...editItemForm, description: e.target.value})}
                    placeholder="Appearance (color, type) and characteristics (material, usage, style)..."
                    className="input min-h-[100px] resize-none"
                  />
                </div>
                <div>
                  <label className="label block mb-1.5">Category</label>
                  <input type="text" value={editItemForm.category} onChange={e => setEditItemForm({...editItemForm, category: e.target.value})} className="input" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
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
  amber: 'border-l-[#F59E0B]',
  rose: 'border-l-[#EF4444]',
  teal: 'border-l-[#10B981]',
};
const valueColorMap: Record<string, string> = {
  blue: 'text-[#1E40AF]',
  amber: 'text-[#D97706]',
  rose: 'text-[#DC2626]',
  teal: 'text-[#059669]',
};

function StatMini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={cn("stat-card border-l-[3px]", colorMap[color])}>
      <p className="stat-label">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums", valueColorMap[color])}>{value}</p>
    </div>
  );
}
