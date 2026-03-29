import React, { useState } from 'react';
import { DownOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Dropdown, Button, Modal, Form, Input, List, Popconfirm, message } from 'antd';
import { useDashboardStore } from '../../store/dashboardStore';
import type { Workspace } from '../../types';

const WorkspaceSelector: React.FC = () => {
  const {
    workspaces,
    currentWorkspaceId,
    setCurrentWorkspace,
    addWorkspace,
    updateWorkspace,
    removeWorkspace,
    theme,
  } = useDashboardStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [form] = Form.useForm();

  const currentWorkspace = workspaces.find((ws) => ws.id === currentWorkspaceId);

  const handleCreate = () => {
    form.validateFields().then((values) => {
      const newWorkspace: Workspace = {
        id: `ws-${Date.now()}`,
        name: values.name,
        description: values.description,
        charts: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addWorkspace(newWorkspace);
      setCurrentWorkspace(newWorkspace.id);
      setIsModalOpen(false);
      form.resetFields();
      message.success('工作区创建成功');
    });
  };

  const handleEdit = () => {
    if (!editingWorkspace) return;
    form.validateFields().then((values) => {
      updateWorkspace(editingWorkspace.id, {
        name: values.name,
        description: values.description,
      });
      setIsModalOpen(false);
      setEditingWorkspace(null);
      setIsEditMode(false);
      form.resetFields();
      message.success('工作区更新成功');
    });
  };

  const handleDelete = (workspace: Workspace) => {
    if (workspace.isDefault) {
      message.error('默认工作区不能删除');
      return;
    }
    removeWorkspace(workspace.id);
    message.success('工作区删除成功');
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingWorkspace(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (workspace: Workspace, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true);
    setEditingWorkspace(workspace);
    form.setFieldsValue({
      name: workspace.name,
      description: workspace.description,
    });
    setIsModalOpen(true);
  };

  const workspaceItems = [
    {
      key: 'workspaces',
      label: (
        <div className="w-64">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="font-medium">工作区</span>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              新建
            </Button>
          </div>
          <List
            dataSource={workspaces}
            renderItem={(workspace) => (
              <List.Item
                className={`cursor-pointer px-3 py-2 hover:bg-neutral-100 dark:hover:bg-[#3d3d3f] transition-colors ${
                  workspace.id === currentWorkspaceId ? 'bg-primary-50 dark:bg-[#1e3a5f]' : ''
                }`}
                onClick={() => {
                  setCurrentWorkspace(workspace.id);
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{workspace.name}</div>
                  {workspace.description && (
                    <div className="text-xs text-text-secondary truncate">
                      {workspace.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => openEditModal(workspace, e)}
                  />
                  {!workspace.isDefault && (
                    <Popconfirm
                      title="删除工作区"
                      description="确定要删除这个工作区吗？"
                      onConfirm={() => handleDelete(workspace)}
                      okText="删除"
                      cancelText="取消"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  )}
                </div>
              </List.Item>
            )}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Dropdown menu={{ items: workspaceItems }} placement="bottomLeft" trigger={['click']}>
        <Button
          type="text"
          className={theme === 'dark' ? 'text-white' : 'text-text-primary'}
        >
          {currentWorkspace?.name || '选择工作区'}
          <DownOutlined className="ml-1 text-xs" />
        </Button>
      </Dropdown>

      <Modal
        title={isEditMode ? '编辑工作区' : '新建工作区'}
        open={isModalOpen}
        onOk={isEditMode ? handleEdit : handleCreate}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingWorkspace(null);
          setIsEditMode(false);
          form.resetFields();
        }}
        okText={isEditMode ? '保存' : '创建'}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入工作区名称' }]}
          >
            <Input placeholder="例如：销售周报" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea
              rows={2}
              placeholder="工作区描述（可选）"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default WorkspaceSelector;
