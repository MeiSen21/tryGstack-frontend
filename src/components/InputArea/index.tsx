import React, { useState, type KeyboardEvent } from 'react';
import { SendOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Tooltip, Alert, Modal, Input, Space, Tag, Typography, Card, Flex } from 'antd';
import { useDashboardStore } from '../../store/dashboardStore';
import { useAIRecommendations } from '../../hooks/useAIRecommendations';
import { usePermission } from '../../hooks/usePermission';
import { RecommendationPanel } from '../RecommendationPanel';

const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;

interface InputAreaProps {
  onSubmit?: (input: string) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSubmit }) => {
  const [input, setInput] = useState('');
  const { theme, error } = useDashboardStore();
  const { canView, isDisabled } = usePermission();
  const { 
    isLoading, 
    showPanel, 
    currentInput,
    recommendations,
    getRecommendations, 
    selectRecommendation, 
    closePanel 
  } = useAIRecommendations();
  
  // 权限检查
  const canGetRecommendation = canView('chartCreate', 'getRecommendation');
  const isGetRecommendationDisabled = isDisabled('chartCreate', 'getRecommendation');

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const trimmedInput = input.trim();
    setInput('');

    if (onSubmit) {
      onSubmit(trimmedInput);
    } else {
      await getRecommendations(trimmedInput);
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
    <>
      <div 
        className="input-area-container py-6 px-4"
        style={{ background: theme === 'dark' ? '#1d1d1f' : '#f5f5f5' }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Title - 使用 antd Typography */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title 
              level={4} 
              style={{ 
                marginBottom: 8,
                color: theme === 'dark' ? '#fff' : '#262626'
              }}
            >
              告诉我你想要什么图表
            </Title>
            <Paragraph 
              type="secondary"
              style={{ 
                margin: 0,
                color: theme === 'dark' ? '#a6a6a6' : '#595959'
              }}
            >
              用自然语言描述你的数据需求，AI 会推荐最佳可视化方案
            </Paragraph>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: 16 }}
              onClose={() => useDashboardStore.getState().setError(null)}
            />
          )}

          {/* Input Container - 使用 antd Card */}
          <Card
            variant="outlined"
            style={{
              borderRadius: 12,
              boxShadow: theme === 'dark' 
                ? '0 2px 8px rgba(0,0,0,0.3)' 
                : '0 2px 8px rgba(0,0,0,0.08)',
              background: theme === 'dark' ? '#2d2d2f' : '#fff',
              borderColor: theme === 'dark' ? '#434343' : '#e8e8e8',
            }}
            styles={{ body: { padding: 0 } }}
          >
            <TextArea
              className="ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="例如：最近7天的销售额趋势..."
              autoSize={{ minRows: 3, maxRows: 5 }}
              disabled={isLoading}
              style={{
                border: 'none',
                borderRadius: '12px 12px 0 0',
                background: 'transparent',
                color: theme === 'dark' ? '#fff' : '#262626',
                fontSize: 15,
                resize: 'none',
                padding: '16px 20px',
              }}
            />
            <Flex 
              justify="space-between" 
              align="center"
              style={{ 
                padding: '12px 20px',
                borderTop: `1px solid ${theme === 'dark' ? '#434343' : '#f0f0f0'}`,
              }}
            >
              <Text 
                type="secondary" 
                style={{ fontSize: 12 }}
              >
                按 Enter 发送，Shift + Enter 换行
              </Text>
              {canGetRecommendation && (
                <Tooltip title={isGetRecommendationDisabled ? '无权限使用此功能' : '发送'}>
                  <Button
                    type="primary"
                    icon={isLoading ? <LoadingOutlined /> : <SendOutlined />}
                    onClick={handleSubmit}
                    disabled={!input.trim() || isLoading || isGetRecommendationDisabled}
                    loading={isLoading}
                    style={isGetRecommendationDisabled ? { opacity: 0.5 } : {}}
                  >
                    {isLoading ? '分析中...' : '获取推荐'}
                  </Button>
                </Tooltip>
              )}
            </Flex>
          </Card>

          {/* Example Prompts - 使用 antd Space + Tag */}
          <Space 
            size="small" 
            wrap 
            style={{ 
              marginTop: 16, 
              justifyContent: 'center',
              width: '100%'
            }}
          >
            <Text 
              type="secondary"
              style={{ fontSize: 13 }}
            >
              试试：
            </Text>
            {examplePrompts.map((prompt) => (
              <Tag
                key={prompt}
                style={{
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  padding: '4px 12px',
                  borderRadius: 16,
                  background: theme === 'dark' ? '#2b2b2b' : '#f5f5f5',
                  borderColor: theme === 'dark' ? '#434343' : '#d9d9d9',
                  color: theme === 'dark' ? '#d9d9d9' : '#595959',
                  opacity: isLoading ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
                onClick={() => !isLoading && setInput(prompt)}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.borderColor = '#1677ff';
                    e.currentTarget.style.color = '#1677ff';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme === 'dark' ? '#434343' : '#d9d9d9';
                  e.currentTarget.style.color = theme === 'dark' ? '#d9d9d9' : '#595959';
                }}
              >
                {prompt}
              </Tag>
            ))}
          </Space>
        </div>
      </div>

      {/* Recommendation Panel Modal */}
      <Modal
        open={showPanel}
        onCancel={closePanel}
        footer={null}
        width={720}
        centered
        destroyOnClose
        className="recommendation-modal"
        styles={{
          body: { padding: 0 }
        }}
      >
        <RecommendationPanel
          input={currentInput}
          recommendations={recommendations}
          onSelect={selectRecommendation}
          onCancel={closePanel}
        />
      </Modal>
    </>
  );
};

export default InputArea;
