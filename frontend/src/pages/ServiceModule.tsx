import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useForm } from 'react-hook-form';
import { Plus, Barcode, Play, Clipboard, Compass, CheckCircle, Clock } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export const ServiceModule: React.FC = () => {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<'bookings' | 'records' | 'technicians' | 'labor' | 'requests' | 'tracking'>('bookings');
  const [showBookService, setShowBookService] = useState(false);
  const [showCreateJobCard, setShowCreateJobCard] = useState(false);
  const [showRequestPart, setShowRequestPart] = useState(false);

  // Tracking WebSocket state
  const [chassisNumber, setChassisNumber] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentStage, setCurrentStage] = useState<string>('Received');
  const [timeline, setTimeline] = useState<any[]>([]);

  useEffect(() => {
    if (subTab !== 'tracking') return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const s = io(socketUrl, { withCredentials: true });
    setSocket(s);

    s.on('service-stage-changed', (data: any) => {
      if (data.chassisNumber === chassisNumber) {
        setCurrentStage(data.stage);
        setTimeline((prev) => [
          ...prev,
          { stage: data.stage, time: new Date(data.updatedAt).toLocaleTimeString() },
        ]);
      }
    });

    return () => {
      s.disconnect();
    };
  }, [chassisNumber, subTab]);

  const handleTrack = () => {
    if (socket && chassisNumber) {
      socket.emit('track-service', chassisNumber);
      setTimeline([{ stage: 'Received', time: new Date().toLocaleTimeString() }]);
      setCurrentStage('Received');
    }
  };

  const stagesList = ['Received', 'Inspecting', 'Parts Replaced', 'Washing', 'Ready'];

  // Material requests queries & mutations
  const { data: requests } = useQuery({
    queryKey: ['materialRequests'],
    queryFn: async () => {
      const res = await api.get('/service/materials');
      return res.data.data;
    },
    enabled: subTab === 'requests',
  });

  const requestPartMutation = useMutation({
    mutationFn: (data: any) => api.post('/service/materials', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialRequests'] });
      setShowRequestPart(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Error raising parts request');
    },
  });

  const { register: regReq, handleSubmit: subReq } = useForm();
  const handleRequestPart = (data: any) => requestPartMutation.mutate(data);

  // Search chassis number
  const [searchChassis, setSearchChassis] = useState('');

  // Queries
  const { data: bookings } = useQuery({
    queryKey: ['serviceBookings'],
    queryFn: async () => {
      const res = await api.get('/service/bookings?bookingType=Service');
      return res.data.data;
    },
  });

  const { data: records } = useQuery({
    queryKey: ['serviceRecords', searchChassis],
    queryFn: async () => {
      const res = await api.get(`/service/records?chassisNumber=${searchChassis}`);
      return res.data.data;
    },
  });

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const res = await api.get('/service/technicians');
      return res.data.data;
    },
  });

  // Mutations
  const bookServiceMutation = useMutation({
    mutationFn: (data: any) =>
      api.post('/service/bookings', { bookingType: 'Service', ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceBookings'] });
      setShowBookService(false);
    },
  });

  const createJobCardMutation = useMutation({
    mutationFn: (data: any) => api.post('/service/records', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRecords'] });
      setShowCreateJobCard(false);
    },
  });

  const { register: regBook, handleSubmit: subBook } = useForm();
  const { register: regJob, handleSubmit: subJob } = useForm();

  const handleBookService = (data: any) => bookServiceMutation.mutate(data);
  const handleCreateJobCard = (data: any) => createJobCardMutation.mutate(data);

  // Static labor rate list
  const laborPriceList = [
    { code: 'L001', job: 'Periodic Maintenance Service', rate: 950 },
    { code: 'L002', job: 'Brake Pad Replacement Front/Rear', rate: 350 },
    { code: 'L003', job: 'Electrical Diagnostics & Wiring Repair', rate: 1200 },
    { code: 'L004', job: 'Battery Health Pack Swap Service', rate: 1500 },
    { code: 'L005', job: 'Software Calibration & Flashing', rate: 600 },
    { code: 'L006', job: 'General Washing and Detailing Polishing', rate: 450 },
  ];

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Service Point Operations</h2>
          <p className="text-sm text-slate-500">Coordinate repairs, raise job cards, assign mechanics, and review labor pricing</p>
        </div>
        <div className="flex space-x-1.5 flex-wrap gap-y-2">
          <button
            onClick={() => setSubTab('bookings')}
            className={`px-3 py-1.5 rounded text-xs font-semibold ${subTab === 'bookings' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            Service Bookings
          </button>
          <button
            onClick={() => setSubTab('records')}
            className={`px-3 py-1.5 rounded text-xs font-semibold ${subTab === 'records' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            Service History Search
          </button>
          <button
            onClick={() => setSubTab('technicians')}
            className={`px-3 py-1.5 rounded text-xs font-semibold ${subTab === 'technicians' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            Technicians
          </button>
          <button
            onClick={() => setSubTab('labor')}
            className={`px-3 py-1.5 rounded text-xs font-semibold ${subTab === 'labor' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            Labor List
          </button>
          <button
            onClick={() => setSubTab('requests')}
            className={`px-3 py-1.5 rounded text-xs font-semibold ${subTab === 'requests' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            Material Request
          </button>
          <button
            onClick={() => setSubTab('tracking')}
            className={`px-3 py-1.5 rounded text-xs font-semibold ${subTab === 'tracking' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            Vehicle Live Tracking
          </button>
        </div>
      </div>

      {/* Bookings */}
      {subTab === 'bookings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-400 uppercase font-bold">Active Service Bookings</h3>
            <button
              onClick={() => setShowBookService(true)}
              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Book Appointment</span>
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
                  <th className="py-3 px-4">Details</th>
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
                    <td className="py-3 px-4 font-semibold text-slate-400">{book.chassisNumber}</td>
                    <td className="py-3 px-4">{new Date(book.scheduledDate).toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs">{book.details || 'N/A'}</td>
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

      {/* Service Search & Record */}
      {subTab === 'records' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search history by Chassis Number..."
                value={searchChassis}
                onChange={(e) => setSearchChassis(e.target.value)}
                className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none w-full sm:w-72"
              />
            </div>
            <button
              onClick={() => setShowCreateJobCard(true)}
              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Raise Job Card</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Job Card ID</th>
                  <th className="py-3 px-4">Chassis Number</th>
                  <th className="py-3 px-4">Service Date</th>
                  <th className="py-3 px-4">Job Details</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">AMC Attached</th>
                  <th className="py-3 px-4">Total Billing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {records?.map((rec: any) => (
                  <tr key={rec._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-4 font-semibold text-slate-400">{rec.recordId}</td>
                    <td className="py-3 px-4 font-semibold">{rec.chassisNumber}</td>
                    <td className="py-3 px-4">{new Date(rec.serviceDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{rec.jobCardDetails}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{rec.amcAttached ? 'Yes' : 'No'}</td>
                    <td className="py-3 px-4 font-semibold">₹{rec.billingAmount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Technician list view */}
      {subTab === 'technicians' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technicians?.map((tech: any) => (
            <div key={tech._id} className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{tech.name}</h4>
                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                  {tech.region}
                </span>
              </div>
              <p className="text-xs text-slate-400">Specialty: {tech.specialty}</p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs items-center">
                <span>Status: <strong className="text-green-500">{tech.status}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Labor Prices */}
      {subTab === 'labor' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase font-bold">Standard Labor Rate List</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Task Description</th>
                  <th className="py-3 px-4 text-right">Standard Rate (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {laborPriceList.map((item) => (
                  <tr key={item.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-4 font-semibold text-slate-400">{item.code}</td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{item.job}</td>
                    <td className="py-3 px-4 text-right font-semibold">₹{item.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Book Service Modal */}
      {showBookService && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-md p-6 text-slate-800 dark:text-white space-y-4">
            <h3 className="text-lg font-bold">Book Service Appointment</h3>
            <form onSubmit={subBook(handleBookService)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    {...regBook('customerName')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    {...regBook('customerPhone')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Scooter Chassis Number</label>
                <input
                  type="text"
                  required
                  {...regBook('chassisNumber')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Booking Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  {...regBook('scheduledDate')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Issue Details / Notes</label>
                <textarea
                  {...regBook('details')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none h-16"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookService(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
                >
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Job Card Modal */}
      {showCreateJobCard && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-md p-6 text-slate-800 dark:text-white space-y-4">
            <h3 className="text-lg font-bold">Raise Job Card / Service Record</h3>
            <form onSubmit={subJob(handleCreateJobCard)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Chassis Number</label>
                  <input
                    type="text"
                    required
                    {...regJob('chassisNumber')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Customer Phone</label>
                  <input
                    type="text"
                    required
                    {...regJob('customerPhone')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Job Card details (Inspection/Fixes)</label>
                <textarea
                  required
                  {...regJob('jobCardDetails')}
                  placeholder="e.g. Brake pad worn out, general periodic service."
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none h-16"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Assign Technician ID</label>
                  <input
                    type="text"
                    required
                    {...regJob('technicianUserId')}
                    placeholder="Enter User Object ID"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Labor Charges (₹)</label>
                  <input
                    type="number"
                    required
                    {...regJob('laborCharges')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4 py-1">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" {...regJob('amcAttached')} className="bg-slate-800" />
                  <span>AMC Covered</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" {...regJob('roadsideAssistance')} className="bg-slate-800" />
                  <span>Roadside Assistance</span>
                </label>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Material Request Sub-tab */}
      {subTab === 'requests' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4 shadow-sm text-slate-800 dark:text-slate-100">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase font-bold">Spare Parts Material Requests</h3>
            <button
              onClick={() => setShowRequestPart(true)}
              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Request Spare Part</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-150 dark:border-slate-800 rounded">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase">
                  <th className="py-2.5 px-4">Request ID</th>
                  <th className="py-2.5 px-4">Part Details</th>
                  <th className="py-2.5 px-4">Quantity</th>
                  <th className="py-2.5 px-4">Chassis Number</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {requests?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">No requests raised yet.</td>
                  </tr>
                ) : (
                  requests?.map((req: any) => (
                    <tr key={req._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                      <td className="py-2.5 px-4 font-mono font-bold">{req.requestId}</td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold">{req.partName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {req.partSku}</div>
                      </td>
                      <td className="py-2.5 px-4">{req.quantity}</td>
                      <td className="py-2.5 px-4 font-mono">{req.chassisNumber}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'Received' || req.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          req.status.includes('Pending') ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-105 text-blue-800'
                        }`}>
                          {req.status}
                        </span>
                        {req.status === 'Incoming Material Notification' && (
                          <button
                            onClick={() => {
                              api.put(`/service/materials/${req._id}/approve`, { action: 'receive' })
                                .then(() => queryClient.invalidateQueries({ queryKey: ['materialRequests'] }));
                            }}
                            className="ml-2 px-1.5 py-0.5 bg-green-600 text-white rounded text-[9px] font-bold"
                          >
                            Mark Received
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Live Tracking Sub-tab */}
      {subTab === 'tracking' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-800 dark:text-slate-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-400 uppercase font-bold">Track Service Status</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Vehicle Chassis Number</label>
                <input
                  type="text"
                  value={chassisNumber}
                  onChange={(e) => setChassisNumber(e.target.value)}
                  placeholder="e.g. CS12345"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-350 dark:border-slate-700 rounded focus:outline-none font-mono text-sm uppercase"
                />
              </div>
              <button
                onClick={handleTrack}
                className="w-full py-2 bg-blue-500 text-white rounded font-bold hover:bg-blue-600 flex items-center justify-center space-x-1.5"
              >
                <Play className="h-4 w-4" />
                <span>Start Live Feed</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 lg:col-span-2 space-y-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-400 uppercase font-bold">WebSocket Interactive Timeline</h3>
            <div className="relative pl-6 space-y-6 border-l border-slate-200 dark:border-slate-800">
              {stagesList.map((stage, stageIdx) => {
                const currentIdx = stagesList.indexOf(currentStage);
                const isDone = stageIdx <= currentIdx;
                const isCurrent = stage === currentStage;

                return (
                  <div key={stage} className="relative">
                    <span className={`absolute -left-[31px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border text-[10px] ${
                      isCurrent ? 'bg-blue-500 border-blue-500 text-white' :
                      isDone ? 'bg-green-500 border-green-500 text-white' :
                      'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}>
                      {isDone ? '✓' : stageIdx + 1}
                    </span>
                    <div className="pl-3">
                      <h4 className={`font-bold text-sm ${isCurrent ? 'text-blue-500' : isDone ? 'text-slate-900 dark:text-white' : 'text-slate-450'}`}>
                        {stage}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {isCurrent ? 'Worker busy completing task...' : isDone ? 'Completed' : 'Awaiting start...'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Live Web Socket Stream Log</h4>
              <div className="bg-slate-950 p-3 rounded font-mono text-[10px] text-green-400 space-y-1 h-32 overflow-y-auto">
                {timeline.map((item, i) => (
                  <p key={i}>[{item.time}] WebSocket event: Service stage updated to "{item.stage}"</p>
                ))}
                {timeline.length === 0 && <p className="text-slate-500">Listening to events...</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Request Spare Part */}
      {showRequestPart && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 rounded shadow-xl max-w-sm w-full p-6 space-y-4 text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-[#1F3B73] text-sm uppercase">Request Workshop Spare Part</h3>
              <button onClick={() => setShowRequestPart(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            </div>
            <form onSubmit={subReq(handleRequestPart)} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Target Chassis Number</label>
                <input
                  type="text"
                  required
                  {...regReq('chassisNumber')}
                  placeholder="CS12345"
                  className="w-full px-3 py-1.5 border border-slate-350 rounded font-mono text-sm uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Part SKU Code</label>
                <input
                  type="text"
                  required
                  {...regReq('partSku')}
                  placeholder="SKU-SPA-BATTERY"
                  className="w-full px-3 py-1.5 border border-slate-350 rounded font-mono text-sm uppercase"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1">Part Name</label>
                  <input
                    type="text"
                    required
                    {...regReq('partName')}
                    placeholder="Lithium Battery Pack"
                    className="w-full px-3 py-1.5 border border-slate-350 rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    {...regReq('quantity')}
                    defaultValue={1}
                    className="w-full px-3 py-1.5 border border-slate-350 rounded"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRequestPart(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestPartMutation.isPending}
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                >
                  {requestPartMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
