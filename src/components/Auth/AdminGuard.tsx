import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { message } from 'antd';

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * 管理员权限守卫组件
 * 需要管理员权限才能访问
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, isAdmin } = useAuthStore();

  // 未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 不是管理员，无权限访问
  if (!isAdmin()) {
    message.error('需要管理员权限');
    return <Navigate to="/" replace />;
  }

  // 条件满足，渲染子组件
  return <>{children}</>;
}

export default AdminGuard;
