import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useForm } from 'react-hook-form';
import { Plus, Tag, Layers, Settings, FileSpreadsheet, Percent, Info } from 'lucide-react';
import { DigitalFormModal } from '../components/DigitalFormModal';

export const SalesModule: React.FC = () => {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<'sales' | 'inventory' | 'accessories' | 'merchandise'>('sales');
  const [showRecordSale, setShowRecordSale] = useState(false);
  const [digitalForm, setDigitalForm] = useState<'gate_pass' | 'pdi' | null>(null);

  // Queries
  const { data: sales } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const res = await api.get('/sales');
      return res.data.data;
    },
  });

  const { data: inventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await api.get('/inventory');
      return res.data.data;
    },
  });

  // Mutations
  const recordSaleMutation = useMutation({
    mutationFn: (data: any) => api.post('/sales', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowRecordSale(false);
    },
  });

  const updateSubsidyMutation = useMutation({
    mutationFn: ({ id, subsidyStatus }: { id: string; subsidyStatus: string }) =>
      api.put(`/sales/${id}/subsidy`, { subsidyStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });

  const { register, handleSubmit } = useForm();

  const handleRecordSale = (data: any) => {
    recordSaleMutation.mutate(data);
  };

  const handleUpdateSubsidy = (id: string, status: string) => {
    updateSubsidyMutation.mutate({ id, subsidyStatus: status });
  };

  // Filter inventory items for selection in Form
  const vehiclesForSale = inventory?.filter((item: any) => item.itemType === 'Scooter' && item.stockLevel > 0) || [];
  const accessoriesList = inventory?.filter((item: any) => item.itemType === 'Accessory') || [];
  const merchandiseList = inventory?.filter((item: any) => item.itemType === 'Merchandise') || [];

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Sales & Inventory Operations</h2>
          <p className="text-sm text-slate-500">Record retail/corporate transactions, verify subsidies, and check inventory levels</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setSubTab('sales')}
            className={`px-4 py-1.5 rounded text-sm ${subTab === 'sales' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
          >
            Sales Registry
          </button>
          <button
            onClick={() => setSubTab('inventory')}
            className={`px-4 py-1.5 rounded text-sm ${subTab === 'inventory' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
          >
            Inventory Stock
          </button>
          <button
            onClick={() => setSubTab('accessories')}
            className={`px-4 py-1.5 rounded text-sm ${subTab === 'accessories' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
          >
            Accessories Classification
          </button>
          <button
            onClick={() => setSubTab('merchandise')}
            className={`px-4 py-1.5 rounded text-sm ${subTab === 'merchandise' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
          >
            Merchandise Articles
          </button>
        </div>
      </div>

      {/* Sales Registry */}
      {subTab === 'sales' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-400 uppercase">Sales History Logs</h3>
            <button
              onClick={() => setShowRecordSale(true)}
              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Record Sale</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Vehicle/Item</th>
                  <th className="py-3 px-4">Net Price</th>
                  <th className="py-3 px-4">Subsidy Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {sales?.map((sale: any) => (
                  <tr key={sale._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-4 font-semibold text-slate-400">{sale.invoiceNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {sale.customerId?.name}
                      <span className="block text-[10px] text-slate-400 font-normal">{sale.customerId?.phoneNumber}</span>
                    </td>
                    <td className="py-3 px-4 capitalize">{sale.salesType}</td>
                    <td className="py-3 px-4">{sale.itemId?.name}</td>
                    <td className="py-3 px-4 font-semibold">₹{sale.price.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        sale.subsidyStatus === 'Approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                        sale.subsidyStatus === 'Pending Approval' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {sale.subsidyStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {sale.subsidyStatus === 'Pending Approval' && (
                        <button
                          onClick={() => handleUpdateSubsidy(sale._id, 'Approved')}
                          className="bg-green-500/15 text-green-600 hover:bg-green-500 hover:text-white px-2 py-0.5 rounded text-[10px] font-semibold"
                        >
                          Approve Subsidy
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Stock view */}
      {subTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase font-bold">Dealership Inventory Registry</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">SKU / Item</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Stock Level</th>
                  <th className="py-3 px-4">Warehouse Location</th>
                  <th className="py-3 px-4">Chassis Number</th>
                  <th className="py-3 px-4">Motor Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {inventory?.map((item: any) => (
                  <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-400 block">{item.sku}</span>
                      <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>
                    </td>
                    <td className="py-3 px-4 capitalize">{item.itemType}</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${item.stockLevel <= item.minStockLevel ? 'text-red-500 font-bold' : 'text-green-500'}`}>
                        {item.stockLevel}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Min Required: {item.minStockLevel}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{item.warehouseLocation}</td>
                    <td className="py-3 px-4">{item.chassisNumber || 'N/A'}</td>
                    <td className="py-3 px-4">{item.motorNumber || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accessories view */}
      {subTab === 'accessories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessoriesList.map((acc: any) => (
            <div key={acc._id} className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{acc.name}</h4>
                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                  Accessory
                </span>
              </div>
              <p className="text-xs text-slate-400">SKU: {acc.sku}</p>
              <div className="flex justify-between items-baseline pt-2">
                <span className="text-xs text-slate-500">Retail price</span>
                <span className="text-sm font-extrabold text-blue-500">₹{acc.price.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs">
                <span>Warehouse: <strong>{acc.warehouseLocation}</strong></span>
                <span>Stock: <strong>{acc.stockLevel} units</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Merchandise view */}
      {subTab === 'merchandise' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {merchandiseList.map((merch: any) => (
            <div key={merch._id} className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{merch.name}</h4>
                <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                  Merchandise
                </span>
              </div>
              <p className="text-xs text-slate-400">SKU: {merch.sku}</p>
              <div className="flex justify-between items-baseline pt-2">
                <span className="text-xs text-slate-500">Retail price</span>
                <span className="text-sm font-extrabold text-blue-500">₹{merch.price.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs">
                <span>Warehouse: <strong>{merch.warehouseLocation}</strong></span>
                <span>Stock: <strong>{merch.stockLevel} units</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Reference Digital Forms */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
        <h3 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider flex items-center gap-1.5">
          <FileSpreadsheet className="h-4.5 w-4.5" /> Department Slips & Digital Forms
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between border border-slate-100 dark:border-slate-800 p-3 rounded hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-white">Gate Pass Format</p>
              <p className="text-[10px] text-slate-400">Official gate security checkout slip</p>
            </div>
            <button
              onClick={() => setDigitalForm('gate_pass')}
              className="px-2.5 py-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white text-[10px] font-bold rounded flex items-center gap-1 transition-all"
            >
              Fill Digital Form
            </button>
          </div>

          <div className="flex items-center justify-between border border-slate-100 dark:border-slate-800 p-3 rounded hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-white">PDI Inspection Sheet</p>
              <p className="text-[10px] text-slate-400">Pre-Delivery inspection checklists</p>
            </div>
            <button
              onClick={() => setDigitalForm('pdi')}
              className="px-2.5 py-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white text-[10px] font-bold rounded flex items-center gap-1 transition-all"
            >
              Fill Digital Form
            </button>
          </div>
        </div>
      </div>

      {/* Record Sale Modal */}
      {showRecordSale && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-md p-6 text-slate-800 dark:text-white space-y-4">
            <h3 className="text-lg font-bold">Record Vehicle Sale Transaction</h3>
            <form onSubmit={handleSubmit(handleRecordSale)} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Sales Classification</label>
                <select
                  required
                  {...register('salesType')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                >
                  <option value="Retail">Retail Sale</option>
                  <option value="Corporate">Corporate Bulk Sale</option>
                  <option value="CPC & CSD">CPC & CSD Sale</option>
                  <option value="Dealership Unit">Dealership Unit Sale</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    {...register('customerName')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    {...register('customerPhone')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Choose Vehicle (from Active Inventory)</label>
                <select
                  required
                  {...register('itemId')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                >
                  <option value="">Select Scooter...</option>
                  {vehiclesForSale.map((item: any) => (
                    <option key={item._id} value={item._id}>
                      {item.name} (SKU: {item.sku} - Stock: {item.stockLevel})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Sale Net Price (₹)</label>
                  <input
                    type="number"
                    required
                    {...register('price')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Subsidy FAME (₹)</label>
                  <input
                    type="number"
                    {...register('subsidyAmount')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Subsidy Status</label>
                  <select
                    {...register('subsidyStatus')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  >
                    <option value="Not Applicable">Not Applicable</option>
                    <option value="Pending Approval">Pending FAME Approval</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Payment Status</label>
                  <select
                    {...register('paymentStatus')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  >
                    <option value="Pending">Pending Invoice Clear</option>
                    <option value="Paid">Fully Paid</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecordSale(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
                >
                  Log Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <DigitalFormModal formType={digitalForm} isOpen={digitalForm !== null} onClose={() => setDigitalForm(null)} />
    </div>
  );
};
