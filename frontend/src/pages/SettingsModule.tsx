import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useForm } from 'react-hook-form';
import { Plus, Users, Settings, Lock, Eye, Check, AlertTriangle, UserMinus, ShieldAlert, Edit } from 'lucide-react';


export const SettingsModule: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'config'>('users');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Dealership parameters state (stored in local storage/mock state)
  const [dealerName, setDealerName] = useState('SMG Dealership Portal');
  const [supportMail, setSupportMail] = useState('support@smg.com');
  const [taxRate, setTaxRate] = useState(18);
  const [is2faEnabled, setIs2faEnabled] = useState(true);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Queries
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['usersList'],
    queryFn: async () => {
      const res = await api.get('/auth/users');
      return res.data.data;
    },
    enabled: activeSubTab === 'users',
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: any) => api.post('/auth/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      setShowAddUserModal(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create user');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/auth/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      setEditingUser(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update user');
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/auth/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to suspend user');
    },
  });

  // Forms
  const { register: regAdd, handleSubmit: subAdd, reset: resetAdd } = useForm();
  const { register: regEdit, handleSubmit: subEdit, reset: resetEdit } = useForm();

  const handleCreateUser = (data: any) => {
    createUserMutation.mutate(data);
    resetAdd();
  };

  const handleUpdateUser = (data: any) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser._id, data });
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSuccess(true);
    setTimeout(() => setConfigSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1F3B73]">System Control Center</h2>
          <p className="text-xs text-slate-500">Manage user authorization credentials, edit roles, and customize dealership rules</p>
        </div>
        <div className="flex space-x-1.5 bg-slate-250 p-0.5 rounded border border-slate-200">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'users' ? 'bg-[#1F3B73] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>User Management</span>
          </button>
          <button
            onClick={() => setActiveSubTab('config')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'config' ? 'bg-[#1F3B73] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Dealership Settings</span>
          </button>
        </div>
      </div>

      {/* User Management View */}
      {activeSubTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-500" /> Active Employee Users
            </h3>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 flex items-center space-x-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Create User Account</span>
            </button>
          </div>

          {usersLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading employee credentials...</div>
          ) : (
            <div className="overflow-x-auto border border-slate-150 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4">Employee Name</th>
                    <th className="py-2.5 px-4">Role Designation</th>
                    <th className="py-2.5 px-4">Username / ID</th>
                    <th className="py-2.5 px-4">Contact Detail</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users?.map((usr: any) => (
                    <tr key={usr._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-800">{usr.name}</td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-55 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-blue-150">
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{usr.userId}</td>
                      <td className="py-3 px-4">
                        <div>{usr.email}</div>
                        <div className="text-[10px] text-slate-400">{usr.phoneNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setEditingUser(usr);
                            resetEdit({
                              name: usr.name,
                              email: usr.email,
                              role: usr.role,
                              phoneNumber: usr.phoneNumber,
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded inline-block"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {usr.userId !== 'masteradmin' && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to suspend user "${usr.name}"?`)) {
                                suspendUserMutation.mutate(usr._id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-650 hover:bg-slate-100 rounded inline-block"
                            title="Suspend User"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Config Settings View */}
      {activeSubTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 lg:col-span-2 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Settings className="h-4 w-4" /> Dealership Policy Configuration
            </h3>

            {configSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded text-xs font-semibold flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>Dealership parameters updated successfully.</span>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Dealership Legal Name</label>
                  <input
                    type="text"
                    required
                    value={dealerName}
                    onChange={(e) => setDealerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3B73] bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Support Contact Email</label>
                  <input
                    type="email"
                    required
                    value={supportMail}
                    onChange={(e) => setSupportMail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3B73] bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Standard SGST/CGST Rate (%)</label>
                  <input
                    type="number"
                    required
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3B73] bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-2 font-semibold">2FA Security Simulation Mode</label>
                  <label className="flex items-center space-x-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={is2faEnabled}
                      onChange={(e) => setIs2faEnabled(e.target.checked)}
                      className="rounded border-slate-350 text-[#1F3B73] focus:ring-[#1F3B73] h-4.5 w-4.5"
                    />
                    <span className="text-slate-600">Require OTP code to complete logins</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                >
                  Save Configurations
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-white space-y-4 shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-4.5 w-4.5 text-amber-500" /> Security Access Rules
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                As Master Admin, you have system root access. Ensure credentials generated comply with secure password parameters:
              </p>
              <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-1.5 pl-1.5">
                <li>Min 8 characters in length.</li>
                <li>Include at least one uppercase letter.</li>
                <li>Restrict user sharing of system OTP keys.</li>
              </ul>
            </div>
            <div className="bg-slate-800 p-3.5 rounded border border-slate-700 flex items-start space-x-2 text-[10px] text-slate-400 mt-6 leading-relaxed">
              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
              <span>
                Changes made here alter global parameters for all portal sections including invoice billing algorithms.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md p-6 text-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-[#1F3B73] text-sm uppercase">Create Employee Portal Access</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            </div>
            <form onSubmit={subAdd(handleCreateUser)} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">User ID / Username</label>
                  <input
                    type="text"
                    required
                    {...regAdd('userId')}
                    placeholder="e.g. salesrep1"
                    className="w-full px-3 py-1.5 border border-slate-350 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Employee Name</label>
                  <input
                    type="text"
                    required
                    {...regAdd('name')}
                    placeholder="e.g. Raman Sharma"
                    className="w-full px-3 py-1.5 border border-slate-350 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    {...regAdd('email')}
                    placeholder="raman@smg.com"
                    className="w-full px-3 py-1.5 border border-slate-350 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    {...regAdd('phoneNumber')}
                    placeholder="9876543210"
                    className="w-full px-3 py-1.5 border border-slate-350 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Security Role</label>
                  <select
                    required
                    {...regAdd('role')}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none"
                  >
                    <option value="Pre Sales Manager">Pre Sales Manager</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="After Sales Manager">After Sales Manager</option>
                    <option value="Purchase Manager">Purchase Manager</option>
                    <option value="Finance Manager">Finance Manager</option>
                    <option value="Service Technician Officer">Service Technician Officer</option>
                    <option value="Spare House Officer">Spare House Officer</option>
                    <option value="Legal Manager">Legal Manager</option>
                    <option value="Master Admin">Master Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    {...regAdd('password')}
                    placeholder="password123"
                    className="w-full px-3 py-1.5 border border-slate-350 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                >
                  Log Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md p-6 text-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-[#1F3B73] text-sm uppercase">Modify Account Permissions</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            </div>
            <form onSubmit={subEdit(handleUpdateUser)} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Employee Name</label>
                <input
                  type="text"
                  required
                  {...regEdit('name')}
                  className="w-full px-3 py-1.5 border border-slate-350 rounded focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    {...regEdit('email')}
                    className="w-full px-3 py-1.5 border border-slate-350 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    {...regEdit('phoneNumber')}
                    className="w-full px-3 py-1.5 border border-slate-350 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Security Role</label>
                  <select
                    required
                    disabled={editingUser.userId === 'masteradmin'}
                    {...regEdit('role')}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none disabled:bg-slate-100"
                  >
                    <option value="Pre Sales Manager">Pre Sales Manager</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="After Sales Manager">After Sales Manager</option>
                    <option value="Purchase Manager">Purchase Manager</option>
                    <option value="Finance Manager">Finance Manager</option>
                    <option value="Service Technician Officer">Service Technician Officer</option>
                    <option value="Spare House Officer">Spare House Officer</option>
                    <option value="Legal Manager">Legal Manager</option>
                    <option value="Master Admin">Master Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Reset Password (Optional)</label>
                  <input
                    type="password"
                    {...regEdit('password')}
                    placeholder="Leave blank to keep same"
                    className="w-full px-3 py-1.5 border border-slate-350 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                >
                  Update Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
