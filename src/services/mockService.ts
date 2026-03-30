import type { 
  ChartConfig, 
  DataPoint, 
  DatasetType, 
  DimensionType, 
  MetricType,
  DataQueryRequest,
  DataQueryResponse 
} from '../types';
import dayjs from 'dayjs';

// ==================== 电商业务常量定义 ====================

/** 中国主要城市 */
const CITIES = [
  { name: '北京', region: '华北', province: '北京市' },
  { name: '上海', region: '华东', province: '上海市' },
  { name: '广州', region: '华南', province: '广东省' },
  { name: '深圳', region: '华南', province: '广东省' },
  { name: '杭州', region: '华东', province: '浙江省' },
  { name: '南京', region: '华东', province: '江苏省' },
  { name: '成都', region: '西南', province: '四川省' },
  { name: '武汉', region: '华中', province: '湖北省' },
  { name: '西安', region: '西北', province: '陕西省' },
  { name: '重庆', region: '西南', province: '重庆市' },
];

/** 一级类目 */
const CATEGORIES = [
  { name: '数码家电', subcategories: ['手机', '电脑', '数码配件', '大家电', '小家电'] },
  { name: '服饰鞋包', subcategories: ['女装', '男装', '鞋靴', '箱包', '配饰'] },
  { name: '食品生鲜', subcategories: ['休闲食品', '生鲜水果', '酒水饮料', '粮油调味'] },
  { name: '美妆个护', subcategories: ['面部护理', '彩妆', '身体护理', '美发护发'] },
  { name: '家居日用', subcategories: ['家纺', '家装', '厨具', '生活日用'] },
  { name: '母婴玩具', subcategories: ['奶粉', '尿裤', '童装', '玩具'] },
  { name: '运动户外', subcategories: ['运动服饰', '运动鞋包', '健身器材', '户外装备'] },
];

/** 品牌 */
const BRANDS = [
  'Apple', '华为', '小米', '耐克', '阿迪达斯', '优衣库', 'ZARA', 'H&M',
  '三只松鼠', '良品铺子', '蒙牛', '伊利', '欧莱雅', '雅诗兰黛', '美的', '海尔'
];

/** 销售渠道 */
const CHANNELS = ['APP', '小程序', 'H5', 'PC', '线下门店'];

/** 流量来源 */
const SOURCES = ['搜索', '推荐', '广告', '直接访问', '社交分享'];

/** 用户类型 */


/** 年龄段 */
const AGE_GROUPS = ['18-25岁', '26-35岁', '36-45岁', '46岁以上'];

/** 转化阶段 */


/** 星期 */
const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

// ==================== 工具函数 ====================

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRandom<T>(items: { item: T; weight: number }[]): T {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  let random = Math.random() * totalWeight;
  for (const { item, weight } of items) {
    random -= weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1].item;
}

// ==================== 数据生成器 ====================

/**
 * 生成销售数据
 */
function generateSalesData(days: number): DataPoint[] {
  const data: DataPoint[] = [];
  const now = dayjs();

  for (let i = 0; i < days; i++) {
    const date = now.subtract(days - 1 - i, 'day');
    const dateStr = date.format('YYYY-MM-DD');
    const weekday = date.day() || 7; // 1-7
    const isWeekend = weekday >= 6;
    
    // 每天生成多条记录（模拟不同维度组合）
    const dailyRecords = randomBetween(20, 50);
    
    for (let j = 0; j < dailyRecords; j++) {
      const city = randomItem(CITIES);
      const category = randomItem(CATEGORIES);
      const hour = randomBetween(0, 23);
      
      // 销售额基于多个因素
      const baseAmount = randomBetween(100, 5000);
      const weekendFactor = isWeekend ? 1.3 : 1;
      const hourFactor = (hour >= 10 && hour <= 22) ? 1.2 : 0.6;
      const sales = Math.floor(baseAmount * weekendFactor * hourFactor);
      
      // 其他指标
      const quantity = Math.floor(sales / randomBetween(50, 300));
      const profit = Math.floor(sales * randomBetween(15, 35) / 100);
      const discount = randomBetween(0, 30);
      const avgOrderValue = Math.floor(sales / Math.max(quantity, 1));

      data.push({
        date: dateStr,
        hour,
        weekday: WEEKDAYS[weekday - 1],
        week: date.format('YYYY-W'),
        month: date.format('YYYY-MM'),
        quarter: `Q${(date as any).quarter()}`, // dayjs quarter 插件
        province: city.province,
        city: city.name,
        region: city.region,
        category: category.name,
        subcategory: randomItem(category.subcategories),
        product: `${randomItem(BRANDS)} ${category.subcategories[0]}`,
        brand: randomItem(BRANDS),
        channel: randomItem(CHANNELS),
        source: weightedRandom([
          { item: '搜索', weight: 35 },
          { item: '推荐', weight: 30 },
          { item: '广告', weight: 15 },
          { item: '直接访问', weight: 15 },
          { item: '社交分享', weight: 5 },
        ]),
        userType: weightedRandom([
          { item: '新客', weight: 20 },
          { item: '老客', weight: 40 },
          { item: '会员', weight: 30 },
          { item: 'VIP', weight: 10 },
        ]),
        ageGroup: randomItem(AGE_GROUPS),
        gender: Math.random() > 0.5 ? '男' : '女',
        sales,
        orders: Math.max(1, Math.floor(quantity / randomBetween(1, 3))),
        quantity,
        profit,
        avgOrderValue,
        discount,
      });
    }
  }

  return data;
}

