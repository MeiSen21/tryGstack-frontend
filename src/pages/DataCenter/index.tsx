import React from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useDashboardStore } from '../../store/dashboardStore';
import WorkspaceSelector from '../../components/WorkspaceSelector';
import InputArea from '../../components/InputArea';
import Dashboard from '../../components/Dashboard';

const DataCenter: React.FC = () => {
  const { theme } = useDashboardStore();

  const handleAddChart = () => {
    const inputArea = document.querySelector('.input-area-container');
    inputArea?.scrollIntoView({ behavior: 'smooth' });
    const textarea = document.querySelector('.ai-input') as HTMLTextAreaElement;
    textarea?.focus();
  };

  return (
    <div className={`min-h-full flex flex-col ${
      theme === 'dark' ? 'bg-[#1d1d1f]' : 'bg-background'
    }`}>
      {/* Page Level Header */}
      <div className={`h-16 px-6 flex items-center justify-between border-b ${
        theme === 'dark'
          ? 'bg-[#2d2d2f] border-[#3d3d3f]'
          : 'bg-white border-gray-200'
      }`}>
        {/* Left: Workspace Selector */}
        <div className="flex items-center gap-4">
          <h2 className={`text-base font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            数据中心
          </h2>
          <div className="h-5 w-px bg-gray-300 dark:bg-[#3d3d3f]" />
          <WorkspaceSelector />
        </div>

        {/* Right: Add Chart Button */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddChart}
        >
          新建图表
        </Button>
      </div>

      {/* Page Content */}
      <div className="flex-1">
        <InputArea />
        <Dashboard />
      </div>
    </div>
  );
};

export default DataCenter;
