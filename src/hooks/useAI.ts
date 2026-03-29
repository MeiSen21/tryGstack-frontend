import { useState, useCallback } from 'react';
import { getAIService, fallbackParse } from '../services/aiService';
import { generateMockData } from '../services/mockService';
import type { AIResponse, ChartConfig, ChartItem } from '../types';
import { generateId, getNextGridPosition } from '../utils/chartHelper';
import { useDashboardStore } from '../store/dashboardStore';

interface UseAIReturn {
  isLoading: boolean;
  error: string | null;
  generateChart: (input: string) => Promise<ChartItem | null>;
}

/**
 * AI 生成图表 Hook
 */
export function useAI(): UseAIReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { charts, addChart, setError: setStoreError } = useDashboardStore();

  const generateChart = useCallback(
    async (input: string): Promise<ChartItem | null> => {
      setIsLoading(true);
      setError(null);
      setStoreError(null);

      try {
        let aiResponse: AIResponse;

        // 尝试调用 AI API
        try {
          const aiService = getAIService();
          aiResponse = await aiService.parseChartConfig(input);
        } catch (apiError) {
          console.warn('AI API 调用失败，使用 fallback 解析:', apiError);
          // 使用 fallback 规则解析
          aiResponse = fallbackParse(input);
        }

        // 生成 Mock 数据
        const mockData = generateMockData(aiResponse.config);

        // 创建图表项
        const position = getNextGridPosition(charts);
        const chartItem: ChartItem = {
          id: generateId(),
          type: aiResponse.config.type,
          title: aiResponse.config.title,
          data: mockData,
          config: aiResponse.config,
          position,
          createdAt: Date.now(),
          sql: aiResponse.sql,
        };

        // 添加到 store
        addChart(chartItem);

        return chartItem;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '生成图表失败';
        setError(errorMessage);
        setStoreError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [charts, addChart, setStoreError]
  );

  return {
    isLoading,
    error,
    generateChart,
  };
}

/**
 * 重新生成图表数据 Hook
 */
export function useRegenerateChart() {
  const { updateChart } = useDashboardStore();

  const regenerateData = useCallback(
    (chartId: string, config: ChartConfig) => {
      const newData = generateMockData(config);
      updateChart(chartId, { data: newData });
    },
    [updateChart]
  );

  return { regenerateData };
}
