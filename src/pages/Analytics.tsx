import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Clock, 
  BarChart3, 
  Calendar, 
  Filter,
  Lightbulb,
  ShoppingBag,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Link } from 'react-router-dom';
import { analyticsService } from '../services/api';
import { formatCurrency, cn } from '@/lib/utils';

export default function Analytics() {
  const [filter, setFilter] = useState('monthly');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (filter !== 'custom') {
      fetchAnalytics();
    }
  }, [filter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsService.getAnalytics(
        filter, 
        filter === 'custom' ? customDates.start : undefined,
        filter === 'custom' ? customDates.end : undefined
      );
      setData(response.data);
      if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err: any) {
      console.error('Failed to fetch analytics', err);
      setError(err.response?.data?.error || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDates.start) return;
    fetchAnalytics();
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E40AF]" />
        <p className="text-[#9CA3AF] text-sm font-medium">Analyzing business data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-4 p-8 bg-[#FEF2F2] rounded-xl border border-[#FECACA]">
        <AlertCircle className="text-[#DC2626]" size={40} />
        <h2 className="h2 text-[#DC2626]">Analytics Error</h2>
        <p className="text-[#B91C1C] text-sm text-center max-w-md">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="btn-primary mt-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="h1">Business Analytics</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Deep dive into financial trends and performance.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex card p-1 gap-1">
            {['weekly', 'monthly', 'custom'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                  filter === f
                    ? "bg-[#1E40AF] text-white"
                    : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {filter === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
              <input
                type="date"
                className="input w-auto text-xs py-1.5"
                value={customDates.start}
                onChange={(e) => setCustomDates({...customDates, start: e.target.value})}
                required
              />
              <span className="text-[#9CA3AF] text-xs">to</span>
              <input
                type="date"
                className="input w-auto text-xs py-1.5"
                value={customDates.end}
                onChange={(e) => setCustomDates({...customDates, end: e.target.value})}
                required
              />
              <button type="submit" className="btn-primary p-2">
                <Filter size={14} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard 
          title="Total Revenue" 
          value={formatCurrency(data?.metrics?.total_revenue || 0)} 
          description="Total sales volume"
          color="blue"
        />
        <MetricCard 
          title="Due Collected" 
          value={formatCurrency(data?.metrics?.due_collected || 0)} 
          description="Recovery from debts"
          color="teal"
        />
        <MetricCard 
          title="Pending Due" 
          value={formatCurrency(data?.metrics?.pending_due || 0)} 
          description="Total outstanding"
          color="amber"
        />
        <MetricCard 
          title="Avg Bill Value" 
          value={formatCurrency(data?.metrics?.avg_bill_value || 0)} 
          description="Revenue per customer"
          color="indigo"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <ChartContainer title="Revenue Trend" subtitle="Daily sales performance">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.trends?.revenue || []}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#1E40AF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(val) => `₹${val}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(val: any) => [formatCurrency(val), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#1E40AF" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Due Trend */}
        <ChartContainer title="Due Trend" subtitle="Debt Added vs. Collected">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.trends?.due || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(val) => `₹${val}`} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="added" name="Added" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3, fill: '#F59E0B' }} />
              <Line type="monotone" dataKey="collected" name="Collected" stroke="#0F766E" strokeWidth={2} dot={{ r: 3, fill: '#0F766E' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Top Selling Items */}
        <ChartContainer title="Top Selling Items" subtitle="Most popular products by quantity">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.top_items || []} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
              <XAxis type="number" axisLine={false} tickLine={false} hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#374151' }} width={120} />
              <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="quantity" fill="#1E40AF" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Insights & Least Selling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Least Selling */}
          <div className="card p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="text-[#9CA3AF]" size={18} />
              <h3 className="section-title">Least Selling</h3>
            </div>
            <div className="space-y-3 flex-1">
              {data?.least_items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors">
                  <span className="text-sm font-medium text-[#374151]">{item.name}</span>
                  <span className="text-xs font-semibold text-[#9CA3AF] tabular-nums">{item.quantity} sold</span>
                </div>
              ))}
              {(!data?.least_items || data.least_items.length === 0) && (
                <div className="h-full flex items-center justify-center py-8">
                  <p className="text-xs text-[#9CA3AF] italic">No low-selling items found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Insights */}
          <div className="card p-6 bg-[#EFF6FF] border-[#BFDBFE] flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="text-[#1E40AF]" size={18} />
              <h3 className="section-title text-[#1E3A8A]/70">Insights</h3>
            </div>
            <div className="space-y-4 flex-1">
              {data?.insights?.map((insight: string, i: number) => {
                const isHighDue = insight.includes('Top dues held by:');
                return (
                  <div key={i} className="flex gap-3">
                    <div className="mt-1.5 flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1E40AF]"></div>
                    </div>
                    <div>
                      {isHighDue ? (
                        <p className="text-sm text-[#1E3A8A] leading-relaxed">
                          Top dues held by:{' '}
                          {data?.high_due_customers?.map((cust: any, idx: number) => (
                            <React.Fragment key={cust.id}>
                              <Link
                                to={`/dues?search=${encodeURIComponent(cust.name)}`}
                                className="font-semibold text-[#1E40AF] hover:underline"
                              >
                                {cust.name}
                              </Link>
                              {idx < data.high_due_customers.length - 1 ? ', ' : '.'}
                            </React.Fragment>
                          ))}
                        </p>
                      ) : (
                        <p className="text-sm text-[#1E3A8A] leading-relaxed">{insight}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {(!data?.insights || data.insights.length === 0) && (
                <div className="h-full flex items-center justify-center py-8">
                  <p className="text-xs text-[#93C5FD] italic">No insights generated yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const borderMap: Record<string, string> = {
  blue: 'border-l-[#1E40AF]',
  teal: 'border-l-[#10B981]',
  amber: 'border-l-[#F59E0B]',
  indigo: 'border-l-[#6366F1]',
};
const valueColorMap: Record<string, string> = {
  blue: 'text-[#1E40AF]',
  teal: 'text-[#059669]',
  amber: 'text-[#D97706]',
  indigo: 'text-[#4F46E5]',
};

function MetricCard({ title, value, description, color }: any) {
  return (
    <div className={cn("stat-card border-l-[3px]", borderMap[color])}>
      <p className="stat-label">{title}</p>
      <p className={cn("text-2xl font-bold tabular-nums", valueColorMap[color])}>{value}</p>
      <p className="text-[10px] text-[#9CA3AF] mt-1 font-medium">{description}</p>
    </div>
  );
}

function ChartContainer({ title, subtitle, children }: any) {
  return (
    <div className="card p-6 flex flex-col h-[380px]">
      <div className="mb-4">
        <h3 className="section-title mb-1">{title}</h3>
        <p className="text-sm text-[#6B7280] font-medium">{subtitle}</p>
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
