import React from 'react';
import { TrendingUp, Users, Receipt, CreditCard, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { formatCurrency, cn } from '@/lib/utils';

const data = [
  { name: 'Mon', sales: 4000, dues: 2400 },
  { name: 'Tue', sales: 3000, dues: 1398 },
  { name: 'Wed', sales: 2000, dues: 9800 },
  { name: 'Thu', sales: 2780, dues: 3908 },
  { name: 'Fri', sales: 1890, dues: 4800 },
  { name: 'Sat', sales: 2390, dues: 3800 },
  { name: 'Sun', sales: 3490, dues: 4300 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500 text-xs">Summary of your store's operational performance today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Today's Sales" 
          value={formatCurrency(42850)} 
          trend="↑ 12%" 
          trendType="up"
        />
        <StatCard 
          title="Bills Generated" 
          value="64" 
          trend="Avg. ₹669" 
          trendType="neutral"
        />
        <StatCard 
          title="New Dues Added" 
          value={formatCurrency(8240)} 
          trend="12 pending" 
          trendType="warning"
        />
        <StatCard 
          title="Dues Collected" 
          value={formatCurrency(12400)} 
          trend="Recovered 45%" 
          trendType="up"
        />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-[#E5E7EB] shadow-sm flex flex-col">
          <div className="p-4 border-b border-[#E5E7EB] flex justify-between items-center bg-slate-50 rounded-t-lg">
            <h3 className="text-sm font-bold uppercase tracking-wide">Recent Transactions</h3>
            <button className="text-xs text-[#2563EB] font-bold">View All</button>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white sticky top-0 border-b">
                <tr className="text-slate-500 font-semibold">
                  <th className="p-3">Bill ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { id: '#10425', customer: 'Rajesh Kumar', phone: '+91 98221 02334', amount: 2450, status: 'Paid', statusColor: 'bg-green-100 text-green-700' },
                  { id: '#10424', customer: 'Sonia Verma', phone: '+91 94220 11422', amount: 5800, status: 'Partial', statusColor: 'bg-amber-100 text-amber-700' },
                  { id: '#10423', customer: 'Karan Singh', phone: '+91 99341 05531', amount: 1240, status: 'Due', statusColor: 'bg-red-100 text-red-700' },
                  { id: '#10422', customer: 'Mukul Jain', phone: '+91 98221 11332', amount: 850, status: 'Paid', statusColor: 'bg-green-100 text-green-700' },
                  { id: '#10421', customer: 'Unknown Customer', phone: 'Cash Sale', amount: 4200, status: 'Paid', statusColor: 'bg-green-100 text-green-700' },
                ].map((bill, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-medium">{bill.id}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-bold">{bill.customer}</span>
                      <span className="text-[10px] block text-slate-400">{bill.phone}</span>
                    </td>
                    <td className="p-3 font-bold">{formatCurrency(bill.amount)}</td>
                    <td className="p-3">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", bill.statusColor)}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button className="px-2 py-1 border border-gray-200 rounded text-[#2563EB] font-bold text-[10px] hover:bg-white transition-colors">Print</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Dues */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm flex flex-col">
          <div className="p-4 border-b border-[#E5E7EB] bg-slate-50 rounded-t-lg">
            <h3 className="text-sm font-bold uppercase tracking-wide text-amber-800">High Outstanding Dues</h3>
          </div>
          <div className="p-4 space-y-4 flex-1">
            {[
              { name: 'Anita Deshmukh', lastSeen: '14 Days ago', amount: 18400 },
              { name: 'Pritam Rawat', lastSeen: '3 Days ago', amount: 12200 },
              { name: 'Vikas Furniture', lastSeen: '22 Days ago', amount: 9500 },
            ].map((d, i) => (
              <div key={i} className="flex justify-between items-center pb-3 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-xs font-bold">{d.name}</p>
                  <p className="text-[10px] text-slate-400">Last: {d.lastSeen}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-red-600">{formatCurrency(d.amount)}</p>
                  <button className="text-[10px] text-blue-600 font-bold hover:underline">Notify</button>
                </div>
              </div>
            ))}
            
            {/* Inventory Alert */}
            <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3 h-3 text-red-600" />
                <span className="text-[10px] font-bold text-red-700 uppercase">Inventory Alert</span>
              </div>
              <p className="text-[11px] text-red-800 leading-tight font-medium">8 Items have been in stock for over 180 days. Consider markdown.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, trendType }: any) {
  const getTrendStyles = () => {
    switch (trendType) {
      case 'up': return 'text-green-600';
      case 'warning': return 'text-amber-600 font-bold';
      case 'down': return 'text-red-600';
      default: return 'text-slate-400';
    }
  };

  const getTitleStyles = () => {
    if (trendType === 'warning') return 'text-amber-600';
    if (trendType === 'up' && title.includes('Collected')) return 'text-green-700';
    return 'text-slate-500';
  };

  return (
    <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm">
      <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", getTitleStyles())}>
        {title}
      </p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className={cn("text-[10px] mt-2", getTrendStyles())}>
        {trend}
      </p>
    </div>
  );
}
