/**
 * withSync Middleware
 * Zustand 中间件，用于拦截状态变更并触发云端同步
 * 
 * 设计原则：
 * - 不修改原有业务逻辑
 * - 在 set 调用后异步触发同步
 * - 防抖处理，避免频繁请求
 */

import { enqueueChange, hasPendingChanges, flushQueue } from '../utils/syncQueue';
import { updateLastSynced } from '../utils/cacheManager';
import { workspaceApi } from '../services/workspaceApi';
import { useAuthStore } from './authStore';
import type { WorkspaceConfig } from '../types';

// 避免循环依赖，通过事件通知 store 更新
let storeUpdater: {
  updateWorkspace?: (id: string, updates: { id: string }) => void;
  setCurrentWorkspace?: (id: string) => void;
} = {};

export function setStoreUpdater(updater: typeof storeUpdater) {
  storeUpdater = updater;
}

// 防抖时间：2 秒
const SYNC_DEBOUNCE = 2000;

// 同步状态
type SyncState = {
  isSyncing: boolean;
  lastSyncTime: number;
  syncTimer: ReturnType<typeof setTimeout> | null;
  pendingWorkspaceId: string | null;
};

const syncState: SyncState = {
  isSyncing: false,
  lastSyncTime: 0,
  syncTimer: null,
  pendingWorkspaceId: null,
};

/**
 * 获取用户隔离的 localStorage key
 */
function getStorageKey(userId: string): string {
  return userId ? `ai-dashboard-storage-${userId}` : 'ai-dashboard-storage-guest';
}

/**
 * 获取或创建工作区
 * 如果工作区不存在，自动创建
 */
async function getOrCreateWorkspace(
  workspaceId: string, 
  userId: string
): Promise<{ id: string; isNew: boolean } | null> {
  // 使用正确的用户隔离 key
  const storageKey = getStorageKey(userId);
  const storage = localStorage.getItem(storageKey);
  
  if (!storage) {
    console.warn('[withSync] 本地存储不存在:', storageKey);
    return null;
  }

  const state = JSON.parse(storage);
  const workspace = state.state?.workspaces?.find(
    (w: any) => w.id === workspaceId
  );

  if (!workspace) {
    console.warn('[withSync] 本地工作区不存在:', workspaceId);
    return null;
  }

  const config: WorkspaceConfig = {
    charts: workspace.charts || [],
    layout: workspace.layout || [],
    theme: workspace.theme || 'light',
  };

  // 首先尝试直接创建（新用户场景）
  // 检查 workspaceId 是否是本地生成的（不含横线或长度较短）
  const isLocalId = workspaceId.startsWith('default-') || workspaceId.length < 30;
  
  if (isLocalId) {
    console.log('[withSync] 检测到本地工作区，直接创建到后端:', workspace.name);
    
    const createResult = await workspaceApi.create(
      workspace.name || '默认工作区',
      workspace.description,
      config
    );

    if (createResult.success && createResult.workspace) {
      console.log('[withSync] 工作区创建成功:', createResult.workspace.id);
      
      // 更新本地工作区 ID 为后端返回的 ID
      const newId = createResult.workspace.id;
      
      // 更新 localStorage 中的工作区 ID
      const updatedState = JSON.parse(storage);
      const wsIndex = updatedState.state.workspaces.findIndex(
        (w: any) => w.id === workspaceId
      );
      if (wsIndex >= 0) {
        updatedState.state.workspaces[wsIndex].id = newId;
        if (updatedState.state.currentWorkspaceId === workspaceId) {
          updatedState.state.currentWorkspaceId = newId;
        }
        localStorage.setItem(storageKey, JSON.stringify(updatedState));
        
        if (storeUpdater.updateWorkspace && storeUpdater.setCurrentWorkspace) {
          storeUpdater.updateWorkspace(workspaceId, { id: newId });
          storeUpdater.setCurrentWorkspace(newId);
        }
      }
      
      return { id: newId, isNew: true };
    } else {
      console.error('[withSync] 创建工作区失败:', createResult.error);
      return null;
    }
  }

  // 已有后端 ID 的工作区，尝试同步更新
  console.log('[withSync] 尝试同步已有工作区:', workspaceId);
  const result = await workspaceApi.syncConfig(workspaceId, config);

  if (result.success && result.workspace) {
    return { id: workspaceId, isNew: false };
  }

  // 同步失败且是 404，尝试重新创建
  if (result.error?.includes('不存在') || result.error?.includes('404')) {
    console.log('[withSync] 工作区不存在，重新创建:', workspace.name);
    
    const createResult = await workspaceApi.create(
      workspace.name || '默认工作区',
      workspace.description,
      config
    );

    if (createResult.success && createResult.workspace) {
      console.log('[withSync] 工作区创建成功:', createResult.workspace.id);
      
      const newId = createResult.workspace.id;
      
      const updatedState = JSON.parse(storage);
      const wsIndex = updatedState.state.workspaces.findIndex(
        (w: any) => w.id === workspaceId
      );
      if (wsIndex >= 0) {
        updatedState.state.workspaces[wsIndex].id = newId;
        if (updatedState.state.currentWorkspaceId === workspaceId) {
          updatedState.state.currentWorkspaceId = newId;
        }
        localStorage.setItem(storageKey, JSON.stringify(updatedState));
        
        // 通过回调更新 store（避免循环依赖）
        if (storeUpdater.updateWorkspace && storeUpdater.setCurrentWorkspace) {
          storeUpdater.updateWorkspace(workspaceId, { id: newId });
          storeUpdater.setCurrentWorkspace(newId);
        }
      }
      
      return { id: newId, isNew: true };
    } else {
      console.error('[withSync] 创建工作区失败:', createResult.error);
    }
  }

  return null;
}

