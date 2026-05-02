import React, { useState, useEffect } from 'react';
import { 
  Download,
  Calendar,
  Search,
  Filter,
  FileText,
  FileDown
} from 'lucide-react';
import { billingService, customerService, dashboardService } from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import BillDetailsModal from '@/components/BillDetailsModal';

export default function Reports() {
  const [reportType, setReportType] = useState('Sales');
  const [dateRange, setDateRange] = useState('month');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalSales: 0,
    totalBills: 0,
    dueAdded: 0,
    dueCollected: 0,
    pendingDue: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchSummary();
  }, [reportType, dateRange, search, statusFilter]);

  const fetchSummary = async () => {
    try {
      // We calculate summary manually to perfectly match the local timezone date filters
      const [billsRes, paymentsRes, customersRes] = await Promise.all([
        billingService.getBills(''),
        billingService.getPayments({}),
        customerService.getCustomers()
      ]);

      const now = new Date();
      let startDate = new Date();
      if (dateRange === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (dateRange === 'week') {
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
      } else if (dateRange === 'month') {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      } else if (dateRange === 'year') {
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
      }

      // Filter bills
      const currentBills = billsRes.data.filter((b: any) => new Date(b.created_at) >= startDate);
      const totalSales = currentBills.reduce((sum: number, b: any) => sum + parseFloat(b.final_amount), 0);
      const totalBills = currentBills.length;
      const dueAdded = currentBills.reduce((sum: number, b: any) => sum + parseFloat(b.due_amount), 0);

      // Filter payments (for dues collected)
      const currentPayments = paymentsRes.data.filter((p: any) => new Date(p.created_at) >= startDate);
      const dueCollected = currentPayments
        .filter((p: any) => p.balance_before > 0)
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

      // Pending due is always overall
      const totalPending = customersRes.data.reduce((sum: number, c: any) => sum + parseFloat(c.outstanding_due || 0), 0);

      setSummary({
        totalSales,
        totalBills,
        dueAdded,
        dueCollected,
        pendingDue: totalPending
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let rawData = [];
      if (reportType === 'Sales') {
        const res = await billingService.getBills(search);
        rawData = res.data;
        if (statusFilter !== 'All') {
          rawData = rawData.filter((b: any) => b.status.toLowerCase() === statusFilter.toLowerCase());
        }
      } else if (reportType === 'Payments') {
        const res = await billingService.getPayments({ search });
        rawData = res.data;
      } else if (reportType === 'Dues') {
        const res = await customerService.getCustomers(search);
        rawData = res.data.filter((c: any) => c.outstanding_due > 0);
      }

      // Apply date filter
      const now = new Date();
      let startDate = new Date();
      if (dateRange === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (dateRange === 'week') {
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
      } else if (dateRange === 'month') {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      } else if (dateRange === 'year') {
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
      }

      const filtered = rawData.filter((item: any) => {
        const itemDateStr = item.created_at || item.last_purchase_date;
        if (!itemDateStr) return true; // If no date, include it (e.g. dues with no purchases)
        const itemDate = new Date(itemDateStr);
        return itemDate >= startDate;
      });

      setData(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    let csv = '';
    if (reportType === 'Sales') {
      csv = 'Date,Bill ID,Customer,Total,Paid,Due,Status\n';
      data.forEach(row => {
        csv += `"${format(new Date(row.created_at), 'MMM dd yyyy')}","${row.bill_number}","${row.customer_name}","${row.final_amount}","${row.paid_amount}","${row.due_amount}","${row.status}"\n`;
      });
    } else if (reportType === 'Payments') {
      csv = 'Date,Customer,Amount,Mode\n';
      data.forEach(row => {
        csv += `"${format(new Date(row.created_at), 'MMM dd yyyy')}","${row.customer_name}","${row.amount}","${row.payment_mode}"\n`;
      });
    } else if (reportType === 'Dues') {
      csv = 'Customer,Total Due,Last Payment Date\n';
      data.forEach(row => {
        csv += `"${row.name}","${row.outstanding_due}","${row.last_purchase_date ? format(new Date(row.last_purchase_date), 'MMM dd yyyy') : ''}"\n`;
      });
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_Report.csv`;
    a.click();
  };

  const exportPDF = () => {
    // A simple window.print() triggered specifically for the table container is an easy way to export PDF.
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operational Reports</h1>
          <p className="text-sm text-gray-500 print:hidden">View and export business analytics.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-semibold shadow-sm hover:bg-gray-50 transition-colors">
            <FileDown size={16} /> CSV
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-md text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors">
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-wrap gap-3 items-center print:hidden">
        <select 
          value={reportType} 
          onChange={e => setReportType(e.target.value)}
          className="bg-slate-50 border border-gray-200 text-sm rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          <option value="Sales">Sales Report</option>
          <option value="Payments">Payments Report</option>
          <option value="Dues">Dues Report</option>
        </select>
        
        <select 
          value={dateRange} 
          onChange={e => setDateRange(e.target.value)}
          className="bg-slate-50 border border-gray-200 text-sm rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {reportType === 'Sales' && (
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-gray-200 text-sm rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="due">Due</option>
          </select>
        )}
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Sales', value: formatCurrency(summary.totalSales), color: 'text-blue-600' },
          { label: 'Total Bills', value: summary.totalBills, color: 'text-gray-900' },
          { label: 'Due Added', value: formatCurrency(summary.dueAdded), color: 'text-amber-600' },
          { label: 'Due Collected', value: formatCurrency(summary.dueCollected), color: 'text-emerald-600' },
          { label: 'Pending Due', value: formatCurrency(summary.pendingDue), color: 'text-red-600' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
            <p className={cn("text-xl font-black mt-1", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden" id="report-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-bold border-b border-gray-200">
                {reportType === 'Sales' && (
                  <>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Bill ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-right">Paid</th>
                    <th className="px-6 py-4 text-right">Due</th>
                    <th className="px-6 py-4">Status</th>
                  </>
                )}
                {reportType === 'Payments' && (
                  <>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4">Mode</th>
                  </>
                )}
                {reportType === 'Dues' && (
                  <>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4 text-right">Total Due</th>
                    <th className="px-6 py-4">Last Payment</th>
                    <th className="px-6 py-4">Due Age</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500 font-medium">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500 font-medium">No records found.</td></tr>
              ) : (
                data.map((row, i) => (
                  <tr 
                    key={i} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (reportType === 'Sales') setSelectedBillId(row.id);
                      if (reportType === 'Payments') setSelectedBillId(row.bill_id);
                    }}
                  >
                    {reportType === 'Sales' && (
                      <>
                        <td className="px-6 py-4 text-gray-600">{format(new Date(row.created_at), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4 font-mono text-xs font-bold">#{row.bill_number}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">{row.customer_name}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(row.final_amount)}</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-medium">{formatCurrency(row.paid_amount)}</td>
                        <td className="px-6 py-4 text-right text-red-600 font-medium">{formatCurrency(row.due_amount)}</td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", 
                            row.status === 'paid' ? 'bg-green-100 text-green-700' :
                            row.status === 'unpaid' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          )}>
                            {row.status}
                          </span>
                        </td>
                      </>
                    )}
                    {reportType === 'Payments' && (
                      <>
                        <td className="px-6 py-4 text-gray-600">{format(new Date(row.created_at), 'MMM dd, yyyy hh:mm a')}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">{row.customer_name}</td>
                        <td className="px-6 py-4 text-right font-black text-emerald-600">+{formatCurrency(row.amount)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md tracking-wider">
                            {row.payment_mode}
                          </span>
                        </td>
                      </>
                    )}
                    {reportType === 'Dues' && (
                      <>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {row.name}
                          <span className="block text-[10px] font-normal text-gray-500">{row.phone}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-red-600 font-black">{formatCurrency(row.outstanding_due)}</td>
                        <td className="px-6 py-4 text-gray-600">{row.last_purchase_date ? format(new Date(row.last_purchase_date), 'MMM dd, yyyy') : 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-gray-500">
                            {row.last_purchase_date ? `${Math.floor((new Date().getTime() - new Date(row.last_purchase_date).getTime()) / (1000 * 3600 * 24))} days` : 'N/A'}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBillId && (
        <BillDetailsModal
          billId={selectedBillId}
          onClose={() => setSelectedBillId(null)}
        />
      )}
    </div>
  );
}
