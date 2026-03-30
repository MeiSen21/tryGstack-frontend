import { useState, useCallback, useEffect } from 'react';
import { ReloadOutlined } from '@ant-design/icons';

interface CaptchaProps {
  onCaptchaLoaded?: (captchaId: string) => void;
}

export function Captcha({ onCaptchaLoaded }: CaptchaProps) {
  const [captchaId, setCaptchaId] = useState<string>('');
  const [svg, setSvg] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  const isDev = import.meta.env.DEV;

  const fetchCaptcha = useCallback(async (oldCaptchaId?: string) => {
    setLoading(true);
    try {
      const url = oldCaptchaId 
        ? `${API_BASE_URL}/auth/captcha/refresh?captchaId=${oldCaptchaId}`
        : `${API_BASE_URL}/auth/captcha`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setCaptchaId(data.data.captchaId);
        setSvg(data.data.svg);
        // 开发模式下保存验证码内容用于测试
        if (isDev && data.data.code) {
          setCode(data.data.code);
        }
        onCaptchaLoaded?.(data.data.captchaId);
      }
    } catch (error) {
      console.error('获取验证码失败:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, onCaptchaLoaded, isDev]);

  // 初始加载
  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleRefresh = () => {
    fetchCaptcha(captchaId);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col">
        <div 
          className="h-10 w-28 rounded border border-gray-300 bg-white cursor-pointer overflow-hidden"
          onClick={handleRefresh}
          title="点击刷新验证码"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        {/* 开发模式下显示验证码文字，方便测试 */}
        {isDev && code && (
          <div className="text-xs text-gray-500 mt-1 text-center font-mono">
            测试: {code}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={loading}
        className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
        title="刷新验证码"
      >
        <ReloadOutlined className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}

export default Captcha;
