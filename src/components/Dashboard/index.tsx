import { useCallback } from 'react';
import type { Layout, LayoutItem } from 'react-grid-layout';
import { Responsive as ResponsiveGridLayout, WidthProvider } from 'react-grid-layout/legacy';
import { Empty, Button, Card, Spin } from 'antd';
import { PlusOutlined, BarChartOutlined, LoadingOutlined } from '@ant-design/icons';
import ChartCard from '../ChartCard';
import { useDashboardStore } from '../../store/dashboardStore';
import { useChart } from '../../hooks/useChart';


// Import react-grid-layout CSS
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayoutWithWidth = WidthProvider(ResponsiveGridLayout);





const Dashboard: React.FC = () => {
  const { charts, theme, pendingChart } = useDashboardStore();
  const { updateLayout } = useChart();

  // Convert charts to layout items (including pending chart)
  const allItems = pendingChart 
    ? [...charts, { 
        id: pendingChart.id, 
        position: { 
          x: 0, 
          y: Math.max(0, ...charts.map(c => c.position.y + c.position.h)), 
          w: 6, 
          h: 10 
        } 
      }]
    : charts;
  
  const layouts = {
    lg: allItems.map((item) => ({
      i: item.id,
      x: item.position.x,
      y: item.position.y,
      w: item.position.w,
      h: item.position.h,
      minW: 4,
      minH: 10,
    })),
  };

  // Handle layout change
  const handleLayoutChange = useCallback(
    (layout: Layout) => {
      (layout as LayoutItem[]).forEach((item) => {
        const chart = charts.find((c) => c.id === item.i);
        if (chart) {
          const newPosition = {
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          };
          // Only update if position changed
          if (
            chart.position.x !== newPosition.x ||
            chart.position.y !== newPosition.y ||
            chart.position.w !== newPosition.w ||
            chart.position.h !== newPosition.h
          ) {
            updateLayout(item.i, newPosition);
          }
        }
      });
    },
    [charts, updateLayout]
  );

  // Scroll to input area
  const scrollToInput = () => {
    const inputArea = document.querySelector('.input-area-container');
    inputArea?.scrollIntoView({ behavior: 'smooth' });
    const textarea = document.querySelector('.ai-input') as HTMLTextAreaElement;
    textarea?.focus();
  };

  if (charts.length === 0) {
    return (
      <div
        className={`flex-1 flex items-center justify-center p-8 ${
          theme === 'dark' ? 'bg-[#1d1d1f]' : 'bg-background'
        }`}
      >
        <Empty
          image={<BarChartOutlined className="text-6xl text-text-tertiary" />}
          description={
            <div className="text-center">
              <p
                className={`text-lg font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-text-primary'
                }`}
              >
                还没有图表
              </p>
              <p className={theme === 'dark' ? 'text-[#a1a1a6]' : 'text-text-secondary'}>
                在上方输入框中描述你的需求，AI 会为你生成图表
              </p>
            </div>
          }
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={scrollToInput}>
            创建第一个图表
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 p-4 ${theme === 'dark' ? 'bg-[#1d1d1f]' : 'bg-background'}`}
    >
      <ResponsiveGridLayoutWithWidth
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={40}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        resizeHandles={['se']}
      >
        {charts.map((chart) => (
          <div key={chart.id}>
            <ChartCard chart={chart} />
          </div>
        ))}
        
        {/* Pending Chart Skeleton */}
        {pendingChart && (
          <div key={pendingChart.id}>
            <Card 
              className={`h-full flex flex-col items-center justify-center ${
                theme === 'dark' ? 'bg-[#2d2d2f] border-[#3d3d3f]' : 'bg-white'
              }`}
              title={
                <div className="flex items-center gap-2">
                  <LoadingOutlined spin />
                  <span>正在生成图表...</span>
                </div>
              }
            >
              <div className="flex flex-col items-center justify-center py-12">
                <Spin size="large" />
                <p className={`mt-4 text-sm ${theme === 'dark' ? 'text-[#a1a1a6]' : 'text-gray-500'}`}>
                  AI 正在处理 "{pendingChart.title}"
                </p>
                <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-[#6e6e73]' : 'text-gray-400'}`}>
                  正在获取数据并生成可视化...
                </p>
              </div>
            </Card>
          </div>
        )}
      </ResponsiveGridLayoutWithWidth>
    </div>
  );
};

export default Dashboard;
