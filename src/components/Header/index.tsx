import React from 'react';
import { Link } from 'react-router-dom';
import {
  DashboardOutlined,
  ShareAltOutlined,
  MoonOutlined,
  SunOutlined,
  DeleteOutlined,
  LoginOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Tooltip, Space, Popconfirm, Avatar, Dropdown } from 'antd';
import { useDashboardStore } from '../../store/dashboardStore';
import { useAuthStore } from '../../store/authStore';

import { generateShareLink } from '../../services/aiService';

interface HeaderProps {
  onShare?: () => void;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onShare, 
  isAuthenticated = false, 
  onLogout 
}) => {
  const { theme, setTheme, charts, clearAll } = useDashboardStore();
  const { user } = useAuthStore();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      const link = generateShareLink(charts);
      navigator.clipboard.writeText(link);
      // 可以使用 message 组件显示提示
    }
  };

  return (
    <header
      className={`h-16 px-6 flex items-center justify-between border-b ${
        theme === 'dark'
          ? 'bg-[#2d2d2f] border-[#3d3d3f]'
          : 'bg-white border-border'
      }`}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <DashboardOutlined className="text-white text-lg" />
        </div>
        <h1
          className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-text-primary'
          }`}
        >
          AI Dashboard Builder
        </h1>
      </div>

      {/* Right: Actions */}
      <Space>
        {/* Clear All */}
        {charts.length > 0 && (
          <Popconfirm
            title="清空所有图表"
            description="确定要删除所有图表吗？此操作不可恢复。"
            onConfirm={clearAll}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="清空所有">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                className={theme === 'dark' ? 'text-[#a1a1a6]' : ''}
              />
            </Tooltip>
          </Popconfirm>
        )}

        {/* Share Button */}
        <Tooltip title="分享看板">
          <Button
            type="text"
            icon={<ShareAltOutlined />}
            onClick={handleShare}
            className={theme === 'dark' ? 'text-[#a1a1a6]' : ''}
          />
        </Tooltip>

        {/* Theme Toggle */}
        <Tooltip title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}>
          <Button
            type="text"
            icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
            onClick={toggleTheme}
            className={theme === 'dark' ? 'text-[#a1a1a6]' : ''}
          />
        </Tooltip>

        <div className="h-6 w-px bg-border" />

        {/* Auth Buttons */}
        {isAuthenticated ? (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'email',
                  label: user?.email,
                  disabled: true,
                },
                {
                  key: 'logout',
                  label: '退出登录',
                  icon: <LogoutOutlined />,
                  onClick: onLogout,
                },
              ],
            }}
            placement="bottomRight"
          >
            <Avatar
              icon={<UserOutlined />}
              className="cursor-pointer bg-primary"
            />
          </Dropdown>
        ) : (
          <Link to="/login">
            <Button
              type="text"
              icon={<LoginOutlined />}
              className={theme === 'dark' ? 'text-[#a1a1a6]' : ''}
            >
              登录
            </Button>
          </Link>
        )}
      </Space>
    </header>
  );
};

export default Header;
