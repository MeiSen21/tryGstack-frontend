import React from 'react';
import {
  DashboardOutlined,
  ShareAltOutlined,
  MoonOutlined,
  SunOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Button, Tooltip, Space, Popconfirm } from 'antd';
import { useDashboardStore } from '../../store/dashboardStore';
import WorkspaceSelector from '../WorkspaceSelector';
import { generateShareLink } from '../../services/aiService';

interface HeaderProps {
  onShare?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShare }) => {
  const { theme, setTheme, charts, clearAll } = useDashboardStore();

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
      {/* Left: Logo and Workspace Selector */}
      <div className="flex items-center gap-6">
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

        <div className="h-6 w-px bg-border" />

        <WorkspaceSelector />
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

        {/* Add Button */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            const inputArea = document.querySelector('.input-area-container');
            inputArea?.scrollIntoView({ behavior: 'smooth' });
            const textarea = document.querySelector('.ai-input') as HTMLTextAreaElement;
            textarea?.focus();
          }}
        >
          新建图表
        </Button>
      </Space>
    </header>
  );
};

export default Header;
