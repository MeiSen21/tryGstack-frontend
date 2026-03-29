import React, { useState, type KeyboardEvent } from 'react';
import { SendOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Tooltip, Alert } from 'antd';
import { useDashboardStore } from '../../store/dashboardStore';
import { useAI } from '../../hooks/useAI';

interface InputAreaProps {
  onSubmit?: (input: string) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSubmit }) => {
  const [input, setInput] = useState('');
  const { theme, error } = useDashboardStore();
  const { isLoading, generateChart } = useAI();

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const trimmedInput = input.trim();
    setInput('');

    if (onSubmit) {
      onSubmit(trimmedInput);
    } else {
      await generateChart(trimmedInput);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const examplePrompts = [
    '最近7天销售额趋势',
    '各品类订单量对比',
    '用户来源占比分析',
    '各地区销售额排名',
  ];

  return (
    <div className={`input-area-container py-6 px-4 ${theme === 'dark' ? 'bg-[#1d1d1f]' : 'bg-background'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <div className="text-center mb-6">
          <h2
            className={`text-xl font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-text-primary'
            }`}
          >
            告诉我你想要什么图表
          </h2>
          <p className={theme === 'dark' ? 'text-[#a1a1a6]' : 'text-text-secondary'}>
            用自然语言描述你的数据需求，AI 会自动生成图表
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            className="mb-4"
            onClose={() => useDashboardStore.getState().setError(null)}
          />
        )}

        {/* Input Container */}
        <div
          className={`rounded-xl border shadow-sm transition-all duration-200 ${
            theme === 'dark'
              ? 'bg-[#2d2d2f] border-[#3d3d3f] focus-within:border-primary'
              : 'bg-white border-border focus-within:border-primary focus-within:shadow-md'
          }`}
        >
          <textarea
            className={`ai-input w-full p-4 bg-transparent border-none outline-none resize-none text-base ${
              theme === 'dark' ? 'text-white placeholder-[#6e6e73]' : 'text-text-primary placeholder-text-tertiary'
            }`}
            rows={3}
            placeholder="例如：最近7天的销售额趋势..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="text-xs text-text-tertiary">
              按 Enter 发送，Shift + Enter 换行
            </div>
            <Tooltip title="发送">
              <Button
                type="primary"
                icon={isLoading ? <LoadingOutlined /> : <SendOutlined />}
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                loading={isLoading}
              >
                {isLoading ? '生成中...' : '生成图表'}
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Example Prompts */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <span className={`text-sm ${theme === 'dark' ? 'text-[#a1a1a6]' : 'text-text-secondary'}`}>
            试试：
          </span>
          {examplePrompts.map((prompt) => (
            <button
              key={prompt}
              className={`text-sm px-3 py-1 rounded-full transition-colors ${
                theme === 'dark'
                  ? 'bg-[#3d3d3f] text-[#a1a1a6] hover:bg-[#4d4d4f]'
                  : 'bg-white text-text-secondary hover:bg-neutral-200 border border-border'
              }`}
              onClick={() => setInput(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InputArea;
