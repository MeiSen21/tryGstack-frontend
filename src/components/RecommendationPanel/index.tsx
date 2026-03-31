import React, { useState } from 'react';
import { Card, Button, Radio, Tag, Typography, Space, Empty } from 'antd';
import { 
  LineChartOutlined, 
  BarChartOutlined, 
  PieChartOutlined,
  DotChartOutlined,
  RadarChartOutlined,
  FilterOutlined,
  DashboardOutlined,
  HeatMapOutlined,
  BulbOutlined,
  CheckCircleFilled
} from '@ant-design/icons';
import type { AIRecommendation, ChartType } from '../../types';

const { Text, Paragraph } = Typography;

// 图表类型图标映射
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

// 图表类型颜色
const chartColors: Record<ChartType, string> = {
  line: '#1890ff',
  bar: '#52c41a',
  pie: '#722ed1',
  scatter: '#13c2c2',
  radar: '#fa8c16',
  funnel: '#eb2f96',
  gauge: '#f5222d',
  heatmap: '#2f54eb',
};

interface RecommendationPanelProps {
  input: string;
  recommendations: AIRecommendation[];
  onSelect: (recommendation: AIRecommendation) => void;
  onCancel: () => void;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  input,
  recommendations,
  onSelect,
  onCancel,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // 重置选中项当推荐列表变化时
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [recommendations]);

  const handleConfirm = () => {
    if (recommendations[selectedIndex]) {
      onSelect(recommendations[selectedIndex]);
    }
  };



  if (recommendations.length === 0) {
    return (
      <Card className="bg-white rounded-xl shadow-lg">
        <Empty description="暂无推荐方案" />
      </Card>
    );
  }

  return (
    <Card 
      className="bg-white rounded-xl shadow-lg"
      title={
        <Space size="small">
          <BulbOutlined style={{ color: '#faad14', fontSize: 18 }} />
          <span className="font-medium">AI 推荐的可视化方案</span>
        </Space>
      }
      extra={
        <Button type="link" onClick={onCancel} className="px-0">
          取消
        </Button>
      }
      styles={{
        body: { padding: '20px 24px' }
      }}
    >
      <Paragraph type="secondary" className="mb-6 text-sm leading-relaxed">
        根据 "<Text strong>{input}</Text>"，AI 为您推荐以下 {recommendations.length} 个可视化方案：
      </Paragraph>

      <Radio.Group
        className="w-full"
        value={selectedIndex}
        onChange={(e) => setSelectedIndex(e.target.value)}
      >
        <Space direction="vertical" size="large" className="w-full">
          {recommendations.map((rec, index) => (
            <Radio.Button
              key={index}
              value={index}
              className={`w-full h-auto rounded-xl border-2 transition-all duration-300 text-left overflow-hidden ${
                selectedIndex === index 
                  ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm' 
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
              style={{ 
                display: 'block', 
                minHeight: 'auto', 
                height: 'auto',
                padding: '20px 24px'
              }}
            >
              <div className="flex items-start gap-5">
                {/* 左侧：图标 */}
                <div 
                  className="flex items-center justify-center w-14 h-14 rounded-xl text-2xl flex-shrink-0"
                  style={{ 
                    backgroundColor: `${chartColors[rec.type]}15`, 
                    color: chartColors[rec.type] 
                  }}
                >
                  {chartIcons[rec.type]}
                </div>

                {/* 中间：详情 */}
                <div className="flex-1 min-w-0 pt-0.5">
                  {/* 标题行 */}
                  <div className="flex items-start gap-3 mb-3">
                    <Text strong className="text-base leading-tight flex-1">{rec.title}</Text>
                    <Tag 
                      color={chartColors[rec.type]} 
                      className="m-0 flex-shrink-0"
                      style={{ borderRadius: 4 }}
                    >
                      {chartNames[rec.type]}
                    </Tag>
                  </div>
                  
                  {/* 元信息行 */}
                  <div className="flex items-center gap-4 mb-4">
                    <Text type="secondary" className="text-xs">
                      数据集: <Text strong className="text-xs">{rec.preview?.dataset || 'sales'}</Text>
                    </Text>
                    <Text type="secondary" className="text-xs">
                      匹配度: <Text strong className="text-xs" style={{ color: '#52c41a' }}>{Math.round(rec.confidence * 100)}%</Text>
                    </Text>
                  </div>

                  {/* 推荐理由 */}
                  <div className="flex flex-col gap-2 mb-4">
                    {rec.reason.map((r, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <CheckCircleFilled className="text-green-500 text-sm mt-0.5 flex-shrink-0" />
                        <Text type="secondary" className="text-sm leading-relaxed">{r}</Text>
                      </div>
                    ))}
                  </div>

                  {/* 描述 */}
                  {rec.preview?.description && (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
                      <Text type="secondary" className="text-xs block truncate">
                        {rec.preview.description}
                      </Text>
                    </div>
                  )}
                </div>

                {/* 右侧：选中标记 */}
                {selectedIndex === index && (
                  <div className="flex items-start justify-center w-8 flex-shrink-0 pt-1">
                    <CheckCircleFilled style={{ color: '#52c41a', fontSize: 22 }} />
                  </div>
                )}
              </div>
            </Radio.Button>
          ))}
        </Space>
      </Radio.Group>

      <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
        <Button onClick={onCancel} size="large">
          取消
        </Button>
        <Button 
          type="primary" 
          size="large"
          onClick={handleConfirm}
          disabled={recommendations.length === 0}
        >
          使用选中的方案
        </Button>
      </div>
    </Card>
  );
};

export default RecommendationPanel;
