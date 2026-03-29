import { useCallback } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import type { ChartItem, GridPosition, ChartType } from '../types';

interface UseChartReturn {
  charts: ChartItem[];
  updateLayout: (id: string, position: GridPosition) => void;
  removeChart: (id: string) => void;
  updateChartType: (id: string, type: ChartType) => void;
  updateChartTitle: (id: string, title: string) => void;
  clearAll: () => void;
}

/**
 * 图表管理 Hook
 */
export function useChart(): UseChartReturn {
  const {
    charts,
    updateLayout: storeUpdateLayout,
    removeChart: storeRemoveChart,
    updateChartType: storeUpdateChartType,
    updateChartTitle: storeUpdateChartTitle,
    clearAll: storeClearAll,
  } = useDashboardStore();

  const updateLayout = useCallback(
    (id: string, position: GridPosition) => {
      storeUpdateLayout(id, position);
    },
    [storeUpdateLayout]
  );

  const removeChart = useCallback(
    (id: string) => {
      storeRemoveChart(id);
    },
    [storeRemoveChart]
  );

  const updateChartType = useCallback(
    (id: string, type: ChartType) => {
      storeUpdateChartType(id, type);
    },
    [storeUpdateChartType]
  );

  const updateChartTitle = useCallback(
    (id: string, title: string) => {
      storeUpdateChartTitle(id, title);
    },
    [storeUpdateChartTitle]
  );

  const clearAll = useCallback(() => {
    storeClearAll();
  }, [storeClearAll]);

  return {
    charts,
    updateLayout,
    removeChart,
    updateChartType,
    updateChartTitle,
    clearAll,
  };
}
