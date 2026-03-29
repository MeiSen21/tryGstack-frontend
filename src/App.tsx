import { useEffect, useState } from 'react';
import { ConfigProvider, theme as antdTheme, Modal, message } from 'antd';
import { useDashboardStore } from './store/dashboardStore';
import { parseShareLink } from './services/aiService';
import Header from './components/Header';
import InputArea from './components/InputArea';
import Dashboard from './components/Dashboard';
import { generateShareLink } from './services/aiService';
import './index.css';

const { defaultAlgorithm, darkAlgorithm } = antdTheme;

function App() {
  const { theme, charts, addChart, clearAll } = useDashboardStore();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');

  // Check for shared link on mount
  useEffect(() => {
    const search = window.location.search;
    if (search) {
      const sharedCharts = parseShareLink(search);
      if (sharedCharts && sharedCharts.length > 0) {
        // Clear current charts and load shared ones
        clearAll();
        sharedCharts.forEach((chart) => {
          addChart(chart);
        });
        message.success('已加载分享的看板');
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.backgroundColor = theme === 'dark' ? '#1d1d1f' : '#f5f5f7';
  }, [theme]);

  const handleShare = () => {
    const link = generateShareLink(charts);
    setShareLink(link);
    setIsShareModalOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      message.success('链接已复制到剪贴板');
    } catch (err) {
      message.error('复制失败');
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? darkAlgorithm : defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          colorBgContainer: theme === 'dark' ? '#2d2d2f' : '#ffffff',
          colorBgElevated: theme === 'dark' ? '#2d2d2f' : '#ffffff',
          colorText: theme === 'dark' ? '#ffffff' : '#1d1d1f',
          colorTextSecondary: theme === 'dark' ? '#a1a1a6' : '#86868b',
          colorBorder: theme === 'dark' ? '#3d3d3f' : '#e5e5e7',
        },
      }}
    >
      <div
        className={`min-h-screen flex flex-col ${
          theme === 'dark' ? 'bg-[#1d1d1f]' : 'bg-background'
        }`}
      >
        <Header onShare={handleShare} />
        <InputArea />
        <Dashboard />

        {/* Share Modal */}
        <Modal
          title="分享看板"
          open={isShareModalOpen}
          onCancel={() => setIsShareModalOpen(false)}
          footer={[
            <button
              key="copy"
              onClick={handleCopyLink}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              复制链接
            </button>,
          ]}
        >
          <div className="mt-4">
            <p className={`mb-2 ${theme === 'dark' ? 'text-[#a1a1a6]' : 'text-text-secondary'}`}>
              复制下方链接分享给他人：
            </p>
            <div
              className={`p-3 rounded-lg break-all text-sm ${
                theme === 'dark'
                  ? 'bg-[#2d2d2f] text-[#a1a1a6]'
                  : 'bg-neutral-100 text-text-secondary'
              }`}
            >
              {shareLink}
            </div>
          </div>
        </Modal>
      </div>
    </ConfigProvider>
  );
}

export default App;
