import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, DollarSign, Package, Wrench, AlertTriangle, Clipboard, ShieldAlert, Activity } from 'lucide-react';

export const DashboardHome: React.FC = () => {
  const { user } = useAuthStore();

  const { data: kpiData } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const res = await api.get('/dashboard/analytics');
      return res.data.data;
    },
  });

  const kpis = kpiData?.kpis || {
    leadsCount: 15,
    salesCount: 8,
    totalRevenue: 1250000,
    inventoryStock: 48,
    pendingClaims: 3,
    activeServices: 4,
  };

  // Mock Sales Trend for Recharts
  const salesTrendData = [
    { month: 'Jan', sales: 4 },
    { month: 'Feb', sales: 7 },
    { month: 'Mar', sales: 11 },
    { month: 'Apr', sales: 9 },
    { month: 'May', sales: 15 },
    { month: 'Jun', sales: 22 },
  ];

  // Mock Low Stock alerts (S1 Air has 2 units, battery pack has 4 units)
  const lowStockAlerts = [
    { name: 'S1 Air Neon Green', sku: 'SKU-SCO-S1A1', stock: 2, min: 5 },
    { name: 'Lithium Battery Pack 3kWh', sku: 'SKU-SPA-BATTERY', stock: 4, min: 5 },
  ];

  // Mock Recent Service Bookings
  const serviceBookings = [
    { id: 'BK-001', customer: 'Raman Sharma', phone: '9876543210', chassis: 'CS12345', type: 'Service', date: '24 Jun 2026' },
    { id: 'BK-002', customer: 'Sanjana Roy', phone: '9988776655', chassis: 'CS67890', type: 'HSRP', date: '25 Jun 2026' },
  ];

  // Mock Pending Warranty Claims
  const pendingClaims = [
    { id: 'WC-101', customer: 'Raman Sharma', chassis: 'CS12345', issue: 'Battery health drops below 70%', status: 'Pending' },
  ];

  // Mock Recent System Activities
  const recentActivities = [
    { id: 1, user: 'Sales Manager', desc: 'Recorded retail sale of S1 Pro for Raman Sharma (INV-72918)', time: '2 hours ago' },
    { id: 2, user: 'Pre Sales Manager', desc: 'Created new lead John Doe (LD-101) from Web source', time: '4 hours ago' },
    { id: 3, user: 'Service Technician', desc: 'Requested Lithium Battery Pack for CS12345 (REQ-01)', time: '5 hours ago' },
    { id: 4, user: 'Spare House Officer', desc: 'Dispatched spare parts for request REQ-01', time: '1 day ago' },
  ];

  return (
    <div className="space-y-6 text-slate-800">
      {/* Title & DateTime */}
      <div className="flex justify-between items-baseline border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F3B73]">SMG Dealership Portal</h2>
          <p className="text-xs text-slate-400">Logged in as: <strong>{user?.name}</strong> ({user?.role})</p>
        </div>
        <div className="text-right text-xs font-semibold text-slate-500">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | {new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leads Registered</p>
            <span className="text-2xl font-bold text-slate-700">{kpis.leadsCount}</span>
            <p className="text-[9px] text-green-600 mt-1 font-semibold">↑ 12% vs last month</p>
          </div>
          <Users className="h-8 w-8 text-blue-500" />
        </div>

        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scooters Sold</p>
            <span className="text-2xl font-bold text-slate-700">{kpis.salesCount} units</span>
            <p className="text-[9px] text-green-600 mt-1 font-semibold">↑ 8% vs last month</p>
          </div>
          <DollarSign className="h-8 w-8 text-green-500" />
        </div>

        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Revenue</p>
            <span className="text-2xl font-bold text-slate-700">₹{kpis.totalRevenue.toLocaleString()}</span>
            <p className="text-[9px] text-blue-600 mt-1 font-semibold">Target: ₹2,000,000</p>
          </div>
          <Package className="h-8 w-8 text-indigo-500" />
        </div>

        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Services</p>
            <span className="text-2xl font-bold text-slate-700">{kpis.activeServices} bookings</span>
            <p className="text-[9px] text-orange-500 mt-1 font-semibold">2 waiting on parts</p>
          </div>
          <Wrench className="h-8 w-8 text-orange-500" />
        </div>
      </div>

      {/* Middle Grid: Sales Trend and Low Stock alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Line Chart */}
        <div className="bg-white p-6 rounded border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider">Monthly Sales Performance</h4>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">EV Division</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#1F3B73" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <h4 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider">Low Stock Alerts</h4>
            </div>
            <div className="space-y-3">
              {lowStockAlerts.map((item, idx) => (
                <div key={idx} className="bg-red-50/50 p-3 rounded border border-red-100 flex flex-col space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">{item.stock} Left</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>SKU: {item.sku}</span>
                    <span>Min Stock Level: {item.min}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-2 font-semibold">
            * Recommended to raise purchase orders for low stock items immediately.
          </div>
        </div>
      </div>

      {/* Bottom Grid: Service Bookings, Warranty Claims, Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Bookings List */}
        <div className="bg-white p-6 rounded border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Clipboard className="h-5 w-5 text-blue-500 shrink-0" />
            <h4 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider">Service Bookings</h4>
          </div>
          <div className="space-y-3">
            {serviceBookings.map((b) => (
              <div key={b.id} className="text-xs flex justify-between items-start border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                <div>
                  <h5 className="font-bold text-slate-800">{b.customer} <span className="text-[10px] text-slate-400 font-mono">({b.id})</span></h5>
                  <p className="text-[10px] text-slate-400">Chassis: {b.chassis}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase">{b.type}</span>
                  <p className="text-[9px] text-slate-400 mt-1">{b.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warranty Claims List */}
        <div className="bg-white p-6 rounded border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
            <h4 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider">Warranty Claim Logs</h4>
          </div>
          <div className="space-y-3">
            {pendingClaims.map((c) => (
              <div key={c.id} className="text-xs flex flex-col space-y-1 bg-amber-50/30 p-2.5 rounded border border-amber-100">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">{c.customer}</span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">{c.status}</span>
                </div>
                <p className="text-[10px] text-slate-600 font-mono">{c.id} | Chassis: {c.chassis}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">Issue: {c.issue}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities Log */}
        <div className="bg-white p-6 rounded border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Activity className="h-5 w-5 text-indigo-500 shrink-0" />
            <h4 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider">Audit Log & Operations</h4>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[220px]">
            {recentActivities.map((act) => (
              <div key={act.id} className="text-[11px] leading-relaxed flex flex-col">
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-0.5">
                  <span>{act.user}</span>
                  <span>{act.time}</span>
                </div>
                <p className="text-slate-600 border-l-2 border-slate-150 pl-2">{act.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
