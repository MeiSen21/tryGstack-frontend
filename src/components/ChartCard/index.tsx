import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  MoreOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  DragOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Select, Popconfirm, Input, Tooltip } from 'antd';
import { useDashboardStore } from '../../store/dashboardStore';
import { generateEChartsOption } from '../../utils/chartHelper';
import SQLDisplay from '../SQLDisplay';
import type { ChartItem, ChartType } from '../../types';

interface ChartCardProps {
  chart: ChartItem;
  isDragging?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({ chart, isDragging }) => {
  const { theme, updateChartType, removeChart, updateChartTitle } = useDashboardStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chart.title);
  const [sqlExpanded, setSqlExpanded] = useState(false);

  const chartOption = useMemo(() => {
    return generateEChartsOption(chart.type, chart.data, chart.config, theme);
  }, [chart.type, chart.data, chart.config, theme]);

  const handleTypeChange = (type: ChartType) => {
    updateChartType(chart.id, type);
  };

  const handleTitleSave = () => {
    if (editTitle.trim()) {
      updateChartTitle(chart.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(chart.title);
    setIsEditing(false);
  };

  const chartTypeOptions = [
    { value: 'line', label: '折线图', icon: <LineChartOutlined /> },
    { value: 'bar', label: '柱状图', icon: <BarChartOutlined /> },
    { value: 'pie', label: '饼图', icon: <PieChartOutlined /> },
  ];

  const menuItems = [
    {
      key: 'edit',
      label: '编辑标题',
      icon: <EditOutlined />,
      onClick: () => setIsEditing(true),
    },
    {
      key: 'delete',
      label: (
        <Popconfirm
          title="删除图表"
          description="确定要删除这个图表吗？"
          onConfirm={() => removeChart(chart.id)}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <span className="text-error">删除图表</span>
        </Popconfirm>
      ),
      icon: <DeleteOutlined className="text-error" />,
    },
  ];

  return (
    <div
      className={`h-full flex flex-col rounded-lg border transition-all duration-200 ${
        theme === 'dark'
          ? 'bg-[#2d2d2f] border-[#3d3d3f]'
          : 'bg-white border-border shadow-sm'
      } ${isDragging ? 'opacity-50 scale-95' : ''}`}
      style={{
        animation: 'cardEnter 0.3s ease-out',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-[#3d3d3f]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Tooltip title="拖拽调整位置">
            <DragOutlined
              className={`cursor-move text-lg transition-colors ${
                theme === 'dark'
                  ? 'text-[#86868b] hover:text-[#a1a1a6]'
                  : 'text-[#8c8c8c] hover:text-[#595959]'
              }`}
            />
          </Tooltip>
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                size="small"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onPressEnter={handleTitleSave}
                autoFocus
                className="flex-1"
              />
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleTitleSave}
              />
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={handleTitleCancel}
              />
            </div>
          ) : (
            <h3
              className={`font-medium truncate ${
                theme === 'dark' ? 'text-white' : 'text-text-primary'
              }`}
            >
              {chart.title}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-1 ml-2">
          {/* Chart Type Selector */}
          <Select
            value={chart.type}
            onChange={handleTypeChange}
            size="small"
            variant="borderless"
            popupMatchSelectWidth={false}
            options={chartTypeOptions.map((opt) => ({
              value: opt.value,
              label: (
                <span className="flex items-center gap-1">
                  {opt.icon}
                  {opt.label}
                </span>
              ),
            }))}
            className={theme === 'dark' ? 'dark-select' : ''}
          />

          {/* More Actions */}
          <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 min-h-0 p-4 pb-12">
        <ReactECharts
          option={chartOption}
          style={{ height: '100%', minHeight: '200px' }}
          opts={{ renderer: 'canvas' }}
          theme={theme}
        />
      </div>

      {/* SQL Display */}
      <div className="px-4 pt-2 pb-4">
        <SQLDisplay
          sql={chart.sql}
          isExpanded={sqlExpanded}
          onToggle={() => setSqlExpanded(!sqlExpanded)}
        />
      </div>

      <style>{`
        @keyframes cardEnter {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default React.memo(ChartCard);
