import React from 'react';
import { PlusOutlined, DatabaseOutlined } from '@ant-design/icons';
import {
  Button,
  Space,
  Typography,
  Divider,
  Layout,
  Flex,
  Badge,
  Tooltip,
} from 'antd';
import { useDashboardStore } from '../../store/dashboardStore';
import WorkspaceSelector from '../../components/WorkspaceSelector';
import InputArea from '../../components/InputArea';
import Dashboard from '../../components/Dashboard';

const { Title, Text } = Typography;

const DataCenter: React.FC = () => {
  const { theme, charts } = useDashboardStore();

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
      {/* 页面级 Header - Style Four 范式: Icon + Badge + Description + Actions */}
      <Layout.Header
        style={{
          background: theme === 'dark' ? '#1f1f1f' : '#fff',
          padding: '0 24px',
          height: 72,
          borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
          position: 'sticky',
          top: 0,
          zIndex: 9,
        }}
      >
        <Flex align="center" justify="space-between" style={{ height: '100%' }}>
          {/* 左侧：页面标题区 */}
          <Flex align="center" gap={16}>
            {/* 页面图标 */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: theme === 'dark' 
                  ? 'linear-gradient(135deg, #2b2b2b 0%, #1f1f1f 100%)'
                  : 'linear-gradient(135deg, #f0f5ff 0%, #e6f0ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${theme === 'dark' ? '#303030' : '#d6e4ff'}`,
              }}
            >
              <DatabaseOutlined
                style={{
                  fontSize: 20,
                  color: '#1677ff',
                }}
              />
            </div>

            {/* 标题 + 描述 */}
            <Flex vertical gap={2}>
              <Flex align="center" gap={8}>
                <Title
                  level={5}
                  style={{
                    margin: 0,
                    color: theme === 'dark' ? '#fff' : '#262626',
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  数据中心
                </Title>
                <Badge
                  count={charts.length}
                  style={{ backgroundColor: '#1677ff' }}
                />
              </Flex>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  color: theme === 'dark' ? '#a6a6a6' : '#8c8c8c',
                }}
              >
                管理和查看您的数据分析工作区
              </Text>
            </Flex>

            <Divider
              type="vertical"
              style={{
                height: 32,
                margin: '0 8px',
                borderColor: theme === 'dark' ? '#303030' : '#f0f0f0',
              }}
            />

            {/* 工作区选择器 */}
            <WorkspaceSelector />
          </Flex>

          {/* 右侧：操作按钮组 */}
          <Space size="middle">
            {/* 图表数量提示 */}
            {charts.length > 0 && (
              <Tooltip title="当前工作区图表数量">
                <Text
                  type="secondary"
                  style={{
                    fontSize: 13,
                    color: theme === 'dark' ? '#a6a6a6' : '#8c8c8c',
                  }}
                >
                  共 {charts.length} 个图表
                </Text>
              </Tooltip>
            )}

            {/* 新建图表按钮 */}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddChart}
              size="middle"
              style={{
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              新建图表
            </Button>
          </Space>
        </Flex>
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
