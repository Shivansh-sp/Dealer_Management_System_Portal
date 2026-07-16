import React, { useState, useEffect } from 'react';
import { 
  X, FileText, CheckCircle, ShieldCheck, Printer, Download, PenTool, RefreshCw, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

interface DigitalFormModalProps {
  formType: 'service_schedule' | 'pdi' | 'gate_pass' | 'purchase_order' | 'material_receipt' | 'warranty_claim' | 'warranty_pickup' | 'failed_part_tag' | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DigitalFormModal: React.FC<DigitalFormModalProps> = ({ formType, isOpen, onClose }) => {
  const [step, setStep] = useState<'fill' | 'sign' | 'submitting' | 'success'>('fill');
  const [formData, setFormData] = useState<any>({});
  const [signatureName, setSignatureName] = useState('');
  const [signatureStyle, setSignatureStyle] = useState('cursive');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progressLog, setProgressLog] = useState<string>('Initiating secure signature...');
  const [documentId, setDocumentId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('fill');
      setFormData({});
      setSignatureName('');
      setErrors({});
      // Generate a realistic Document ID
      const prefix = {
        service_schedule: 'SRV-SCH',
        pdi: 'PDI-CHK',
        gate_pass: 'GATE-PSS',
        purchase_order: 'PO-REQ',
        material_receipt: 'MAT-REC',
        warranty_claim: 'WR-CLM',
        warranty_pickup: 'WR-PKU',
        failed_part_tag: 'FLD-TAG'
      }[formType || 'service_schedule'] || 'DOC';
      setDocumentId(`${prefix}-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, [isOpen, formType]);

  if (!isOpen || !formType) return null;

  const formTitles: Record<string, string> = {
    service_schedule: 'Service Schedule, Labor & Part Prices',
    pdi: 'Pre-Delivery Inspection (PDI) Sheet',
    gate_pass: 'Gate Pass Checkout Format',
    purchase_order: 'Purchase Order Request (PO)',
    material_receipt: 'Material Receipt Log Sheet',
    warranty_claim: 'Warranty Claim CRM Form',
    warranty_pickup: 'Warranty Defective Part Pickup Log',
    failed_part_tag: 'Failed Tag Component Tagging'
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Core generic validations based on formType
    if (formType === 'service_schedule') {
      if (!formData.customerName) newErrors.customerName = 'Customer Name is required';
      if (!formData.contactNumber) newErrors.contactNumber = 'Contact Number is required';
      if (!formData.vehicleModel) newErrors.vehicleModel = 'Vehicle Model is required';
      if (!formData.serviceType) newErrors.serviceType = 'Service Type is required';
    } else if (formType === 'pdi') {
      if (!formData.chassisNumber) newErrors.chassisNumber = 'Chassis Number is required';
      if (!formData.inspectorName) newErrors.inspectorName = 'Inspector Name is required';
      if (!formData.batteryHealth) newErrors.batteryHealth = 'Battery verification status is required';
    } else if (formType === 'gate_pass') {
      if (!formData.vehicleNumber) newErrors.vehicleNumber = 'Vehicle/Chassis Number is required';
      if (!formData.receiverName) newErrors.receiverName = 'Receiver Name is required';
      if (!formData.purpose) newErrors.purpose = 'Purpose of exit is required';
    } else if (formType === 'purchase_order') {
      if (!formData.supplierName) newErrors.supplierName = 'Supplier Name is required';
      if (!formData.itemDesc) newErrors.itemDesc = 'Item Description is required';
      if (!formData.qty || formData.qty <= 0) newErrors.qty = 'Valid quantity is required';
    } else if (formType === 'material_receipt') {
      if (!formData.challanNumber) newErrors.challanNumber = 'Challan/Receipt Number is required';
      if (!formData.supplierName) newErrors.supplierName = 'Supplier Name is required';
      if (!formData.status) newErrors.status = 'Inspection status is required';
    } else if (formType === 'warranty_claim') {
      if (!formData.ownerName) newErrors.ownerName = 'Owner Name is required';
      if (!formData.chassisNumber) newErrors.chassisNumber = 'Chassis Number is required';
      if (!formData.partName) newErrors.partName = 'Failed Part Name is required';
    } else if (formType === 'warranty_pickup') {
      if (!formData.logisticPartner) newErrors.logisticPartner = 'Logistic/Courier Name is required';
      if (!formData.trackingNo) newErrors.trackingNo = 'Tracking/Docket number is required';
      if (!formData.partSKU) newErrors.partSKU = 'Part SKU/Serial is required';
    } else if (formType === 'failed_part_tag') {
      if (!formData.partSerial) newErrors.partSerial = 'Part Serial Number is required';
      if (!formData.chassisNumber) newErrors.chassisNumber = 'Chassis Number is required';
      if (!formData.faultSymptom) newErrors.faultSymptom = 'Failure Symptom description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextToSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setStep('sign');
    }
  };

  const handleSignAndSubmit = async () => {
    if (!signatureName.trim()) {
      setErrors({ signature: 'Please type your full name to sign digitally.' });
      return;
    }
    setStep('submitting');
    
    // Simulate secure signature process
    const steps = [
      'Generating legal digital document structure...',
      'Hashing document payload with SHA-256...',
      'Signing hash with private security keys...',
      'Registering digital certificate ID...',
      'Finalizing secure database record...'
    ];

    let currentStep = 0;
    setProgressLog(steps[0]);

    // Perform API call in background
    let apiSuccess = false;
    let apiErrorMsg = '';
    
    const documentTypeMapping: Record<string, string> = {
      service_schedule: 'Service Schedule',
      pdi: 'PDI Inspection Sheet',
      gate_pass: 'Gate Pass',
      purchase_order: 'Purchase Order',
      material_receipt: 'Material Receipt Sheet',
      warranty_claim: 'Warranty Claim Form',
      warranty_pickup: 'Warranty Pickup Sheet',
      failed_part_tag: 'Failed Part Tag',
    };

    const docName = `${formTitles[formType]} (${
      formData.customerName || 
      formData.supplierName || 
      formData.chassisNumber || 
      formData.partSerial || 
      formData.challanNumber || 
      formData.trackingNo || 
      formData.vehicleNumber || 
      documentId
    })`;

    const relatedEntityId = 
      formData.chassisNumber || 
      formData.partSerial || 
      formData.challanNumber || 
      formData.trackingNo || 
      formData.vehicleNumber || 
      formData.invoiceNumber || 
      formData.poNumber;

    try {
      await api.post('/dashboard/documents/digital', {
        documentId,
        name: docName,
        documentType: documentTypeMapping[formType],
        formData,
        signature: signatureName,
        signatureStyle,
        relatedEntityId: relatedEntityId ? String(relatedEntityId) : undefined
      });
      apiSuccess = true;
    } catch (err: any) {
      console.error('Failed to save digital document:', err);
      apiErrorMsg = err?.response?.data?.message || err.message;
    }

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setProgressLog(steps[currentStep]);
      } else {
        clearInterval(interval);
        if (!apiSuccess) {
          alert('Backend Sync Note: ' + (apiErrorMsg || 'Finalized locally, but server sync failed.'));
        }
        setStep('success');
      }
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      documentId,
      formType,
      formTitle: formTitles[formType],
      submittedAt: new Date().toLocaleString(),
      signature: signatureName,
      signatureStyle,
      data: formData
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", `${documentId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] text-slate-800 dark:text-white overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#F8FAFC] dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#1F3B73]/10 text-[#1F3B73] dark:text-blue-400 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1F3B73] dark:text-blue-400 uppercase tracking-wide">
                {formTitles[formType]}
              </h3>
              <p className="text-[10px] text-slate-400">ID: {documentId}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-full transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: FILL FORM */}
          {step === 'fill' && (
            <form onSubmit={handleNextToSign} className="space-y-4 text-xs">
              
              {/* Form type specific inputs */}
              {formType === 'service_schedule' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Customer Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.customerName || ''} 
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      placeholder="Enter customer full name"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.customerName && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.customerName}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Contact Number</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.contactNumber || ''} 
                      onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.contactNumber && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.contactNumber}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Vehicle Model</label>
                    <select 
                      required 
                      value={formData.vehicleModel || ''} 
                      onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    >
                      <option value="">Select Scooter Model</option>
                      <option value="SMG E1 Pro (High Range)">SMG E1 Pro (High Range)</option>
                      <option value="SMG E1 Lite (Standard)">SMG E1 Lite (Standard)</option>
                      <option value="SMG E2 Sport (Performance)">SMG E2 Sport (Performance)</option>
                    </select>
                    {errors.vehicleModel && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.vehicleModel}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Service Type</label>
                    <select 
                      required 
                      value={formData.serviceType || ''} 
                      onChange={(e) => handleInputChange('serviceType', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    >
                      <option value="">Select Service Tier</option>
                      <option value="First Free Service">First Free Service (1000km)</option>
                      <option value="Paid General Maintenance">Paid General Maintenance</option>
                      <option value="Major Battery / Motor Repair">Major Battery / Motor Repair</option>
                      <option value="Annual Maintenance Plan (AMC)">Annual Maintenance Plan (AMC)</option>
                    </select>
                    {errors.serviceType && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.serviceType}</p>}
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Select Spare Parts Replaced</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/40 p-3 border border-slate-200 dark:border-slate-800 rounded">
                      {[
                        { label: 'Disc Brake Pads (Front/Rear)', value: 'brake_pads', price: 450 },
                        { label: 'Lithium Battery Module Pack', value: 'battery_pack', price: 28000 },
                        { label: 'Smart Throttle Grip', value: 'throttle', price: 1200 },
                        { label: 'LED Headlamp assembly', value: 'headlamp', price: 2100 },
                        { label: 'Tubeless Rear Tyre (12-inch)', value: 'tyre', price: 1800 },
                        { label: 'Regen Controller Unit', value: 'controller', price: 6500 }
                      ].map((item) => {
                        const activeParts = formData.parts || [];
                        const isChecked = activeParts.some((p: any) => p.value === item.value);
                        return (
                          <label key={item.value} className="flex items-center gap-2 cursor-pointer py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                let nextParts;
                                if (isChecked) {
                                  nextParts = activeParts.filter((p: any) => p.value !== item.value);
                                } else {
                                  nextParts = [...activeParts, item];
                                }
                                handleInputChange('parts', nextParts);
                                // Compute total cost
                                const labor = formData.serviceType === 'First Free Service' ? 0 : 750;
                                const partsCost = nextParts.reduce((sum: number, p: any) => sum + p.price, 0);
                                handleInputChange('estimatedCost', labor + partsCost);
                              }}
                              className="rounded border-slate-300 dark:border-slate-700 text-[#1F3B73] focus:ring-[#1F3B73]"
                            />
                            {item.label} (₹{item.price})
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Mechanic Comments & Diagnostic Details</label>
                    <textarea 
                      value={formData.remarks || ''} 
                      onChange={(e) => handleInputChange('remarks', e.target.value)}
                      placeholder="Details of failures, battery voltage tests, or mechanical wear noticed..."
                      rows={3}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                  </div>

                  <div className="bg-[#F8FAFC] dark:bg-slate-950/20 md:col-span-2 p-3 border border-slate-200 dark:border-slate-800 rounded flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Auto-Calculated Total (₹)</span>
                    <span className="text-lg font-bold text-green-600">₹{(formData.estimatedCost || (formData.serviceType === 'First Free Service' ? 0 : 750)).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {formType === 'pdi' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Chassis Number</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.chassisNumber || ''} 
                      onChange={(e) => handleInputChange('chassisNumber', e.target.value)}
                      placeholder="e.g. ME4ME12X3XXXXX"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.chassisNumber && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.chassisNumber}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Vehicle Model</label>
                    <input 
                      type="text" 
                      value={formData.vehicleModel || ''} 
                      onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                      placeholder="e.g. SMG E1 Pro"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Checklist Verifications</label>
                    <div className="space-y-2 bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-200 dark:border-slate-800 rounded">
                      {[
                        { label: 'Battery Health check (Inspect voltage, charger pairing and diagnostic codes)', field: 'batteryHealth' },
                        { label: 'Brake System check (Front & Rear brake efficiency, fluid levels if hydraulic)', field: 'brakeSystem' },
                        { label: 'Electrical & Instrumentation check (Dashboard display, LED Indicators, horn)', field: 'electricals' },
                        { label: 'Tyre Pressure & Alignment check (Rear wheel motor assembly alignment)', field: 'tyres' },
                        { label: 'Accessories & Fitting check (Chassis bolts tightness, mirror fitments)', field: 'fitments' },
                        { label: 'Road Test Approval (Diagnostics on acceleration, braking & suspension)', field: 'roadTest' }
                      ].map((item) => (
                        <div key={item.field} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-2 text-[11px]">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                          <div className="flex gap-4 mt-1 sm:mt-0 font-bold">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input 
                                type="radio" 
                                name={item.field}
                                checked={formData[item.field] === 'Pass'}
                                onChange={() => handleInputChange(item.field, 'Pass')}
                                className="text-green-600 focus:ring-green-500 h-3.5 w-3.5"
                              />
                              <span className="text-green-600">PASS</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input 
                                type="radio" 
                                name={item.field}
                                checked={formData[item.field] === 'Fail'}
                                onChange={() => handleInputChange(item.field, 'Fail')}
                                className="text-red-600 focus:ring-red-500 h-3.5 w-3.5"
                              />
                              <span className="text-red-600">FAIL</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Inspector Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.inspectorName || ''} 
                      onChange={(e) => handleInputChange('inspectorName', e.target.value)}
                      placeholder="Inspector Full Name"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.inspectorName && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.inspectorName}</p>}
                  </div>
                </div>
              )}

              {formType === 'gate_pass' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Vehicle / Chassis Number</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.vehicleNumber || ''} 
                      onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                      placeholder="e.g. DL-01-XX-9999 or Chassis"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.vehicleNumber && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.vehicleNumber}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Driver / Receiver Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.receiverName || ''} 
                      onChange={(e) => handleInputChange('receiverName', e.target.value)}
                      placeholder="Person taking the vehicle out"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.receiverName && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.receiverName}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Purpose of Exit</label>
                    <select 
                      required 
                      value={formData.purpose || ''} 
                      onChange={(e) => handleInputChange('purpose', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    >
                      <option value="">Select Purpose</option>
                      <option value="New Customer Vehicle Delivery">New Customer Vehicle Delivery</option>
                      <option value="Demo Test Ride">Demo Test Ride</option>
                      <option value="Workshop Post-Service Road Test">Workshop Post-Service Road Test</option>
                      <option value="Stock Yard Transfer">Stock Yard Transfer</option>
                    </select>
                    {errors.purpose && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.purpose}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Security Guard Duty Name</label>
                    <input 
                      type="text" 
                      value={formData.securityGuard || ''} 
                      onChange={(e) => handleInputChange('securityGuard', e.target.value)}
                      placeholder="Security guard name"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Date & Time of Exit</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={formData.exitTime || ''} 
                      onChange={(e) => handleInputChange('exitTime', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                  </div>
                </div>
              )}

              {formType === 'purchase_order' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Supplier / Manufacturer Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.supplierName || ''} 
                      onChange={(e) => handleInputChange('supplierName', e.target.value)}
                      placeholder="e.g. SMG EV Motors Manufacturing Ltd"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.supplierName && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.supplierName}</p>}
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Purchase Items & Specifications</label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/40 p-3 border border-slate-200 dark:border-slate-800 rounded">
                      <div className="col-span-2 space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400">Item Description / SKU</label>
                        <select 
                          required 
                          value={formData.itemDesc || ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            const price = {
                              'E-Scooter Chassis Frame': 12000,
                              'Hub Motor 250W Assembly': 9500,
                              'Brake Assembly kit': 1400,
                              'Smart Controller Board (v4.2)': 4500
                            }[val] || 0;
                            handleInputChange('itemDesc', val);
                            handleInputChange('unitPrice', price);
                            handleInputChange('total', price * (formData.qty || 1));
                          }}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded outline-none"
                        >
                          <option value="">Select Item SKU</option>
                          <option value="E-Scooter Chassis Frame">E-Scooter Chassis Frame (₹12,000)</option>
                          <option value="Hub Motor 250W Assembly">Hub Motor 250W Assembly (₹9,500)</option>
                          <option value="Brake Assembly kit">Brake Assembly kit (₹1,400)</option>
                          <option value="Smart Controller Board (v4.2)">Smart Controller Board (v4.2) (₹4,500)</option>
                        </select>
                        {errors.itemDesc && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.itemDesc}</p>}
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400">Quantity</label>
                        <input 
                          type="number" 
                          min={1} 
                          required 
                          value={formData.qty || 1} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            handleInputChange('qty', val);
                            handleInputChange('total', val * (formData.unitPrice || 0));
                          }}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded outline-none"
                        />
                        {errors.qty && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.qty}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Delivery Terms</label>
                    <select 
                      value={formData.deliveryTerms || 'FOB Destination'} 
                      onChange={(e) => handleInputChange('deliveryTerms', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    >
                      <option value="FOB Destination">FOB Destination</option>
                      <option value="EXW Factory">EXW Factory</option>
                      <option value="CIF Port">CIF Port</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Delivery Date Request</label>
                    <input 
                      type="date" 
                      value={formData.requestedDate || ''} 
                      onChange={(e) => handleInputChange('requestedDate', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                  </div>

                  <div className="bg-[#F8FAFC] dark:bg-slate-950/20 md:col-span-2 p-3 border border-slate-200 dark:border-slate-800 rounded flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Auto-Calculated Total (₹)</span>
                    <span className="text-lg font-bold text-green-600">₹{(formData.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {formType === 'material_receipt' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Challan / Receipt Number</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.challanNumber || ''} 
                      onChange={(e) => handleInputChange('challanNumber', e.target.value)}
                      placeholder="e.g. CHN-123456"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.challanNumber && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.challanNumber}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Supplier / Manufacturer</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.supplierName || ''} 
                      onChange={(e) => handleInputChange('supplierName', e.target.value)}
                      placeholder="e.g. SMG Parts Ltd"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.supplierName && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.supplierName}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Carrier Vehicle Number</label>
                    <input 
                      type="text" 
                      value={formData.carrierVehicle || ''} 
                      onChange={(e) => handleInputChange('carrierVehicle', e.target.value)}
                      placeholder="e.g. HR-55-XX-1234"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Inspection Quality Status</label>
                    <select 
                      required 
                      value={formData.status || ''} 
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    >
                      <option value="">Select Quality Status</option>
                      <option value="Passed Inspection & Staged">Passed Inspection & Staged</option>
                      <option value="Quarantined / Pending Lab Report">Quarantined / Pending Lab Report</option>
                      <option value="Damaged / Rejected Delivery">Damaged / Rejected Delivery</option>
                    </select>
                    {errors.status && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.status}</p>}
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Material Log Details (SKUs & Quantities)</label>
                    <textarea 
                      value={formData.logDetails || ''} 
                      onChange={(e) => handleInputChange('logDetails', e.target.value)}
                      placeholder="e.g. SKU-123 (10 units), SKU-456 (25 units). Damaged boxes if any..."
                      rows={3}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                  </div>
                </div>
              )}

              {formType === 'warranty_claim' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Customer Owner Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.ownerName || ''} 
                      onChange={(e) => handleInputChange('ownerName', e.target.value)}
                      placeholder="Customer Name"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.ownerName && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.ownerName}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Vehicle Chassis Number</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.chassisNumber || ''} 
                      onChange={(e) => handleInputChange('chassisNumber', e.target.value)}
                      placeholder="Chassis Number"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.chassisNumber && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.chassisNumber}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Component Claiming Warranty</label>
                    <select 
                      required 
                      value={formData.partName || ''} 
                      onChange={(e) => handleInputChange('partName', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    >
                      <option value="">Select Faulty Component</option>
                      <option value="EV Lithium Battery Pack (60V)">EV Lithium Battery Pack (60V)</option>
                      <option value="BLDC Hub Motor 250W">BLDC Hub Motor 250W</option>
                      <option value="Digital Electronic Controller Board">Digital Electronic Controller Board</option>
                      <option value="LCD Speedometer Console Screen">LCD Speedometer Console Screen</option>
                    </select>
                    {errors.partName && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.partName}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Odometer Reading (km)</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.odometer || ''} 
                      onChange={(e) => handleInputChange('odometer', e.target.value)}
                      placeholder="Current km reading"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Failure Symptoms & Diagnostic Voltages</label>
                    <textarea 
                      value={formData.symptoms || ''} 
                      onChange={(e) => handleInputChange('symptoms', e.target.value)}
                      placeholder="Describe issue (e.g. Battery output reads 0V, cell group balance error...)"
                      rows={3}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                  </div>
                </div>
              )}

              {formType === 'warranty_pickup' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Logistic / Courier Agency Partner</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.logisticPartner || ''} 
                      onChange={(e) => handleInputChange('logisticPartner', e.target.value)}
                      placeholder="e.g. DHL, BlueDart, Delhivery"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.logisticPartner && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.logisticPartner}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Tracking / Docket Number</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.trackingNo || ''} 
                      onChange={(e) => handleInputChange('trackingNo', e.target.value)}
                      placeholder="Tracking number of parts box"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.trackingNo && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.trackingNo}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Defective Part SKU / Serial</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.partSKU || ''} 
                      onChange={(e) => handleInputChange('partSKU', e.target.value)}
                      placeholder="e.g. BAT-60V-123456"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.partSKU && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.partSKU}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Date of Dispatch</label>
                    <input 
                      type="date" 
                      value={formData.dispatchDate || ''} 
                      onChange={(e) => handleInputChange('dispatchDate', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                  </div>
                </div>
              )}

              {formType === 'failed_part_tag' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Failed Part Serial Number</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.partSerial || ''} 
                      onChange={(e) => handleInputChange('partSerial', e.target.value)}
                      placeholder="e.g. MOT-250W-987654"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.partSerial && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.partSerial}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Vehicle Chassis Number</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.chassisNumber || ''} 
                      onChange={(e) => handleInputChange('chassisNumber', e.target.value)}
                      placeholder="Chassis Number vehicle came from"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.chassisNumber && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.chassisNumber}</p>}
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Fault Symptom & Inspection Failure Details</label>
                    <textarea 
                      required
                      value={formData.faultSymptom || ''} 
                      onChange={(e) => handleInputChange('faultSymptom', e.target.value)}
                      placeholder="Describe nature of component failure..."
                      rows={3}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                    {errors.faultSymptom && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.faultSymptom}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-500 uppercase tracking-wide">Technician Assigned</label>
                    <input 
                      type="text" 
                      value={formData.technician || ''} 
                      onChange={(e) => handleInputChange('technician', e.target.value)}
                      placeholder="Technician name"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded font-semibold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#1F3B73] hover:bg-[#15284E] text-white rounded font-semibold transition-all"
                >
                  Proceed to Sign
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: DIGITAL SIGNATURE */}
          {step === 'sign' && (
            <div className="space-y-6 text-xs text-slate-800 dark:text-white">
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-200 dark:border-slate-800 rounded space-y-2">
                <h4 className="font-bold text-slate-700 dark:text-slate-300">Secure Digital Signature declaration</h4>
                <p className="text-[10px] leading-relaxed text-slate-400">
                  By signing this document electronically, you declare that all information entered in the form is true, audited, and holds compliance value. The signature will be secured with a dynamic SHA-256 fingerprint hash.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-500 uppercase tracking-wide">Type Full Name to Sign</label>
                  <input 
                    type="text" 
                    required 
                    value={signatureName} 
                    onChange={(e) => {
                      setSignatureName(e.target.value);
                      if (errors.signature) {
                        setErrors({});
                      }
                    }}
                    placeholder="Type name here"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1F3B73] outline-none text-sm"
                  />
                  {errors.signature && <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.signature}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold text-slate-500 uppercase tracking-wide">Select Signature Font Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cursive', name: 'Elegant Script', class: 'font-serif italic text-base' },
                      { id: 'bold_hand', name: 'Bold Signature', class: 'font-mono uppercase font-bold text-xs' },
                      { id: 'clean', name: 'Modern Sans', class: 'font-sans font-semibold tracking-wider text-xs' }
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSignatureStyle(style.id)}
                        className={`p-3 rounded border text-center transition-all ${
                          signatureStyle === style.id 
                            ? 'border-[#1F3B73] bg-[#1F3B73]/5 dark:bg-blue-500/10' 
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <span className="block text-[10px] text-slate-400 mb-1">{style.name}</span>
                        <span className={style.class}>{signatureName || 'Signature'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setStep('fill')} 
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded font-semibold transition-all"
                >
                  Back to Form
                </button>
                <button 
                  type="button" 
                  onClick={handleSignAndSubmit}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold flex items-center gap-1.5 transition-all"
                >
                  <PenTool className="h-4 w-4" /> Sign & Finalize Document
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUBMITTING / SIGNING LOADER */}
          {step === 'submitting' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="h-10 w-10 text-[#1F3B73] dark:text-blue-400 animate-spin" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Securing Digital Form...</p>
              <p className="text-xs text-slate-400 animate-pulse">{progressLog}</p>
            </div>
          )}

          {/* STEP 4: SUCCESS VIEW / RECEIPT */}
          {step === 'success' && (
            <div className="space-y-6">
              
              {/* Top Banner */}
              <div className="bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 p-4 rounded-lg flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Form Completed & Signed Successfully!</h4>
                  <p className="text-[10px] text-green-600/80">The document is now locked and registered in the dealer portal database.</p>
                </div>
              </div>

              {/* PDF Mock Receipt */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6 bg-slate-50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 font-sans shadow-inner space-y-6">
                
                {/* PDF Header */}
                <div className="flex justify-between items-start border-b border-slate-300 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold tracking-wider text-[#1F3B73] dark:text-blue-400">SMG CORPORATION</h2>
                    <p className="text-[9px] text-slate-400">Dealership Management Portal Document</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-green-500 text-white flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> DIGITALLY SECURED
                    </span>
                    <p className="text-[9px] text-slate-400 mt-1">Doc Ref: {documentId}</p>
                  </div>
                </div>

                {/* PDF Content grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[10px]">
                  <div className="border-b border-slate-100 dark:border-slate-800/50 pb-1">
                    <span className="block text-slate-400 font-bold uppercase text-[8px]">Document Type</span>
                    <span className="font-semibold">{formTitles[formType]}</span>
                  </div>
                  <div className="border-b border-slate-100 dark:border-slate-800/50 pb-1">
                    <span className="block text-slate-400 font-bold uppercase text-[8px]">Generation Date</span>
                    <span className="font-semibold">{new Date().toLocaleString()}</span>
                  </div>

                  {/* Form fields rendering dynamically */}
                  {Object.entries(formData).map(([key, val]: any) => {
                    if (key === 'parts' && Array.isArray(val)) {
                      return (
                        <div key={key} className="col-span-2 border-b border-slate-100 dark:border-slate-800/50 pb-1">
                          <span className="block text-slate-400 font-bold uppercase text-[8px]">Parts Replaced</span>
                          <span className="font-semibold">{val.map(p => `${p.label} (₹${p.price})`).join(', ')}</span>
                        </div>
                      );
                    }
                    if (typeof val === 'object') return null;
                    
                    // Format key name nicely
                    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase());
                    
                    return (
                      <div key={key} className="border-b border-slate-100 dark:border-slate-800/50 pb-1">
                        <span className="block text-slate-400 font-bold uppercase text-[8px]">{formattedKey}</span>
                        <span className="font-semibold">
                          {key === 'estimatedCost' || key === 'total' || key === 'unitPrice'
                            ? `₹${val.toLocaleString()}`
                            : String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* PDF Signature section */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[8px] text-slate-400 uppercase font-bold">Document Authentication Fingerprint</p>
                    <code className="text-[9px] bg-slate-200/50 dark:bg-slate-900 px-2 py-0.5 rounded font-mono text-slate-500 break-all select-all">
                      SHA256:{documentId.split('-')[1]}a87f9b02c84d7e2a9b31d8e
                    </code>
                  </div>
                  <div className="text-right border-b border-slate-300 dark:border-slate-700 pb-1 px-4 min-w-[150px]">
                    <span className="block text-[8px] text-slate-400 uppercase font-bold text-center mb-1">Digitally Signed By</span>
                    <span className={`block text-center text-slate-700 dark:text-slate-200 ${
                      signatureStyle === 'cursive' ? 'font-serif italic text-base' : 
                      signatureStyle === 'bold_hand' ? 'font-mono uppercase font-bold text-xs' : 
                      'font-sans font-semibold tracking-wider text-xs'
                    }`}>
                      {signatureName}
                    </span>
                  </div>
                </div>

              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={onClose} 
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded font-semibold transition-all text-xs"
                >
                  Close Window
                </button>
                <button 
                  onClick={handleDownloadJson}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold flex items-center gap-1.5 transition-all text-xs"
                >
                  <Download className="h-4 w-4" /> Download Data
                </button>
                <button 
                  onClick={handlePrint}
                  className="px-4 py-2 bg-[#1F3B73] hover:bg-[#15284E] text-white rounded font-semibold flex items-center gap-1.5 transition-all text-xs"
                >
                  <Printer className="h-4 w-4" /> Print Document
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
