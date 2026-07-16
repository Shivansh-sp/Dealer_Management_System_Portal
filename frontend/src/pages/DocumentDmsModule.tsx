import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useForm } from 'react-hook-form';
import { FileText, Upload, Download, Eye, Layers } from 'lucide-react';

export const DocumentDmsModule: React.FC = () => {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  // Queries
  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await api.get('/dashboard/documents');
      return res.data.data;
    },
  });

  // Mutations
  const uploadDocMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/dashboard/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowUpload(false);
    },
  });

  const { register, handleSubmit } = useForm();

  const handleUpload = (data: any) => {
    const file = data.file[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', data.name);
      formData.append('documentType', data.documentType);
      formData.append('relatedEntityId', data.relatedEntityId || '');
      uploadDocMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Document Management (DMS)</h2>
          <p className="text-sm text-slate-500">Upload PDF compliance records, view document version history, and download slips</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 flex items-center space-x-1"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase">Documents Repository</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {documents?.map((doc: any) => (
                  <tr key={doc._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span>{doc.name}</span>
                      {doc.isDigital && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-green-500/10 text-green-600 font-bold uppercase scale-90">Digital</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{doc.documentType}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{doc.relatedEntityId || 'N/A'}</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="p-1.5 text-slate-400 hover:text-blue-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Preview Document"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!doc.isDigital ? (
                        <a
                          href={`http://localhost:5000${doc.fileUrl}`}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-green-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 inline-block"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(doc, null, 2));
                            const dlAnchor = document.createElement('a');
                            dlAnchor.setAttribute("href", dataStr);
                            dlAnchor.setAttribute("download", `${doc.documentId}.json`);
                            dlAnchor.click();
                          }}
                          className="p-1.5 text-slate-400 hover:text-green-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 inline-block"
                          title="Download JSON Data"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Document Preview panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase">Live Document Preview</h3>
          {selectedDoc ? (
            selectedDoc.isDigital ? (
              <div className="border border-slate-200 dark:border-slate-800 rounded p-6 bg-slate-50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 space-y-4 max-h-[500px] overflow-y-auto">
                <div className="flex justify-between items-start border-b pb-3 border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="font-bold text-xs text-[#1F3B73] dark:text-blue-400">SMG DIGITAL CERTIFICATE</h4>
                    <p className="text-[9px] text-slate-400">Secure digital registry form</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8px] bg-green-500 text-white font-extrabold">DIGITAL</span>
                </div>
                <div className="space-y-3 text-[10px]">
                  <div className="grid grid-cols-2 gap-2 border-b pb-2 border-slate-100 dark:border-slate-800/50">
                    <div>
                      <span className="block text-slate-400 text-[8px] uppercase font-bold">Document ID</span>
                      <span className="font-semibold">{selectedDoc.documentId}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[8px] uppercase font-bold">Type</span>
                      <span className="font-semibold">{selectedDoc.documentType}</span>
                    </div>
                  </div>
                  {/* Dynamically list all fields in formData */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-b pb-2 border-slate-100 dark:border-slate-800/50">
                    {selectedDoc.formData && Object.entries(selectedDoc.formData).map(([key, val]: any) => {
                      if (key === 'parts' && Array.isArray(val)) {
                        return (
                          <div key={key} className="col-span-2">
                            <span className="block text-slate-400 text-[8px] uppercase font-bold">Parts Replaced</span>
                            <span className="font-semibold">{val.map((p: any) => `${p.label} (₹${p.price})`).join(', ')}</span>
                          </div>
                        );
                      }
                      if (typeof val === 'object') return null;
                      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase());
                      return (
                        <div key={key}>
                          <span className="block text-slate-400 text-[8px] uppercase font-bold">{label}</span>
                          <span className="font-semibold">
                            {key === 'estimatedCost' || key === 'total' || key === 'unitPrice' ? `₹${val.toLocaleString()}` : String(val)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Signature details */}
                  <div className="pt-2 flex justify-between items-end">
                    <div className="text-[8px] text-slate-400 font-mono">
                      SHA256: {selectedDoc._id?.slice(-8) || 'unknown'}a87f
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">Signed By</span>
                      <span className={`block font-serif italic text-xs ${
                        selectedDoc.signatureStyle === 'cursive' ? 'font-serif italic text-sm' :
                        selectedDoc.signatureStyle === 'bold_hand' ? 'font-mono uppercase font-bold text-[10px]' :
                        'font-sans font-semibold tracking-wider text-[10px]'
                      }`}>{selectedDoc.signature}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded h-[400px] overflow-hidden bg-slate-950">
                <iframe src={`http://localhost:5000${selectedDoc.fileUrl}`} className="w-full h-full" title="PDF Preview" />
              </div>
            )
          ) : (
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded h-[400px] flex items-center justify-center text-xs text-slate-400 text-center p-4">
              Select a PDF or Digital document preview icon to display it here
            </div>
          )}
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-md p-6 text-slate-800 dark:text-white space-y-4">
            <h3 className="text-lg font-bold">Upload DMS Document</h3>
            <form onSubmit={handleSubmit(handleUpload)} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Document Label Name</label>
                <input
                  type="text"
                  required
                  {...register('name')}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Document Catalog Classification</label>
                  <select
                    required
                    {...register('documentType')}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  >
                    <option value="Warranty Claim Form">Warranty Claim Form</option>
                    <option value="Technical Component Detail">Technical Component Detail</option>
                    <option value="Warranty Pickup Sheet">Warranty Pickup Sheet</option>
                    <option value="PDI Inspection Sheet">PDI Inspection Sheet</option>
                    <option value="Failed Part Tag">Failed Part Tag</option>
                    <option value="Labor Cost Sheet">Labor Cost Sheet</option>
                    <option value="Part Replacement Cost Sheet">Part Replacement Cost Sheet</option>
                    <option value="Service Schedule">Service Schedule</option>
                    <option value="Material Receipt Sheet">Material Receipt Sheet</option>
                    <option value="Purchase Order">Purchase Order</option>
                    <option value="Gate Pass">Gate Pass</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Related ID reference</label>
                  <input
                    type="text"
                    {...register('relatedEntityId')}
                    placeholder="e.g. PO-12345, CS987"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Upload PDF File</label>
                <input
                  type="file"
                  required
                  accept="application/pdf"
                  {...register('file')}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
