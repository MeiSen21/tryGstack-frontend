import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 权限级别
export type PermissionLevel = 'visible' | 'hidden' | 'disabled';

// 权限配置类型
export interface UserPermissions {
  menus: {
    datacenter: boolean;
    userManagement: boolean;
  };
  features: {
    workspace: {
      create: PermissionLevel;
      edit: PermissionLevel;
      delete: PermissionLevel;
    };
    chartCreate: {
      getRecommendation: PermissionLevel;
    };
    chart: {
      editTitle: PermissionLevel;
      delete: PermissionLevel;
      refresh: PermissionLevel;
    };
  };
}

// 默认权限配置（普通用户）
export const defaultPermissions: UserPermissions = {
  menus: {
    datacenter: true,
    userManagement: false,
  },
  features: {
    workspace: { create: 'visible', edit: 'visible', delete: 'visible' },
    chartCreate: { getRecommendation: 'visible' },
    chart: { editTitle: 'visible', delete: 'visible', refresh: 'visible' },
  },
};

// 管理员默认权限
export const adminPermissions: UserPermissions = {
  menus: {
    datacenter: true,
    userManagement: true,
  },
  features: {
    workspace: { create: 'visible', edit: 'visible', delete: 'visible' },
    chartCreate: { getRecommendation: 'visible' },
    chart: { editTitle: 'visible', delete: 'visible', refresh: 'visible' },
  },
};

// Permission State
interface PermissionState {
  permissions: UserPermissions;
  isLoading: boolean;
  error: string | null;

  // Actions
  setPermissions: (permissions: UserPermissions) => void;
  resetPermissions: () => void;
  
  // 权限检查方法
  checkMenu: (menuKey: string) => boolean;
  checkFeature: (component: string, action: string) => PermissionLevel;
  isVisible: (component: string, action: string) => boolean;
  isDisabled: (component: string, action: string) => boolean;
  isHidden: (component: string, action: string) => boolean;
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      permissions: defaultPermissions,
      isLoading: false,
      error: null,

      setPermissions: (permissions: UserPermissions) => {
        set({ permissions });
      },

      resetPermissions: () => {
        set({ permissions: defaultPermissions });
      },

      // 检查菜单权限
      checkMenu: (menuKey: string): boolean => {
        const { permissions } = get();
        return permissions.menus[menuKey as keyof typeof permissions.menus] ?? false;
      },

      // 检查功能权限，返回 'visible' | 'hidden' | 'disabled'
      checkFeature: (component: string, action: string): PermissionLevel => {
        const { permissions } = get();
        const componentFeatures = permissions.features[component as keyof typeof permissions.features];
        if (!componentFeatures) return 'visible';
        return (componentFeatures as any)[action] ?? 'visible';
      },

      // 判断是否可见（非 hidden）
      isVisible: (component: string, action: string): boolean => {
        return get().checkFeature(component, action) !== 'hidden';
      },

      // 判断是否禁用
      isDisabled: (component: string, action: string): boolean => {
        return get().checkFeature(component, action) === 'disabled';
      },

      // 判断是否隐藏
      isHidden: (component: string, action: string): boolean => {
        return get().checkFeature(component, action) === 'hidden';
      },
    }),
    {
      name: 'permission-storage',
    }
  )
);

export default usePermissionStore;
