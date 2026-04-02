import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearCache } from '../utils/cacheManager';
import { clearQueue } from '../utils/syncQueue';

export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'disabled';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (token: string, user: User) => Promise<void>;
  clearAuth: () => void;
  initAuth: () => void;
  
  // Getters
  isAdmin: () => boolean;
  hasRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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

      // 是否是管理员
      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },

      // 检查是否具有指定角色
      hasRole: (role: UserRole) => {
        const { user } = get();
        return user?.role === role;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
