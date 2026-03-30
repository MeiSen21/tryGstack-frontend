import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChartItem, GridPosition, Workspace } from '../types';
import { DataEngine } from '../engine/DataEngine';

interface PendingChart {
  id: string;
  title: string;
}

interface DashboardState {
  charts: ChartItem[];
  theme: 'light' | 'dark';
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  isLoading: boolean;
  error: string | null;
  pendingChart: PendingChart | null;
}

interface DashboardActions {
  addChart: (chart: ChartItem) => void;
  updateChart: (id: string, updates: Partial<ChartItem>) => void;
  removeChart: (id: string) => void;
  updateLayout: (id: string, position: GridPosition) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  clearAll: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateChartType: (id: string, type: ChartItem['type']) => void;
  updateChartTitle: (id: string, title: string) => void;
  refreshChartData: (id: string) => Promise<void>;
  // Workspace actions
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  removeWorkspace: (id: string) => void;
  setCurrentWorkspace: (id: string) => void;
  loadWorkspace: (id: string) => void;
  setPendingChart: (pending: PendingChart | null) => void;
}

const initialState: DashboardState = {
  charts: [],
  theme: 'light',
  workspaces: [
    {
      id: 'default',
      name: '默认工作区',
      description: '默认工作区',
      charts: [],
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ],
  currentWorkspaceId: 'default',
  isLoading: false,
  error: null,
  pendingChart: null,
};

export const useDashboardStore = create<DashboardState & DashboardActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addChart: (chart) =>
        set((state) => {
          const newCharts = [...state.charts, chart];
          // Also update current workspace
          const updatedWorkspaces = state.workspaces.map((ws) =>
            ws.id === state.currentWorkspaceId
              ? { ...ws, charts: newCharts, updatedAt: Date.now() }
              : ws
          );
          return { charts: newCharts, workspaces: updatedWorkspaces };
        }),

      updateChart: (id, updates) =>
        set((state) => {
          const newCharts = state.charts.map((chart) =>
            chart.id === id ? { ...chart, ...updates } : chart
          );
          const updatedWorkspaces = state.workspaces.map((ws) =>
            ws.id === state.currentWorkspaceId
              ? { ...ws, charts: newCharts, updatedAt: Date.now() }
              : ws
          );
          return { charts: newCharts, workspaces: updatedWorkspaces };
        }),

      removeChart: (id) =>
        set((state) => {
          const newCharts = state.charts.filter((chart) => chart.id !== id);
          const updatedWorkspaces = state.workspaces.map((ws) =>
            ws.id === state.currentWorkspaceId
              ? { ...ws, charts: newCharts, updatedAt: Date.now() }
              : ws
          );
          return { charts: newCharts, workspaces: updatedWorkspaces };
        }),

      updateLayout: (id, position) =>
        set((state) => {
          const newCharts = state.charts.map((chart) =>
            chart.id === id ? { ...chart, position } : chart
          );
          const updatedWorkspaces = state.workspaces.map((ws) =>
            ws.id === state.currentWorkspaceId
              ? { ...ws, charts: newCharts, updatedAt: Date.now() }
              : ws
          );
          return { charts: newCharts, workspaces: updatedWorkspaces };
        }),

      updateChartType: (id, type) =>
        set((state) => {
          const newCharts = state.charts.map((chart) =>
            chart.id === id ? { ...chart, type, config: { ...chart.config, type } } : chart
          );
          const updatedWorkspaces = state.workspaces.map((ws) =>
            ws.id === state.currentWorkspaceId
              ? { ...ws, charts: newCharts, updatedAt: Date.now() }
              : ws
          );
          return { charts: newCharts, workspaces: updatedWorkspaces };
        }),

      updateChartTitle: (id, title) =>
        set((state) => {
          const newCharts = state.charts.map((chart) =>
            chart.id === id ? { ...chart, title, config: { ...chart.config, title } } : chart
          );
          const updatedWorkspaces = state.workspaces.map((ws) =>
            ws.id === state.currentWorkspaceId
              ? { ...ws, charts: newCharts, updatedAt: Date.now() }
              : ws
          );
          return { charts: newCharts, workspaces: updatedWorkspaces };
        }),

      setTheme: (theme) => set({ theme }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearAll: () =>
        set((state) => {
          const updatedWorkspaces = state.workspaces.map((ws) =>
            ws.id === state.currentWorkspaceId
              ? { ...ws, charts: [], updatedAt: Date.now() }
              : ws
          );
          return { charts: [], workspaces: updatedWorkspaces };
        }),

      // Workspace actions
      addWorkspace: (workspace) =>
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
        })),

      updateWorkspace: (id, updates) =>
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === id ? { ...ws, ...updates, updatedAt: Date.now() } : ws
          ),
        })),

      removeWorkspace: (id) =>
        set((state) => {
          const newWorkspaces = state.workspaces.filter((ws) => ws.id !== id);
          // If removing current workspace, switch to default
          const newCurrentId =
            state.currentWorkspaceId === id
              ? newWorkspaces.find((ws) => ws.isDefault)?.id || newWorkspaces[0]?.id
              : state.currentWorkspaceId;
          const newCharts = newWorkspaces.find((ws) => ws.id === newCurrentId)?.charts || [];
          return {
            workspaces: newWorkspaces,
            currentWorkspaceId: newCurrentId,
            charts: newCharts,
          };
        }),

      setCurrentWorkspace: (id) =>
        set((state) => {
          const workspace = state.workspaces.find((ws) => ws.id === id);
          return {
            currentWorkspaceId: id,
            charts: workspace?.charts || [],
          };
        }),

      loadWorkspace: (id) => {
        const { setCurrentWorkspace } = get();
        setCurrentWorkspace(id);
      },

      setPendingChart: (pending) => set({ pendingChart: pending }),

      refreshChartData: async (id: string) => {
        const state = get();
        const chart = state.charts.find((c) => c.id === id);
        if (!chart || !chart.dataSource) {
          throw new Error('Chart or dataSource not found');
        }

        const dataEngine = new DataEngine();
        
        // Fetch fresh data - 转换 DataSourceInfo 为 DataSourceConfig
        const dataSourceConfig = {
          dataset: chart.dataSource.dataset,
          dimensions: chart.dimensions || ['date'],
          metrics: chart.metrics || [{ field: 'sales', name: '销售额', aggregation: 'sum' }],
          timeRange: chart.dataSource.timeRange?.start ? 
            `${chart.dataSource.timeRange.start}_${chart.dataSource.timeRange.end}` : 
            '7d',
        };
        const rawData = await dataEngine.fetch(dataSourceConfig);
        
        // Transform data based on chart config
        const transformConfig = chart.transform || {
          xDimension: chart.dimensions?.[0] || 'date',
          metric: chart.metrics?.[0]?.field || 'sales',
          aggregation: chart.metrics?.[0]?.aggregation || 'sum',
        };
        
        const chartData = dataEngine.transform(rawData, transformConfig, chart.type);
        
        // Update chart with new data
        const updatedChart: ChartItem = {
          ...chart,
          data: chartData,
          dataSource: {
            ...chart.dataSource,
            recordCount: rawData.length,
            lastUpdated: Date.now(),
          },
        };
        
        const newCharts = state.charts.map((c) =>
          c.id === id ? updatedChart : c
        );
        
        const updatedWorkspaces = state.workspaces.map((ws) =>
          ws.id === state.currentWorkspaceId
            ? { ...ws, charts: newCharts, updatedAt: Date.now() }
            : ws
        );
        
        set({ charts: newCharts, workspaces: updatedWorkspaces });
      },
    }),
    {
      name: 'ai-dashboard-storage',
      partialize: (state) => ({
        charts: state.charts,
        theme: state.theme,
        workspaces: state.workspaces,
        currentWorkspaceId: state.currentWorkspaceId,
      }),
    }
  )
);
