import { useState, useCallback } from 'react';
import { message } from 'antd';
import { chartEngine } from '../engine/ChartEngine';

import type { AIRecommendation, ChartItem } from '../types';
import { generateId, getNextGridPosition } from '../utils/chartHelper';
import { useDashboardStore } from '../store/dashboardStore';

interface UseAIRecommendationsReturn {
  isLoading: boolean;
  recommendations: AIRecommendation[];
  showPanel: boolean;
  currentInput: string;
  getRecommendations: (input: string) => Promise<void>;
  selectRecommendation: (recommendation: AIRecommendation) => Promise<ChartItem | null>;
  closePanel: () => void;
}

/**
 * AI 推荐图表 Hook
 * 新架构：AI推荐 → 用户选择 → 生成图表
 */
export function useAIRecommendations(): UseAIRecommendationsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const { charts, addChart } = useDashboardStore();

  /**
   * 获取 AI 推荐列表
   */
  const getRecommendations = useCallback(async (input: string) => {
    if (!input.trim()) return;

    setIsLoading(true);
    setCurrentInput(input);

    try {
      const result = await chartEngine.getRecommendations(input);
      setRecommendations(result);
      setShowPanel(true);
    } catch (err) {
      message.error('获取推荐失败，请稍后重试');
      console.error('获取推荐失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 选择推荐并生成图表
   */
  const selectRecommendation = useCallback(async (
    recommendation: AIRecommendation
  ): Promise<ChartItem | null> => {
    setIsLoading(true);

    try {
      // 1. 生成完整的图表配置
      const config = await chartEngine.selectRecommendation(recommendation, currentInput);

      // 2. 获取数据
      const rawData = await chartEngine.fetchData(config.dataSource);
      const chartData = chartEngine.transformData(rawData, config.transform, config.type);

      // 3. 创建图表项
      const position = getNextGridPosition(charts);
      const chartItem: ChartItem = {
        id: generateId(),
        type: config.type,
        title: config.title,
        data: chartData,
        config: {
          type: config.type,
          title: config.title,
          dataset: config.dataset,
          dimensions: config.dimensions,
          metrics: config.metrics,
          transform: config.transform,
          timeRange: config.timeRange,
        },
        position,
        createdAt: Date.now(),
        // 兼容字段
        dataset: config.dataset,
        dimensions: config.dimensions as any,
        metrics: config.metrics as any,
        transform: config.transform as any,
        dataSource: {
          dataset: config.dataSource.dataset,
          recordCount: rawData.length,
          lastUpdated: Date.now(),
        },
      };

      // 4. 添加到 store
      addChart(chartItem);

      // 5. 关闭面板
      setShowPanel(false);
      setRecommendations([]);

      message.success('图表已生成');
      return chartItem;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成图表失败';
      message.error(errorMessage);
      console.error('生成图表失败:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentInput, charts, addChart]);

  /**
   * 关闭推荐面板
   */
  const closePanel = useCallback(() => {
    setShowPanel(false);
    setRecommendations([]);
    setCurrentInput('');
  }, []);

  return {
    isLoading,
    recommendations,
    showPanel,
    currentInput,
    getRecommendations,
    selectRecommendation,
    closePanel,
  };
}
