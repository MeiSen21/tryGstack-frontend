import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme, Modal, message } from 'antd';
import { useDashboardStore } from './store/dashboardStore';
import { useAuthStore } from './store/authStore';
import { parseShareLink } from './services/aiService';
import { setupNetworkListener } from './utils/syncQueue';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DataCenter from './pages/DataCenter';
import SidebarLayout from './components/SidebarLayout';
import AuthGuard from './components/Auth/AuthGuard';
import { generateShareLink } from './services/aiService';
import './index.css';

const { defaultAlgorithm, darkAlgorithm } = antdTheme;

// 主页面布局组件（需要认证）
function MainLayout() {
  const { theme, charts, addChart, clearAll } = useDashboardStore();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');

  // Check for shared link on mount
  useEffect(() => {
    const search = window.location.search;
    if (search) {
      const sharedCharts = parseShareLink(search);
      if (sharedCharts && sharedCharts.length > 0) {
        clearAll();
        sharedCharts.forEach((chart) => {
          addChart(chart);
        });
        message.success('已加载分享的看板');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const handleShare = () => {
    const link = generateShareLink(charts);
    setShareLink(link);
    setIsShareModalOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      message.success('链接已复制到剪贴板');
    } catch (err) {
      message.error('复制失败');
    }
  };

  const handleLogout = () => {
    useAuthStore.getState().clearAuth();
    message.success('已退出登录');
  };

  return (
    <SidebarLayout onShare={handleShare} onLogout={handleLogout}>
      <DataCenter />

      {/* Share Modal */}
      <Modal
        title="分享看板"
        open={isShareModalOpen}
        onCancel={() => setIsShareModalOpen(false)}
        footer={[
          <button
            key="copy"
            onClick={handleCopyLink}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            复制链接
          </button>,
        ]}
      >
        <div className="mt-4">
          <p className={`mb-2 ${theme === 'dark' ? 'text-[#a1a1a6]' : 'text-text-secondary'}`}>
            复制下方链接分享给他人：
          </p>
          <div
            className={`p-3 rounded-lg break-all text-sm ${
              theme === 'dark'
                ? 'bg-[#2d2d2f] text-[#a1a1a6]'
                : 'bg-neutral-100 text-text-secondary'
            }`}
          >
            {shareLink}
          </div>
        </div>
      </Modal>
    </SidebarLayout>
  );
}

function App() {
  const { theme, fetchWorkspaces, syncedUserId } = useDashboardStore();
  const { initAuth, isAuthenticated, user } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initAuth();
  }, []);

  // 监听用户登录事件（处理循环依赖）
  useEffect(() => {
    const handleLogin = () => {
      console.log('[App] 检测到用户登录，开始同步工作区');
      fetchWorkspaces();
    };

    window.addEventListener('user:login', handleLogin as EventListener);
    return () => {
      window.removeEventListener('user:login', handleLogin as EventListener);
    };
  }, [fetchWorkspaces]);

  // 已登录时检查是否需要同步（页面刷新时）
  useEffect(() => {
    if (isAuthenticated && user) {
      // 如果用户变了，或者没有同步过，触发同步
      if (!syncedUserId || syncedUserId !== user.id) {
        console.log('[App] 检测到需要同步工作区');
        fetchWorkspaces();
      }
    }
  }, [isAuthenticated, user, syncedUserId, fetchWorkspaces]);

  // 设置网络恢复监听
  useEffect(() => {
    setupNetworkListener((result) => {
      if (result.success) {
        message.success('离线变更已同步到云端');
      }
    });
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? darkAlgorithm : defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          colorBgContainer: theme === 'dark' ? '#2d2d2f' : '#ffffff',
          colorBgElevated: theme === 'dark' ? '#2d2d2f' : '#ffffff',
          colorText: theme === 'dark' ? '#ffffff' : '#1d1d1f',
          colorTextSecondary: theme === 'dark' ? '#a1a1a6' : '#86868b',
          colorBorder: theme === 'dark' ? '#3d3d3f' : '#e5e5e7',
        },
      }}
    >
      <Routes>
        {/* 公开路由 - 登录页 */}
        <Route
          path="/login"
          element={
            <AuthGuard requireAuth={false}>
              <LoginPage />
            </AuthGuard>
          }
        />
        
        {/* 公开路由 - 注册页 */}
        <Route
          path="/register"
          element={
            <AuthGuard requireAuth={false}>
              <RegisterPage />
            </AuthGuard>
          }
        />
        
        {/* 受保护路由 - 首页 */}
        <Route
          path="/"
          element={
            <AuthGuard requireAuth={true}>
              <MainLayout />
            </AuthGuard>
          }
        />
      </Routes>
    </ConfigProvider>
  );
}

export default App;
