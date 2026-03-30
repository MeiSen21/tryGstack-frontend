import type {
  ChartConfig,
  ChartType,
  DataPoint,
  DataSourceConfig,
  DataQueryRequest,
  DimensionType,
  MetricType,
  TransformConfig,
} from '../types';
import { queryData } from '../services/mockService';

/**
 * 缓存条目
 */
interface CacheEntry {
  data: DataPoint[];
  timestamp: number;
  config: DataSourceConfig;
}

/**
 * 数据引擎
 * 负责数据获取、缓存和转换
 */
export class DataEngine {
  private static instance: DataEngine;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  static getInstance(): DataEngine {
    if (!DataEngine.instance) {
      DataEngine.instance = new DataEngine();
    }
    return DataEngine.instance;
  }

  /**
   * 获取数据（带缓存）
   * @param config 图表配置
   * @param refresh 是否强制刷新
   * @returns 转换后的数据
   */
  async fetch(config: DataSourceConfig, refresh = false): Promise<DataPoint[]> {
    const cacheKey = this.generateCacheKey(config);

    // 检查缓存
    if (!refresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && !this.isExpired(cached.timestamp)) {
        console.log('使用缓存数据');
        return cached.data;
      }
    }

    // 请求数据
    console.log('请求新数据');
    const request: DataQueryRequest = {
      dataset: config.dataset,
      dimensions: config.dimensions,
      metrics: config.metrics.map((m) => m.field),
      filters: config.filters,
      timeRange: config.timeRange
        ? {
            start: this.getTimeRangeStart(config.timeRange),
            end: new Date().toISOString(),
          }
        : undefined,
    };

    const response = await queryData(request);

    // 转换数据
    const defaultTransform: TransformConfig = {
      metric: config.metrics[0]?.field || 'sales',
      aggregation: config.metrics[0]?.aggregation || 'sum',
    };
    const transformed = this.transform(response.data, config.transform || defaultTransform);

    // 缓存结果
    this.cache.set(cacheKey, {
      data: transformed,
      timestamp: Date.now(),
      config,
    });

    return transformed;
  }

  /**
   * 获取数据来源信息
   * @param config 图表配置
   * @param data 当前数据
   * @returns 数据来源信息
   */
  getDataSourceInfo(config: ChartConfig, data: DataPoint[]) {
    // 将 ChartConfig 转换为 DataSourceConfig 用于缓存键
    const dataSourceConfig: DataSourceConfig = {
      dataset: config.dataset,
      dimensions: config.dimensions,
      metrics: config.metrics,
      timeRange: config.timeRange || '7d',
      filters: config.filters,
      transform: config.transform,
    };
    const cacheKey = this.generateCacheKey(dataSourceConfig);
    const cached = this.cache.get(cacheKey);

    return {
      dataset: config.dataset,
      recordCount: data.length,
      lastUpdated: cached?.timestamp || Date.now(),
      timeRange: config.timeRange
        ? {
            start: this.getTimeRangeStart(config.timeRange),
            end: new Date().toISOString().split('T')[0],
          }
        : undefined,
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(config: DataSourceConfig): string {
    return JSON.stringify({
      dataset: config.dataset,
      dimensions: config.dimensions,
      metrics: config.metrics.map((m) => m.field),
      filters: config.filters,
      timeRange: config.timeRange,
      transform: config.transform,
    });
  }

  /**
   * 检查缓存是否过期
   */
  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.CACHE_TTL;
  }

  /**
   * 获取时间范围起始日期
   */
  private getTimeRangeStart(timeRange: string): string {
    const now = new Date();
    const days =
      {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
        '1M': 30,
      }[timeRange] || 7;

    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return start.toISOString().split('T')[0];
  }

  /**
   * 数据转换
   * 将原始数据按照 transform 配置转换为图表数据
   */
  transform(rawData: DataPoint[], transform: TransformConfig, _chartType?: ChartType): DataPoint[] {
    const {
      xDimension,
      yDimension,
      seriesDimension,
      metric,
      aggregation,
      sortBy,
      sortOrder,
      limit,
    } = transform;

    // 确定分组维度
    const groupDimensions: (DimensionType | undefined)[] = [];
    if (xDimension) groupDimensions.push(xDimension);
    if (yDimension) groupDimensions.push(yDimension);
    if (seriesDimension) groupDimensions.push(seriesDimension);

    if (groupDimensions.length === 0 || !metric) {
      return rawData;
    }

    // 1. 分组
    const grouped = this.groupBy(
      rawData,
      groupDimensions.filter((d): d is DimensionType => d !== undefined)
    );

    // 2. 聚合
    const aggregated = Object.entries(grouped).map(([key, items]) => {
      const result: DataPoint = {};
      const dimensionValues = key.split('|');

      groupDimensions.forEach((dim, index) => {
        if (dim) {
          result[dim] = dimensionValues[index];
        }
      });

      result[metric] = this.aggregate(items, metric, aggregation);
      return result;
    });

    // 3. 排序
    if (sortBy && xDimension) {
      aggregated.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'value') {
          comparison = Number(b[metric]) - Number(a[metric]);
        } else if (sortBy === 'name' && xDimension) {
          comparison = String(a[xDimension]).localeCompare(String(b[xDimension]));
        }
        return sortOrder === 'asc' ? -comparison : comparison;
      });
    }

    // 4. 截取
    if (limit && limit > 0) {
      return aggregated.slice(0, limit);
    }

    return aggregated;
  }

  /**
   * 按维度分组
   */
  private groupBy(data: DataPoint[], dimensions: DimensionType[]): Record<string, DataPoint[]> {
    return data.reduce((acc, item) => {
      const key = dimensions.map((d) => item[d]).join('|');
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, DataPoint[]>);
  }

  /**
   * 聚合计算
   */
  private aggregate(
    items: DataPoint[],
    metric: MetricType,
    aggregation: string
  ): number {
    const values = items.map((item) => Number(item[metric]) || 0);

    switch (aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      case 'count':
        return values.length;
      default:
        return values[0] || 0;
    }
  }
}

// 导出单例
export const dataEngine = DataEngine.getInstance();
