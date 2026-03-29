import { useCallback } from 'react';
import type { Layout, LayoutItem } from 'react-grid-layout';
import { Responsive as ResponsiveGridLayout, WidthProvider } from 'react-grid-layout/legacy';
import { Empty, Button } from 'antd';
import { PlusOutlined, BarChartOutlined } from '@ant-design/icons';
import ChartCard from '../ChartCard';
import { useDashboardStore } from '../../store/dashboardStore';
import { useChart } from '../../hooks/useChart';


// Import react-grid-layout CSS
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayoutWithWidth = WidthProvider(ResponsiveGridLayout);





const Dashboard: React.FC = () => {
  const { charts, theme } = useDashboardStore();
  const { updateLayout } = useChart();

  // Convert charts to layout items
  const layouts = {
    lg: charts.map((chart) => ({
      i: chart.id,
      x: chart.position.x,
      y: chart.position.y,
      w: chart.position.w,
      h: chart.position.h,
      minW: 3,
      minH: 6,
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
      </ResponsiveGridLayoutWithWidth>
    </div>
  );
};

export default Dashboard;
