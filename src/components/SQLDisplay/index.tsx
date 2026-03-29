import React from 'react';
import { CodeOutlined, CopyOutlined, CheckOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

interface SQLDisplayProps {
  sql: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const SQLDisplay: React.FC<SQLDisplayProps> = ({ sql, isExpanded, onToggle }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className="mt-3 border rounded-lg overflow-hidden bg-[#fafafa] dark:bg-[#1d1d1f]">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-text-secondary hover:bg-neutral-200 dark:hover:bg-[#2d2d2f] transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <CodeOutlined />
          <span>查看生成的 SQL</span>
        </div>
        {isExpanded ? <UpOutlined className="text-xs" /> : <DownOutlined className="text-xs" />}
      </button>

      {/* SQL Content */}
      {isExpanded && (
        <div className="relative">
          <pre className="p-3 text-xs font-mono text-text-primary overflow-x-auto whitespace-pre-wrap break-all">
            {sql}
          </pre>
          <Tooltip title={copied ? '已复制' : '复制'}>
            <Button
              type="text"
              size="small"
              icon={copied ? <CheckOutlined className="text-success" /> : <CopyOutlined />}
              className="absolute top-2 right-2"
              onClick={handleCopy}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default SQLDisplay;
