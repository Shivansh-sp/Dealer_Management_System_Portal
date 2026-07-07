import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useForm } from 'react-hook-form';
import { api } from '../services/api';
import { User, Mail, Phone, Lock, Save, ShieldAlert, KeyRound } from 'lucide-react';

export const ProfileModule: React.FC = () => {
  const { user, fetchProfile } = useAuthStore();
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const { register: regProfile, handleSubmit: subProfile } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
    },
  });

  const { register: regPwd, handleSubmit: subPwd, reset: resetPwd } = useForm();

  const handleUpdateProfile = async (data: any) => {
    setProfileLoading(true);
    setProfileSuccess(null);
    setProfileError(null);
    try {
      const res = await api.put('/auth/profile', data);
      setProfileSuccess(res.data.message || 'Profile updated successfully.');
      await fetchProfile(); // refresh authStore state
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (data: any) => {
    setPwdLoading(true);
    setPwdSuccess(null);
    setPwdError(null);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPwdSuccess(res.data.message || 'Password updated successfully.');
      resetPwd();
    } catch (err: any) {
      setPwdError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Module Title */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-[#1F3B73]">My Profile & Account Settings</h2>
        <p className="text-xs text-slate-500">Manage your credentials, update contact information, and review security access</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card Summary */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center space-y-2 py-4 border-b border-slate-100">
              <div className="h-16 w-16 rounded-full bg-blue-50 text-[#1F3B73] border border-blue-200 flex items-center justify-center font-bold text-2xl uppercase shadow-inner">
                {user?.name ? user.name.slice(0, 2) : 'EM'}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">{user?.name}</h3>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block uppercase">
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-400">Employee ID</span>
                <span className="font-mono text-slate-700 font-bold">{user?.userId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-400">Email Address</span>
                <span className="text-slate-700">{user?.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-400">Phone Number</span>
                <span className="text-slate-700">{user?.phoneNumber || 'N/A'}</span>
              </div>
              {user?.lastLogin && (
                <div className="flex justify-between pb-2">
                  <span className="text-slate-400">Last Login session</span>
                  <span className="text-slate-650 text-right">{new Date(user.lastLogin).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-[10px] text-slate-500 leading-normal flex items-start space-x-2">
            <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              If your security role permissions are incorrect, please raise an IT ticket or contact a system Master Admin immediately.
            </span>
          </div>
        </div>

        {/* Profile edit & Password change forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit details form */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <User className="h-4 w-4" /> Personal Information
            </h3>

            {profileSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded text-xs font-semibold">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs font-semibold">
                {profileError}
              </div>
            )}

            <form onSubmit={subProfile(handleUpdateProfile)} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    {...regProfile('name')}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3B73] bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    {...regProfile('email')}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3B73] bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  {...regProfile('phoneNumber')}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3B73] bg-slate-50"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 flex items-center space-x-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>{profileLoading ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change password form */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#1F3B73] uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <KeyRound className="h-4 w-4" /> Change Portal Password
            </h3>

            {pwdSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded text-xs font-semibold">
                {pwdSuccess}
              </div>
            )}
            {pwdError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs font-semibold">
                {pwdError}
              </div>
            )}

            <form onSubmit={subPwd(handleChangePassword)} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    {...regPwd('currentPassword')}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3B73] bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    {...regPwd('newPassword')}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3B73] bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 flex items-center space-x-1.5"
                >
                  <Lock className="h-4 w-4" />
                  <span>{pwdLoading ? 'Updating...' : 'Change Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
