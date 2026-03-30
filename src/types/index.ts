/**
 * 图表类型 - 电商业务场景
 */
export type ChartType =
  | 'line'      // 折线图 - 趋势分析
  | 'bar'       // 柱状图 - 对比排名
  | 'pie'       // 饼图 - 占比分布
  | 'scatter'   // 散点图 - 相关性分析
  | 'radar'     // 雷达图 - 多维度评估
  | 'funnel'    // 漏斗图 - 转化分析
  | 'gauge'     // 仪表盘 - 目标监控
  | 'heatmap';  // 热力图 - 时段/密度分析

/**
 * 数据集类型 - 电商业务
 */
export type DatasetType = 'sales' | 'users' | 'conversion';

/**
 * 维度类型 - 电商业务维度
 */
export type DimensionType =
  // 时间维度
  | 'date' | 'hour' | 'week' | 'month' | 'quarter' | 'weekday'
  // 地理维度
  | 'province' | 'city' | 'region'
  // 商品维度
  | 'category' | 'subcategory' | 'product' | 'brand'
  // 渠道维度
  | 'channel' | 'source'
  // 用户维度
  | 'userType' | 'ageGroup' | 'gender'
  // 转化维度
  | 'stage';

/**
 * 指标类型 - 电商业务指标
 */
export type MetricType =
  // 销售指标
  | 'sales' | 'orders' | 'quantity' | 'profit' | 'avgOrderValue' | 'discount'
  // 用户指标
  | 'newUsers' | 'activeUsers' | 'retentionRate' | 'conversionRate' | 'ltv'
  // 转化指标
  | 'users' | 'dropOffRate';

/**
 * 筛选条件
 */
export interface Filter {
  field: DimensionType | MetricType;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between';
  value: any;
}

/**
 * 指标配置
 */
export interface MetricConfig {
  field: MetricType;
  name: string;
  aggregation: 'sum' | 'avg' | 'count' | 'max' | 'min' | 'none';
  unit?: string;
}

/**
 * 数据转换配置
 * 定义如何从原始数据转换为图表数据
 */
export interface TransformConfig {
  /** X轴维度 */
  xDimension?: DimensionType;
  /** Y轴维度（热力图用） */
  yDimension?: DimensionType;
  /** 系列分组维度（多系列图表用） */
  seriesDimension?: DimensionType;
  /** 主要指标 */
  metric: MetricType;
  /** 聚合方式 */
  aggregation: 'sum' | 'avg' | 'count' | 'max' | 'min' | 'none';
  /** 排序依据 */
  sortBy?: 'value' | 'name';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 限制数量（Top N） */
  limit?: number;
}

/**
 * AI推荐配置
 */
export interface AIRecommendation {
  type: ChartType;
  title: string;
  reason: string[];      // 推荐理由（2-3点）
  confidence: number;    // 推荐置信度 0-100
  preview?: {
    dataset: DatasetType;
    description: string;
    estimatedRecords?: number;
  };
}

/**
 * 图表配置（AI生成）
 */
export interface ChartConfig {
  type: ChartType;
  title: string;
  /** 数据集 */
  dataset: DatasetType;
  /** 维度列表 */
  dimensions: DimensionType[];
  /** 指标列表 */
  metrics: MetricConfig[];
  /** 数据转换配置 */
  transform: TransformConfig;
  /** 筛选条件 */
  filters?: Filter[];
  /** 时间范围 */
  timeRange?: '7d' | '30d' | '90d' | '1y' | '1M';
  /** 视觉配置（可选） */
  visual?: {
    smooth?: boolean;        // 折线平滑
    showArea?: boolean;      // 显示面积
    showLabel?: boolean;     // 显示数值标签
    color?: string[];        // 自定义颜色
  };
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
 * 数据来源信息
 */
export interface DataSourceInfo {
  dataset: DatasetType;
  recordCount: number;
  lastUpdated: number;
  timeRange?: { start: string; end: string };
}

/** 数据源配置（用于请求） */
export interface DataSourceConfig {
  dataset: DatasetType;
  dimensions: DimensionType[];
  metrics: MetricConfig[];
  timeRange: string;
  filters?: Filter[];
  transform?: TransformConfig;
}

/** AI 图表配置（包含数据源） */
export interface AIChartConfig extends ChartConfig {
  dataSource: DataSourceConfig;
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
  /** 数据来源信息 */
  dataSource?: DataSourceInfo;
  /** 数据集（兼容字段） */
  dataset?: DatasetType;
  /** 维度列表（兼容字段） */
  dimensions?: DimensionType[];
  /** 指标列表（兼容字段） */
  metrics?: MetricConfig[];
  /** 数据转换配置（兼容字段） */
  transform?: TransformConfig;
  /** SQL说明（兼容字段） */
  sql?: string;
}

/**
 * AI响应 - 旧架构直接解析模式（兼容）
 */
export interface AIResponse {
  config: ChartConfig;
  sql: string;
}

/**
 * AI响应 - 推荐列表模式
 */
export interface AIRecommendationsResponse {
  recommendations: AIRecommendation[];
  selected?: ChartConfig;
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

/**
 * 通用数据查询请求
 */
export interface DataQueryRequest {
  dataset: DatasetType;
  dimensions: DimensionType[];
  metrics: MetricType[];
  filters?: Filter[];
  timeRange?: {
    start: string;
    end: string;
  };
}

/**
 * 通用数据查询响应
 */
export interface DataQueryResponse {
  data: DataPoint[];
  schema: {
    dimensions: { name: DimensionType; type: 'string' | 'date' | 'number' }[];
    metrics: { name: MetricType; type: 'number'; unit?: string }[];
  };
  meta: {
    totalRows: number;
    timeRange: { start: string; end: string };
    cached?: boolean;
    cachedAt?: string;
  };
}

/**
 * 推荐请求
 */
export interface RecommendRequest {
  input: string;
  context?: {
    dataset?: DatasetType;
    history?: string[];
  };
}

/**
 * 推荐响应
 */
export interface RecommendResponse {
  recommendations: AIRecommendation[];
  suggestedDataset?: DatasetType;
}
