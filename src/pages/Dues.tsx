import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  AlertCircle, 
  Clock, 
  MoreVertical,
  CheckCircle2,
  Loader2,
  Filter,
  User,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { customerService, billingService } from '@/services/api';
import CollectPaymentModal from '@/components/CollectPaymentModal';
import { cn } from '@/lib/utils';

export default function Dues() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('');
  const [recoveryThisMonth, setRecoveryThisMonth] = useState(0);

  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  useEffect(() => {
    fetchDues();
    fetchMonthlyRecovery();
  }, []);

  const fetchMonthlyRecovery = async () => {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const res = await billingService.getPayments({ start_date: firstDay });
      // Sum only the payments (collections)
      const total = res.data.reduce((sum: number, p: any) => sum + p.amount, 0);
      setRecoveryThisMonth(total);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDues = async () => {
    try {
      const response = await customerService.getCustomers();
      const duesOnly = response.data.filter((c: any) => c.outstanding_due > 0);
      setCustomers(duesOnly);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDues = customers.filter(c => {
    // Text search
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    
    // Risk level filter
    const daysOld = Math.floor((new Date().getTime() - new Date(c.last_purchase_date || c.created_at).getTime()) / (1000 * 3600 * 24));
    const risk = daysOld > 60 ? 'High' : daysOld > 30 ? 'Medium' : 'Low';
    const matchesRisk = filterRisk === 'All' || risk === filterRisk;

    // Date filter
    let matchesDate = true;
    if (filterDate) {
       const customerDate = new Date(c.last_purchase_date || c.created_at).toISOString().split('T')[0];
       matchesDate = customerDate === filterDate;
    }

    return matchesSearch && matchesRisk && matchesDate;
  });

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding_due, 0);

  // High risk: Due amount for customers who haven't purchased in > 60 days
  const highRiskDues = customers.reduce((sum, c) => {
    const daysOld = Math.floor((new Date().getTime() - new Date(c.last_purchase_date || c.created_at).getTime()) / (1000 * 3600 * 24));
    if (daysOld > 60 && c.outstanding_due > 0) return sum + c.outstanding_due;
    return sum;
  }, 0);

  // Recovery this month: Calculated dynamically from recent payments
  // (state set via fetchMonthlyRecovery)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Due Management</h1>
          <p className="text-sm text-gray-500">Track and recover outstanding credit from customers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Outstanding</p>
          <p className="text-3xl font-black text-red-600 mt-2">₹{totalOutstanding.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <AlertCircle size={14} className="text-red-500" />
            <span>Across {customers.length} customers</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">High Risk Dues</p>
          <p className="text-3xl font-black text-amber-600 mt-2">₹{highRiskDues.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <Clock size={14} className="text-amber-500" />
            <span>Dues older than 60 days</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recovery this Month</p>
          <p className="text-3xl font-black text-emerald-600 mt-2">₹{recoveryThisMonth.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>Calculated from recent payments</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="border border-gray-300 rounded-md text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Risks</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
            
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-gray-300 rounded-md text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-bold border-b border-gray-200">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total Due</th>
                <th className="px-6 py-4">Due Since</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
              ) : filteredDues.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No dues found.</td></tr>
              ) : (
                filteredDues.map((due) => {
                  const daysOld = Math.floor((new Date().getTime() - new Date(due.last_purchase_date || due.created_at).getTime()) / (1000 * 3600 * 24));
                  const risk_level = daysOld > 60 ? 'High' : daysOld > 30 ? 'Medium' : 'Low';
                  
                  return (
                    <tr key={due.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{due.name}</p>
                            <p className="text-[10px] text-gray-500">{due.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-red-600 font-black">₹{due.outstanding_due.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-medium">{format(new Date(due.last_purchase_date || due.created_at), 'MMM dd, yyyy')}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">
                            {daysOld} days ago
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                          risk_level === 'High' ? 'bg-red-50 text-red-600' :
                          risk_level === 'Medium' ? 'bg-amber-50 text-amber-600' :
                          'bg-blue-50 text-blue-600'
                        )}>
                          {risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            setSelectedCustomer(due);
                            setCollectModalOpen(true);
                          }}
                          className="flex items-center gap-2 text-blue-600 font-bold text-xs hover:bg-blue-50 px-3 py-1.5 rounded-md transition-all ml-auto"
                        >
                          COLLECT
                          <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {collectModalOpen && selectedCustomer && (
        <CollectPaymentModal
          type="customer"
          targetId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          maxAmount={selectedCustomer.outstanding_due}
          onClose={() => setCollectModalOpen(false)}
          onSuccess={() => {
            setCollectModalOpen(false);
            fetchDues(); // refresh the list
          }}
        />
      )}
    </div>
  );
}
