/**
 * Workspace API Service
 * 封装后端工作区相关 API 调用
 */

import type { Workspace, WorkspaceConfig } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface SyncResult {
  success: boolean;
  workspace?: Workspace;
  error?: string;
}

export interface FetchResult {
  success: boolean;
  workspaces?: Workspace[];
  error?: string;
}

/**
 * 获取 JWT Token
 */
function getToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * 构建请求头
 */
function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * 转换后端 Workspace 格式到前端格式
 */
function transformWorkspace(backendWs: any): Workspace {
  return {
    id: backendWs.id,
    name: backendWs.name,
    description: backendWs.description || undefined,
    charts: backendWs.config?.charts || [],
    isDefault: backendWs.isDefault,
    createdAt: new Date(backendWs.createdAt).getTime(),
    updatedAt: new Date(backendWs.updatedAt).getTime(),
  };
}

export const workspaceApi = {
  /**
   * 获取用户所有工作区
   * GET /api/workspaces
   */
  async fetchAll(): Promise<FetchResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/workspaces`, {
        method: 'GET',
        headers: buildHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || `请求失败: ${response.status}`,
        };
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error?.message || '获取工作区失败',
        };
      }

      // 转换后端格式到前端格式
      const workspaces = (data.data || []).map(transformWorkspace);

      return {
        success: true,
        workspaces,
      };
    } catch (error) {
      console.error('获取工作区失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  },

  /**
   * 获取单个工作区
   * GET /api/workspaces/:id
   */
  async fetchById(id: string): Promise<FetchResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
        method: 'GET',
        headers: buildHeaders(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error?.message || `请求失败: ${response.status}`,
        };
      }

      const workspace = transformWorkspace(data.data);

      return {
        success: true,
        workspaces: [workspace],
      };
    } catch (error) {
      console.error('获取工作区失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  },

  /**
   * 同步工作区配置
   * PUT /api/workspaces/:id
   */
  async syncConfig(
    id: string,
    config: WorkspaceConfig
  ): Promise<SyncResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify({ config }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error?.message || `同步失败: ${response.status}`,
        };
      }

      const workspace = transformWorkspace(data.data);

      return {
        success: true,
        workspace,
      };
    } catch (error) {
      console.error('同步工作区失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  },

  /**
   * 创建工作区
   * POST /api/workspaces
   */
  async create(
    name: string,
    description?: string,
    config?: WorkspaceConfig
  ): Promise<SyncResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/workspaces`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          name,
          description,
          config: config || { charts: [], layout: [], theme: 'light' },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error?.message || `创建失败: ${response.status}`,
        };
      }

      const workspace = transformWorkspace(data.data);

      return {
        success: true,
        workspace,
      };
    } catch (error) {
      console.error('创建工作区失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  },

  /**
   * 更新工作区（名称、描述等）
   * PUT /api/workspaces/:id
   */
  async update(
    id: string,
    updates: { name?: string; description?: string; isDefault?: boolean }
  ): Promise<SyncResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error?.message || `更新失败: ${response.status}`,
        };
      }

      const workspace = transformWorkspace(data.data);

      return {
        success: true,
        workspace,
      };
    } catch (error) {
      console.error('更新工作区失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  },

  /**
   * 删除工作区
   * DELETE /api/workspaces/:id
   */
  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
        method: 'DELETE',
        headers: buildHeaders(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error?.message || `删除失败: ${response.status}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('删除工作区失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  },
};

export default workspaceApi;
