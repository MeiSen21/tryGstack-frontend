import { useCallback } from 'react';
import usePermissionStore from '../store/permissionStore';

// 权限级别类型
type PermissionLevel = 'visible' | 'hidden' | 'disabled';

/**
 * 权限检查 Hook
 * 用于组件中检查用户对特定功能的权限
 */
export function usePermission() {
  const {
    permissions,
    setPermissions,
    resetPermissions,
    checkMenu,
    checkFeature,
    isVisible: storeIsVisible,
    isDisabled: storeIsDisabled,
    isHidden: storeIsHidden,
  } = usePermissionStore();

  /**
   * 检查菜单权限
   */
  const hasMenuAccess = useCallback((menuKey: string): boolean => {
    return checkMenu(menuKey);
  }, [checkMenu]);

  /**
   * 检查功能权限级别
   */
  const getFeatureLevel = useCallback((component: string, action: string): PermissionLevel => {
    return checkFeature(component, action);
  }, [checkFeature]);

  /**
   * 检查功能是否可见
   */
  const canView = useCallback((component: string, action: string): boolean => {
    return storeIsVisible(component, action);
  }, [storeIsVisible]);

  /**
   * 检查功能是否可操作（非禁用且非隐藏）
   */
  const canOperate = useCallback((component: string, action: string): boolean => {
    const level = checkFeature(component, action);
    return level === 'visible';
  }, [checkFeature]);

  /**
   * 检查功能是否被禁用
   */
  const isDisabled = useCallback((component: string, action: string): boolean => {
    return storeIsDisabled(component, action);
  }, [storeIsDisabled]);

  /**
   * 检查功能是否被隐藏
   */
  const isHidden = useCallback((component: string, action: string): boolean => {
    return storeIsHidden(component, action);
  }, [storeIsHidden]);

  /**
   * 批量检查多个功能是否都可见
   */
  const canViewAny = useCallback((checks: Array<{ component: string; action: string }>): boolean => {
    return checks.some(({ component, action }) => storeIsVisible(component, action));
  }, [storeIsVisible]);

  /**
   * 批量检查多个功能是否都可操作
   */
  const canOperateAll = useCallback((checks: Array<{ component: string; action: string }>): boolean => {
    return checks.every(({ component, action }) => {
      const level = checkFeature(component, action);
      return level === 'visible';
    });
  }, [checkFeature]);

  return {
    permissions,
    setPermissions,
    resetPermissions,
    hasMenuAccess,
    getFeatureLevel,
    canView,
    canOperate,
    isDisabled,
    isHidden,
    canViewAny,
    canOperateAll,
  };
}

export default usePermission;
