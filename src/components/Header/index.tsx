import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ShareAltOutlined,
  MoonOutlined,
  SunOutlined,
  DeleteOutlined,
  LoginOutlined,
  LogoutOutlined,
  UserOutlined,
  HomeOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import {
  Button,
  Tooltip,
  Space,
  Popconfirm,
  Avatar,
  Dropdown,
  Flex,
  Typography,
  Divider,
  Badge,
  Breadcrumb,
} from 'antd';
import { useDashboardStore } from '../../store/dashboardStore';
import { useAuthStore } from '../../store/authStore';
import { generateShareLink } from '../../services/aiService';

const { Text } = Typography;

interface HeaderProps {
  onShare?: () => void;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onShare,
  onLogout,
}) => {
  const { theme, setTheme, charts, clearAll } = useDashboardStore();
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      const link = generateShareLink(charts);
      navigator.clipboard.writeText(link);
    }
  };

  // 根据路径生成面包屑
  const getBreadcrumbItems = () => {
    const items = [{ title: <Link to="/"><HomeOutlined /></Link> }];
    
    if (location.pathname === '/datacenter' || location.pathname === '/') {
      items.push({
        title: (
          <Flex align="center" gap={4}>
            <DatabaseOutlined />
            <span>数据中心</span>
          </Flex>
        ),
      });
    }
    
    return items;
  };

  // 用户下拉菜单项（已登录）
  const userMenuItems = [
    {
      key: 'user-info',
      label: (
        <Flex vertical align="center" style={{ padding: '8px 0' }}>
          <Avatar
            size={48}
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1677ff', marginBottom: 8 }}
          />
          <Text strong>{user?.email?.split('@')[0] || '用户'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {user?.email}
          </Text>
        </Flex>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: onLogout,
    },
  ];

  // 访客下拉菜单项（未登录）
  const guestMenuItems = [
    {
      key: 'guest-info',
      label: (
        <Flex vertical align="center" style={{ padding: '8px 0' }}>
          <Avatar
            size={48}
            icon={<UserOutlined />}
            style={{ backgroundColor: '#d9d9d9', marginBottom: 8 }}
          />
          <Text strong>访客</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            未登录状态
          </Text>
        </Flex>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'login',
      label: '登录账号',
      icon: <LoginOutlined />,
      onClick: () => {
        window.location.href = '/login';
      },
    },
  ];

  return (
    <Flex
      align="center"
      justify="space-between"
      style={{
        height: 64,
        padding: '0 24px',
        background: theme === 'dark' ? '#141414' : '#fff',
        borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
      }}
    >
      {/* 左侧：Logo + 面包屑 */}
      <Flex align="center" gap={16}>
        {/* Logo 区域 */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Flex align="center" gap={8}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DashboardOutlined style={{ color: '#fff', fontSize: 18 }} />
            </div>
            <Text
              strong
              style={{
                fontSize: 16,
                color: theme === 'dark' ? '#fff' : '#262626',
              }}
            >
              AI Dashboard
            </Text>
          </Flex>
        </Link>

        <Divider type="vertical" style={{ height: 24 }} />

        {/* 面包屑导航 */}
        <Breadcrumb
          items={getBreadcrumbItems()}
          style={{
            color: theme === 'dark' ? '#a6a6a6' : '#595959',
          }}
        />
      </Flex>

      {/* 右侧：操作按钮组 */}
      <Flex align="center" gap={4}>
        {/* 图表统计徽章 */}
        {charts.length > 0 && (
          <>
            <Badge
              count={charts.length}
              style={{ backgroundColor: '#1677ff' }}
            >
              <Tooltip title="已创建图表数">
                <Button
                  type="text"
                  icon={<DatabaseOutlined />}
                  style={{
                    color: theme === 'dark' ? '#a6a6a6' : '#595959',
                  }}
                />
              </Tooltip>
            </Badge>

            {/* 清空按钮 */}
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
                  style={{
                    color: theme === 'dark' ? '#a6a6a6' : '#595959',
                  }}
                />
              </Tooltip>
            </Popconfirm>
          </>
        )}

        {/* 分享按钮 */}
        <Tooltip title="分享看板">
          <Button
            type="text"
            icon={<ShareAltOutlined />}
            onClick={handleShare}
            style={{
              color: theme === 'dark' ? '#a6a6a6' : '#595959',
            }}
          />
        </Tooltip>

        {/* 主题切换 */}
        <Tooltip title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}>
          <Button
            type="text"
            icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
            onClick={toggleTheme}
            style={{
              color: theme === 'dark' ? '#a6a6a6' : '#595959',
            }}
          />
        </Tooltip>

        <Divider type="vertical" style={{ height: 24, margin: '0 8px' }} />

        {/* 用户区域 - 始终显示用户信息样式 */}
        <Dropdown
          menu={{ items: isAuthenticated ? userMenuItems : guestMenuItems }}
          placement="bottomRight"
          arrow
        >
          <Flex
            align="center"
            gap={8}
            style={{
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 6,
              transition: 'background 0.2s',
            }}
            className="user-dropdown-trigger"
          >
            <Avatar
              size="small"
              icon={<UserOutlined />}
              style={{
                backgroundColor: isAuthenticated ? '#1677ff' : theme === 'dark' ? '#434343' : '#d9d9d9',
              }}
            />
            <Text
              style={{
                color: theme === 'dark' ? '#a6a6a6' : '#595959',
                fontSize: 14,
              }}
            >
              {isAuthenticated ? user?.email?.split('@')[0] || '用户' : '访客'}
            </Text>
          </Flex>
        </Dropdown>
      </Flex>
    </Flex>
  );
};

export default Header;
