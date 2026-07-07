import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useForm } from 'react-hook-form';
import { ShieldCheck, Calendar, DollarSign, Plus, FileText } from 'lucide-react';

export const AfterSalesModule: React.FC<{ defaultSubTab?: 'hsrp' | 'warranty' | 'resale' }> = ({ defaultSubTab }) => {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<'hsrp' | 'warranty' | 'resale'>(defaultSubTab || 'hsrp');

  React.useEffect(() => {
    if (defaultSubTab) {
      setSubTab(defaultSubTab);
    }
  }, [defaultSubTab]);
  const [showBookHsrp, setShowBookHsrp] = useState(false);
  const [showSubmitClaim, setShowSubmitClaim] = useState(false);

  // Resale calculator state
  const [scooterAge, setScooterAge] = useState(1);
  const [kmsDriven, setKmsDriven] = useState(5000);
  const [batteryHealth, setBatteryHealth] = useState(95);

  // Queries
  const { data: bookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await api.get('/service/bookings?bookingType=HSRP');
      return res.data.data;
    },
  });

  const { data: claims } = useQuery({
    queryKey: ['claims'],
    queryFn: async () => {
      const res = await api.get('/service/warranty');
      return res.data.data;
    },
  });

  // Mutations
  const submitClaimMutation = useMutation({
    mutationFn: (data: any) => api.post('/service/warranty', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      setShowSubmitClaim(false);
    },
  });

  const bookHsrpMutation = useMutation({
    mutationFn: (data: any) =>
      api.post('/service/bookings', { bookingType: 'HSRP', ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setShowBookHsrp(false);
    },
  });

  const updateClaimMutation = useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: string; remarks: string }) =>
      api.put(`/service/warranty/${id}`, { status, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    },
  });

  const { register: regClaim, handleSubmit: subClaim } = useForm();
  const { register: regHsrp, handleSubmit: subHsrp } = useForm();

  const handleClaimSubmit = (data: any) => submitClaimMutation.mutate(data);
  const handleHsrpSubmit = (data: any) => bookHsrpMutation.mutate(data);

  // Estimate Resale Value: basic depreciation logic
  const calculateResaleVal = () => {
    const originalPrice = 145000;
    let depRate = 0.15; // 15% flat depreciation for year 1
    if (scooterAge > 1) depRate += (scooterAge - 1) * 0.08;
    if (kmsDriven > 10000) depRate += 0.05;
    if (batteryHealth < 90) depRate += (90 - batteryHealth) * 0.015;

    const finalVal = originalPrice * (1 - depRate);
    return Math.max(40000, finalVal);
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">After-Sales & Warranty Department</h2>
          <p className="text-sm text-slate-500">Manage High-Security Registration Plates (HSRP), log warranty claims, and evaluate resale values</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setSubTab('hsrp')}
            className={`px-4 py-1.5 rounded text-sm ${subTab === 'hsrp' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
          >
            HSRP Registration
          </button>
          <button
            onClick={() => setSubTab('warranty')}
            className={`px-4 py-1.5 rounded text-sm ${subTab === 'warranty' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
          >
            Warranty Claim Logs
          </button>
          <button
            onClick={() => setSubTab('resale')}
            className={`px-4 py-1.5 rounded text-sm ${subTab === 'resale' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
          >
            Resale Cost Calculator
          </button>
        </div>
      </div>

      {/* HSRP Booking */}
      {subTab === 'hsrp' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-400 uppercase">HSRP Active Schedule</h3>
            <button
              onClick={() => setShowBookHsrp(true)}
              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Book HSRP Slot</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Chassis Number</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {bookings?.map((book: any) => (
                  <tr key={book._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-4 font-semibold text-slate-400">{book.bookingId}</td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {book.customerId?.name}
                      <span className="block text-[10px] text-slate-400 font-normal">{book.customerId?.phoneNumber}</span>
                    </td>
                    <td className="py-3 px-4">{book.chassisNumber}</td>
                    <td className="py-3 px-4">{new Date(book.scheduledDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        book.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                      }`}>
                        {book.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Warranty claim view */}
      {subTab === 'warranty' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-400 uppercase">Submitted Warranty Claim Requests</h3>
            <button
              onClick={() => setShowSubmitClaim(true)}
              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Submit Claim</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Claim ID</th>
                  <th className="py-3 px-4">Chassis Number</th>
                  <th className="py-3 px-4">Claim Type</th>
                  <th className="py-3 px-4">Invoice Ref</th>
                  <th className="py-3 px-4">Issue Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {claims?.map((claim: any) => (
                  <tr key={claim._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-4 font-semibold text-slate-400">{claim.claimId}</td>
                    <td className="py-3 px-4">{claim.chassisNumber}</td>
                    <td className="py-3 px-4">{claim.claimType}</td>
                    <td className="py-3 px-4">{claim.invoiceNumber}</td>
                    <td className="py-3 px-4 max-w-xs truncate">{claim.issueDescription}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        claim.status === 'Approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                        claim.status === 'Rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                      }`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {claim.status === 'Pending' && (
                        <div className="flex justify-end space-x-1">
                          <button
                            onClick={() => updateClaimMutation.mutate({ id: claim._id, status: 'Approved', remarks: 'Part verified' })}
                            className="bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white px-2 py-1 rounded text-[10px] font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateClaimMutation.mutate({ id: claim._id, status: 'Rejected', remarks: 'Verification failed' })}
                            className="bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white px-2 py-1 rounded text-[10px] font-semibold"
                          >
                            Reject
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

      {/* Resale value calculator */}
      {subTab === 'resale' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase">Depreciation Inputs</h3>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Scooter Age (Years): {scooterAge}</label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={scooterAge}
                  onChange={(e) => setScooterAge(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Kilometers Driven (kms): {kmsDriven.toLocaleString()}</label>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="2000"
                  value={kmsDriven}
                  onChange={(e) => setKmsDriven(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Battery Health State (%): {batteryHealth}%</label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="1"
                  value={batteryHealth}
                  onChange={(e) => setBatteryHealth(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-white flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Resale Valuation Statement</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Original Buy Price</span>
                  <span>₹1,45,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Age Depreciation</span>
                  <span className="text-red-400">-{scooterAge * 10}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Battery Degradation</span>
                  <span className="text-red-400">-{100 - batteryHealth}%</span>
                </div>
              </div>
            </div>
            <div className="pt-4 flex justify-between items-baseline border-t border-slate-800">
              <span className="text-sm font-semibold text-blue-400">Estimated Valuation</span>
              <span className="text-3xl font-extrabold text-white">
                ₹{Math.floor(calculateResaleVal()).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Download Reference Templates */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
        <h3 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="h-4.5 w-4.5" /> Department Slips & Reference Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col justify-between border border-slate-100 dark:border-slate-800 p-3 rounded hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-white">Warranty Claim Form PDF</p>
              <p className="text-[10px] text-slate-400">Official template for raising warranty claims</p>
            </div>
            <a
              href="http://localhost:5000/uploads/WARRANTY%20CLAIM%20FORM(CRM)%20-%20Copy.pdf"
              download
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-all"
            >
              Download PDF
            </a>
          </div>

          <div className="flex flex-col justify-between border border-slate-100 dark:border-slate-800 p-3 rounded hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-white">Warranty Part Pick Up PDF</p>
              <p className="text-[10px] text-slate-400">Part pickup verification sheet</p>
            </div>
            <a
              href="http://localhost:5000/uploads/WARRANTY%20PART%20PICK%20UP%20(CRM)%20-%20Copy.pdf"
              download
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-all"
            >
              Download PDF
            </a>
          </div>

          <div className="flex flex-col justify-between border border-slate-100 dark:border-slate-800 p-3 rounded hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-white">Failed Part Tag PDF</p>
              <p className="text-[10px] text-slate-400">Security and component failure tags</p>
            </div>
            <a
              href="http://localhost:5000/uploads/FAILED%20TAG%20PART%20(CRM)%20-%20Copy.pdf"
              download
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-all"
            >
              Download PDF
            </a>
          </div>
        </div>
      </div>

      {/* Book HSRP Modal */}
      {showBookHsrp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-md p-6 text-slate-800 dark:text-white space-y-4">
            <h3 className="text-lg font-bold">Book HSRP Slot</h3>
            <form onSubmit={subHsrp(handleHsrpSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    {...regHsrp('customerName')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    {...regHsrp('customerPhone')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Vehicle Chassis Number</label>
                <input
                  type="text"
                  required
                  {...regHsrp('chassisNumber')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Scheduled Installation Date</label>
                <input
                  type="date"
                  required
                  {...regHsrp('scheduledDate')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookHsrp(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
                >
                  Confirm Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Warranty Modal */}
      {showSubmitClaim && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-md p-6 text-slate-800 dark:text-white space-y-4">
            <h3 className="text-lg font-bold">Log Warranty Claim Request</h3>
            <form onSubmit={subClaim(handleClaimSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Vehicle Chassis Number</label>
                  <input
                    type="text"
                    required
                    {...regClaim('chassisNumber')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Customer Phone</label>
                  <input
                    type="text"
                    required
                    {...regClaim('customerPhone')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Claim Scope</label>
                  <select
                    {...regClaim('claimType')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  >
                    <option value="Scooter">Complete Scooter</option>
                    <option value="Part">Specific Part Replacement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Invoice Reference</label>
                  <input
                    type="text"
                    required
                    {...regClaim('invoiceNumber')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Part SKU / Number (for Part claims)</label>
                <input
                  type="text"
                  {...regClaim('partNumber')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Issue Details</label>
                <textarea
                  required
                  {...regClaim('issueDescription')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none h-16"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitClaim(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
                >
                  Submit Claims
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
