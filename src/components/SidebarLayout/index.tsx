import React from 'react';
import { Layout } from 'antd';
import Sidebar from '../Sidebar';
import Header from '../Header';

const { Content } = Layout;

interface SidebarLayoutProps {
  children: React.ReactNode;
  onShare?: () => void;
  onLogout?: () => void;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ 
  children,
  onShare,
  onLogout 
}) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sidebar />

      {/* 主内容区 */}
      <Layout>
        {/* 系统级 Header */}
        <Header 
          onShare={onShare}
          onLogout={onLogout}
        />

        {/* 页面内容 */}
        <Content style={{ padding: 0, overflow: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default SidebarLayout;
