/**
 * Cache Manager
 * 管理本地缓存的元数据，包括 TTL、用户隔离等
 */

import { useAuthStore } from '../store/authStore';

// 缓存有效期：5 分钟
export const CACHE_TTL = 5 * 60 * 1000;

// 缓存元数据存储键
const CACHE_META_KEY = 'ai-dashboard-cache-meta';

interface CacheMetadata {
  lastSyncedAt: number;
  syncedUserId: string;
  version: number;
}

/**
 * 获取当前登录用户 ID
 */
function getCurrentUserId(): string | null {
  const { user } = useAuthStore.getState();
  return user?.id || null;
}

/**
 * 获取缓存元数据
 */
export function getCacheMetadata(): CacheMetadata | null {
  try {
    const meta = localStorage.getItem(CACHE_META_KEY);
    if (!meta) return null;
    return JSON.parse(meta);
  } catch {
    return null;
  }
}

/**
 * 设置缓存元数据
 */
export function setCacheMetadata(metadata: CacheMetadata): void {
  try {
    localStorage.setItem(CACHE_META_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error('保存缓存元数据失败:', error);
  }
}

/**
 * 更新最后同步时间
 */
export function updateLastSynced(userId: string): void {
  const metadata: CacheMetadata = {
    lastSyncedAt: Date.now(),
    syncedUserId: userId,
    version: 1,
  };
  setCacheMetadata(metadata);
}

/**
 * 检查缓存是否有效
 * - 检查是否有缓存元数据
 * - 检查用户是否一致
 * - 检查是否过期
 */
export function isCacheValid(): boolean {
  const metadata = getCacheMetadata();
  if (!metadata) return false;

  // 检查用户是否一致
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return false;
  if (metadata.syncedUserId !== currentUserId) return false;

  // 检查是否过期
  const now = Date.now();
  const elapsed = now - metadata.lastSyncedAt;
  return elapsed < CACHE_TTL;
}

/**
 * 获取缓存剩余有效时间（毫秒）
 * 返回 0 表示已过期
 */
export function getCacheRemainingTime(): number {
  const metadata = getCacheMetadata();
  if (!metadata) return 0;

  const currentUserId = getCurrentUserId();
  if (!currentUserId || metadata.syncedUserId !== currentUserId) return 0;

  const now = Date.now();
  const elapsed = now - metadata.lastSyncedAt;
  const remaining = CACHE_TTL - elapsed;
  
  return remaining > 0 ? remaining : 0;
}

/**
 * 清空缓存（用户切换时调用）
 */
export function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_META_KEY);
    // 注意：不清除 workspaces 数据，因为可能离线时需要
    // 只清除元数据，下次会触发重新同步
  } catch (error) {
    console.error('清除缓存失败:', error);
  }
}

/**
 * 强制使缓存失效
 */
export function invalidateCache(): void {
  const metadata = getCacheMetadata();
  if (metadata) {
    setCacheMetadata({
      ...metadata,
      lastSyncedAt: 0, // 设为 0 表示已过期
    });
  }
}

/**
 * 检查是否需要同步
 * - 缓存不存在
 * - 缓存已过期
 * - 用户变更
 */
export function shouldSync(): boolean {
  return !isCacheValid();
}

/**
 * 格式化缓存状态（用于调试）
 */
export function getCacheStatus(): {
  valid: boolean;
  syncedUserId: string | null;
  lastSyncedAt: number | null;
  remainingTime: number;
  currentUserId: string | null;
} {
  const metadata = getCacheMetadata();
  const currentUserId = getCurrentUserId();
  
  return {
    valid: isCacheValid(),
    syncedUserId: metadata?.syncedUserId || null,
    lastSyncedAt: metadata?.lastSyncedAt || null,
    remainingTime: getCacheRemainingTime(),
    currentUserId,
  };
}
