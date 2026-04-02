import type { UserRole, UserStatus } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  username?: string;
}

export interface UpdateUserData {
  email?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UserListItem {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsersResponse {
  total: number;
  page: number;
  pageSize: number;
  list: UserListItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
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
 * 管理员服务
 * 提供用户管理相关 API 调用
 */
export const adminService = {
  /**
   * 获取用户列表（分页）
   * @param params - 查询参数
   */
  async getUsers(params: GetUsersParams = {}): Promise<ApiResponse<PaginatedUsersResponse>> {
    const { page = 1, pageSize = 10, username } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('pageSize', pageSize.toString());
    if (username) {
      queryParams.append('username', username);
    }

    const response = await fetch(`${API_BASE_URL}/admin/users?${queryParams.toString()}`, {
      method: 'GET',
      headers: buildHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `请求失败: ${response.status}`);
    }

    return data;
  },

  /**
   * 更新用户信息
   * @param userId - 用户 ID
   * @param data - 更新数据
   */
  async updateUser(userId: string, data: UpdateUserData): Promise<ApiResponse<UserListItem>> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || `请求失败: ${response.status}`);
    }

    return result;
  },

  /**
   * 删除用户
   * @param userId - 用户 ID
   */
  async deleteUser(userId: string): Promise<ApiResponse<null>> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `请求失败: ${response.status}`);
    }

    return data;
  },
};

export default adminService;
