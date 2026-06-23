import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, X, Loader } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/dashboard/search?query=${query}`);
        setResults(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center pt-24">
      <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center space-x-3 w-full">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by customer, lead, chassis, invoice, PO..."
              className="bg-transparent border-none text-white text-base focus:outline-none w-full placeholder-slate-500"
            />
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-sm text-slate-300">
          {loading && (
            <div className="flex justify-center items-center py-8">
              <Loader className="animate-spin text-blue-500 h-6 w-6" />
            </div>
          )}

          {!loading && !results && (
            <p className="text-center text-xs text-slate-500 py-4">Type a query to search the DMS database</p>
          )}

          {results && (
            <>
              {/* Customers */}
              {results.customers?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Customers</h4>
                  <div className="space-y-1.5">
                    {results.customers.map((c: any) => (
                      <div key={c._id} className="bg-slate-800/40 p-2 rounded hover:bg-slate-800 transition-colors">
                        <p className="font-semibold text-white">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.phoneNumber} | {c.customerId}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leads */}
              {results.leads?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Leads</h4>
                  <div className="space-y-1.5">
                    {results.leads.map((l: any) => (
                      <div key={l._id} className="bg-slate-800/40 p-2 rounded hover:bg-slate-800 transition-colors">
                        <p className="font-semibold text-white">{l.name} <span className="text-xs font-normal px-2 bg-blue-900/50 text-blue-400 rounded">{l.status}</span></p>
                        <p className="text-xs text-slate-400">{l.phoneNumber} | {l.leadId}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices/Sales */}
              {results.sales?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Invoices / Sales</h4>
                  <div className="space-y-1.5">
                    {results.sales.map((s: any) => (
                      <div key={s._id} className="bg-slate-800/40 p-2 rounded hover:bg-slate-800 transition-colors">
                        <p className="font-semibold text-white">{s.invoiceNumber}</p>
                        <p className="text-xs text-slate-400">Customer: {s.customerId?.name} | Total: ₹{s.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Claims */}
              {results.warrantyClaims?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Warranty Claims</h4>
                  <div className="space-y-1.5">
                    {results.warrantyClaims.map((wc: any) => (
                      <div key={wc._id} className="bg-slate-800/40 p-2 rounded hover:bg-slate-800 transition-colors">
                        <p className="font-semibold text-white">{wc.claimId} <span className="text-xs font-normal px-2 bg-yellow-900/50 text-yellow-400 rounded">{wc.status}</span></p>
                        <p className="text-xs text-slate-400">Chassis: {wc.chassisNumber} | Type: {wc.claimType}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checks */}
              {Object.values(results).every((arr: any) => arr?.length === 0) && (
                <p className="text-center text-xs text-slate-500 py-4">No records found matching "{query}"</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
