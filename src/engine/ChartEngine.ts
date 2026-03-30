import type {
  AIRecommendation,
  AIChartConfig,
  ChartType,
  DatasetType,
  DimensionType,
  MetricType,
  DataPoint,
  DataSourceConfig,
  TransformConfig,
} from '../types';
import { getAIService } from '../services/aiService';
import { DataEngine } from './DataEngine';

/**
 * 图表引擎
 * 负责AI推荐解析和图表配置生成
 */
export class ChartEngine {
  private static instance: ChartEngine;
  private dataEngine: DataEngine;

  constructor() {
    this.dataEngine = new DataEngine();
  }

  static getInstance(): ChartEngine {
    if (!ChartEngine.instance) {
      ChartEngine.instance = new ChartEngine();
    }
    return ChartEngine.instance;
  }

  /**
   * 获取AI推荐列表
   * @param input 用户输入
   * @returns 推荐列表
   */
  async getRecommendations(input: string): Promise<AIRecommendation[]> {
    try {
      const aiService = getAIService();
      const recommendations = await aiService.getRecommendations(input);
      return recommendations;
    } catch (error) {
      console.error('获取推荐失败:', error);
      // 返回默认推荐
      return this.getDefaultRecommendations(input);
    }
  }

  /**
   * 用户选择推荐后，生成完整图表配置
   * @param recommendation 用户选择的推荐
   * @param input 原始输入
   * @returns 完整的图表配置
   */
  async selectRecommendation(
    recommendation: AIRecommendation,
    input: string
  ): Promise<AIChartConfig> {
    try {
      const aiService = getAIService();
      const config = await aiService.convertToChartConfig(recommendation, input);
      return config;
    } catch (error) {
      console.error('生成配置失败:', error);
      // 基于推荐生成默认配置
      return this.generateDefaultConfig(recommendation);
    }
  }

  /**
   * 获取数据
   * @param dataSource 数据源配置
   * @returns 原始数据
   */
  async fetchData(dataSource: DataSourceConfig): Promise<DataPoint[]> {
    return this.dataEngine.fetch(dataSource);
  }

  /**
   * 转换数据
   * @param rawData 原始数据
   * @param transform 转换配置
   * @param chartType 图表类型
   * @returns 转换后的数据
   */
  transformData(
    rawData: DataPoint[],
    transform: TransformConfig,
    chartType: ChartType
  ): DataPoint[] {
    return this.dataEngine.transform(rawData, transform, chartType);
  }

  /**
   * 获取默认推荐（当AI服务失败时）
   */
  private getDefaultRecommendations(input: string): AIRecommendation[] {
    const lower = input.toLowerCase();

    // 根据关键词返回默认推荐
    if (lower.includes('趋势') || lower.includes('走势')) {
      return [
        {
          type: 'line',
          title: '销售额趋势分析',
          reason: ['折线图最适合展示时间趋势变化', '可以清晰观察数据的上升下降趋势'],
          confidence: 0.9,
          preview: {
            dataset: 'sales' as DatasetType,
            description: '时间序列销售数据',
          },
        },
      ];
    }

    if (lower.includes('排名') || lower.includes('对比')) {
      return [
        {
          type: 'bar',
          title: '销售额排名对比',
          reason: ['柱状图适合展示分类数据的对比', '排名数据一目了然'],
          confidence: 0.9,
          preview: {
            dataset: 'sales' as DatasetType,
            description: '分类销售对比数据',
          },
        },
      ];
    }

    if (lower.includes('占比') || lower.includes('份额')) {
      return [
        {
          type: 'pie',
          title: '销售占比分布',
          reason: ['饼图适合展示部分与整体的关系', '占比情况直观明了'],
          confidence: 0.9,
          preview: {
            dataset: 'sales' as DatasetType,
            description: '分类占比数据',
          },
        },
      ];
    }

    // 默认返回折线图
    return [
      {
        type: 'line',
        title: '数据分析',
        reason: ['基于您的描述，折线图是较为通用的选择', '可以展示数据的变化趋势'],
        confidence: 0.7,
        preview: {
          dataset: 'sales' as DatasetType,
          description: '通用分析数据',
        },
      },
    ];
  }

