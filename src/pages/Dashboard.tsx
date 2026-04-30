import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Receipt, CreditCard, ArrowUpRight, ArrowDownRight, Package, Calendar } from 'lucide-react';
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
import { dashboardService } from '../services/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('today');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getDashboard(timeRange);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return <div className="flex justify-center items-center h-full">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 text-xs">Summary of your store's operational performance.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          <Calendar size={16} className="text-gray-400 ml-2" />
          <select 
            className="bg-transparent border-none text-sm font-medium focus:ring-0 outline-none pr-2 py-1"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="last_week">Last Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Sales" 
          value={formatCurrency(data?.stats?.sales || 0)} 
          trend="" 
          trendType="neutral"
        />
        <StatCard 
          title="Bills Generated" 
          value={data?.stats?.bills || 0} 
          trend="" 
          trendType="neutral"
        />
        <StatCard 
          title="New Dues Added" 
          value={formatCurrency(data?.stats?.dues_added || 0)} 
          trend="" 
          trendType="warning"
        />
        <StatCard 
          title="Dues Collected" 
          value={formatCurrency(data?.stats?.dues_collected || 0)} 
          trend="" 
          trendType="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Infographics / Plots */}
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm flex flex-col h-80">
          <h3 className="text-sm font-bold uppercase tracking-wide mb-4">Sales & Dues Trend</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chart_data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sales" name="Sales (₹)" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dues" name="Dues (₹)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Dues */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm flex flex-col h-80">
          <div className="p-4 border-b border-[#E5E7EB] bg-slate-50 rounded-t-lg">
            <h3 className="text-sm font-bold uppercase tracking-wide text-amber-800">High Outstanding Dues</h3>
          </div>
          <div className="p-4 space-y-4 flex-1 overflow-auto">
            {data?.top_dues?.length > 0 ? data.top_dues.map((d: any, i: number) => (
              <div key={i} className="flex justify-between items-center pb-3 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-xs font-bold">{d.name}</p>
                  <p className="text-[10px] text-slate-400">Last: {d.lastSeen}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-red-600">{formatCurrency(d.amount)}</p>
                </div>
              </div>
            )) : <p className="text-xs text-slate-500">No outstanding dues.</p>}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#E5E7EB] flex justify-between items-center bg-slate-50 rounded-t-lg">
          <h3 className="text-sm font-bold uppercase tracking-wide">Recent Transactions</h3>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white sticky top-0 border-b">
              <tr className="text-slate-500 font-semibold">
                <th className="p-3">Bill ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.recent_bills?.length > 0 ? data.recent_bills.map((bill: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-medium">{bill.id}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="font-bold">{bill.customer}</span>
                    <span className="text-[10px] block text-slate-400">{bill.phone}</span>
                  </td>
                  <td className="p-3 font-bold">{formatCurrency(bill.amount)}</td>
                  <td className="p-3">
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", 
                      bill.status === 'paid' ? 'bg-green-100 text-green-700' :
                      bill.status === 'unpaid' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    )}>
                      {bill.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-500">No recent transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
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
      {trend && (
        <p className={cn("text-[10px] mt-2", getTrendStyles())}>
          {trend}
        </p>
      )}
    </div>
  );
}
