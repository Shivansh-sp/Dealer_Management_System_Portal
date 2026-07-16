import { create } from 'zustand';
import { api } from '../services/api';

export interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  lastLogin?: string;
  phoneNumber?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userId: string, password: string) => Promise<{ requireOtp: boolean; tempToken?: string; otp?: string }>;
  verifyOtp: (tempToken: string, otp: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: sessionStorage.getItem('accessToken'),
  isAuthenticated: !!sessionStorage.getItem('accessToken'),
  isLoading: false,

  login: async (userId, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { userId, password });
      set({ isLoading: false });
      return res.data.data; // returns { tempToken, userId, otp } (otp in dev mode)
    } catch (err: any) {
      set({ isLoading: false });
      throw err.response?.data || new Error('Login failed');
    }
  },

  verifyOtp: async (tempToken, otp) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/verify-otp', { tempToken, otp });
      const { accessToken, refreshToken, user } = res.data.data;

      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('refreshToken', refreshToken);

      set({
        accessToken,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false });
      throw err.response?.data || new Error('Verification failed');
    }
  },

  logout: () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },

  fetchProfile: async () => {
    try {
      const res = await api.get('/auth/profile');
      set({ user: res.data.data });
    } catch (err) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });
    }
  },
}));
