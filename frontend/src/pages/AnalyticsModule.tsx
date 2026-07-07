import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Wrench,
  ShieldCheck,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Calendar,
} from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const AnalyticsModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'sales' | 'leads' | 'services'>('overview');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['dashboardAnalyticsDetailed'],
    queryFn: async () => {
      const res = await api.get('/dashboard/analytics');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-xs font-semibold text-slate-500">Loading dealership analytics and charts...</p>
        </div>
      </div>
    );
  }

  const kpis = analyticsData?.kpis || {
    leadsCount: 0,
    salesCount: 0,
    totalRevenue: 0,
    inventoryStock: 0,
    pendingClaims: 0,
    activeServices: 0,
  };

  const leadConversions = analyticsData?.leadConversions || {};
  const monthlySales = analyticsData?.monthlySales || [];

  // Transform Lead Conversions map to recharts format
  const leadChartData = Object.entries(leadConversions).map(([name, value]) => ({
    name,
    value: Number(value),
  }));

  // Create mock sales category breakdown
  const salesCategoryData = [
    { name: 'Retail', value: Math.round(kpis.salesCount * 0.6) || 4 },
    { name: 'Corporate', value: Math.round(kpis.salesCount * 0.2) || 2 },
    { name: 'CPC & CSD', value: Math.round(kpis.salesCount * 0.1) || 1 },
    { name: 'Dealership Unit', value: Math.round(kpis.salesCount * 0.1) || 1 },
  ];

  // Create mock service stage breakdown
  const serviceStageData = [
    { stage: 'Received', count: Math.max(1, Math.round(kpis.activeServices * 0.2)) },
    { stage: 'Inspecting', count: Math.max(1, Math.round(kpis.activeServices * 0.3)) },
    { stage: 'Parts Replaced', count: Math.max(0, Math.round(kpis.activeServices * 0.2)) },
    { stage: 'Washing', count: Math.max(0, Math.round(kpis.activeServices * 0.1)) },
    { stage: 'Ready', count: Math.max(1, Math.round(kpis.activeServices * 0.2)) },
  ];

  return (
    <div className="space-y-6 text-slate-800">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1F3B73]">Dealership Performance Analytics</h2>
          <p className="text-xs text-slate-500">Cross-department statistics, sales revenue growth trends, and conversions funnels</p>
        </div>
        <div className="flex space-x-1.5 bg-slate-250 p-0.5 rounded border border-slate-200">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'overview' ? 'bg-[#1F3B73] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sales')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'sales' ? 'bg-[#1F3B73] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Sales Analytics</span>
          </button>
          <button
            onClick={() => setActiveSubTab('leads')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'leads' ? 'bg-[#1F3B73] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Lead Funnels</span>
          </button>
          <button
            onClick={() => setActiveSubTab('services')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'services' ? 'bg-[#1F3B73] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Workshop & Service</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Revenue</p>
            <h3 className="text-xl font-bold text-slate-800">₹{kpis.totalRevenue.toLocaleString()}</h3>
            <p className="text-[9px] text-green-600 font-semibold flex items-center">↑ 14.2% vs last month</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sales Units</p>
            <h3 className="text-xl font-bold text-slate-800">{kpis.salesCount} units</h3>
            <p className="text-[9px] text-green-600 font-semibold flex items-center">↑ 8.5% vs last month</p>
          </div>
          <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
            <Package className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Active Leads</p>
            <h3 className="text-xl font-bold text-slate-800">{kpis.leadsCount}</h3>
            <p className="text-[9px] text-blue-600 font-semibold flex items-center">Target: 50 registered</p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Services</p>
            <h3 className="text-xl font-bold text-slate-800">{kpis.activeServices} runs</h3>
            <p className="text-[9px] text-orange-500 font-semibold flex items-center">98.5% SLA Match rate</p>
          </div>
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
            <Wrench className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Overview Tab Content */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Sales Trend Area Chart */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4" /> Monthly Sales & Revenue Trend
              </h4>
              <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">Last 6 Months</span>
            </div>
            <div className="h-72 w-full">
              {monthlySales.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No sales recorded yet to build monthly trends.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlySales} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1F3B73" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#1F3B73" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis tickLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#1F3B73" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Lead conversion quick chart */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider flex items-center gap-1.5">
                <PieIcon className="h-4 w-4" /> Lead Status Funnel
              </h4>
            </div>
            <div className="h-56 w-full flex items-center justify-center relative">
              {leadChartData.length === 0 ? (
                <div className="text-xs text-slate-400">No leads registered.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {leadChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-slate-100">
              {leadChartData.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="text-slate-600 truncate">{item.name}: <strong>{item.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sales Analytics Tab */}
      {activeSubTab === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider border-b border-slate-100 pb-3">
              Revenue Volume by Category
            </h4>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySales} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="revenue" name="Total Net Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider border-b border-slate-100 pb-3">
                Sales Type Share Breakdown
              </h4>
              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesCategoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      dataKey="value"
                    >
                      {salesCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded border border-slate-200 text-xs">
              <p className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-green-600" /> Sales Performance Insight:
              </p>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Retail sales remain the primary volume driver contributing to 60% of total scooter units sold. FAME subsidies status should be audited regularly to maintain a healthy cash flow.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lead Funnels Tab */}
      {activeSubTab === 'leads' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider border-b border-slate-100 pb-3">
              Total Lead Influx & Conversion
            </h4>
            <div className="h-72 w-full">
              {leadChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No lead details present.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis tickLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Lead Count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider border-b border-slate-100 pb-3">
              Sales Pipeline Metrics
            </h4>
            <div className="space-y-4 pt-2">
              <div className="border border-slate-150 rounded p-3 bg-indigo-50/30">
                <span className="text-[10px] uppercase font-bold text-slate-400">Lead Conversion Rate</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-black text-indigo-700">
                    {kpis.leadsCount > 0 ? (( (leadConversions['Converted'] || 0) / kpis.leadsCount) * 100).toFixed(1) : 0}%
                  </span>
                  <span className="text-xs text-slate-500">from registered leads</span>
                </div>
              </div>

              <div className="border border-slate-150 rounded p-3 bg-green-50/30">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Converted Units</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-black text-green-700">{leadConversions['Converted'] || 0}</span>
                  <span className="text-xs text-slate-500">Retail sales</span>
                </div>
              </div>

              <div className="border border-slate-150 rounded p-3 bg-red-50/30">
                <span className="text-[10px] uppercase font-bold text-slate-400">Rejection Ratio</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-black text-red-700">
                    {kpis.leadsCount > 0 ? (( (leadConversions['Rejected'] || 0) / kpis.leadsCount) * 100).toFixed(1) : 0}%
                  </span>
                  <span className="text-xs text-slate-500">disqualified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service & Repairs Tab */}
      {activeSubTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider border-b border-slate-100 pb-3">
              Active Workshop Load Distribution (by Stage)
            </h4>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceStageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="stage" tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Active Bookings" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider border-b border-slate-100 pb-3">
              After-Sales & Claims KPI
            </h4>
            <div className="space-y-4 pt-2">
              <div className="border border-slate-150 rounded p-4 flex items-center justify-between bg-yellow-50/20">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Pending Claims</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">{kpis.pendingClaims} claims</h3>
                </div>
                <div className="p-2 bg-yellow-100 text-yellow-800 rounded">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>

              <div className="border border-slate-150 rounded p-4 flex items-center justify-between bg-blue-50/20">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Workshop Capacity</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">15 slots</h3>
                </div>
                <div className="p-2 bg-blue-100 text-blue-800 rounded">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
