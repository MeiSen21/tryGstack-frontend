import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChartItem, GridPosition, Workspace } from '../types';
import { DataEngine } from '../engine/DataEngine';
import { workspaceApi } from '../services/workspaceApi';
import { isCacheValid, updateLastSynced } from '../utils/cacheManager';
import { flushQueue, hasPendingChanges } from '../utils/syncQueue';
import { withSync, setStoreUpdater } from './withSync';
import { useAuthStore } from './authStore';

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
  // 新增：同步相关状态
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncedAt: number | null;
  syncedUserId: string | null;
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
  // 新增：云端同步 actions
  fetchWorkspaces: () => Promise<void>;
  syncCurrentWorkspace: () => Promise<void>;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
  clearPendingChanges: () => void;
  // 新增：重置状态（用于用户切换）
  resetStore: () => void;
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
  // 新增：同步初始状态
  syncStatus: 'idle',
  lastSyncedAt: null,
  syncedUserId: null,
};

/**
 * 获取用户隔离的存储配置
 * 每个用户使用独立的 localStorage key
 */
const getPersistConfig = () => {
  const { user } = useAuthStore.getState();
  const userId = user?.id;
  
  // 已登录用户使用用户ID作为key的一部分，未登录用户使用默认key
  const storageKey = userId 
    ? `ai-dashboard-storage-${userId}` 
    : 'ai-dashboard-storage-guest';
  
  return {
    name: storageKey,
    partialize: (state: DashboardState) => ({
      charts: state.charts,
      theme: state.theme,
      workspaces: state.workspaces,
      currentWorkspaceId: state.currentWorkspaceId,
      lastSyncedAt: state.lastSyncedAt,
      syncedUserId: state.syncedUserId,
    }),
    // 重新加载时验证用户ID是否匹配
    onRehydrateStorage: () => (state) => {
      if (state) {
        const { user } = useAuthStore.getState();
        const currentUserId = user?.id;
        
        // 如果存储的数据属于不同用户，清空状态
        if (state.syncedUserId && state.syncedUserId !== currentUserId) {
          console.log('[DashboardStore] 检测到数据属于其他用户，清空状态');
          state.workspaces = [];
          state.charts = [];
          state.currentWorkspaceId = null;
          state.syncedUserId = null;
          state.lastSyncedAt = null;
        }
      }
    },
  };
};

