import React, { useState } from 'react';
import { Card, Button, Radio, Spin, Tag, Typography, Space, Empty } from 'antd';
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
import { getAIService } from '../../services/aiService';

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
  onSelect: (recommendation: AIRecommendation) => void;
  onCancel: () => void;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  input,
  onSelect,
  onCancel,
}) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // 获取推荐
  React.useEffect(() => {
    let cancelled = false;

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError('');
        const aiService = getAIService();
        const result = await aiService.getRecommendations(input);
        
        if (!cancelled) {
          setRecommendations(result);
          setSelectedIndex(0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '获取推荐失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      cancelled = true;
    };
  }, [input]);

  const handleConfirm = () => {
    if (recommendations[selectedIndex]) {
      onSelect(recommendations[selectedIndex]);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white rounded-xl shadow-lg">
        <div className="flex flex-col items-center justify-center py-16">
          <Spin size="large" />
          <Text type="secondary" className="mt-4 text-sm">
            AI 正在分析需求并推荐最佳可视化方案...
          </Text>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white rounded-xl shadow-lg">
        <Empty description={<Text type="danger">{error}</Text>} />
      </Card>
    );
  }

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
        <Space>
          <BulbOutlined style={{ color: '#faad14' }} />
          <span>AI 推荐的可视化方案</span>
        </Space>
      }
      extra={
        <Button type="link" onClick={onCancel}>
          取消
        </Button>
      }
    >
      <Paragraph type="secondary" className="mb-5 text-sm">
        根据 "<Text strong>{input}</Text>"，AI 为您推荐以下 {recommendations.length} 个可视化方案：
      </Paragraph>

      <Radio.Group
        className="w-full"
        value={selectedIndex}
        onChange={(e) => setSelectedIndex(e.target.value)}
      >
        <Space direction="vertical" size="middle" className="w-full">
          {recommendations.map((rec, index) => (
            <Radio.Button
              key={index}
              value={index}
              className={`w-full h-auto p-4 pb-5 rounded-lg border-2 transition-all duration-300 text-left ${
                selectedIndex === index 
                  ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50' 
                  : 'border-gray-200 hover:border-blue-400'
              }`}
              style={{ display: 'block', minHeight: 'auto', height: 'auto' }}
            >
              <div className="flex items-start gap-4">
                {/* 左侧：图标和类型 */}
                <div 
                  className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl flex-shrink-0"
                  style={{ 
                    backgroundColor: `${chartColors[rec.type]}20`, 
                    color: chartColors[rec.type] 
                  }}
                >
                  {chartIcons[rec.type]}
                </div>

                {/* 中间：详情 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Text strong className="text-base">{rec.title}</Text>
                    <Tag color={chartColors[rec.type]}>{chartNames[rec.type]}</Tag>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <Tag>数据集: {rec.preview?.dataset || 'sales'}</Tag>
                    <Text type="secondary" className="text-xs">
                      匹配度: {Math.round(rec.confidence * 100)}%
                    </Text>
                  </div>

                  <div className="flex flex-col gap-1.5 mb-3">
                    {rec.reason.map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircleFilled className="text-green-500 text-sm mt-0.5 flex-shrink-0" />
                        <Text type="secondary" className="text-xs leading-5">{r}</Text>
                      </div>
                    ))}
                  </div>

                  <Text type="secondary" className="text-xs block px-3 py-2 bg-gray-100 rounded truncate">
                    {rec.preview?.description}
                  </Text>
                </div>

                {/* 右侧：选中标记 */}
                {selectedIndex === index && (
                  <div className="flex items-center justify-center w-10 flex-shrink-0">
                    <CheckCircleFilled style={{ color: '#52c41a', fontSize: 20 }} />
                  </div>
                )}
              </div>
            </Radio.Button>
          ))}
        </Space>
      </Radio.Group>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <Button onClick={onCancel}>
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
