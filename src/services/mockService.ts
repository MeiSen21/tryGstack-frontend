import type { ChartConfig, DataPoint } from '../types';
import dayjs from 'dayjs';

const REGIONS = ['江苏', '浙江', '上海', '北京', '广东', '四川', '湖北'];
const CATEGORIES = ['电子产品', '服装', '食品', '家居', '图书', '美妆'];
const SOURCES = ['直接访问', '搜索引擎', '社交媒体', '邮件营销', '广告推广'];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseTimeRange(timeRange?: string): number {
  if (!timeRange) return 7;
  if (timeRange === '7d') return 7;
  if (timeRange === '30d') return 30;
  if (timeRange === '1y') return 365;
  if (timeRange === 'this_month') return dayjs().daysInMonth();
  return 7;
}

/**
 * 根据指标字段生成合理的数据范围
 */
function getValueRange(field: string): [number, number] {
  const ranges: Record<string, [number, number]> = {
    amount: [5000, 50000], // 销售额
    order_amount: [5000, 50000],
    count: [50, 500], // 订单量
    order_count: [50, 500],
    users: [100, 1000], // 用户数
    user_count: [100, 1000],
    uv: [100, 1000],
    avg_price: [50, 500], // 客单价
    value: [100, 1000],
  };
  return ranges[field] || [100, 1000];
}

export function generateMockData(config: ChartConfig): DataPoint[] {
  const { dimensions, metrics, timeRange } = config;

  // 时间维度
  if (dimensions.includes('date')) {
    const days = parseTimeRange(timeRange);
    return Array.from({ length: days }, (_, i) => {
      const date = dayjs()
        .subtract(days - 1 - i, 'day')
        .format('MM-DD');

      const point: DataPoint = { date };
      metrics.forEach((metric) => {
        const [min, max] = getValueRange(metric.field);
        point[metric.field] = randomBetween(min, max);
      });
      return point;
    });
  }

  // 地区维度
  if (dimensions.includes('region')) {
    return REGIONS.map((region) => {
      const point: DataPoint = { region };
      metrics.forEach((metric) => {
        const [min, max] = getValueRange(metric.field);
        point[metric.field] = randomBetween(min * 2, max * 2);
      });
      return point;
    });
  }

  // 品类维度
  if (dimensions.includes('category')) {
    return CATEGORIES.map((category) => {
      const point: DataPoint = { category };
      metrics.forEach((metric) => {
        const [min, max] = getValueRange(metric.field);
        point[metric.field] = randomBetween(min, max);
      });
      return point;
    });
  }

  // 来源维度
  if (dimensions.includes('source')) {
    return SOURCES.map((source) => {
      const point: DataPoint = { source };
      metrics.forEach((metric) => {
        const [min, max] = getValueRange(metric.field);
        point[metric.field] = randomBetween(min, max);
      });
      return point;
    });
  }

  // 名称维度（通用）
  if (dimensions.includes('name')) {
    return Array.from({ length: 5 }, (_, i) => {
      const point: DataPoint = { name: `项目${i + 1}` };
      metrics.forEach((metric) => {
        const [min, max] = getValueRange(metric.field);
        point[metric.field] = randomBetween(min, max);
      });
      return point;
    });
  }

  // 默认：生成通用数据
  return Array.from({ length: 5 }, (_, i) => {
    const point: DataPoint = { name: `项目${i + 1}` };
    metrics.forEach((metric) => {
      const [min, max] = getValueRange(metric.field);
      point[metric.field] = randomBetween(min, max);
    });
    return point;
  });
}
