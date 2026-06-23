import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useForm } from 'react-hook-form';
import { Plus, CheckSquare, Clipboard } from 'lucide-react';

export const PurchaseModule: React.FC = () => {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<'po' | 'pdi'>('po');
  const [showCreatePo, setShowCreatePo] = useState(false);
  const [showLogPdi, setShowLogPdi] = useState(false);

  // Queries
  const { data: orders } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: async () => {
      const res = await api.get('/purchase');
      return res.data.data;
    },
  });

  // Mutations
  const createPoMutation = useMutation({
    mutationFn: (data: any) => api.post('/purchase', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setShowCreatePo(false);
    },
  });

  const createPdiMutation = useMutation({
    mutationFn: (data: any) => api.post('/purchase/pdi', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setShowLogPdi(false);
    },
  });

  const receivePoMutation = useMutation({
    mutationFn: (id: string) => api.put(`/purchase/${id}/receive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Error receiving PO');
    },
  });

  const { register: regPo, handleSubmit: subPo } = useForm();
  const { register: regPdi, handleSubmit: subPdi } = useForm();

  const handleCreatePo = (data: any) => createPoMutation.mutate(data);
  const handleLogPdi = (data: any) => {
    // Simple checklist array mapping
    const checklist = [
      { item: 'Battery Voltage checked', status: 'Pass' },
      { item: 'Brake fluid level checked', status: 'Pass' },
      { item: 'Tire pressure verified', status: 'Pass' },
      { item: 'Dashboard software version matched', status: 'Pass' },
    ];
    createPdiMutation.mutate({ checklist, ...data });
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Purchase Department & PDI</h2>
          <p className="text-sm text-slate-500">Initiate purchase orders for scooters/merchandise, and complete PDI verification sheets</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setSubTab('po')}
            className={`px-4 py-1.5 rounded text-sm ${subTab === 'po' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
          >
            Purchase Orders (PO)
          </button>
          <button
            onClick={() => setSubTab('pdi')}
            className={`px-4 py-1.5 rounded text-sm ${subTab === 'pdi' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
          >
            PDI Sheet Logging
          </button>
        </div>
      </div>

      {/* PO List */}
      {subTab === 'po' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-400 uppercase">Purchase History</h3>
            <button
              onClick={() => setShowCreatePo(true)}
              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Raise PO Request</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Net Price</th>
                  <th className="py-3 px-4">PO Status</th>
                  <th className="py-3 px-4">PDI Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {orders?.map((po: any) => (
                  <tr key={po._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-4 font-semibold text-slate-400">{po.poNumber}</td>
                    <td className="py-3 px-4 capitalize">{po.itemType}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{po.itemName}</td>
                    <td className="py-3 px-4">{po.quantity}</td>
                    <td className="py-3 px-4">₹{po.totalAmount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        po.status === 'Received' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        po.pdiStatus === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                        po.pdiStatus === 'Failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {po.pdiStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {po.status === 'Pending' && (
                        <button
                          onClick={() => receivePoMutation.mutate(po._id)}
                          className="bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white px-2 py-1 rounded text-[10px] font-semibold"
                        >
                          Receive Stock
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

      {/* Log PDI */}
      {subTab === 'pdi' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-400 uppercase">Pre-Delivery Inspections Sheets</h3>
            <button
              onClick={() => setShowLogPdi(true)}
              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 flex items-center space-x-1"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Verify & Log PDI</span>
            </button>
          </div>
          <div className="text-xs text-slate-400 space-y-2 max-w-lg">
            <p><strong>PDI Workflow Checklist:</strong></p>
            <p>• Connect incoming PO items with physical scooter inspections.</p>
            <p>• Run diagnostic battery and electrical checks prior to adding the scooters into inventory stocks.</p>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showCreatePo && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-md p-6 text-slate-800 dark:text-white space-y-4">
            <h3 className="text-lg font-bold">Raise Purchase Order (PO)</h3>
            <form onSubmit={subPo(handleCreatePo)} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Item Category</label>
                <select
                  required
                  {...regPo('itemType')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                >
                  <option value="Scooter">E-Scooter</option>
                  <option value="Accessory">Accessory pack</option>
                  <option value="Merchandise">Merchandise articles</option>
                  <option value="Spare Part">Spare Parts batch</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  {...regPo('itemName')}
                  placeholder="e.g. S1 Pro Gen 2 Matte Gray"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    {...regPo('quantity')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    required
                    {...regPo('unitPrice')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Vendor/Manufacturer</label>
                <input
                  type="text"
                  required
                  {...regPo('vendorName')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePo(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
                >
                  Raise PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log PDI Modal */}
      {showLogPdi && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-md p-6 text-slate-800 dark:text-white space-y-4">
            <h3 className="text-lg font-bold">Pre-Delivery Inspection (PDI) Sheet</h3>
            <form onSubmit={subPdi(handleLogPdi)} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">PO Reference Number</label>
                <input
                  type="text"
                  required
                  {...regPdi('poNumber')}
                  placeholder="PO-XXXXXX"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Vehicle Chassis Number</label>
                <input
                  type="text"
                  required
                  {...regPdi('chassisNumber')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Inspection Result Status</label>
                <select
                  required
                  {...regPdi('status')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                >
                  <option value="Approved">Approved (PDI Pass)</option>
                  <option value="Failed">Failed (PDI Fail)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Comments / Defect remarks</label>
                <textarea
                  {...regPdi('remarks')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none h-16"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogPdi(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
                >
                  Save PDI Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
