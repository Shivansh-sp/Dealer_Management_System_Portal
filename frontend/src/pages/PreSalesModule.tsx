import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useForm } from 'react-hook-form';
import { Phone, Calendar, Printer, FileText, CheckCircle, Plus, Info, Upload } from 'lucide-react';

export const PreSalesModule: React.FC = () => {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<'leads' | 'testRides' | 'calculator'>('leads');

  // Search & filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Modals state
  const [showAddLead, setShowAddLead] = useState(false);
  const [showImportCsv, setShowImportCsv] = useState(false);
  const [activeLeadForCall, setActiveLeadForCall] = useState<any>(null);
  const [activeLeadForTestRide, setActiveLeadForTestRide] = useState<any>(null);
  const [activeLeadForQuotation, setActiveLeadForQuotation] = useState<any>(null);

  // Cost calculator state
  const [calcBasePrice, setCalcBasePrice] = useState(125000);
  const [calcInsurance, setCalcInsurance] = useState(8500);
  const [calcAccessories, setCalcAccessories] = useState(4500);
  const [calcMaintenance, setCalcMaintenance] = useState(3000);
  const [calcRegistration, setCalcRegistration] = useState(6500);

  // Queries
  const { data: leadsData } = useQuery({
    queryKey: ['leads', search, status],
    queryFn: async () => {
      const res = await api.get(`/pre-sales/leads?search=${search}&status=${status}`);
      return res.data.data;
    },
  });

  const { data: testRides } = useQuery({
    queryKey: ['testRides'],
    queryFn: async () => {
      const res = await api.get('/pre-sales/test-rides');
      return res.data.data;
    },
  });

  // Mutations
  const addLeadMutation = useMutation({
    mutationFn: (data: any) => api.post('/pre-sales/leads', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setShowAddLead(false);
    },
  });

  const csvImportMutation = useMutation({
    mutationFn: (csvText: string) => api.post('/pre-sales/leads/import', { csvData: csvText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setShowImportCsv(false);
    },
  });

  const logCallMutation = useMutation({
    mutationFn: ({ leadId, payload }: { leadId: string; payload: any }) =>
      api.post(`/pre-sales/leads/${leadId}/calls`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setActiveLeadForCall(null);
    },
  });

  const bookTestRideMutation = useMutation({
    mutationFn: (data: any) => api.post('/pre-sales/test-rides', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testRides'] });
      setActiveLeadForTestRide(null);
    },
  });

  const createQuotationMutation = useMutation({
    mutationFn: (data: any) => api.post('/pre-sales/quotations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setActiveLeadForQuotation(null);
      alert('Quotation generated successfully in system.');
    },
  });

  // Form Submissions
  const { register: regLead, handleSubmit: subLead } = useForm();
  const { register: regCall, handleSubmit: subCall } = useForm();
  const { register: regRide, handleSubmit: subRide } = useForm();
  const { register: regQuo, handleSubmit: subQuo } = useForm();

  const handleAddLead = (data: any) => addLeadMutation.mutate(data);
  const handleLogCall = (data: any) => {
    if (activeLeadForCall) {
      logCallMutation.mutate({ leadId: activeLeadForCall._id, payload: data });
    }
  };
  const handleBookTestRide = (data: any) => {
    if (activeLeadForTestRide) {
      bookTestRideMutation.mutate({ leadId: activeLeadForTestRide._id, ...data });
    }
  };
  const handleCreateQuotation = (data: any) => {
    if (activeLeadForQuotation) {
      createQuotationMutation.mutate({ leadId: activeLeadForQuotation._id, ...data });
    }
  };

  const handleCsvImportSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('csvFile') as File;
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        csvImportMutation.mutate(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Pre-Sales Lead Management</h2>
          <p className="text-sm text-slate-500">Capture leads, run test rides, log call remarks, and output price quotes</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setSubTab('leads')}
            className={`px-4 py-1.5 rounded text-sm ${subTab === 'leads' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
          >
            Leads
          </button>
          <button
            onClick={() => setSubTab('testRides')}
            className={`px-4 py-1.5 rounded text-sm ${subTab === 'testRides' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
          >
            Test Rides
          </button>
          <button
            onClick={() => setSubTab('calculator')}
            className={`px-4 py-1.5 rounded text-sm ${subTab === 'calculator' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
          >
            Ownership Cost Calculator
          </button>
        </div>
      </div>

      {/* Main leads content */}
      {subTab === 'leads' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-64"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="New">New</option>
                <option value="Interested">Interested</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Converted">Converted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="flex space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setShowImportCsv(true)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center space-x-1"
              >
                <Upload className="h-4 w-4" />
                <span>Import CSV</span>
              </button>
              <button
                onClick={() => setShowAddLead(true)}
                className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Lead</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Lead ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {leadsData?.map((lead: any) => (
                  <tr key={lead._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-4 font-semibold text-slate-400">{lead.leadId}</td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{lead.name}</td>
                    <td className="py-3 px-4">{lead.phoneNumber}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        lead.status === 'New' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                        lead.status === 'Interested' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                        lead.status === 'Follow-up' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                        lead.status === 'Converted' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{lead.source}</td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs">{lead.remarks || 'No remarks'}</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => setActiveLeadForCall(lead)}
                        title="Log Call"
                        className="p-1 text-slate-400 hover:text-blue-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 inline-block"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setActiveLeadForTestRide(lead)}
                        title="Book Test Ride"
                        className="p-1 text-slate-400 hover:text-green-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 inline-block"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setActiveLeadForQuotation(lead)}
                        title="Create Quotation"
                        className="p-1 text-slate-400 hover:text-yellow-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 inline-block"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Test rides list view */}
      {subTab === 'testRides' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase">Scheduled Test Rides</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Lead Name</th>
                  <th className="py-3 px-4">Chassis Number</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {testRides?.map((ride: any) => (
                  <tr key={ride._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{ride.leadId?.name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-400">{ride.chassisNumber}</td>
                    <td className="py-3 px-4">{new Date(ride.scheduledTime).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        ride.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        ride.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        {ride.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {ride.status === 'Pending' && (
                        <div className="flex justify-end space-x-1">
                          <button
                            onClick={async () => {
                              await api.put(`/pre-sales/test-rides/${ride._id}`, { status: 'Completed' });
                              queryClient.invalidateQueries({ queryKey: ['testRides'] });
                            }}
                            className="bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white px-2 py-1 rounded text-[10px] font-semibold"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={async () => {
                              await api.put(`/pre-sales/test-rides/${ride._id}`, { status: 'Cancelled' });
                              queryClient.invalidateQueries({ queryKey: ['testRides'] });
                            }}
                            className="bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white px-2 py-1 rounded text-[10px] font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ownership calculator view */}
      {subTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase">Cost Components Slider</h3>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Base Price (₹): {calcBasePrice.toLocaleString()}</label>
                <input
                  type="range"
                  min="90000"
                  max="200000"
                  step="5000"
                  value={calcBasePrice}
                  onChange={(e) => setCalcBasePrice(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Insurance (₹): {calcInsurance.toLocaleString()}</label>
                <input
                  type="range"
                  min="3000"
                  max="15000"
                  step="500"
                  value={calcInsurance}
                  onChange={(e) => setCalcInsurance(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Accessories (₹): {calcAccessories.toLocaleString()}</label>
                <input
                  type="range"
                  min="1000"
                  max="12000"
                  step="500"
                  value={calcAccessories}
                  onChange={(e) => setCalcAccessories(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Maintenance / AMC Plan (₹): {calcMaintenance.toLocaleString()}</label>
                <input
                  type="range"
                  min="1500"
                  max="8000"
                  step="500"
                  value={calcMaintenance}
                  onChange={(e) => setCalcMaintenance(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Registration & RTO Charges (₹): {calcRegistration.toLocaleString()}</label>
                <input
                  type="range"
                  min="4000"
                  max="15000"
                  step="500"
                  value={calcRegistration}
                  onChange={(e) => setCalcRegistration(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-white flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Total Ownership Statement</h3>
              <div className="space-y-2.5 text-sm border-b border-slate-800 pb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Base Price</span>
                  <span>₹{calcBasePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Comprehensive Insurance</span>
                  <span>₹{calcInsurance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Essential Accessories Pack</span>
                  <span>₹{calcAccessories.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Annual Maintenance (AMC)</span>
                  <span>₹{calcMaintenance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Road Tax & Registration</span>
                  <span>₹{calcRegistration.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="pt-4 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-blue-400">On-Road Cost (Estimated)</span>
              <span className="text-3xl font-extrabold text-white">
                ₹{(calcBasePrice + calcInsurance + calcAccessories + calcMaintenance + calcRegistration).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddLead && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-md p-6 text-slate-800 dark:text-white space-y-4">
            <h3 className="text-lg font-bold">Log New Lead</h3>
            <form onSubmit={subLead(handleAddLead)} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Prospect Name</label>
                <input
                  type="text"
                  required
                  {...regLead('name')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  {...regLead('phoneNumber')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  {...regLead('email')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Source</label>
                <input
                  type="text"
                  placeholder="e.g. Website, Walk-in"
                  {...regLead('source')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Initial Remarks</label>
                <textarea
                  {...regLead('remarks')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none h-16"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLead(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportCsv && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-md p-6 text-slate-800 dark:text-white space-y-4">
            <h3 className="text-lg font-bold">Import Leads from CSV</h3>
            <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 rounded text-[11px] text-slate-400">
              <p className="font-semibold text-slate-200 mb-1">Expected CSV columns (comma separated):</p>
              <code>Name, Email, PhoneNumber, Source, Remarks</code>
            </div>
            <form onSubmit={handleCsvImportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select CSV File</label>
                <input
                  type="file"
                  name="csvFile"
                  accept=".csv"
                  required
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportCsv(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
                >
                  Upload & Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Call Modal */}
      {activeLeadForCall && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-md p-6 text-slate-800 dark:text-white space-y-4">
            <h3 className="text-lg font-bold">Log Call Remark for {activeLeadForCall.name}</h3>
            <form onSubmit={subCall(handleLogCall)} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Call Discussion Remarks</label>
                <textarea
                  required
                  {...regCall('remarks')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none h-20"
                  placeholder="Discussed test ride schedule/pricing..."
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Next Follow-Up Date (Optional)</label>
                <input
                  type="datetime-local"
                  {...regCall('nextFollowUp')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveLeadForCall(null)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
                >
                  Log Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Test Ride Modal */}
      {activeLeadForTestRide && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-md p-6 text-slate-800 dark:text-white space-y-4">
            <h3 className="text-lg font-bold">Schedule Test Ride for {activeLeadForTestRide.name}</h3>
            <form onSubmit={subRide(handleBookTestRide)} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Scooter Chassis Number</label>
                <input
                  type="text"
                  required
                  {...regRide('chassisNumber')}
                  placeholder="e.g. CS12345"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Scheduled Time</label>
                <input
                  type="datetime-local"
                  required
                  {...regRide('scheduledTime')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Additional Staff Notes</label>
                <textarea
                  {...regRide('remarks')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none h-16"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveLeadForTestRide(null)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
                >
                  Schedule Ride
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Quotation Modal */}
      {activeLeadForQuotation && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-md p-6 text-slate-800 dark:text-white space-y-4">
            <h3 className="text-lg font-bold">Generate Quotation Statement</h3>
            <form onSubmit={subQuo(handleCreateQuotation)} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Scooter Model</label>
                <input
                  type="text"
                  required
                  {...regQuo('scooterModel')}
                  placeholder="e.g. S1 Pro Gen 2"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Base Price (₹)</label>
                <input
                  type="number"
                  required
                  {...regQuo('basePrice')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Insurance (₹)</label>
                  <input
                    type="number"
                    {...regQuo('insuranceCost')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Accessories (₹)</label>
                  <input
                    type="number"
                    {...regQuo('accessoriesCost')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Maintenance (₹)</label>
                  <input
                    type="number"
                    {...regQuo('maintenanceCost')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Registration (₹)</label>
                  <input
                    type="number"
                    {...regQuo('registrationCost')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveLeadForQuotation(null)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
                >
                  Generate & Export
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
