/**
 * 图表类型
 */
export type ChartType = 'line' | 'bar' | 'pie';

/**
 * 指标配置
 */
export interface MetricConfig {
  field: string;
  name: string;
  aggregation?: 'sum' | 'count' | 'avg';
}

/**
 * 图表配置（AI生成）
 */
export interface ChartConfig {
  type: ChartType;
  title: string;
  dimensions: string[];
  metrics: MetricConfig[];
  timeRange?: '7d' | '30d' | 'this_month' | '1y';
}

/**
 * 数据点
 */
export type DataPoint = Record<string, string | number>;

/**
 * 网格位置
 */
export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 图表项（完整）
 */
export interface ChartItem {
  id: string;
  type: ChartType;
  title: string;
  data: DataPoint[];
  config: ChartConfig;
  position: GridPosition;
  createdAt: number;
  sql: string;
}

/**
 * AI响应
 */
export interface AIResponse {
  config: ChartConfig;
  sql: string;
}

/**
 * 看板状态
 */
export interface DashboardState {
  charts: ChartItem[];
  theme: 'light' | 'dark';
}

/**
 * Workspace
 */
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  charts: ChartItem[];
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}
