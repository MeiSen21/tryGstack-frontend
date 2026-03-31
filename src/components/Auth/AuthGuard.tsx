import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * 路由守卫组件
 * @param requireAuth - true: 需要认证才能访问; false: 禁止已认证用户访问(如登录页)
 */
export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  // 需要认证但未登录，重定向到登录页
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 不需要认证但已登录(如登录页)，重定向到首页
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 条件满足，渲染子组件
  return <>{children}</>;
}

export default AuthGuard;