/**
 * 执行同步
 */
async function performSync(workspaceId: string): Promise<void> {
  // 检查是否已登录
  const { isAuthenticated, user } = useAuthStore.getState();
  if (!isAuthenticated || !user) {
    console.log('[withSync] 用户未登录，跳过同步');
    return;
  }

  // 检查是否正在同步
  if (syncState.isSyncing) {
    console.log('[withSync] 正在同步中，稍后重试');
    syncState.pendingWorkspaceId = workspaceId;
    return;
  }

  syncState.isSyncing = true;
  console.log('[withSync] 开始同步工作区:', workspaceId);

  try {
    // 先执行待同步队列中的变更
    if (hasPendingChanges()) {
      await flushQueue();
    }

    // 获取或创建工作区
    const workspaceResult = await getOrCreateWorkspace(workspaceId, user.id);
    
    if (workspaceResult) {
      console.log('[withSync] 同步成功, isNew:', workspaceResult.isNew);
      updateLastSynced(user.id);
      syncState.lastSyncTime = Date.now();
    } else {
      console.error('[withSync] 同步失败: 无法获取或创建工作区');
      // 同步失败，加入队列稍后重试
      enqueueChange(workspaceId, 'updateChart', {});
    }
  } catch (error) {
    console.error('[withSync] 同步异常:', error);
    // 异常时加入队列
    enqueueChange(workspaceId, 'updateChart', {});
  } finally {
    syncState.isSyncing = false;

    // 如果有挂起的同步请求，继续执行
    if (syncState.pendingWorkspaceId && syncState.pendingWorkspaceId !== workspaceId) {
      const nextId = syncState.pendingWorkspaceId;
      syncState.pendingWorkspaceId = null;
      performSync(nextId);
    }
  }
}

/**
 * 防抖同步
 */
function debouncedSync(workspaceId: string): void {
  // 清除之前的定时器
  if (syncState.syncTimer) {
    clearTimeout(syncState.syncTimer);
  }

  // 设置新的定时器
  syncState.syncTimer = setTimeout(() => {
    performSync(workspaceId);
    syncState.syncTimer = null;
  }, SYNC_DEBOUNCE);
}

/**
 * 需要同步的 Action 类型
 */
const SYNC_ACTIONS = [
  'addChart',
  'updateChart',
  'removeChart',
  'updateLayout',
  'updateChartType',
  'updateChartTitle',
  'clearAll',
];

/**
 * 检查是否是数据变更操作
 */
function isDataChangeAction(fn: Function): boolean {
  const fnStr = fn.toString();
  return SYNC_ACTIONS.some((action) => fnStr.includes(action));
}

/**
 * withSync Middleware
 * 包装 Zustand store，在状态变更后触发同步
 */
export function withSync<T extends object>(
  config: (set: any, get: any, api: any) => T
): (set: any, get: any, api: any) => T {
  return (set, get, api) => {
    // 包装 set 函数
    const wrappedSet: typeof set = (fn: any) => {
      // 获取变更前的状态快照
      const beforeState = get();
      const currentWorkspaceId = beforeState?.currentWorkspaceId;
      const beforeCharts = beforeState?.charts?.length || 0;
      const beforeWorkspaces = JSON.stringify(beforeState?.workspaces);

      // 执行原始 set
      set(fn);

      // 获取变更后的状态
      const afterState = get();
      const afterCharts = afterState?.charts?.length || 0;
      const afterWorkspaces = JSON.stringify(afterState?.workspaces);

      // 检测是否有数据变更
      const hasChanges = 
        beforeCharts !== afterCharts || 
        beforeWorkspaces !== afterWorkspaces;

      if (currentWorkspaceId && hasChanges) {
        console.log('[withSync] 检测到数据变更，准备同步');
        debouncedSync(currentWorkspaceId);
      }
    };

    // 创建 store
    const store = config(wrappedSet, get, api);

    return store;
  };
}

/**
 * 手动触发同步
 * 用于用户手动点击"同步"按钮
 */
export async function manualSync(): Promise<{ success: boolean; message: string }> {
  const { isAuthenticated, user } = useAuthStore.getState();
  const { currentWorkspaceId } = useAuthStore.getState();

  if (!isAuthenticated || !user) {
    return { success: false, message: '请先登录' };
  }

  if (!currentWorkspaceId) {
    return { success: false, message: '未选择工作区' };
  }

  await performSync(currentWorkspaceId);
  
  return { success: true, message: '同步完成' };
}

/**
 * 获取同步状态
 */
export function getSyncStatus(): {
  isSyncing: boolean;
  lastSyncTime: number;
  hasPending: boolean;
} {
  return {
    isSyncing: syncState.isSyncing,
    lastSyncTime: syncState.lastSyncTime,
    hasPending: hasPendingChanges(),
  };
}