/**
 * 生成用户数据
 */
function generateUsersData(days: number): DataPoint[] {
  const data: DataPoint[] = [];
  const now = dayjs();

  for (let i = 0; i < days; i++) {
    const date = now.subtract(days - 1 - i, 'day');
    const dateStr = date.format('YYYY-MM-DD');
    const isWeekend = date.day() === 0 || date.day() === 6;
    
    // 每天生成用户数据
    const dailyRecords = randomBetween(10, 30);
    
    for (let j = 0; j < dailyRecords; j++) {
      const baseUsers = randomBetween(100, 1000);
      const weekendFactor = isWeekend ? 1.2 : 1;
      
      data.push({
        date: dateStr,
        source: randomItem(SOURCES),
        ageGroup: randomItem(AGE_GROUPS),
        gender: Math.random() > 0.5 ? '男' : '女',
        city: randomItem(CITIES).name,
        channel: randomItem(CHANNELS),
        newUsers: Math.floor(baseUsers * 0.2 * weekendFactor),
        activeUsers: Math.floor(baseUsers * weekendFactor),
        retentionRate: randomBetween(20, 60),
        conversionRate: randomBetween(2, 15),
        ltv: randomBetween(200, 2000),
      });
    }
  }

  return data;
}

/**
 * 生成转化漏斗数据
 */
function generateConversionData(days: number): DataPoint[] {
  const data: DataPoint[] = [];
  const now = dayjs();

  for (let i = 0; i < days; i++) {
    const date = now.subtract(days - 1 - i, 'day');
    const dateStr = date.format('YYYY-MM-DD');
    
    for (const channel of CHANNELS) {
      // 模拟漏斗数据（递减）
      const visitUsers = randomBetween(5000, 15000);
      const browseUsers = Math.floor(visitUsers * randomBetween(40, 70) / 100);
      const cartUsers = Math.floor(browseUsers * randomBetween(20, 40) / 100);
      const orderUsers = Math.floor(cartUsers * randomBetween(30, 60) / 100);
      const payUsers = Math.floor(orderUsers * randomBetween(80, 95) / 100);
      const completeUsers = Math.floor(payUsers * randomBetween(95, 100) / 100);

      const stages = [
        { stage: '访问', users: visitUsers },
        { stage: '浏览', users: browseUsers },
        { stage: '加购', users: cartUsers },
        { stage: '下单', users: orderUsers },
        { stage: '支付', users: payUsers },
        { stage: '完成', users: completeUsers },
      ];

      for (let j = 0; j < stages.length; j++) {
        const current = stages[j];
        const prev = stages[j - 1];
        const conversionRate = prev ? Math.floor((current.users / prev.users) * 100) : 100;
        const dropOffRate = 100 - conversionRate;

        data.push({
          date: dateStr,
          stage: current.stage,
          channel,
          users: current.users,
          conversionRate,
          dropOffRate,
        });
      }
    }
  }

  return data;
}

// ==================== 数据聚合转换 ====================

/**
 * 按维度聚合数据
 */
function aggregateData(
  data: DataPoint[],
  dimensions: DimensionType[],
  metric: MetricType,
  aggregation: string
): DataPoint[] {
  const grouped = data.reduce((acc, item) => {
    const key = dimensions.map(d => item[d]).join('|');
    if (!acc[key]) {
      acc[key] = { ...item, _values: [] };
    }
    acc[key]._values.push(Number(item[metric]) || 0);
    return acc;
  }, {} as Record<string, any>);

  return Object.values(grouped).map((group: any) => {
    const values = group._values;
    let aggregatedValue = 0;

    switch (aggregation) {
      case 'sum':
        aggregatedValue = values.reduce((a: number, b: number) => a + b, 0);
        break;
      case 'avg':
        aggregatedValue = values.reduce((a: number, b: number) => a + b, 0) / values.length;
        break;
      case 'max':
        aggregatedValue = Math.max(...values);
        break;
      case 'min':
        aggregatedValue = Math.min(...values);
        break;
      case 'count':
        aggregatedValue = values.length;
        break;
      default:
        aggregatedValue = values[0];
    }

    const result = { ...group };
    delete result._values;
    result[metric] = aggregatedValue;
    return result;
  });
}

/**
 * 排序数据
 */
