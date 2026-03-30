import React from 'react';
import { Card, Tag, Typography, Space, Tooltip, Button, Badge } from 'antd';
import { 
  DatabaseOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CheckCircleFilled,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DotChartOutlined,
  RadarChartOutlined,
  FilterOutlined,
  DashboardOutlined,
  HeatMapOutlined,
} from '@ant-design/icons';
import type { ChartType, DatasetType } from '../../types';

const { Text, Paragraph } = Typography;

// 数据集信息
const datasetInfo: Record<DatasetType, { name: string; icon: React.ReactNode; description: string; recordCount: string }> = {
  sales: {
    name: '销售数据',
    icon: <BarChartOutlined />,
    description: '全渠道销售订单数据，包含销售额、订单量、毛利等指标',
    recordCount: '1.2M',
  },
  users: {
    name: '用户数据',
    icon: <LineChartOutlined />,
    description: '用户注册、活跃、留存等行为数据',
    recordCount: '850K',
  },
  conversion: {
    name: '转化数据',
    icon: <FilterOutlined />,
    description: '用户购买转化漏斗数据，从访问到支付各阶段',
    recordCount: '2.1M',
  },
};

// 图表类型图标
const chartIcons: Record<ChartType, React.ReactNode> = {
  line: <LineChartOutlined />,
  bar: <BarChartOutlined />,
  pie: <PieChartOutlined />,
  scatter: <DotChartOutlined />,
  radar: <RadarChartOutlined />,
  funnel: <FilterOutlined />,
  gauge: <DashboardOutlined />,
  heatmap: <HeatMapOutlined />,
};

// 图表类型中文名称
const chartNames: Record<ChartType, string> = {
  line: '折线图',
  bar: '柱状图',
  pie: '饼图',
  scatter: '散点图',
  radar: '雷达图',
  funnel: '漏斗图',
  gauge: '仪表盘',
  heatmap: '热力图',
};

// 常用维度
const commonDimensions: Record<DatasetType, string[]> = {
  sales: ['date', 'province', 'city', 'category', 'channel', 'source'],
  users: ['date', 'source', 'ageGroup', 'gender', 'city'],
  conversion: ['stage', 'channel', 'date'],
};

// 常用指标
const commonMetrics: Record<DatasetType, string[]> = {
  sales: ['sales', 'orders', 'profit'],
  users: ['newUsers', 'activeUsers', 'retentionRate'],
  conversion: ['users', 'conversionRate'],
};

interface DataSourcePanelProps {
  dataset: DatasetType;
  chartType: ChartType;
  recordCount?: number;
  lastUpdated?: number;
  onRefresh?: () => void;
  loading?: boolean;
}

export const DataSourcePanel: React.FC<DataSourcePanelProps> = ({
  dataset,
  chartType,
  recordCount,
  lastUpdated,
  onRefresh,
  loading = false,
}) => {
  const info = datasetInfo[dataset];
  const dimensions = commonDimensions[dataset];
  const metrics = commonMetrics[dataset];

  const formatTime = (time?: number) => {
    if (!time) return '刚刚';
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <Card 
      className="bg-gray-50 rounded-lg h-full"
      size="small"
      title={
        <Space className="py-1">
          <DatabaseOutlined className="text-blue-500 text-sm" />
          <span className="text-sm font-medium">数据源信息</span>
        </Space>
      }
      extra={
        onRefresh && (
          <Tooltip title="刷新数据">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined spin={loading} className="text-xs" />}
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center justify-center"
            />
          </Tooltip>
        )
      }
      styles={{
        body: { padding: '12px' }
      }}
    >
      {/* 数据集信息 */}
      <div className="mb-5">
        <div className="flex items-start gap-3 mb-3">
          <div 
            className="flex items-center justify-center w-10 h-10 rounded-xl text-lg text-white flex-shrink-0 mt-0.5"
            style={{ background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)' }}
          >
            {info.icon}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <Text strong className="block text-sm mb-0.5">{info.name}</Text>
            <Badge 
              status="success" 
              text={<Text type="secondary" className="text-xs">{info.recordCount} 条记录</Text>}
            />
          </div>
        </div>
        <Paragraph 
          type="secondary" 
          className="text-xs leading-relaxed mb-0"
          style={{ marginBottom: 0 }}
        >
          {info.description}
        </Paragraph>
      </div>

      {/* 图表类型 */}
      <div className="mb-5">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2.5 font-medium">
          <BarChartOutlined className="text-xs" />
          <span>图表类型</span>
        </div>
        <Tag 
          className="text-xs px-2.5 py-1 rounded"
          style={{ 
            background: '#e6f7ff', 
            borderColor: '#91d5ff', 
            color: '#096dd9',
            lineHeight: '1.5'
          }}
          icon={chartIcons[chartType]}
        >
          {chartNames[chartType]}
        </Tag>
      </div>

      {/* 可用维度 */}
      <div className="mb-5">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2.5 font-medium">
          <InfoCircleOutlined className="text-xs" />
          <span>分析维度</span>
          <Tooltip title="可用于分组和筛选的字段">
            <InfoCircleOutlined className="text-xs opacity-50 cursor-help hover:opacity-80" />
          </Tooltip>
        </div>
        <div className="flex flex-wrap gap-2">
          {dimensions.map(dim => (
            <Tag 
              key={dim} 
              className="text-xs bg-gray-100 border-gray-300 text-gray-700 px-2 py-0.5"
              style={{ lineHeight: '1.6' }}
            >
              {dim}
            </Tag>
          ))}
        </div>
      </div>

      {/* 可用指标 */}
      <div className="mb-5">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2.5 font-medium">
          <BarChartOutlined className="text-xs" />
          <span>数据指标</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {metrics.map(metric => (
            <Tag 
              key={metric} 
              color="blue" 
              className="text-xs px-2 py-0.5"
              style={{ lineHeight: '1.6' }}
            >
              {metric}
            </Tag>
          ))}
        </div>
      </div>

      {/* 数据状态 */}
      {(recordCount !== undefined || lastUpdated) && (
        <div className="pt-4 border-t border-dashed border-gray-300">
          <div className="flex items-center gap-2 mb-2">
            <FileTextOutlined className="text-xs text-gray-500" />
            <Text type="secondary" className="text-xs">当前数据: {recordCount?.toLocaleString() || '-'} 条</Text>
          </div>
          <div className="flex items-center gap-2">
            <FieldTimeOutlined className="text-xs text-gray-500" />
            <Text type="secondary" className="text-xs">更新时间: {formatTime(lastUpdated)}</Text>
            <CheckCircleFilled className="text-green-500 text-xs ml-auto" />
          </div>
        </div>
      )}
    </Card>
  );
};

export default DataSourcePanel;
