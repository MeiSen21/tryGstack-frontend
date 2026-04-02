import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  Tag,
  Typography,
  Tooltip,
  Popconfirm,
  message,
  Select,
  Flex,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useDashboardStore } from '../../store/dashboardStore';
import { useAuthStore } from '../../store/authStore';
import { adminService } from '../../services/adminService';
import type { User, UserRole, UserStatus } from '../../store/authStore';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface UserListItem {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  current: number;
  pageSize: number;
  total: number;
}

const UserManage: React.FC = () => {
  const { theme } = useDashboardStore();
  const { user: currentUser, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);

  // 检查权限，非管理员重定向
  useEffect(() => {
    if (!isAdmin()) {
      message.error('无权访问该页面');
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // 获取用户列表
  const fetchUsers = async (page = 1, pageSize = 10, username?: string) => {
    setLoading(true);
    try {
      const response = await adminService.getUsers({
        page,
        pageSize,
        username,
      });
      
      if (response.success) {
        setUsers(response.data.list);
        setPagination({
          current: response.data.page,
          pageSize: response.data.pageSize,
          total: response.data.total,
        });
      }
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    if (isAdmin()) {
      fetchUsers(pagination.current, pagination.pageSize);
    }
  }, []);

  // 搜索
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    fetchUsers(1, pagination.pageSize, value || undefined);
  };

  // 刷新
  const handleRefresh = () => {
    setSearchKeyword('');
    fetchUsers(1, pagination.pageSize);
  };

  // 页码变化
  const handlePageChange = (page: number, pageSize?: number) => {
    fetchUsers(page, pageSize || pagination.pageSize, searchKeyword || undefined);
  };

  // 更新用户角色
  const handleUpdateRole = async (userId: string, role: UserRole) => {
    try {
      const response = await adminService.updateUser(userId, { role });
      if (response.success) {
        message.success('角色更新成功');
        fetchUsers(pagination.current, pagination.pageSize, searchKeyword || undefined);
      }
    } catch (error) {
      message.error('角色更新失败');
    }
  };

  // 更新用户状态
  const handleUpdateStatus = async (userId: string, status: UserStatus) => {
    try {
      const response = await adminService.updateUser(userId, { status });
      if (response.success) {
        message.success(status === 'active' ? '用户已启用' : '用户已禁用');
        fetchUsers(pagination.current, pagination.pageSize, searchKeyword || undefined);
      }
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  // 删除用户
  const handleDelete = async (userId: string) => {
    // 不能删除自己
    if (userId === currentUser?.id) {
      message.error('不能删除自己的账户');
      return;
    }

    try {
      const response = await adminService.deleteUser(userId);
      if (response.success) {
        message.success('用户删除成功');
        fetchUsers(pagination.current, pagination.pageSize, searchKeyword || undefined);
      }
    } catch (error) {
      message.error('用户删除失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => <Text copyable>{email}</Text>,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: UserRole, record: UserListItem) => (
        <Select
          value={role}
          style={{ width: 100 }}
          onChange={(value) => handleUpdateRole(record.id, value)}
          disabled={record.id === currentUser?.id}
        >
          <Option value="user">普通用户</Option>
          <Option value="admin">管理员</Option>
        </Select>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: UserStatus) => (
        <Badge
          status={status === 'active' ? 'success' : 'error'}
          text={status === 'active' ? '正常' : '已禁用'}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: UserListItem) => (
        <Space size="small">
          {record.status === 'active' ? (
            <Tooltip title="禁用">
              <Button
                type="text"
                icon={<StopOutlined />}
                onClick={() => handleUpdateStatus(record.id, 'disabled')}
                disabled={record.id === currentUser?.id}
              />
            </Tooltip>
          ) : (
            <Tooltip title="启用">
              <Button
                type="text"
                icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                onClick={() => handleUpdateStatus(record.id, 'active')}
              />
            </Tooltip>
          )}
          
          <Popconfirm
            title="确认删除"
            description="删除后无法恢复，确定要删除该用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            disabled={record.id === currentUser?.id}
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={record.id === currentUser?.id}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: 24,
        minHeight: '100%',
        background: theme === 'dark' ? '#141414' : '#f5f5f5',
      }}
    >
      {/* 页面标题 */}
      <Card
        style={{
          marginBottom: 24,
          background: theme === 'dark' ? '#1f1f1f' : '#fff',
          borderColor: theme === 'dark' ? '#303030' : '#f0f0f0',
        }}
      >
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={12}>
            <TeamOutlined style={{ fontSize: 24, color: '#1677ff' }} />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                用户管理
              </Title>
              <Text type="secondary">
                管理系统用户，分配角色和权限
              </Text>
            </div>
          </Flex>
          
          <Space>
            <Search
              placeholder="搜索邮箱"
              allowClear
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            <Tooltip title="刷新">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
              />
            </Tooltip>
          </Space>
        </Flex>
      </Card>

      {/* 用户列表 */}
      <Card
        style={{
          background: theme === 'dark' ? '#1f1f1f' : '#fff',
          borderColor: theme === 'dark' ? '#303030' : '#f0f0f0',
        }}
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: handlePageChange,
          }}
          style={{
            background: 'transparent',
          }}
        />
      </Card>
    </div>
  );
};

export default UserManage;
