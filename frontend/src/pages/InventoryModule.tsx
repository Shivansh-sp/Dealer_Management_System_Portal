import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useForm } from 'react-hook-form';
import { Plus, Search, AlertTriangle, Clipboard, ShieldCheck, Check, Truck, Barcode, QrCode, ArrowRight, FileText } from 'lucide-react';

export const InventoryModule: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [subTab, setSubTab] = useState<'inventory' | 'requests' | 'gatePass'>('inventory');

  // Filters
  const [search, setSearch] = useState('');
  const [itemType, setItemType] = useState('');
  const [lowStock, setLowStock] = useState(false);

  // Modals
  const [showAddItem, setShowAddItem] = useState(false);
  const [showCreateGatePass, setShowCreateGatePass] = useState(false);
  const [activeRequestForDispatch, setActiveRequestForDispatch] = useState<any>(null);
  const [scanValue, setScanValue] = useState('');

  // Queries
  const { data: inventoryData, isLoading: invLoading } = useQuery({
    queryKey: ['inventory', search, itemType, lowStock],
    queryFn: async () => {
      const res = await api.get(
        `/inventory?search=${search}&itemType=${itemType}&lowStock=${lowStock}`
      );
      return res.data;
    },
  });

  const { data: requests, isLoading: reqLoading } = useQuery({
    queryKey: ['materialRequests'],
    queryFn: async () => {
      const res = await api.get('/service/materials');
      return res.data.data;
    },
  });

  const { data: gatePasses, isLoading: gpLoading } = useQuery({
    queryKey: ['gatePasses'],
    queryFn: async () => {
      const res = await api.get('/inventory/gate-passes');
      return res.data.data;
    },
  });

  // Mutations
  const addItemMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowAddItem(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Error adding item');
    },
  });

  const dispatchPartMutation = useMutation({
    mutationFn: ({ id, stickerBarcode }: { id: string; stickerBarcode: string }) =>
      api.put(`/service/materials/${id}/approve`, { action: 'dispatch', stickerBarcode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialRequests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setActiveRequestForDispatch(null);
      setScanValue('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Error dispatching part');
    },
  });

  const raiseGatePassMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/gate-passes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gatePasses'] });
      setShowCreateGatePass(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Error generating gate pass');
    },
  });

  const approveGatePassMutation = useMutation({
    mutationFn: (id: string) => api.put(`/inventory/gate-passes/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gatePasses'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  // Forms
  const { register: regItem, handleSubmit: subItem, watch: watchItemType } = useForm();
  const { register: regPass, handleSubmit: subPass } = useForm();

  const handleAddItem = (data: any) => addItemMutation.mutate(data);
  const handleRaiseGatePass = (data: any) => raiseGatePassMutation.mutate(data);
  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRequestForDispatch && scanValue) {
      dispatchPartMutation.mutate({
        id: activeRequestForDispatch._id,
        stickerBarcode: scanValue,
      });
    }
  };

  const selectedItemType = watchItemType('itemType');
  const isMasterAdminOrPurchase = ['Master Admin', 'Purchase Manager'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1F3B73]">Inventory & Gate Pass Operations</h2>
          <p className="text-xs text-slate-500">Track E-Scooters/parts levels, approve workshop material dispatches, and log security checkouts</p>
        </div>
        <div className="flex space-x-2 bg-slate-200 p-0.5 rounded">
          <button
            onClick={() => setSubTab('inventory')}
            className={`px-4 py-1.5 rounded text-xs font-semibold ${subTab === 'inventory' ? 'bg-[#1F3B73] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Inventory Stock
          </button>
          <button
            onClick={() => setSubTab('requests')}
            className={`px-4 py-1.5 rounded text-xs font-semibold ${subTab === 'requests' ? 'bg-[#1F3B73] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Spare Parts Requests
          </button>
          <button
            onClick={() => setSubTab('gatePass')}
            className={`px-4 py-1.5 rounded text-xs font-semibold ${subTab === 'gatePass' ? 'bg-[#1F3B73] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Security Gate Passes
          </button>
        </div>
      </div>

      {/* 1. Inventory Stock Tab */}
      {subTab === 'inventory' && (
        <div className="bg-white border border-slate-200 rounded p-6 space-y-6 shadow-sm">
          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search by name, SKU, chassis..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1F3B73]"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none"
              >
                <option value="">All Item Types</option>
                <option value="Scooter">E-Scooters</option>
                <option value="Accessory">Accessories</option>
                <option value="Merchandise">Merchandise</option>
                <option value="Spare Part">Spare Parts</option>
              </select>
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowStock}
                  onChange={(e) => setLowStock(e.target.checked)}
                  className="rounded border-slate-350 text-[#1F3B73] focus:ring-[#1F3B73] h-3.5 w-3.5"
                />
                <span className="text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Low Stock Only
                </span>
              </label>
            </div>
            {isMasterAdminOrPurchase && (
              <button
                onClick={() => setShowAddItem(true)}
                className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 flex items-center space-x-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add Stock Item</span>
              </button>
            )}
          </div>

          {/* Table */}
          {invLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading stock levels...</div>
          ) : (
            <div className="overflow-x-auto border border-slate-150 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4">Item Details</th>
                    <th className="py-2.5 px-4">SKU / Barcode</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Stock Level</th>
                    <th className="py-2.5 px-4">Price</th>
                    <th className="py-2.5 px-4">Warehouse Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryData?.data?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No inventory matched your filters.</td>
                    </tr>
                  ) : (
                    inventoryData?.data?.map((item: any) => {
                      const isLow = item.stockLevel <= item.minStockLevel;
                      return (
                        <tr key={item._id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            <div>{item.name}</div>
                            {item.itemType === 'Scooter' && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                Chassis: {item.chassisNumber} | Motor: {item.motorNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono">{item.sku}</div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Barcode className="h-3 w-3 shrink-0" /> {item.barcode}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                              {item.itemType}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <span className={`font-bold ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                                {item.stockLevel} units
                              </span>
                              {isLow && (
                                <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1 py-0.2 rounded uppercase">
                                  Low Stock
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-slate-400">Min limit: {item.minStockLevel}</div>
                          </td>
                          <td className="py-3 px-4 font-semibold">₹{item.price.toLocaleString()}</td>
                          <td className="py-3 px-4 text-slate-500">{item.warehouseLocation}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. Spare Parts Requests Tab */}
      {subTab === 'requests' && (
        <div className="bg-white border border-slate-200 rounded p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Point Material Requests</h3>
          {reqLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading material requests...</div>
          ) : (
            <div className="overflow-x-auto border border-slate-150 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5 px-4">Request ID</th>
                    <th className="py-2.5 px-4">Part / Quantity</th>
                    <th className="py-2.5 px-4">Chassis Target</th>
                    <th className="py-2.5 px-4">Requested By</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No requests raised by technicians.</td>
                    </tr>
                  ) : (
                    requests?.map((req: any) => (
                      <tr key={req._id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{req.requestId}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{req.partName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">SKU: {req.partSku} | Qty: {req.quantity}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{req.chassisNumber}</td>
                        <td className="py-3 px-4 text-slate-500">{req.requestedBy?.name || 'Technician'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.status.includes('Approved') || req.status === 'Received' ? 'bg-green-100 text-green-800' :
                            req.status.includes('Pending') ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {req.status === 'Pending Store Approval' && (
                            <button
                              onClick={() => {
                                // Transition to manager approval, or directly dispatch if admin
                                api.put(`/service/materials/${req._id}/approve`, { action: 'approve_store' })
                                  .then(() => queryClient.invalidateQueries({ queryKey: ['materialRequests'] }));
                              }}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded hover:bg-blue-100"
                            >
                              Approve Request
                            </button>
                          )}
                          {req.status === 'Pending Manager Approval' && (
                            <button
                              onClick={() => {
                                api.put(`/service/materials/${req._id}/approve`, { action: 'approve_manager' })
                                  .then(() => queryClient.invalidateQueries({ queryKey: ['materialRequests'] }));
                              }}
                              className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded hover:bg-purple-100"
                            >
                              Manager Signoff
                            </button>
                          )}
                          {req.status === 'Approved' && (
                            <button
                              onClick={() => setActiveRequestForDispatch(req)}
                              className="px-2 py-1 bg-green-600 text-white text-[10px] font-bold rounded hover:bg-green-700"
                            >
                              Scan & Dispatch Part
                            </button>
                          )}
                          {req.status !== 'Pending Store Approval' && req.status !== 'Pending Manager Approval' && req.status !== 'Approved' && (
                            <span className="text-[10px] text-slate-400 font-semibold">Done ✓</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. Security Gate Passes Tab */}
      {subTab === 'gatePass' && (
        <div className="bg-white border border-slate-200 rounded p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gate Passes Security Logs</h3>
            <button
              onClick={() => setShowCreateGatePass(true)}
              className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 flex items-center space-x-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Raise Outgoing Gate Pass</span>
            </button>
          </div>

          {gpLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading gate passes...</div>
          ) : (
            <div className="overflow-x-auto border border-slate-150 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5 px-4">Gate Pass ID</th>
                    <th className="py-2.5 px-4">Vehicle Details</th>
                    <th className="py-2.5 px-4">Driver / Customer</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Gate Checkout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gatePasses?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">No gate checkout passes generated.</td>
                    </tr>
                  ) : (
                    gatePasses?.map((gp: any) => (
                      <tr key={gp._id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{gp.gatePassId}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">Invoice: {gp.invoiceNumber}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Chassis: {gp.chassisNumber} | Motor: {gp.motorNumber}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{gp.customerName}</div>
                          <div className="text-[10px] text-slate-400">Driver: {gp.driverName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            gp.securityApproved ? 'bg-green-105 text-green-800' : 'bg-red-50 text-red-700'
                          }`}>
                            {gp.securityApproved ? 'Checked Out ✓' : 'Awaiting Checkout'}
                          </span>
                          {gp.checkedOutAt && (
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              {new Date(gp.checkedOutAt).toLocaleTimeString()}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!gp.securityApproved ? (
                            <button
                              onClick={() => approveGatePassMutation.mutate(gp._id)}
                              className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded flex items-center space-x-1 ml-auto"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>Authorize Outflow</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center justify-end gap-1">
                              Checked out <Check className="h-3.5 w-3.5 text-green-600" />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Quick Download Reference Templates */}
      <div className="bg-white border border-slate-200 rounded p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="h-4.5 w-4.5" /> Department Slips & Reference Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between border border-slate-100 p-3 rounded hover:bg-slate-50 transition-colors">
            <div>
              <p className="text-xs font-semibold text-slate-800">Material Receipt Sheet PDF</p>
              <p className="text-[10px] text-slate-400">Official log sheet for incoming inventory stock receipts</p>
            </div>
            <a
              href="http://localhost:5000/uploads/Material%20Reciept%20Sheet.pdf"
              download
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white text-[10px] font-bold rounded flex items-center gap-1 transition-all"
            >
              Download PDF
            </a>
          </div>
        </div>
      </div>

      {/* MODAL: Add Stock Item */}
      {showAddItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 rounded shadow-xl max-w-md w-full p-6 space-y-4 text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-[#1F3B73] text-sm uppercase">Add Stock Item</h3>
              <button onClick={() => setShowAddItem(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            </div>
            <form onSubmit={subItem(handleAddItem)} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Item Type</label>
                <select
                  required
                  {...regItem('itemType')}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3B73]"
                >
                  <option value="Scooter">E-Scooter</option>
                  <option value="Accessory">Accessory</option>
                  <option value="Merchandise">Merchandise</option>
                  <option value="Spare Part">Spare Part</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    {...regItem('name')}
                    placeholder="e.g. S1 Pro Gray"
                    className="w-full px-3 py-1.5 border border-slate-350 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3B73]"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    {...regItem('sku')}
                    placeholder="SKU-SCO-S1P2"
                    className="w-full px-3 py-1.5 border border-slate-350 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3B73]"
                  />
                </div>
              </div>

              {selectedItemType === 'Scooter' && (
                <div className="grid grid-cols-2 gap-3 p-2 bg-slate-50 rounded border border-slate-200">
                  <div>
                    <label className="block text-slate-500 mb-1">Chassis Number</label>
                    <input
                      type="text"
                      required
                      {...regItem('chassisNumber')}
                      placeholder="CS12345"
                      className="w-full px-3 py-1.5 border border-slate-350 rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Motor Number</label>
                    <input
                      type="text"
                      required
                      {...regItem('motorNumber')}
                      placeholder="MN54321"
                      className="w-full px-3 py-1.5 border border-slate-350 rounded bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    {...regItem('price')}
                    placeholder="145000"
                    className="w-full px-3 py-1.5 border border-slate-350 rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Initial Qty</label>
                  <input
                    type="number"
                    required
                    {...regItem('stockLevel')}
                    defaultValue={1}
                    className="w-full px-3 py-1.5 border border-slate-350 rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    required
                    {...regItem('minStockLevel')}
                    defaultValue={5}
                    className="w-full px-3 py-1.5 border border-slate-350 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Warehouse Location</label>
                <input
                  type="text"
                  {...regItem('warehouseLocation')}
                  placeholder="Main Warehouse"
                  className="w-full px-3 py-1.5 border border-slate-350 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddItem(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addItemMutation.isPending}
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                >
                  {addItemMutation.isPending ? 'Saving...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Dispatch Spare Part with Scan Simulation */}
      {activeRequestForDispatch && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 rounded shadow-xl max-w-sm w-full p-6 space-y-4 text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-[#1F3B73] text-sm uppercase">Simulate Barcode Dispatch</h3>
              <button onClick={() => setActiveRequestForDispatch(null)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            </div>
            <div className="text-xs space-y-2 bg-slate-50 p-3 rounded border border-slate-200">
              <p><strong>Part:</strong> {activeRequestForDispatch.partName}</p>
              <p><strong>Target Chassis:</strong> {activeRequestForDispatch.chassisNumber}</p>
              <p><strong>Quantity:</strong> {activeRequestForDispatch.quantity}</p>
            </div>
            <form onSubmit={handleDispatch} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Scan / Enter Sticker Barcode</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={scanValue}
                    onChange={(e) => setScanValue(e.target.value)}
                    placeholder="BC-BATT-348"
                    className="w-full pl-3 pr-20 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-green-600 font-mono text-sm tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setScanValue(`BC-BATT-${Math.floor(100 + Math.random() * 900)}`)}
                    className="absolute right-1 top-1.5 px-2 py-0.5 bg-slate-200 text-[10px] font-bold rounded text-slate-700 hover:bg-slate-300"
                  >
                    Simulate scan
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveRequestForDispatch(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatchPartMutation.isPending}
                  className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded font-bold flex items-center space-x-1"
                >
                  <Barcode className="h-4 w-4" />
                  <span>{dispatchPartMutation.isPending ? 'Dispatching...' : 'Dispatch & Deduct'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Raise Outgoing Gate Pass */}
      {showCreateGatePass && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 rounded shadow-xl max-w-md w-full p-6 space-y-4 text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-[#1F3B73] text-sm uppercase">Generate Vehicle Gate Pass</h3>
              <button onClick={() => setShowCreateGatePass(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            </div>
            <form onSubmit={subPass(handleRaiseGatePass)} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Chassis Number</label>
                  <input
                    type="text"
                    required
                    {...regPass('chassisNumber')}
                    placeholder="CS12345"
                    className="w-full px-3 py-1.5 border border-slate-350 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3B73] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Motor Number</label>
                  <input
                    type="text"
                    required
                    {...regPass('motorNumber')}
                    placeholder="MN54321"
                    className="w-full px-3 py-1.5 border border-slate-350 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3B73] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Retail Invoice No.</label>
                  <input
                    type="text"
                    required
                    {...regPass('invoiceNumber')}
                    placeholder="INV-72918"
                    className="w-full px-3 py-1.5 border border-slate-350 rounded focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    {...regPass('customerName')}
                    placeholder="Raman Sharma"
                    className="w-full px-3 py-1.5 border border-slate-350 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Outflow Driver Name / Details</label>
                <input
                  type="text"
                  required
                  {...regPass('driverName')}
                  placeholder="Self-driven / Logistics Agent name"
                  className="w-full px-3 py-1.5 border border-slate-350 rounded focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGatePass(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={raiseGatePassMutation.isPending}
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                >
                  {raiseGatePassMutation.isPending ? 'Generating...' : 'Create Gate Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
