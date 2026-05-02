import React, { useState, useEffect } from 'react';
import { 
  Download, Search, FileDown, Loader2
} from 'lucide-react';
import { billingService, customerService } from '@/services/api';
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
    totalSales: 0, totalBills: 0, dueAdded: 0, dueCollected: 0, pendingDue: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchSummary();
  }, [reportType, dateRange, search, statusFilter]);

  const fetchSummary = async () => {
    try {
      const [billsRes, paymentsRes, customersRes] = await Promise.all([
        billingService.getBills(''),
        billingService.getPayments({}),
        customerService.getCustomers()
      ]);

      const now = new Date();
      let startDate = new Date();
      if (dateRange === 'today') { startDate.setHours(0, 0, 0, 0); }
      else if (dateRange === 'week') { startDate.setDate(now.getDate() - now.getDay()); startDate.setHours(0, 0, 0, 0); }
      else if (dateRange === 'month') { startDate.setDate(1); startDate.setHours(0, 0, 0, 0); }
      else if (dateRange === 'year') { startDate.setMonth(0, 1); startDate.setHours(0, 0, 0, 0); }

      const currentBills = billsRes.data.filter((b: any) => new Date(b.created_at) >= startDate);
      const totalSales = currentBills.reduce((sum: number, b: any) => sum + parseFloat(b.final_amount), 0);
      const totalBills = currentBills.length;
      const dueAdded = currentBills.reduce((sum: number, b: any) => sum + parseFloat(b.due_amount), 0);
      const currentPayments = paymentsRes.data.filter((p: any) => new Date(p.created_at) >= startDate);
      const dueCollected = currentPayments.filter((p: any) => p.balance_before > 0).reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
      const totalPending = customersRes.data.reduce((sum: number, c: any) => sum + parseFloat(c.outstanding_due || 0), 0);

      setSummary({ totalSales, totalBills, dueAdded, dueCollected, pendingDue: totalPending });
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
        if (statusFilter !== 'All') rawData = rawData.filter((b: any) => b.status.toLowerCase() === statusFilter.toLowerCase());
      } else if (reportType === 'Payments') {
        const res = await billingService.getPayments({ search });
        rawData = res.data;
      } else if (reportType === 'Dues') {
        const res = await customerService.getCustomers(search);
        rawData = res.data.filter((c: any) => c.outstanding_due > 0);
      }

      const now = new Date();
      let startDate = new Date();
      if (dateRange === 'today') { startDate.setHours(0, 0, 0, 0); }
      else if (dateRange === 'week') { startDate.setDate(now.getDate() - now.getDay()); startDate.setHours(0, 0, 0, 0); }
      else if (dateRange === 'month') { startDate.setDate(1); startDate.setHours(0, 0, 0, 0); }
      else if (dateRange === 'year') { startDate.setMonth(0, 1); startDate.setHours(0, 0, 0, 0); }

      setData(rawData.filter((item: any) => {
        const itemDateStr = item.created_at || item.last_purchase_date;
        if (!itemDateStr) return true;
        return new Date(itemDateStr) >= startDate;
      }));
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
      data.forEach(row => { csv += `"${format(new Date(row.created_at), 'MMM dd yyyy')}","${row.bill_number}","${row.customer_name}","${row.final_amount}","${row.paid_amount}","${row.due_amount}","${row.status}"\n`; });
    } else if (reportType === 'Payments') {
      csv = 'Date,Customer,Amount,Mode\n';
      data.forEach(row => { csv += `"${format(new Date(row.created_at), 'MMM dd yyyy')}","${row.customer_name}","${row.amount}","${row.payment_mode}"\n`; });
    } else if (reportType === 'Dues') {
      csv = 'Customer,Total Due,Last Payment Date\n';
      data.forEach(row => { csv += `"${row.name}","${row.outstanding_due}","${row.last_purchase_date ? format(new Date(row.last_purchase_date), 'MMM dd yyyy') : ''}"\n`; });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_Report.csv`;
    a.click();
  };

  const summaryItems = [
    { label: 'Sales', value: formatCurrency(summary.totalSales), color: 'blue' },
    { label: 'Bills', value: summary.totalBills, color: 'slate' },
    { label: 'Dues Added', value: formatCurrency(summary.dueAdded), color: 'amber' },
    { label: 'Collected', value: formatCurrency(summary.dueCollected), color: 'teal' },
    { label: 'Pending', value: formatCurrency(summary.pendingDue), color: 'rose' }
  ];

  const borderColors: Record<string, string> = { blue: 'border-l-[#1E40AF]', slate: 'border-l-gray-400', amber: 'border-l-amber-500', teal: 'border-l-teal-600', rose: 'border-l-rose-500' };
  const valueColors: Record<string, string> = { blue: 'text-[#1E40AF]', slate: 'text-gray-900', amber: 'text-amber-600', teal: 'text-teal-700', rose: 'text-rose-600' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5 print:hidden">View and export business data.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors">
            <FileDown size={15} /> CSV
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-[#1E40AF] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-blue-800 transition-colors">
            <Download size={15} /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-wrap gap-3 items-center print:hidden">
        <select value={reportType} onChange={e => setReportType(e.target.value)} className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium">
          <option value="Sales">Sales</option>
          <option value="Payments">Payments</option>
          <option value="Dues">Dues</option>
        </select>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium">
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
        </div>
        {reportType === 'Sales' && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium">
            <option value="All">All</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="due">Due</option>
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {summaryItems.map((stat, i) => (
          <div key={i} className={cn("bg-white p-4 rounded-xl border border-gray-100 border-l-[3px]", borderColors[stat.color])}>
            <p className="text-xs font-medium text-gray-400 mb-1">{stat.label}</p>
            <p className={cn("text-xl font-semibold tabular-nums", valueColors[stat.color])}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden" id="report-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="text-xs text-gray-400 font-medium border-b border-gray-100">
                {reportType === 'Sales' && (<><th className="px-6 py-3">Date</th><th className="px-6 py-3">Bill</th><th className="px-6 py-3">Customer</th><th className="px-6 py-3 text-right">Total</th><th className="px-6 py-3 text-right">Paid</th><th className="px-6 py-3 text-right">Due</th><th className="px-6 py-3">Status</th></>)}
                {reportType === 'Payments' && (<><th className="px-6 py-3">Date</th><th className="px-6 py-3">Customer</th><th className="px-6 py-3 text-right">Amount</th><th className="px-6 py-3">Mode</th></>)}
                {reportType === 'Dues' && (<><th className="px-6 py-3">Customer</th><th className="px-6 py-3 text-right">Total Due</th><th className="px-6 py-3">Last Payment</th><th className="px-6 py-3">Age</th></>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600" /></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-gray-400 text-sm">No records found.</td></tr>
              ) : (
                data.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onClick={() => {
                      if (reportType === 'Sales') setSelectedBillId(row.id);
                      if (reportType === 'Payments') setSelectedBillId(row.bill_id);
                    }}
                  >
                    {reportType === 'Sales' && (
                      <>
                        <td className="px-6 py-3.5 text-gray-500">{format(new Date(row.created_at), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-3.5 font-mono text-xs text-gray-500">#{row.bill_number}</td>
                        <td className="px-6 py-3.5 font-medium text-gray-800">{row.customer_name}</td>
                        <td className="px-6 py-3.5 text-right font-medium text-gray-800 tabular-nums">{formatCurrency(row.final_amount)}</td>
                        <td className="px-6 py-3.5 text-right text-emerald-600 tabular-nums">{formatCurrency(row.paid_amount)}</td>
                        <td className="px-6 py-3.5 text-right text-rose-600 tabular-nums">{formatCurrency(row.due_amount)}</td>
                        <td className="px-6 py-3.5">
                          <span className={cn("px-2 py-1 rounded-md text-xs font-medium border",
                            row.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            row.status === 'unpaid' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          )}>
                            {row.status}
                          </span>
                        </td>
                      </>
                    )}
                    {reportType === 'Payments' && (
                      <>
                        <td className="px-6 py-3.5 text-gray-500">{format(new Date(row.created_at), 'MMM dd, yyyy hh:mm a')}</td>
                        <td className="px-6 py-3.5 font-medium text-gray-800">{row.customer_name}</td>
                        <td className="px-6 py-3.5 text-right font-semibold text-emerald-600 tabular-nums">+{formatCurrency(row.amount)}</td>
                        <td className="px-6 py-3.5">
                          <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-md border border-gray-200">{row.payment_mode}</span>
                        </td>
                      </>
                    )}
                    {reportType === 'Dues' && (
                      <>
                        <td className="px-6 py-3.5">
                          <p className="font-medium text-gray-800">{row.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{row.phone}</p>
                        </td>
                        <td className="px-6 py-3.5 text-right text-rose-600 font-semibold tabular-nums">{formatCurrency(row.outstanding_due)}</td>
                        <td className="px-6 py-3.5 text-gray-500">{row.last_purchase_date ? format(new Date(row.last_purchase_date), 'MMM dd, yyyy') : 'N/A'}</td>
                        <td className="px-6 py-3.5 text-gray-500 text-sm">
                          {row.last_purchase_date ? `${Math.floor((new Date().getTime() - new Date(row.last_purchase_date).getTime()) / (1000 * 3600 * 24))} days` : 'N/A'}
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

      {selectedBillId && <BillDetailsModal billId={selectedBillId} onClose={() => setSelectedBillId(null)} />}
    </div>
  );
}