export const useDashboardStore = create<DashboardState & DashboardActions>()(
  persist(
    withSync((set, get) => ({
      ...initialState,

      addChart: (chart) =>
        set((state) => {
          const newCharts = [...state.charts, chart];
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

      // 新增：从云端获取工作区
      fetchWorkspaces: async () => {
        const { user, isAuthenticated } = useAuthStore.getState();
        
        if (!isAuthenticated || !user) {
          console.log('[DashboardStore] 用户未登录，跳过同步');
          return;
        }

        // 检查缓存是否有效（仅针对当前用户）
        const { syncedUserId } = get();
        const isUserSwitched = syncedUserId && syncedUserId !== user.id;
        
        if (!isUserSwitched && isCacheValid()) {
          console.log('[DashboardStore] 缓存有效，使用本地数据');
          set({ syncStatus: 'idle', syncedUserId: user.id });
          return;
        }

        // 如果用户切换了，清空当前数据
        if (isUserSwitched) {
          console.log('[DashboardStore] 检测到用户切换，清空本地数据');
          set({
            workspaces: [],
            charts: [],
            currentWorkspaceId: null,
          });
        }

        console.log('[DashboardStore] 开始从云端获取工作区...');
        set({ syncStatus: 'syncing' });

        try {
          // 先执行待同步队列
          if (hasPendingChanges()) {
            await flushQueue();
          }

          // 从云端获取工作区
          const result = await workspaceApi.fetchAll();

          if (result.success && result.workspaces) {
            console.log('[DashboardStore] 获取工作区成功:', result.workspaces.length);
            
            // 使用云端数据，不再回退到本地数据（避免看到其他用户的数据）
            let workspaces = [...result.workspaces];

            // 如果没有工作区，创建一个默认工作区
            if (workspaces.length === 0) {
              const defaultWorkspace: Workspace = {
                id: `default-${user.id}`,
                name: '默认工作区',
                description: '我的默认工作区',
                charts: [],
                isDefault: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              workspaces = [defaultWorkspace];
            }

            const currentWorkspaceId = workspaces.find((w) => w.isDefault)?.id 
              || workspaces[0]?.id;

            const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

            set({
              workspaces,
              currentWorkspaceId,
              charts: currentWorkspace?.charts || [],
              syncStatus: 'idle',
              lastSyncedAt: Date.now(),
              syncedUserId: user.id,
            });

            updateLastSynced(user.id);
          } else {
            console.error('[DashboardStore] 获取工作区失败:', result.error);
            set({ syncStatus: 'error', error: result.error || '同步失败' });
          }
        } catch (error) {
          console.error('[DashboardStore] 同步异常:', error);
          set({ syncStatus: 'error', error: '网络错误' });
        }
      },

      // 新增：手动同步当前工作区
      syncCurrentWorkspace: async () => {
        const { currentWorkspaceId, workspaces, syncStatus } = get();
        const { user, isAuthenticated } = useAuthStore.getState();

        if (!isAuthenticated || !user) {
          set({ error: '请先登录' });
          return;
        }

        if (!currentWorkspaceId) {
          set({ error: '未选择工作区' });
          return;
        }

        if (syncStatus === 'syncing') {
          console.log('[DashboardStore] 正在同步中...');
          return;
        }

        set({ syncStatus: 'syncing' });

        try {
          const workspace = workspaces.find((w) => w.id === currentWorkspaceId);
          if (!workspace) {
            set({ syncStatus: 'error', error: '工作区不存在' });
            return;
          }

          const result = await workspaceApi.syncConfig(currentWorkspaceId, {
            charts: workspace.charts || [],
            layout: workspace.layout || [],
            theme: workspace.theme || 'light',
          });

          if (result.success) {
            set({
              syncStatus: 'idle',
              lastSyncedAt: Date.now(),
              syncedUserId: user.id,
            });
            updateLastSynced(user.id);
          } else {
            set({ syncStatus: 'error', error: result.error });
          }
        } catch (error) {
          set({ syncStatus: 'error', error: '同步失败' });
        }
      },

      // 新增：设置同步状态
      setSyncStatus: (status) => set({ syncStatus: status }),

      // 新增：清空待同步队列
      clearPendingChanges: () => {
        // 在 syncQueue 中实现
        import('../utils/syncQueue').then(({ clearQueue }) => {
          clearQueue();
        });
      },

      // 新增：重置状态（用于用户切换）
      resetStore: () => {
        console.log('[DashboardStore] 重置状态');
        set({
          charts: [],
          workspaces: [],
          currentWorkspaceId: null,
          lastSyncedAt: null,
          syncedUserId: null,
        });
      },

      refreshChartData: async (id: string) => {
        const state = get();
        const chart = state.charts.find((c) => c.id === id);
        if (!chart || !chart.dataSource) {
          throw new Error('Chart or dataSource not found');
        }

        const dataEngine = new DataEngine();
        
        const dataSourceConfig = {
          dataset: chart.dataSource.dataset,
          dimensions: chart.dimensions || ['date'],
          metrics: chart.metrics || [{ field: 'sales', name: '销售额', aggregation: 'sum' }],
          timeRange: chart.dataSource.timeRange?.start ? 
            `${chart.dataSource.timeRange.start}_${chart.dataSource.timeRange.end}` : 
            '7d',
        };
        const rawData = await dataEngine.fetch(dataSourceConfig);
        
        const transformConfig = chart.transform || {
          xDimension: chart.dimensions?.[0] || 'date',
          metric: chart.metrics?.[0]?.field || 'sales',
          aggregation: chart.metrics?.[0]?.aggregation || 'sum',
        };
        
        const chartData = dataEngine.transform(rawData, transformConfig, chart.type);
        
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
    })),
    getPersistConfig()
  )
);

// 注册 store updater（用于 withSync 回调）
setStoreUpdater({
  updateWorkspace: (id, updates) => {
    useDashboardStore.getState().updateWorkspace(id, updates);
  },
  setCurrentWorkspace: (id) => {
    useDashboardStore.getState().setCurrentWorkspace(id);
  },
});
