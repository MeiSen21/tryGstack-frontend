import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Switch,
  Radio,
  Space,
  Typography,
  Divider,
  Button,
  message,
  Spin,
  Alert,
} from 'antd';
import {
  SafetyOutlined,
  MenuOutlined,
  ToolOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useDashboardStore } from '../../store/dashboardStore';
import { useAuthStore } from '../../store/authStore';
import { permissionService } from '../../services/permissionService';
import { usePermissionStore, defaultPermissions, adminPermissions } from '../../store/permissionStore';
import type { UserPermissions } from '../../store/permissionStore';

// 权限级别类型
type PermissionLevel = 'visible' | 'hidden' | 'disabled';

const { Title, Text } = Typography;
const { Group: RadioGroup } = Radio;

interface UserPermissionDrawerProps {
  userId: string;
  userEmail: string;
  userRole: 'admin' | 'user';
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// 权限 Schema 类型
interface PermissionSchema {
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

export const UserPermissionDrawer: React.FC<UserPermissionDrawerProps> = ({
  userId,
  userEmail,
  userRole,
  open,
  onClose,
  onSuccess,
}) => {
  const { theme } = useDashboardStore();
  const { user: currentUser } = useAuthStore();
  const setStorePermissions = usePermissionStore((state) => state.setPermissions);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schema, setSchema] = useState<PermissionSchema | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>(
    userRole === 'admin' ? adminPermissions : defaultPermissions
  );
  const [hasCustomPermissions, setHasCustomPermissions] = useState(false);

  // 加载权限配置
  useEffect(() => {
    if (open && userId) {
      loadPermissions();
    }
  }, [open, userId]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      // 并行加载 schema 和用户权限
      const [schemaRes, userPermsRes] = await Promise.all([
        permissionService.getPermissionsSchema(),
        permissionService.getUserPermissions(userId),
      ]);

      if (schemaRes.success) {
        setSchema(schemaRes.data);
      }

      if (userPermsRes.success) {
        setPermissions(userPermsRes.data);
        setHasCustomPermissions(true);
      }
    } catch (error) {
      message.error('加载权限配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存权限配置
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await permissionService.updateUserPermissions(userId, permissions);
      if (res.success) {
        message.success('权限配置已保存');
        setHasCustomPermissions(true);
        
        // 如果修改的是当前登录用户，实时更新权限状态
        if (currentUser?.id === userId) {
          setStorePermissions(permissions);
          message.info('您的权限已更新，已实时生效');
        }
        
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      message.error('保存权限配置失败');
    } finally {
      setSaving(false);
    }
  };

  // 重置为默认权限
  const handleReset = async () => {
    try {
      const res = await permissionService.resetUserPermissions(userId);
      if (res.success) {
        setPermissions(res.data);
        setHasCustomPermissions(false);
        
        // 如果重置的是当前登录用户，实时更新权限状态
        if (currentUser?.id === userId) {
          setStorePermissions(res.data);
          message.info('您的权限已重置为默认，已实时生效');
        }
        
        message.success('已重置为默认权限');
      }
    } catch (error) {
      message.error('重置权限失败');
    }
  };

  // 更新菜单权限
  const updateMenuPermission = (key: string, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      menus: {
        ...prev.menus,
        [key]: value,
      },
    }));
  };

  // 更新功能权限
  const updateFeaturePermission = (
    component: string,
    action: string,
    value: PermissionLevel
  ) => {
    setPermissions((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [component]: {
          ...prev.features[component as keyof typeof prev.features],
          [action]: value,
        },
      },
    }));
  };

  // 权限级别选项
  const levelOptions = [
    { label: '可见', value: 'visible' },
    { label: '隐藏', value: 'hidden' },
    { label: '禁用', value: 'disabled' },
  ];

  const isDark = theme === 'dark';

  return (
    <Drawer
      title={
        <Space>
          <SafetyOutlined style={{ color: '#1677ff' }} />
          <span>权限配置</span>
        </Space>
      }
      width={520}
      open={open}
      onClose={onClose}
      styles={{
        body: {
          background: isDark ? '#141414' : '#f5f5f5',
          padding: '16px 24px',
        },
        header: {
          background: isDark ? '#1f1f1f' : '#fff',
          borderBottom: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
        },
      }}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>取消</Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
            disabled={!hasCustomPermissions}
          >
            重置默认
          </Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            保存
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        {/* 用户信息 */}
        <div
          style={{
            padding: 16,
            background: isDark ? '#1f1f1f' : '#fff',
            borderRadius: 8,
            marginBottom: 16,
            border: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
          }}
        >
          <Text type="secondary">用户：</Text>
          <Text strong>{userEmail}</Text>
          <br />
          <Text type="secondary">角色：</Text>
          <Text>{userRole === 'admin' ? '管理员' : '普通用户'}</Text>
        </div>

        {hasCustomPermissions && (
          <Alert
            message="该用户已配置自定义权限"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 菜单权限 */}
        <div
          style={{
            padding: 16,
            background: isDark ? '#1f1f1f' : '#fff',
            borderRadius: 8,
            marginBottom: 16,
            border: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
          }}
        >
          <Space style={{ marginBottom: 16 }}>
            <MenuOutlined style={{ color: '#1677ff' }} />
            <Title level={5} style={{ margin: 0 }}>
              菜单权限
            </Title>
          </Space>

          <Space direction="vertical" style={{ width: '100%' }}>
            {schema?.menus.map((menu) => (
              <div
                key={menu.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
                }}
              >
                <div>
                  <Text strong>{menu.label}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {menu.description}
                  </Text>
                </div>
                <Switch
                  checked={permissions.menus[menu.key as keyof typeof permissions.menus]}
                  onChange={(checked) => updateMenuPermission(menu.key, checked)}
                  disabled={menu.key === 'userManagement' && userRole !== 'admin'}
                />
              </div>
            ))}
          </Space>
        </div>

        {/* 功能权限 */}
        <div
          style={{
            padding: 16,
            background: isDark ? '#1f1f1f' : '#fff',
            borderRadius: 8,
            border: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
          }}
        >
          <Space style={{ marginBottom: 16 }}>
            <ToolOutlined style={{ color: '#1677ff' }} />
            <Title level={5} style={{ margin: 0 }}>
              功能权限
            </Title>
          </Space>

          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {schema?.features.map((feature) => (
              <div key={feature.component}>
                <Text strong style={{ fontSize: 14 }}>
                  {feature.label}
                </Text>
                <Divider style={{ margin: '8px 0' }} />
                <Space direction="vertical" style={{ width: '100%' }}>
                  {feature.actions.map((action) => (
                    <div
                      key={`${feature.component}-${action.key}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                      }}
                    >
                      <div>
                        <Text>{action.label}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {action.description}
                        </Text>
                      </div>
                      <RadioGroup
                        options={levelOptions}
                        value={
                          permissions.features[
                            feature.component as keyof typeof permissions.features
                          ]?.[action.key as any] as PermissionLevel
                        }
                        onChange={(e) =>
                          updateFeaturePermission(
                            feature.component,
                            action.key,
                            e.target.value as PermissionLevel
                          )
                        }
                        optionType="button"
                        buttonStyle="solid"
                        size="small"
                      />
                    </div>
                  ))}
                </Space>
              </div>
            ))}
          </Space>
        </div>
      </Spin>
    </Drawer>
  );
};

export default UserPermissionDrawer;
