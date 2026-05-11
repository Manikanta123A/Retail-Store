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

  const getStartDate = () => {
    const now = new Date();
    let startDate = new Date();
    if (dateRange === 'today') { startDate.setHours(0, 0, 0, 0); }
    else if (dateRange === 'week') { 
      const day = now.getDay();
      startDate.setDate(now.getDate() - day); 
      startDate.setHours(0, 0, 0, 0); 
    }
    else if (dateRange === 'month') { startDate.setDate(1); startDate.setHours(0, 0, 0, 0); }
    else if (dateRange === 'year') { startDate.setMonth(0, 1); startDate.setHours(0, 0, 0, 0); }
    return startDate.toISOString();
  };

  const fetchSummary = async () => {
    try {
      const startDate = getStartDate();
      const res = await billingService.getSummary(startDate);
      setSummary(res.data);
    } catch (e) {
      console.error('Summary fetch error:', e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = getStartDate();
      let rawData = [];
      
      if (reportType === 'Sales') {
        const res = await billingService.getBills(search, '', { start_date: startDate });
        rawData = res.data;
        if (statusFilter !== 'All') {
          rawData = rawData.filter((b: any) => b.status.toLowerCase() === statusFilter.toLowerCase());
        }
      } else if (reportType === 'Payments') {
        const res = await billingService.getPayments({ search, start_date: startDate });
        rawData = res.data;
      } else if (reportType === 'Dues') {
        const res = await customerService.getCustomers(search);
        rawData = res.data.filter((c: any) => c.outstanding_due > 0);
      }

      setData(rawData);
    } catch (e) {
      console.error('Data fetch error:', e);
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

  const borderColors: Record<string, string> = { blue: 'border-l-[#1E40AF]', slate: 'border-l-[#9CA3AF]', amber: 'border-l-[#F59E0B]', teal: 'border-l-[#10B981]', rose: 'border-l-[#EF4444]' };
  const valueColors: Record<string, string> = { blue: 'text-[#1E40AF]', slate: 'text-[#111827]', amber: 'text-[#D97706]', teal: 'text-[#059669]', rose: 'text-[#DC2626]' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="h1">Reports</h1>
          <p className="text-sm text-[#6B7280] mt-0.5 print:hidden">View and export business data.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={exportCSV} className="btn-secondary gap-2">
            <FileDown size={15} /> CSV
          </button>
          <button onClick={() => window.print()} className="btn-primary gap-2">
            <Download size={15} /> PDF
          </button>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center print:hidden">
        <select value={reportType} onChange={e => setReportType(e.target.value)} className="input w-auto">
          <option value="Sales">Sales</option>
          <option value="Payments">Payments</option>
          <option value="Dues">Dues</option>
        </select>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="input w-auto">
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input type="text" placeholder="Search customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
        </div>
        {reportType === 'Sales' && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-auto">
            <option value="All">All</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="due">Due</option>
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {summaryItems.map((stat, i) => (
          <div key={i} className={cn("stat-card border-l-[3px]", borderColors[stat.color])}>
            <p className="stat-label">{stat.label}</p>
            <p className={cn("text-xl font-bold tabular-nums", valueColors[stat.color])}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden" id="report-table-container">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                {reportType === 'Sales' && (<><th>Date</th><th>Bill</th><th>Customer</th><th className="text-right">Total</th><th className="text-right">Paid</th><th className="text-right">Due</th><th>Status</th></>)}
                {reportType === 'Payments' && (<><th>Date</th><th>Customer</th><th className="text-right">Amount</th><th>Mode</th></>)}
                {reportType === 'Dues' && (<><th>Customer</th><th className="text-right">Total Due</th><th>Last Payment</th><th>Age</th></>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[#1E40AF]" /></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-[#9CA3AF] text-sm">No records found.</td></tr>
              ) : (
                data.map((row, i) => (
                  <tr
                    key={i}
                    className="cursor-pointer"
                    onClick={() => {
                      if (reportType === 'Sales') setSelectedBillId(row.id);
                      if (reportType === 'Payments') setSelectedBillId(row.bill_id);
                    }}
                  >
                    {reportType === 'Sales' && (
                      <>
                        <td className="text-[#6B7280]">{format(new Date(row.created_at), 'MMM dd, yyyy')}</td>
                        <td className="font-mono text-xs text-[#6B7280]">#{row.bill_number}</td>
                        <td className="font-medium text-[#111827]">{row.customer_name || 'Walk-in Customer'}</td>
                        <td className="text-right font-medium text-[#111827] tabular-nums">{formatCurrency(row.final_amount)}</td>
                        <td className="text-right text-[#059669] tabular-nums">{formatCurrency(row.paid_amount)}</td>
                        <td className="text-right text-[#DC2626] tabular-nums">{formatCurrency(row.due_amount)}</td>
                        <td>
                          <span className={cn(
                            row.status === 'paid' ? 'badge-success' :
                            row.status === 'unpaid' ? 'badge-danger' :
                            'badge-warning'
                          )}>{row.status}</span>
                        </td>
                      </>
                    )}
                    {reportType === 'Payments' && (
                      <>
                        <td className="text-[#6B7280]">{format(new Date(row.created_at), 'MMM dd, yyyy hh:mm a')}</td>
                        <td className="font-medium text-[#111827]">{row.customer_name || 'Walk-in Customer'}</td>
                        <td className="text-right font-semibold text-[#059669] tabular-nums">+{formatCurrency(row.amount)}</td>
                        <td><span className="badge-neutral">{row.payment_mode}</span></td>
                      </>
                    )}
                    {reportType === 'Dues' && (
                      <>
                        <td>
                          <p className="font-medium text-[#111827]">{row.name}</p>
                          <p className="text-xs text-[#9CA3AF] mt-0.5">{row.phone}</p>
                        </td>
                        <td className="text-right text-[#DC2626] font-semibold tabular-nums">{formatCurrency(row.outstanding_due)}</td>
                        <td className="text-[#6B7280]">{row.last_purchase_date ? format(new Date(row.last_purchase_date), 'MMM dd, yyyy') : 'N/A'}</td>
                        <td className="text-[#6B7280]">
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