function sortData(
  data: DataPoint[],
  sortBy: string,
  sortOrder: string,
  metric: MetricType
): DataPoint[] {
  return [...data].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'value') {
      comparison = Number(b[metric]) - Number(a[metric]);
    } else {
      comparison = String(a[sortBy]).localeCompare(String(b[sortBy]));
    }
    return sortOrder === 'desc' ? comparison : -comparison;
  });
}

// ==================== 主接口 ====================

/**
 * 查询数据（模拟API）
 */
export async function queryData(request: DataQueryRequest): Promise<DataQueryResponse> {
  const { dataset, dimensions, metrics, filters, timeRange } = request;
  
  // 确定时间范围（从 start/end 计算天数，默认 7 天）
  const days = timeRange ? 
    Math.max(1, dayjs(timeRange.end).diff(dayjs(timeRange.start), 'day')) : 
    7;
  
  // 生成原始数据
  let rawData: DataPoint[] = [];
  switch (dataset) {
    case 'sales':
      rawData = generateSalesData(days);
      break;
    case 'users':
      rawData = generateUsersData(days);
      break;
    case 'conversion':
      rawData = generateConversionData(days);
      break;
  }

  // 应用筛选
  if (filters) {
    rawData = rawData.filter(item => {
      return filters.every(filter => {
        const value = item[filter.field];
        switch (filter.operator) {
          case 'eq': return value === filter.value;
          case 'gt': return Number(value) > filter.value;
          case 'lt': return Number(value) < filter.value;
          case 'gte': return Number(value) >= filter.value;
          case 'lte': return Number(value) <= filter.value;
          case 'in': return filter.value.includes(value);
          case 'between': 
            const num = Number(value);
            return num >= filter.value[0] && num <= filter.value[1];
          default: return true;
        }
      });
    });
  }

  // 构建响应
  return {
    data: rawData,
    schema: {
      dimensions: dimensions.map(d => ({ name: d, type: 'string' as const })),
      metrics: metrics.map(m => ({ 
        name: m, 
        type: 'number' as const,
        unit: m.includes('sales') || m.includes('profit') || m.includes('ltv') ? '元' : 
              m.includes('Rate') ? '%' : ''
      })),
    },
    meta: {
      totalRows: rawData.length,
      timeRange: {
        start: dayjs().subtract(days, 'day').format('YYYY-MM-DD'),
        end: dayjs().format('YYYY-MM-DD'),
      },
    },
  };
}

/**
 * 生成图表数据（兼容旧接口）
 */
export function generateMockData(config: ChartConfig): DataPoint[] {
  const { dataset, transform, timeRange = '7d' } = config;
  
  const days = timeRange === '7d' ? 7 : 
               timeRange === '30d' ? 30 : 
               timeRange === '90d' ? 90 : 7;

  // 生成数据
  let data: DataPoint[] = [];
  switch (dataset) {
    case 'sales':
      data = generateSalesData(days);
      break;
    case 'users':
      data = generateUsersData(days);
      break;
    case 'conversion':
      data = generateConversionData(days);
      break;
  }

  // 应用转换
  if (transform) {
    const { xDimension, seriesDimension, metric, aggregation, sortBy, sortOrder, limit } = transform;
    
    // 确定分组维度
    const groupDimensions: DimensionType[] = [];
    if (xDimension) groupDimensions.push(xDimension);
    if (seriesDimension) groupDimensions.push(seriesDimension);
    
    if (groupDimensions.length > 0 && metric) {
      data = aggregateData(data, groupDimensions, metric, aggregation || 'sum');
    }
    
    if (sortBy && metric) {
      data = sortData(data, sortBy, sortOrder || 'desc', metric);
    }
    
    if (limit && limit > 0) {
      data = data.slice(0, limit);
    }
  }

  return data;
}

/**
 * 获取数据集的维度列表
 */
export function getDatasetDimensions(dataset: DatasetType): DimensionType[] {
  switch (dataset) {
    case 'sales':
      return ['date', 'hour', 'weekday', 'week', 'month', 'quarter', 
              'province', 'city', 'region',
              'category', 'subcategory', 'product', 'brand',
              'channel', 'source',
              'userType', 'ageGroup', 'gender'];
    case 'users':
      return ['date', 'source', 'ageGroup', 'gender', 'city', 'channel'];
    case 'conversion':
      return ['date', 'stage', 'channel'];
    default:
      return [];
  }
}

/**
 * 获取数据集的指标列表
 */
export function getDatasetMetrics(dataset: DatasetType): MetricType[] {
  switch (dataset) {
    case 'sales':
      return ['sales', 'orders', 'quantity', 'profit', 'avgOrderValue', 'discount'];
    case 'users':
      return ['newUsers', 'activeUsers', 'retentionRate', 'conversionRate', 'ltv'];
    case 'conversion':
      return ['users', 'conversionRate', 'dropOffRate'];
    default:
      return [];
  }
}
