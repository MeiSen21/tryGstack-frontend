import { useState } from 'react';
import { Modal, Form, Input, Button, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { Captcha } from '../Captcha';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, user: any) => void;
}

export function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [loginCaptchaId, setLoginCaptchaId] = useState('');
  const [registerCaptchaId, setRegisterCaptchaId] = useState('');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

  const handleLoginCaptchaLoaded = (id: string) => {
    setLoginCaptchaId(id);
  };

  const handleRegisterCaptchaLoaded = (id: string) => {
    setRegisterCaptchaId(id);
  };

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          captchaId: loginCaptchaId,
          captchaCode: values.captchaCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('登录成功！');
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        onLoginSuccess(data.data.token, data.data.user);
        onClose();
        loginForm.resetFields();
      } else {
        message.error(data.error?.message || '登录失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          captchaId: registerCaptchaId,
          captchaCode: values.captchaCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('注册成功！请登录');
        setActiveTab('login');
        registerForm.resetFields();
      } else {
        message.error(data.error?.message || '注册失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const loginFormContent = (
    <Form form={loginForm} layout="vertical" onFinish={handleLogin}>
      <Form.Item
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '邮箱格式不正确' },
        ]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="邮箱"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="captchaCode"
        rules={[{ required: true, message: '请输入验证码' }]}
      >
        <div className="flex gap-2">
          <Input
            prefix={<SafetyOutlined />}
            placeholder="验证码"
            size="large"
            className="flex-1"
          />
          <Captcha onCaptchaLoaded={handleLoginCaptchaLoaded} />
        </div>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={loading}
        >
          登录
        </Button>
      </Form.Item>
    </Form>
  );

  const registerFormContent = (
    <Form form={registerForm} layout="vertical" onFinish={handleRegister}>
      <Form.Item
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '邮箱格式不正确' },
        ]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="邮箱"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6位' },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: '请确认密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致'));
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="确认密码"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="captchaCode"
        rules={[{ required: true, message: '请输入验证码' }]}
      >
        <div className="flex gap-2">
          <Input
            prefix={<SafetyOutlined />}
            placeholder="验证码"
            size="large"
            className="flex-1"
          />
          <Captcha onCaptchaLoaded={handleRegisterCaptchaLoaded} />
        </div>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={loading}
        >
          注册
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <Modal
      title={null}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={420}
      centered
    >
      <div className="py-4">
        <h2 className="text-2xl font-semibold text-center mb-6">
          AI Dashboard
        </h2>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            {
              key: 'login',
              label: '登录',
              children: loginFormContent,
            },
            {
              key: 'register',
              label: '注册',
              children: registerFormContent,
            },
          ]}
        />
      </div>
    </Modal>
  );
}

export default LoginModal;
