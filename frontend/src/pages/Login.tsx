import React, { useState } from 'react';
import logo from '../assets/logo.jpg';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const loginFn = useAuthStore((state) => state.login);
  const verifyOtpFn = useAuthStore((state) => state.verifyOtp);
  const initSocket = useNotificationStore((state) => state.initSocket);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginFn(userId, password);
      setTempToken(data.tempToken);
      if (data.otp) {
        setSimulatedOtp(data.otp);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tempToken) {
        await verifyOtpFn(tempToken, otp);
        const user = useAuthStore.getState().user;
        if (user) {
          initSocket(user.id);
        }
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F7FA]">
      {/* Left side: Login form (40% width) */}
      <div className="w-full lg:w-[40%] bg-white flex flex-col justify-between p-12 border-r border-slate-200">
        <div>
          {/* Logo */}
          <div className="flex items-center">
            <img src={logo} alt="SMG Logo" className="h-12 w-auto object-contain" />
          </div>
        </div>

        <div className="max-w-md mx-auto w-full space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-[#1F3B73] tracking-wide">
              Employee Portal
            </h2>
            <h3 className="text-xl font-semibold text-slate-800 mt-1">
              Welcome
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Login with username
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded text-xs">
              {error}
            </div>
          )}

          {!tempToken ? (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3B73] text-sm text-slate-800"
                    placeholder="username"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3B73] text-sm text-slate-800"
                    placeholder="password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <a href="#" className="text-xs text-slate-400 hover:underline">
                  Forgot you password ?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#1F3B73] hover:bg-[#1A3261] text-white text-sm font-semibold rounded uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'LOGIN'}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleVerifyOtp}>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Two-Factor Verification
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full text-center tracking-widest text-lg font-bold py-2 bg-white border border-slate-300 rounded focus:outline-none text-slate-800"
                  placeholder="000000"
                />
              </div>

              {simulatedOtp && (
                <div className="bg-blue-50 border border-blue-100 text-blue-800 px-3 py-2 rounded text-xs text-center font-semibold">
                  [Simulation Code]: <strong>{simulatedOtp}</strong>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={() => setTempToken(null)}
                className="w-full text-center text-xs text-slate-400 hover:underline"
              >
                Back to Login
              </button>
            </form>
          )}

          <div className="border-t border-slate-100 pt-4 space-y-1.5 text-[11px] text-slate-400">
            <p className="font-semibold text-slate-500">Seeded Credentials:</p>
            <p>• <strong>Master Admin</strong>: <code className="bg-slate-100 px-1 py-0.5 rounded text-[#1F3B73]">masteradmin</code> / <code className="bg-slate-100 px-1 py-0.5 rounded text-[#1F3B73]">password123</code></p>
            <p>• <strong>Pre-Sales</strong>: <code className="bg-slate-100 px-1 py-0.5 rounded text-[#1F3B73]">presalesmanager</code></p>
            <p>• <strong>Sales</strong>: <code className="bg-slate-100 px-1 py-0.5 rounded text-[#1F3B73]">salesmanager</code></p>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          © {new Date().getFullYear()} SMG Corporation. All rights reserved.
        </div>
      </div>

      {/* Right side: Office Background Image & Translucent panel (60% width) */}
      <div
        className="hidden lg:flex lg:w-[60%] bg-cover bg-center items-center justify-center relative"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80')`,
        }}
      >
        {/* Overlay to darken background */}
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" />

        {/* Floating Glass Panel */}
        <div className="relative bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-8 max-w-md w-full mx-6 text-white shadow-2xl space-y-4">
          <h4 className="text-lg font-bold tracking-wide">
            Enterprise Dealership Portal
          </h4>
          <p className="text-xs text-slate-200 leading-relaxed">
            Manage leads, process digital invoices, track service points, schedule test rides, audit spare parts, and verify warranties in a secure environment.
          </p>
          <div className="flex space-x-2 pt-2 text-[10px] text-slate-300 font-semibold">
            <span className="bg-white/10 px-2 py-1 rounded">RBAC Secure</span>
            <span className="bg-white/10 px-2 py-1 rounded">Real-Time Sync</span>
            <span className="bg-white/10 px-2 py-1 rounded">Audit Audited</span>
          </div>
        </div>
      </div>
    </div>
  );
};
