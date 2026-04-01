import React from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Space, Typography, Divider, Layout } from 'antd';
import { useDashboardStore } from '../../store/dashboardStore';
import WorkspaceSelector from '../../components/WorkspaceSelector';
import InputArea from '../../components/InputArea';
import Dashboard from '../../components/Dashboard';

const { Title } = Typography;

const DataCenter: React.FC = () => {
  const { theme } = useDashboardStore();

  const handleAddChart = () => {
    const inputArea = document.querySelector('.input-area-container');
    inputArea?.scrollIntoView({ behavior: 'smooth' });
    const textarea = document.querySelector('.ai-input') as HTMLTextAreaElement;
    textarea?.focus();
  };

  return (
    <div
      style={{
        minHeight: '100%',
        background: theme === 'dark' ? '#141414' : '#f5f5f5',
      }}
    >
      {/* 页面级 Header */}
      <Layout.Header
        style={{
          background: theme === 'dark' ? '#1f1f1f' : '#fff',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
          position: 'sticky',
          top: 0,
          zIndex: 9,
        }}
      >
        {/* 左侧：标题 + 工作区选择器 */}
        <Space size="large" align="center">
          <Title 
            level={5} 
            style={{ 
              margin: 0,
              color: theme === 'dark' ? '#fff' : '#262626',
            }}
          >
            数据中心
          </Title>
          <Divider 
            type="vertical" 
            style={{ 
              height: 24,
              borderColor: theme === 'dark' ? '#434343' : '#e8e8e8',
            }} 
          />
          <WorkspaceSelector />
        </Space>

        {/* 右侧：新建图表按钮 */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddChart}
          size="middle"
        >
          新建图表
        </Button>
      </Layout.Header>

      {/* 页面内容 */}
      <div style={{ padding: '24px' }}>
        <InputArea />
        <Dashboard />
      </div>
    </div>
  );
};

export default DataCenter;
