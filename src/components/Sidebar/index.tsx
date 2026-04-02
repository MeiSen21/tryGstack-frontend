import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { DatabaseOutlined, TeamOutlined } from '@ant-design/icons';
import { useDashboardStore } from '../../store/dashboardStore';
import { useAuthStore } from '../../store/authStore';
import { usePermission } from '../../hooks/usePermission';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const { theme } = useDashboardStore();
  const { isAdmin } = useAuthStore();
  const { hasMenuAccess } = usePermission();
  const location = useLocation();
  const navigate = useNavigate();

  // 根据权限动态生成菜单项
  const menuItems = [
    // 数据中心菜单 - 根据权限显示
    ...(hasMenuAccess('datacenter')
      ? [
          {
            key: '/',
            icon: <DatabaseOutlined />,
            label: '数据中心',
          },
        ]
      : []),
    // 用户管理菜单 - 根据权限显示（原管理员专属）
    ...(hasMenuAccess('userManagement') || isAdmin()
      ? [
          {
            key: '/admin/users',
            icon: <TeamOutlined />,
            label: '用户管理',
          },
        ]
      : []),
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Sider
      theme={theme === 'dark' ? 'dark' : 'light'}
      width={200}
      style={{
        boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
          background: theme === 'dark' ? '#001529' : '#fff',
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: theme === 'dark' ? '#fff' : '#1677ff',
          }}
        >
          AI Dashboard
        </span>
      </div>

      {/* Menu */}
      <Menu
        theme={theme === 'dark' ? 'dark' : 'light'}
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          borderRight: 0,
          marginTop: 8,
        }}
      />
    </Sider>
  );
};

export default Sidebar;