  /**
   * 生成默认配置（当AI生成失败时）
   */
  private generateDefaultConfig(recommendation: AIRecommendation): AIChartConfig {
    const { type, title, preview } = recommendation;
    const dataset = preview?.dataset || 'sales';

    // 根据图表类型生成默认配置
    const baseConfig: Omit<AIChartConfig, 'transform' | 'dataSource'> = {
      type,
      title,
      dataset: dataset as DatasetType,
      dimensions: ['date' as DimensionType],
      metrics: [{ field: 'sales' as MetricType, name: '销售额', aggregation: 'sum' }],
      timeRange: '7d',
    };

    const dataSource: DataSourceConfig = {
      dataset: dataset as DatasetType,
      dimensions: ['date'],
      metrics: [{ field: 'sales', name: '销售额', aggregation: 'sum' }],
      timeRange: '7d',
    };

    switch (type) {
      case 'line':
        return {
          ...baseConfig,
          transform: {
            xDimension: 'date' as DimensionType,
            metric: 'sales' as MetricType,
            aggregation: 'sum',
          },
          dataSource,
        };

      case 'bar':
        return {
          ...baseConfig,
          dimensions: ['city' as DimensionType],
          transform: {
            xDimension: 'city' as DimensionType,
            metric: 'sales' as MetricType,
            aggregation: 'sum',
            sortBy: 'value',
            sortOrder: 'desc',
            limit: 10,
          },
          dataSource: {
            ...dataSource,
            dimensions: ['city'],
          },
        };

      case 'pie':
        return {
          ...baseConfig,
          dimensions: ['category' as DimensionType],
          transform: {
            xDimension: 'category' as DimensionType,
            metric: 'sales' as MetricType,
            aggregation: 'sum',
          },
          dataSource: {
            ...dataSource,
            dimensions: ['category'],
          },
        };

      case 'scatter':
        return {
          ...baseConfig,
          dimensions: ['product' as DimensionType],
          metrics: [
            { field: 'sales' as MetricType, name: '销售额', aggregation: 'sum' },
            { field: 'profit' as MetricType, name: '毛利', aggregation: 'sum' },
          ],
          transform: {
            xDimension: 'sales' as DimensionType,
            metric: 'profit' as MetricType,
            aggregation: 'sum',
          },
          dataSource: {
            ...dataSource,
            dimensions: ['product'],
            metrics: [
              { field: 'sales', name: '销售额', aggregation: 'sum' },
              { field: 'profit', name: '毛利', aggregation: 'sum' },
            ],
          },
        };

      case 'radar':
        return {
          ...baseConfig,
          dimensions: ['category' as DimensionType],
          metrics: [
            { field: 'sales' as MetricType, name: '销售额', aggregation: 'sum' },
            { field: 'profit' as MetricType, name: '毛利', aggregation: 'sum' },
            { field: 'orders' as MetricType, name: '订单数', aggregation: 'sum' },
          ],
          transform: {
            xDimension: 'category' as DimensionType,
            metric: 'sales' as MetricType,
            aggregation: 'sum',
          },
          dataSource: {
            ...dataSource,
            dimensions: ['category'],
            metrics: [
              { field: 'sales', name: '销售额', aggregation: 'sum' },
              { field: 'profit', name: '毛利', aggregation: 'sum' },
              { field: 'orders', name: '订单数', aggregation: 'sum' },
            ],
          },
        };

      case 'funnel':
        return {
          ...baseConfig,
          dataset: 'conversion' as DatasetType,
          dimensions: ['stage' as DimensionType],
          metrics: [{ field: 'users' as MetricType, name: '用户数', aggregation: 'sum' }],
          transform: {
            xDimension: 'stage' as DimensionType,
            metric: 'users' as MetricType,
            aggregation: 'sum',
          },
          dataSource: {
            dataset: 'conversion',
            dimensions: ['stage'],
            metrics: [{ field: 'users', name: '用户数', aggregation: 'sum' }],
            timeRange: '7d',
          },
        };

      case 'gauge':
        return {
          ...baseConfig,
          transform: {
            metric: 'sales' as MetricType,
            aggregation: 'sum',
          },
          dataSource,
        };

      case 'heatmap':
        return {
          ...baseConfig,
          dimensions: ['hour' as DimensionType, 'weekday' as DimensionType],
          transform: {
            xDimension: 'hour' as DimensionType,
            yDimension: 'weekday' as DimensionType,
            metric: 'orders' as MetricType,
            aggregation: 'sum',
          },
          dataSource: {
            ...dataSource,
            dimensions: ['hour', 'weekday'],
            metrics: [{ field: 'orders', name: '订单数', aggregation: 'sum' }],
          },
        };

      default:
        return {
          ...baseConfig,
          transform: {
            xDimension: 'date' as DimensionType,
            metric: 'sales' as MetricType,
            aggregation: 'sum',
          },
          dataSource,
        };
    }
  }
}

// 导出单例
export const chartEngine = ChartEngine.getInstance();
