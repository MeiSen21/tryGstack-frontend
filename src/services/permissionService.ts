// 权限服务
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// 获取存储的 token
const getToken = () => localStorage.getItem('token');

// API 响应类型
interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

// 权限 Schema 类型
export interface PermissionSchema {
  menus: Array<{
    key: string;
    label: string;
    description: string;
  }>;
  features: Array<{
    component: string;
    label: string;
    actions: Array<{
      key: string;
      label: string;
      description: string;
    }>;
  }>;
}

// 通用请求封装
async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const response = await fetch(`${API_BASE_URL}/permissions${url}`, {
      ...options,
      headers,
    });

    // 检查 HTTP 错误状态
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        data: null as T,
        error: {
          code: `HTTP_${response.status}`,
          message: errorText || `请求失败: ${response.status} ${response.statusText}`,
        },
      };
    }

    return await response.json();
  } catch (networkError) {
    // 网络错误处理
    return {
      success: false,
      data: null as T,
      error: {
        code: 'NETWORK_ERROR',
        message: networkError instanceof Error ? networkError.message : '网络请求失败',
      },
    };
  }
}

/**
 * 权限服务
 */
export const permissionService = {
  /**
   * 获取权限配置 Schema
   */
  async getPermissionsSchema(): Promise<ApiResponse<PermissionSchema>> {
    return request<PermissionSchema>('/schema');
  },

  /**
   * 获取用户权限配置
   */
  async getUserPermissions(userId: string): Promise<ApiResponse<any>> {
    return request<any>(`/${userId}`);
  },

  /**
   * 更新用户权限配置
   */
  async updateUserPermissions(
    userId: string,
    permissions: any
  ): Promise<ApiResponse<any>> {
    return request<any>(`/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  },

  /**
   * 重置用户权限为默认值
   */
  async resetUserPermissions(userId: string): Promise<ApiResponse<any>> {
    return request<any>(`/${userId}/reset`, {
      method: 'POST',
    });
  },
};

export default permissionService;
