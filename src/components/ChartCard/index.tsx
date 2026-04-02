import React, { useState, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  MoreOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  DragOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Popconfirm, Input, Tooltip, message } from 'antd';
import { useDashboardStore } from '../../store/dashboardStore';
import { usePermission } from '../../hooks/usePermission';
import { generateEChartsOption } from '../../utils/chartHelper';
import DataSourcePanel from '../DataSourcePanel';
import type { ChartItem, DatasetType, ChartType } from '../../types';

interface ChartCardProps {
  chart: ChartItem;
  isDragging?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({ chart, isDragging }) => {
  const { theme, removeChart, updateChartTitle, refreshChartData } = useDashboardStore();
  const { canView, isDisabled } = usePermission();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chart.title);
  const [refreshing, setRefreshing] = useState(false);
  
  // 权限检查
  const canEditTitle = canView('chart', 'editTitle');
  const canDeleteChart = canView('chart', 'delete');
  const isEditTitleDisabled = isDisabled('chart', 'editTitle');
  const isDeleteChartDisabled = isDisabled('chart', 'delete');

  // 图表选项
  const chartOption = useMemo(() => {
    return generateEChartsOption(chart.type, chart.data, chart.config, theme);
  }, [chart.type, chart.data, chart.config, theme]);

  // 处理标题保存
  const handleTitleSave = () => {
    if (editTitle.trim()) {
      updateChartTitle(chart.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  // 处理标题取消
  const handleTitleCancel = () => {
    setEditTitle(chart.title);
    setIsEditing(false);
  };

  // 处理刷新
  const handleRefresh = useCallback(async () => {
    if (!chart.dataSource) {
      message.warning('无法刷新：缺少数据源配置');
      return;
    }
    
    setRefreshing(true);
    try {
      await refreshChartData(chart.id);
      message.success('数据已刷新');
    } catch (error) {
      message.error('刷新失败，请稍后重试');
    } finally {
      setRefreshing(false);
    }
  }, [chart.id, chart.dataSource, refreshChartData]);

  // 菜单项 - 根据权限动态生成
  const menuItems = [
    // 编辑标题
    ...(canEditTitle
      ? [
          {
            key: 'edit',
            label: <span style={isEditTitleDisabled ? { opacity: 0.5 } : {}}>编辑标题</span>,
            icon: <EditOutlined style={isEditTitleDisabled ? { opacity: 0.5 } : {}} />,
            onClick: () => !isEditTitleDisabled && setIsEditing(true),
            disabled: isEditTitleDisabled,
          } as any,
        ]
      : []),
    // 刷新数据
    {
      key: 'refresh',
      label: '刷新数据',
      icon: <ReloadOutlined />,
      onClick: handleRefresh,
    },
    // 删除图表
    ...(canDeleteChart
      ? [
          { type: 'divider' as const },
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
                disabled={isDeleteChartDisabled}
              >
                <span style={isDeleteChartDisabled ? { opacity: 0.5 } : { color: '#ff4d4f' }}>
                  删除图表
                </span>
              </Popconfirm>
            ),
            icon: <DeleteOutlined style={isDeleteChartDisabled ? { opacity: 0.5 } : { color: '#ff4d4f' }} />,
            danger: true,
            disabled: isDeleteChartDisabled,
          } as any,
        ]
      : []),
  ];

  // 提取数据集类型
  const dataset: DatasetType = chart.dataSource?.dataset || 
    (chart.dataset as DatasetType) || 'sales';

  return (
    <div
      className={`h-full flex flex-col rounded-xl border transition-all duration-200 ${
        theme === 'dark'
          ? 'bg-[#2d2d2f] border-[#3d3d3f]'
          : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
      } ${isDragging ? 'opacity-50 scale-95' : ''}`}
      style={{ animation: 'cardEnter 0.3s ease-out' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#3d3d3f]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Tooltip title="拖拽调整位置">
            <DragOutlined className={`drag-handle text-lg cursor-move transition-colors ${
              theme === 'dark' ? 'text-[#86868b] hover:text-[#a1a1a6]' : 'text-gray-500 hover:text-gray-700'
            }`} />
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
            <h3 className={`font-medium truncate text-base ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {chart.title}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-1 ml-2">
          {/* 刷新按钮 */}
          <Tooltip title="刷新数据">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleRefresh}
              disabled={refreshing || !chart.dataSource}
              className="text-gray-500 hover:text-blue-500"
            />
          </Tooltip>

          {/* 更多操作 */}
          <Dropdown 
            menu={{ items: menuItems }} 
            placement="bottomRight" 
            trigger={['click']}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 p-5 overflow-auto">
        {/* 图表区域 */}
        <div className="min-h-[280px] overflow-hidden">
          <ReactECharts
            option={chartOption}
            style={{ height: '100%', minHeight: '280px' }}
            opts={{ renderer: 'canvas' }}
            theme={theme}
          />
        </div>

        {/* 数据源面板 */}
        <div className="lg:max-w-full h-full">
          <DataSourcePanel
            dataset={dataset}
            chartType={chart.type as ChartType}
            recordCount={chart.dataSource?.recordCount}
            lastUpdated={chart.dataSource?.lastUpdated}
            onRefresh={handleRefresh}
            loading={refreshing}
          />
        </div>
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
