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
  permissions?: any; // 用户细粒度权限配置
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  currentWorkspaceId?: string | null;
  
  // Actions
  setAuth: (token: string, user: User) => Promise<void>;
  clearAuth: () => void;
  initAuth: () => void;
  
  // Getters
  isAdmin: () => boolean;
  hasRole: (role: UserRole) => boolean;
}

// 导入 permissionStore（避免循环依赖，使用动态导入）
const loadPermissions = async (permissions: any) => {
  if (permissions) {
    const { usePermissionStore } = await import('./permissionStore');
    usePermissionStore.getState().setPermissions(permissions);
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: async (token: string, user: User) => {
        set({ token, user, isAuthenticated: true });
        
        // 加载用户权限到 permissionStore
        if (user.permissions) {
          await loadPermissions(user.permissions);
        }
        
        // 登录成功后，触发工作区同步
        // 通过事件触发，避免循环依赖
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('user:login', { detail: user }));
        }, 0);
      },

      clearAuth: () => {
        const { user } = get();
        const userId = user?.id;
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 清除缓存和同步队列
        clearCache();
        clearQueue();
        
        // 清除用户专属的工作区数据
        if (userId) {
          localStorage.removeItem(`ai-dashboard-storage-${userId}`);
        }
        localStorage.removeItem('ai-dashboard-storage-guest');
        
        // 重置权限
        import('./permissionStore').then(({ usePermissionStore }) => {
          usePermissionStore.getState().resetPermissions();
        });
        
        set({ token: null, user: null, isAuthenticated: false });
      },

      initAuth: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ token, user, isAuthenticated: true });
            
            // 加载用户权限到 permissionStore
            if (user.permissions) {
              loadPermissions(user.permissions);
            }
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

export default useAuthStore;
