import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Receipt, CreditCard, Package, Calendar, IndianRupee, ArrowUpRight } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="skeleton h-7 w-40 mb-2" />
            <div className="skeleton h-4 w-56" />
          </div>
          <div className="skeleton h-10 w-36 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card">
              <div className="skeleton h-3 w-20 mb-3" />
              <div className="skeleton h-8 w-28" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6 h-80">
            <div className="skeleton h-4 w-32 mb-4" />
            <div className="skeleton h-full w-full rounded-lg" />
          </div>
          <div className="card h-80">
            <div className="p-5"><div className="skeleton h-4 w-40" /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="h1">Dashboard</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">Here's how your store is performing.</p>
        </div>
        
        <div className="flex items-center gap-2 card px-3 py-2">
          <Calendar size={14} className="text-[#9CA3AF]" />
          <select 
            className="bg-transparent border-none text-sm font-medium text-[#374151] focus:ring-0 outline-none cursor-pointer"
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          title="Sales" 
          value={formatCurrency(data?.stats?.sales || 0)} 
          icon={<IndianRupee size={18} />}
          accentColor="blue"
        />
        <StatCard 
          title="Bills Generated" 
          value={data?.stats?.bills || 0} 
          icon={<Receipt size={18} />}
          accentColor="slate"
        />
        <StatCard 
          title="New Dues" 
          value={formatCurrency(data?.stats?.dues_added || 0)} 
          icon={<TrendingUp size={18} />}
          accentColor="amber"
        />
        <StatCard 
          title="Collected" 
          value={formatCurrency(data?.stats?.dues_collected || 0)} 
          icon={<CreditCard size={18} />}
          accentColor="teal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 card p-6 flex flex-col h-80">
          <h3 className="text-sm font-medium text-[#6B7280] mb-4">Sales & Dues Trend</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chart_data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <Tooltip 
                  cursor={{ fill: '#F9FAFB' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.06)', fontSize: '13px' }}
                />
                <Bar dataKey="sales" name="Sales (₹)" fill="#1E40AF" radius={[5, 5, 0, 0]} />
                <Bar dataKey="dues" name="Dues (₹)" fill="#F59E0B" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Dues */}
        <div className="card flex flex-col h-80">
          <div className="px-5 py-4 border-b border-[#F3F4F6]">
            <h3 className="text-sm font-medium text-[#6B7280]">High Outstanding Dues</h3>
          </div>
          <div className="p-4 space-y-1 flex-1 overflow-auto">
            {data?.top_dues?.length > 0 ? data.top_dues.map((d: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-2.5 px-2 rounded-lg hover:bg-[#F9FAFB] transition-colors">
                <div>
                  <p className="text-sm font-medium text-[#111827]">{d.name}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{d.lastSeen}</p>
                </div>
                <span className="text-sm font-semibold text-[#DC2626] tabular-nums">{formatCurrency(d.amount)}</span>
              </div>
            )) : <p className="text-sm text-[#9CA3AF] p-2">No outstanding dues.</p>}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card flex flex-col">
        <div className="px-6 py-4 border-b border-[#F3F4F6]">
          <h3 className="h3">Recent Transactions</h3>
        </div>
        <div className="flex-1 overflow-auto">
          <table>
            <thead>
              <tr>
                <th>Bill</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.recent_bills?.length > 0 ? data.recent_bills.map((bill: any, i: number) => (
                <tr key={i}>
                  <td className="font-mono text-xs text-[#6B7280]">{bill.id}</td>
                  <td>
                    <span className="font-medium text-[#111827]">{bill.customer}</span>
                    <span className="text-xs text-[#9CA3AF] block mt-0.5">{bill.phone}</span>
                  </td>
                  <td className="font-semibold tabular-nums">{formatCurrency(bill.amount)}</td>
                  <td>
                    <span className={cn(
                      bill.status === 'paid' ? 'badge-success' :
                      bill.status === 'unpaid' ? 'badge-danger' :
                      'badge-warning'
                    )}>
                      {bill.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#9CA3AF]">No recent transactions.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const accentConfig = {
  blue:  { border: 'border-l-[#1E40AF]', iconBg: 'bg-blue-50 text-[#1E40AF]' },
  slate: { border: 'border-l-gray-400', iconBg: 'bg-gray-50 text-gray-500' },
  amber: { border: 'border-l-amber-500', iconBg: 'bg-amber-50 text-amber-600' },
  teal:  { border: 'border-l-teal-600', iconBg: 'bg-teal-50 text-teal-700' },
};

function StatCard({ title, value, icon, accentColor }: { title: string; value: any; icon: React.ReactNode; accentColor: keyof typeof accentConfig }) {
  const config = accentConfig[accentColor];

  return (
    <div className={cn("stat-card border-l-[3px]", config.border)}>
      <div className="flex items-center justify-between mb-3">
        <p className="stat-label">{title}</p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.iconBg)}>
          {icon}
        </div>
      </div>
      <p className="stat-value">{value}</p>
    </div>
  );
}
