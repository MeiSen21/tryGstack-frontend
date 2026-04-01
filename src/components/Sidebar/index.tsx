import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import { useDashboardStore } from '../../store/dashboardStore';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const { theme } = useDashboardStore();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      key: '/',
      icon: <DatabaseOutlined />,
      label: '数据中心',
    },
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
