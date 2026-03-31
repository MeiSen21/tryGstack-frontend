import { useState } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { Captcha } from '../../components/Captcha';
import { useAuthStore } from '../../store/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [captchaId, setCaptchaId] = useState('');
  const [form] = Form.useForm();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

  const handleCaptchaLoaded = (id: string) => {
    setCaptchaId(id);
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
          captchaId: captchaId,
          captchaCode: values.captchaCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('登录成功！');
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        setAuth(data.data.token, data.data.user);
        navigate('/', { replace: true });
      } else {
        message.error(data.error?.message || '登录失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md shadow-2xl dark:bg-gray-800 dark:border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            AI Dashboard Builder
          </h1>
          <p className="text-gray-500 dark:text-gray-400">智能数据可视化平台</p>
        </div>

        <Form form={form} layout="vertical" onFinish={handleLogin}>
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
              <Captcha onCaptchaLoaded={handleCaptchaLoaded} />
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

          <div className="text-center">
            <span className="text-gray-500 dark:text-gray-400">还没有账号？</span>
            <Link to="/register" className="ml-1 text-blue-500 hover:text-blue-600">
              立即注册
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default LoginPage;
