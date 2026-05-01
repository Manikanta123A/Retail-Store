import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Clock, 
  BarChart3, 
  Calendar, 
  ChevronDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Lightbulb,
  ShoppingBag,
  AlertCircle
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
      setError(err.response?.data?.error || 'Failed to load analytics data. Please check if the server is running.');
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
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-sm font-medium">Analyzing business data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-4 p-8 bg-red-50 rounded-xl border border-red-100">
        <AlertCircle className="text-red-600" size={48} />
        <h2 className="text-lg font-bold text-red-900">Analytics Error</h2>
        <p className="text-red-700 text-center max-w-md">{error}</p>
        <button 
          onClick={fetchAnalytics}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 1. Header & Time Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Analytics</h1>
          <p className="text-gray-500 text-sm">Deep dive into your store's financial trends and performance.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            {['weekly', 'monthly', 'custom'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-md transition-all capitalize",
                  filter === f 
                    ? "bg-blue-600 text-white shadow-sm" 
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
                className="text-xs border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={customDates.start}
                onChange={(e) => setCustomDates({...customDates, start: e.target.value})}
                required
              />
              <span className="text-gray-400 text-xs">to</span>
              <input 
                type="date" 
                className="text-xs border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={customDates.end}
                onChange={(e) => setCustomDates({...customDates, end: e.target.value})}
                required
              />
              <button type="submit" className="bg-gray-900 text-white p-2 rounded-lg hover:bg-gray-800">
                <Filter size={14} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Revenue" 
          value={formatCurrency(data?.metrics?.total_revenue || 0)} 
          icon={<TrendingUp className="text-blue-600" size={20} />}
          description="Total sales volume"
        />
        <MetricCard 
          title="Due Collected" 
          value={formatCurrency(data?.metrics?.due_collected || 0)} 
          icon={<Wallet className="text-green-600" size={20} />}
          description="Recovery from debts"
        />
        <MetricCard 
          title="Pending Due" 
          value={formatCurrency(data?.metrics?.pending_due || 0)} 
          icon={<Clock className="text-amber-600" size={20} />}
          description="Total outstanding"
        />
        <MetricCard 
          title="Avg Bill Value" 
          value={formatCurrency(data?.metrics?.avg_bill_value || 0)} 
          icon={<BarChart3 className="text-purple-600" size={20} />}
          description="Revenue per customer"
        />
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <ChartContainer title="Revenue Trend" subtitle="Daily sales performance">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.trends?.revenue || []}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(val) => `₹${val}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(val: any) => [formatCurrency(val), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Due Trend */}
        <ChartContainer title="Due Trend" subtitle="Debt Added vs. Collected">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.trends?.due || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="added" name="Added" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="collected" name="Collected" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Top Selling Items */}
        <ChartContainer title="Top Selling Items" subtitle="Most popular products by quantity">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.top_items || []} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
              <XAxis type="number" axisLine={false} tickLine={false} hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#374151' }} width={100} />
              <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="quantity" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* 4. Insights & Least Selling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Least Selling */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="text-gray-400" size={18} />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Least Selling</h3>
            </div>
            <div className="space-y-3">
              {data?.least_items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <span className="text-xs font-bold text-gray-500">{item.quantity} sold</span>
                </div>
              ))}
              {(!data?.least_items || data.least_items.length === 0) && (
                <p className="text-xs text-gray-400 italic">No low-selling items found.</p>
              )}
            </div>
          </div>

          {/* Insights */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="text-blue-600" size={18} />
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">Business Insights</h3>
            </div>
            <div className="space-y-4">
              {data?.insights?.map((insight: string, i: number) => {
                const isHighDue = insight.includes('Top dues held by:');
                return (
                  <div key={i} className="flex gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    </div>
                    <div>
                      {isHighDue ? (
                        <p className="text-xs text-blue-800 leading-relaxed">
                          Top dues held by:{' '}
                          {data?.high_due_customers?.map((cust: any, idx: number) => (
                            <React.Fragment key={cust.id}>
                              <Link 
                                to={`/dues?search=${encodeURIComponent(cust.name)}`}
                                className="font-bold underline hover:text-blue-600 transition-colors"
                              >
                                {cust.name}
                              </Link>
                              {idx < data.high_due_customers.length - 1 ? ', ' : '.'}
                            </React.Fragment>
                          ))}
                        </p>
                      ) : (
                        <p className="text-xs text-blue-800 leading-relaxed">{insight}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {(!data?.insights || data.insights.length === 0) && (
                <p className="text-xs text-blue-400 italic">Analyzing patterns... No insights yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, description }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-gray-50 rounded-lg">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        <p className="text-[10px] text-gray-400 mt-1 font-medium">{description}</p>
      </div>
    </div>
  );
}

function ChartContainer({ title, subtitle, children }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[350px]">
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{title}</h3>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
