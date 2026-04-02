import React from 'react';
import { usePermission } from '../../hooks/usePermission';

interface PermissionGuardProps {
  /**
   * 组件标识
   */
  component: string;
  /**
   * 操作标识
   */
  action: string;
  /**
   * 子元素
   */
  children: React.ReactNode;
  /**
   * 无权限时的替代显示内容
   */
  fallback?: React.ReactNode;
  /**
   * 是否只在隐藏时渲染 fallback，禁用时仍渲染子元素（但禁用状态）
   * 默认为 false，即 hidden 和 disabled 都使用 fallback
   */
  showOnDisabled?: boolean;
}

/**
 * 权限守卫组件
 * 根据用户权限控制子元素的显示/隐藏/禁用状态
 * 
 * 使用示例：
 * ```tsx
 * // 基础用法：无权限时隐藏
 * <PermissionGuard component="workspace" action="create">
 *   <Button>新建工作区</Button>
 * </PermissionGuard>
 * 
 * // 自定义 fallback
 * <PermissionGuard 
 *   component="workspace" 
 *   action="delete"
 *   fallback={<span>无删除权限</span>}
 * >
 *   <Button>删除</Button>
 * </PermissionGuard>
 * 
 * // 禁用时仍显示（只处理隐藏）
 * <PermissionGuard component="chart" action="editTitle" showOnDisabled>
 *   <Button disabled={isDisabled('chart', 'editTitle')}>编辑</Button>
 * </PermissionGuard>
 * ```
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  component,
  action,
  children,
  fallback = null,
  showOnDisabled = false,
}) => {
  const { canView, isDisabled, getFeatureLevel } = usePermission();

  const level = getFeatureLevel(component, action);

  // 如果隐藏，显示 fallback
  if (level === 'hidden') {
    return <>{fallback}</>;
  }

  // 如果禁用
  if (level === 'disabled') {
    // 如果 showOnDisabled 为 true，渲染子元素（父组件需要处理禁用状态）
    if (showOnDisabled) {
      return <>{children}</>;
    }
    // 否则显示 fallback
    return <>{fallback}</>;
  }

  // 可见且可操作
  return <>{children}</>;
};

export default PermissionGuard;
