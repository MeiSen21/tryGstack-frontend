/**
 * Sync Queue
 * 管理待同步的变更队列，支持离线恢复后批量同步
 */

import { workspaceApi } from '../services/workspaceApi';
import { updateLastSynced } from './cacheManager';
import type { ChartItem, GridPosition } from '../types';

// 存储键
const PENDING_CHANGES_KEY = 'ai-dashboard-pending-changes';

// 变更类型
export type ChangeType = 'addChart' | 'updateChart' | 'removeChart' | 'updateLayout' | 'clearAll';

// 变更项
export interface PendingChange {
  id: string;              // 变更唯一 ID
  workspaceId: string;     // 所属工作区 ID
  type: ChangeType;        // 变更类型
  timestamp: number;       // 变更时间
  data?: any;              // 变更数据
  retryCount: number;      // 重试次数
}

/**
 * 生成唯一 ID
 */
function generateChangeId(): string {
  return `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 获取待同步队列
 */
export function getPendingChanges(): PendingChange[] {
  try {
    const data = localStorage.getItem(PENDING_CHANGES_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * 保存待同步队列
 */
function savePendingChanges(changes: PendingChange[]): void {
  try {
    localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes));
  } catch (error) {
    console.error('保存待同步队列失败:', error);
  }
}

/**
 * 添加变更到队列
 */
export function enqueueChange(
  workspaceId: string,
  type: ChangeType,
  data?: any
): PendingChange {
  const change: PendingChange = {
    id: generateChangeId(),
    workspaceId,
    type,
    timestamp: Date.now(),
    data,
    retryCount: 0,
  };

  const queue = getPendingChanges();
  queue.push(change);
  savePendingChanges(queue);

  console.log(`[SyncQueue] 变更已加入队列: ${type}`, change);
  return change;
}

/**
 * 从队列中移除变更
 */
export function dequeueChange(changeId: string): void {
  const queue = getPendingChanges();
  const filtered = queue.filter((c) => c.id !== changeId);
  savePendingChanges(filtered);
}

/**
 * 清空队列
 */
export function clearQueue(): void {
  localStorage.removeItem(PENDING_CHANGES_KEY);
}

/**
 * 检查是否有待同步的变更
 */
export function hasPendingChanges(): boolean {
  return getPendingChanges().length > 0;
}

/**
 * 获取队列长度
 */
export function getQueueLength(): number {
  return getPendingChanges().length;
}

/**
 * 增加重试次数
 */
function incrementRetryCount(changeId: string): void {
  const queue = getPendingChanges();
  const change = queue.find((c) => c.id === changeId);
  if (change) {
    change.retryCount++;
    savePendingChanges(queue);
  }
}

/**
 * 执行单个同步
 */
async function executeChange(change: PendingChange): Promise<boolean> {
  const { workspaceId, type, data } = change;

  try {
    switch (type) {
      case 'addChart':
      case 'updateChart':
      case 'removeChart':
      case 'updateLayout':
      case 'clearAll': {
        // 这些变更都需要同步整个工作区配置
        // 从 localStorage 获取最新的工作区配置
        const storage = localStorage.getItem('ai-dashboard-storage');
        if (!storage) return false;

        const state = JSON.parse(storage);
        const workspace = state.state?.workspaces?.find(
          (w: any) => w.id === workspaceId
        );

        if (!workspace) {
          console.warn(`[SyncQueue] 工作区不存在: ${workspaceId}`);
          return true; // 视为成功，移除队列
        }

        const result = await workspaceApi.syncConfig(workspaceId, {
          charts: workspace.charts || [],
          layout: workspace.layout || [],
          theme: workspace.theme || 'light',
        });

        return result.success;
      }

      default:
        console.warn(`[SyncQueue] 未知变更类型: ${type}`);
        return true; // 未知类型，直接移除
    }
  } catch (error) {
    console.error(`[SyncQueue] 同步失败:`, error);
    return false;
  }
}

/**
 * 刷新队列（执行所有待同步变更）
 * @returns 同步结果统计
 */
export async function flushQueue(): Promise<{
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
}> {
  const queue = getPendingChanges();
  
  if (queue.length === 0) {
    return { success: true, total: 0, succeeded: 0, failed: 0 };
  }

  console.log(`[SyncQueue] 开始同步 ${queue.length} 个待处理变更`);

  let succeeded = 0;
  let failed = 0;
  const remaining: PendingChange[] = [];

  for (const change of queue) {
    // 最多重试 3 次
    if (change.retryCount >= 3) {
      console.warn(`[SyncQueue] 变更超过最大重试次数，放弃:`, change);
      failed++;
      continue;
    }

    const success = await executeChange(change);

    if (success) {
      succeeded++;
      console.log(`[SyncQueue] 变更同步成功: ${change.type}`);
    } else {
      incrementRetryCount(change.id);
      remaining.push(change);
      console.log(`[SyncQueue] 变更同步失败，稍后重试: ${change.type}`);
    }
  }

  // 保存剩余未同步的变更
  savePendingChanges(remaining);

  // 如果有成功同步的，更新最后同步时间
  if (succeeded > 0) {
    const { user } = await import('../store/authStore').then((m) => m.useAuthStore.getState());
    if (user?.id) {
      updateLastSynced(user.id);
    }
  }

  console.log(
    `[SyncQueue] 同步完成: ${succeeded} 成功, ${failed} 失败, ${remaining.length} 待重试`
  );

  return {
    success: failed === 0,
    total: queue.length,
    succeeded,
    failed,
  };
}

/**
 * 监听网络恢复事件
 * 网络恢复后自动同步队列
 */
export function setupNetworkListener(callback?: (result: { success: boolean }) => void): void {
  window.addEventListener('online', async () => {
    console.log('[SyncQueue] 网络已恢复，开始同步...');
    
    if (hasPendingChanges()) {
      const result = await flushQueue();
      callback?.(result);
    }
  });
}

/**
 * 获取队列状态摘要（用于 UI 显示）
 */
export function getQueueStatus(): {
  hasPending: boolean;
  count: number;
  oldestChange: number | null;
} {
  const queue = getPendingChanges();
  const oldest = queue.length > 0 
    ? Math.min(...queue.map((c) => c.timestamp))
    : null;

  return {
    hasPending: queue.length > 0,
    count: queue.length,
    oldestChange: oldest,
  };
}
