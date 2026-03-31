import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearCache } from '../utils/cacheManager';
import { clearQueue } from '../utils/syncQueue';

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (token: string, user: User) => Promise<void>;
  clearAuth: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: async (token: string, user: User) => {
        set({ token, user, isAuthenticated: true });
        
        // 登录成功后，触发工作区同步
        // 通过事件触发，避免循环依赖
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('user:login', { detail: user }));
        }, 0);
      },

      clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 清除缓存和同步队列
        clearCache();
        clearQueue();
        
        set({ token: null, user: null, isAuthenticated: false });
      },

      initAuth: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ token, user, isAuthenticated: true });
          } catch {
            set({ token: null, user: null, isAuthenticated: false });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
