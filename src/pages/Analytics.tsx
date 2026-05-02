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
        <p className="text-gray-400 text-sm font-medium">Analyzing business data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-4 p-8 bg-rose-50 rounded-2xl border border-rose-100">
        <AlertCircle className="text-rose-600" size={48} />
        <h2 className="text-base font-semibold text-rose-900">Analytics Error</h2>
        <p className="text-rose-700 text-sm text-center max-w-md">{error}</p>
        <button 
          onClick={fetchAnalytics}
          className="mt-2 px-6 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
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
          <h1 className="text-xl font-semibold text-gray-900">Business Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Deep dive into financial trends and performance.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            {['weekly', 'monthly', 'custom'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                  filter === f 
                    ? "bg-[#1E40AF] text-white shadow-sm" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {filter === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
              <input 
                type="date" 
                className="text-xs bg-white border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={customDates.start}
                onChange={(e) => setCustomDates({...customDates, start: e.target.value})}
                required
              />
              <span className="text-gray-400 text-xs">to</span>
              <input 
                type="date" 
                className="text-xs bg-white border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={customDates.end}
                onChange={(e) => setCustomDates({...customDates, end: e.target.value})}
                required
              />
              <button type="submit" className="bg-gray-900 text-white p-2 rounded-lg hover:bg-black transition-colors">
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
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="text-gray-400" size={18} />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Least Selling</h3>
            </div>
            <div className="space-y-3 flex-1">
              {data?.least_items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100 transition-hover hover:border-gray-200">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <span className="text-xs font-semibold text-gray-400 tabular-nums">{item.quantity} sold</span>
                </div>
              ))}
              {(!data?.least_items || data.least_items.length === 0) && (
                <div className="h-full flex items-center justify-center py-8">
                  <p className="text-xs text-gray-400 italic">No low-selling items found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Insights */}
          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="text-[#1E40AF]" size={18} />
              <h3 className="text-xs font-semibold text-blue-900/60 uppercase tracking-widest">Insights</h3>
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
                        <p className="text-sm text-blue-900/80 leading-relaxed">
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
                        <p className="text-sm text-blue-900/80 leading-relaxed">{insight}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {(!data?.insights || data.insights.length === 0) && (
                <div className="h-full flex items-center justify-center py-8">
                  <p className="text-xs text-blue-400 italic">No insights generated yet.</p>
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
  teal: 'border-l-teal-600',
  amber: 'border-l-amber-500',
  indigo: 'border-l-indigo-600',
};
const valueColorMap: Record<string, string> = {
  blue: 'text-[#1E40AF]',
  teal: 'text-teal-700',
  amber: 'text-amber-600',
  indigo: 'text-indigo-700',
};

function MetricCard({ title, value, description, color }: any) {
  return (
    <div className={cn("bg-white p-5 rounded-xl border border-gray-100 border-l-[3px] shadow-sm", borderMap[color])}>
      <p className="text-xs font-medium text-gray-400 mb-1">{title}</p>
      <p className={cn("text-2xl font-semibold tabular-nums", valueColorMap[color])}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-1 font-medium">{description}</p>
    </div>
  );
}

function ChartContainer({ title, subtitle, children }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[380px]">
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-sm text-gray-400 font-medium">{subtitle}</p>
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
