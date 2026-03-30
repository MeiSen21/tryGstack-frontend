import type { 
  AIResponse, 
  AIRecommendation, 
  AIChartConfig,
  ChartItem, 
  DatasetType
} from '../types';

const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_MODEL = 'kimi-k2-0905-preview';

// ==========================================
// 新架构：AI 推荐模式
// ==========================================

const RECOMMENDATION_PROMPT = `你是电商数据可视化专家，根据用户的需求推荐最合适的图表类型。

## 你的任务
分析用户的自然语言需求，推荐最多 3 个最匹配的图表方案。

## 可用数据集

### 1. sales（销售数据）
维度: date(日期), hour(小时), province(省份), city(城市), category(品类), 
      product(商品), brand(品牌), channel(渠道), source(流量来源), 
      userType(用户类型), ageGroup(年龄段), gender(性别)
指标: sales(销售额), orders(订单数), profit(毛利)

### 2. users（用户数据）
维度: date, source(来源渠道), ageGroup(年龄段), gender(性别), city(城市)
指标: newUsers(新增用户), activeUsers(活跃用户), retentionRate(留存率), 
      conversionRate(转化率)

### 3. conversion（转化漏斗数据）
维度: stage(阶段), channel(渠道), date(日期)
指标: users(用户数), conversionRate(转化率)

## 图表类型推荐规则

| 类型 | 适用场景 | 关键词 |
|------|----------|--------|
| line | 时间趋势、走势变化 | 趋势、走势、变化、最近、本周、本月 |
| bar | 对比排名、TOP分析 | 排名、对比、各、TOP、最、第一 |
| pie | 占比分布、结构分析 | 占比、份额、构成、分布 |
| scatter | 相关性分析、散点分布 | 关系、相关、分布 |
| radar | 多维度综合评价 | 综合、多维度、表现、评估 |
| funnel | 转化漏斗分析 | 漏斗、转化、流失 |
| gauge | 目标完成度、进度 | 完成、进度、目标、KPI |
| heatmap | 时段热力分布 | 热力、时段、密集、矩阵 |

## 输出格式
返回 JSON 数组，每个推荐包含：
- type: 图表类型
- title: 图表标题
- reason: 推荐理由（数组，每条一句话）
- confidence: 置信度 0-1
- preview: { dataset, description }

示例：
[{
  "type": "line",
  "title": "最近7天销售额趋势",
  "reason": ["适合展示时间序列的变化趋势", "直观反映业务增长态势"],
  "confidence": 0.95,
  "preview": { "dataset": "sales", "description": "按日期聚合销售额" }
}]`;

const CONFIG_PROMPT = `你是电商数据可视化配置专家。根据用户选择将推荐转换为具体的图表配置。

## 可用数据集

### sales（销售数据）
维度: date, hour, province, city, category, product, brand, channel, source, userType, ageGroup, gender
指标: sales, orders, profit

### users（用户数据）
维度: date, source, ageGroup, gender, city
指标: newUsers, activeUsers, retentionRate, conversionRate

### conversion（转化漏斗数据）
维度: stage, channel, date
指标: users, conversionRate

## 转换规则

根据图表类型设置合适的维度、指标和变换配置：
- line: xDimension=date, 时间序列
- bar: xDimension=城市/品类/省份等, 支持排序和限制
- pie: xDimension=分类维度, 占比分析
- funnel: 使用 conversion 数据集, stage 维度
- gauge: 单一数值, 计算完成率
- radar: 多维度对比
- scatter: 双指标散点图
- heatmap: xDimension + yDimension, 矩阵热力

## 输出格式
{
  "type": "图表类型",
  "title": "图表标题",
  "dataset": "sales | users | conversion",
  "dimensions": ["维度1", "维度2"],
  "metrics": [
    { "field": "指标字段", "name": "显示名称", "aggregation": "sum | avg | count" }
  ],
  "transform": {
    "xDimension": "X轴维度",
    "yDimension": "Y轴维度（热力图等）",
    "seriesDimension": "分组维度（可选）",
    "metric": "主指标",
    "aggregation": "sum | avg | count",
    "sortBy": "value | name（可选）",
    "sortOrder": "asc | desc（可选）",
    "limit": 10（可选）
  },
  "timeRange": "7d | 30d | 90d"
}`;

// ==========================================
// 兼容旧架构：直接解析模式
// ==========================================

const SYSTEM_PROMPT = `你是电商数据分析专家，专门分析全渠道销售数据，将用户的自然语言需求转换为图表配置JSON。

## 可用数据集

### 1. sales（销售数据 - 最常用）
时间维度: date(日期), hour(小时), week(周), month(月份), quarter(季度)
地理维度: province(省份), city(城市), region(区域: 华北/华东/华南/华中/西南/西北/东北)
商品维度: category(一级类目: 数码家电/服饰鞋包/食品生鲜/美妆个护/家居日用/母婴玩具/运动户外), 
         subcategory(二级类目), 
         product(商品名称),
         brand(品牌)
渠道维度: channel(渠道: APP/小程序/H5/PC/线下门店), 
         source(流量来源: 搜索/推荐/广告/直接访问/社交分享)
用户维度: userType(用户类型: 新客/老客/会员/VIP), 
         ageGroup(年龄段: 18-25岁/26-35岁/36-45岁/46岁以上),
         gender(性别: 男/女)

指标: sales(销售额/元), orders(订单数), quantity(销量/件), profit(毛利/元), 
      avgOrderValue(客单价/元), discount(折扣率/%)

### 2. users（用户数据）
维度: date, source(来源渠道), ageGroup(年龄段), gender(性别), city(城市), channel(注册渠道)
指标: newUsers(新增用户), activeUsers(活跃用户), retentionRate(留存率/%), 
      conversionRate(转化率/%), ltv(用户生命周期价值/元)

### 3. conversion（转化漏斗数据）
维度: stage(阶段: 访问/浏览/加购/下单/支付/完成), channel(渠道), date(日期)
指标: users(用户数), conversionRate(转化率/%), dropOffRate(流失率/%)

## 图表业务场景映射

【趋势分析】→ line(折线图) - 看时间变化
适用: 销售额走势、订单量变化、用户增长
关键词: "趋势", "走势", "变化", "最近N天", "本周", "本月", "同比", "环比"
维度选择: date(日期) 作为 X轴
指标选择: sales(销售额) 或 orders(订单数)

【对比分析】→ bar(柱状图) - 看排名对比
适用: 各省份销售额排名、TOP10商品、各渠道业绩对比
关键词: "对比", "排名", "各...", "TOP", "最", "第一"
维度选择: city(城市)/province(省份)/category(类目)/channel(渠道) 作为 X轴
指标选择: sales(销售额) 或 orders(订单数)
排序: 按数值降序，可设置 limit: 10 只显示前10

【占比分析】→ pie(饼图) - 看结构分布
适用: 品类销售占比、用户来源分布、新老客占比、渠道份额
关键词: "占比", "分布", "份额", "比例", "构成"
维度选择: category(类目)/source(来源)/userType(用户类型)/channel(渠道)
指标选择: sales(销售额) 或 orders(订单数)

【商品分析】→ scatter(散点图) - 看两个变量的关系
适用: 价格与销量关系、销量与评分关系、库存与周转关系
关键词: "关系", "相关性", "分布", "对比"(两个指标)
维度选择: 不需要特定维度
指标选择: 两个指标，如 sales 和 profit，或 quantity 和 avgOrderValue

【综合评估】→ radar(雷达图) - 看多维度表现
适用: 各品类综合表现、店铺运营能力、用户画像分析
关键词: "综合", "多维度", "能力", "表现", "评分", "对比"(多个方面)
维度选择: 多个维度作为雷达轴，如 [sales, profit, orders, avgOrderValue]
或类目维度: [数码家电, 服饰鞋包, 食品生鲜, 美妆个护]

【转化分析】→ funnel(漏斗图) - 看流程转化
适用: 用户购买转化漏斗、从访问到支付的转化
关键词: "转化", "漏斗", "流失", "从...到...", "步骤", "流程"
维度选择: stage(阶段) 作为漏斗层级
指标选择: users(用户数)
注意: 使用 conversion 数据集

【目标监控】→ gauge(仪表盘) - 看完成进度
适用: 本月销售目标完成度、今日GMV进度、季度KPI完成率
关键词: "完成度", "进度", "目标", "KPI", "达成率", "百分比", "实时"
指标选择: sales(销售额) 或具体百分比数值
注意: 数据需要是单一数值，如 {value: 78.5, target: 100}

【时段分析】→ heatmap(热力图) - 看时间矩阵
适用: 一周用户活跃热力图、各时段订单热力、城市时间段销售密度
关键词: "热力", "时段", "密集", "分布"(时间+地域), "矩阵"
维度选择: hour(小时) + weekday(星期) 或 city(城市) + date(日期)
指标选择: orders(订单数) 或 sales(销售额)

## 输出配置规则

1. 根据用户问题中的业务关键词，判断分析意图
2. 选择合适的数据集、维度和指标
3. 设置合理的时间范围（默认最近7天）
4. 如果有分组对比需求，设置 seriesDimension

## 输出格式（严格JSON，不要任何其他文字）
{
  "config": {
    "type": "line | bar | pie | scatter | radar | funnel | gauge | heatmap",
    "title": "图表标题（简洁专业）",
    "dataset": "sales | users | conversion",
    "dimensions": ["维度字段名"],
    "metrics": [{"field": "指标字段名", "name": "显示名称", "aggregation": "sum | avg | count"}],
    "transform": {
      "xDimension": "date | city | category | ...",
      "yDimension": "...",
      "seriesDimension": "channel | userType | ...",
      "metric": "sales | orders | profit | ...",
      "aggregation": "sum | avg | count | max | min",
      "sortBy": "value | name",
      "sortOrder": "asc | desc",
      "limit": 10
    },
    "timeRange": "7d | 30d | 90d | 1y"
  },
  "sql": "数据查询说明（简要说明数据逻辑）"
}

## 示例

输入："最近7天销售额趋势"
输出：{"config":{"type":"line","title":"最近7天销售额趋势","dataset":"sales","dimensions":["date"],"metrics":[{"field":"sales","name":"销售额","aggregation":"sum"}],"transform":{"xDimension":"date","metric":"sales","aggregation":"sum"},"timeRange":"7d"},"sql":"从sales数据集查询最近7天，按日期聚合销售额"}

输入："各省份销售额排名TOP10"
输出：{"config":{"type":"bar","title":"各省份销售额排名TOP10","dataset":"sales","dimensions":["province"],"metrics":[{"field":"sales","name":"销售额","aggregation":"sum"}],"transform":{"xDimension":"province","metric":"sales","aggregation":"sum","sortBy":"value","sortOrder":"desc","limit":10},"timeRange":"30d"},"sql":"从sales数据集查询，按省份分组汇总销售额，降序取前10"}

输入："品类销售占比"
输出：{"config":{"type":"pie","title":"品类销售占比","dataset":"sales","dimensions":["category"],"metrics":[{"field":"sales","name":"销售额","aggregation":"sum"}],"transform":{"xDimension":"category","metric":"sales","aggregation":"sum"},"timeRange":"30d"},"sql":"从sales数据集查询，按一级类目分组统计销售额占比"}

输入："用户购买转化漏斗"
输出：{"config":{"type":"funnel","title":"用户购买转化漏斗","dataset":"conversion","dimensions":["stage"],"metrics":[{"field":"users","name":"用户数","aggregation":"sum"}],"transform":{"xDimension":"stage","metric":"users","aggregation":"sum"},"timeRange":"7d"},"sql":"从conversion数据集查询，按转化阶段统计用户数"}`;

interface AIServiceOptions {
  apiKey: string;
}

export class AIService {
  private apiKey: string;

  constructor(options: AIServiceOptions) {
    this.apiKey = options.apiKey;
  }

  // ==========================================
  // 新架构：AI 推荐模式
  // ==========================================

  /**
   * 获取 AI 图表推荐
   */
  async getRecommendations(input: string): Promise<AIRecommendation[]> {
    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [
          { role: 'system', content: RECOMMENDATION_PROMPT },
          { role: 'user', content: input },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error('API返回内容为空');
    }

    try {
      const parsed = JSON.parse(content) as AIRecommendation[];
      // 如果返回的是对象包装数组，提取数组
      if (!Array.isArray(parsed)) {
        const arr = (parsed as unknown as { recommendations?: AIRecommendation[] }).recommendations;
        if (arr) return arr;
      }
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      // Fallback to rule-based recommendations
      return this.fallbackRecommendations(input);
    }
  }

  /**
   * 将选中的推荐转换为完整的图表配置
   */
  async convertToChartConfig(
    recommendation: AIRecommendation, 
    originalInput: string
  ): Promise<AIChartConfig> {
    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [
          { role: 'system', content: CONFIG_PROMPT },
          { 
            role: 'user', 
            content: `用户需求: "${originalInput}"

选中的推荐:
- 类型: ${recommendation.type}
- 标题: ${recommendation.title}
- 数据集: ${recommendation.preview?.dataset || 'sales'}

请生成完整的图表配置JSON。`
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error('API返回内容为空');
    }

    try {
      const config = JSON.parse(content) as AIChartConfig;
      // 添加数据源配置
      return {
        ...config,
        dataSource: {
          dataset: config.dataset,
          dimensions: config.dimensions,
          metrics: config.metrics,
          timeRange: config.timeRange || '7d',
        },
      };
    } catch (e) {
      return this.fallbackConvert(recommendation, originalInput);
    }
  }

  /**
   * Fallback: 基于规则的推荐
   */
  private fallbackRecommendations(input: string): AIRecommendation[] {
    const lower = input.toLowerCase();
    const recommendations: AIRecommendation[] = [];

    // 趋势分析
    if (lower.includes('趋势') || lower.includes('走势') || lower.includes('变化') || lower.includes('最近')) {
      recommendations.push({
        type: 'line',
        title: '销售额趋势分析',
        reason: ['适合展示时间序列的变化趋势', '直观反映业务增长态势', '便于观察周期性规律'],
        confidence: 0.95,
        preview: { dataset: 'sales', description: '按日期聚合销售额，展示时间趋势', estimatedRecords: 30 },
      });
    }

    // 对比分析
    if (lower.includes('排名') || lower.includes('对比') || lower.includes('各') || lower.includes('top')) {
      const dimension = lower.includes('省份') || lower.includes('城市') ? '省份' :
                       lower.includes('商品') || lower.includes('产品') ? '商品' :
                       lower.includes('品牌') ? '品牌' : '品类';
      recommendations.push({
        type: 'bar',
        title: `各${dimension}销售额排名`,
        reason: ['柱状图适合对比不同类别的数值大小', '排名展示清晰直观', '支持TOP筛选突出重点'],
        confidence: 0.9,
        preview: { dataset: 'sales', description: `按${dimension}分组汇总销售额并排序`, estimatedRecords: 10 },
      });
    }

    // 占比分析
    if (lower.includes('占比') || lower.includes('份额') || lower.includes('构成') || lower.includes('分布')) {
      recommendations.push({
        type: 'pie',
        title: '销售占比分析',
        reason: ['饼图直观展示各部分占比', '适合展示结构分布', '便于识别主要贡献者'],
        confidence: 0.88,
        preview: { dataset: 'sales', description: '按维度统计销售额占比分布', estimatedRecords: 5 },
      });
    }

    // 转化分析
    if (lower.includes('漏斗') || lower.includes('转化') || lower.includes('流程')) {
      recommendations.push({
        type: 'funnel',
        title: '用户转化漏斗',
        reason: ['漏斗图专门用于展示流程转化', '清晰展示各阶段流失情况', '便于识别转化瓶颈'],
        confidence: 0.92,
        preview: { dataset: 'conversion', description: '按转化阶段统计用户数量', estimatedRecords: 6 },
      });
    }

    // 如果没有任何匹配，默认推荐折线图
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'line',
        title: '最近7天销售额趋势',
        reason: ['折线图是最通用的趋势展示方式', '适合大多数时间序列数据', '易于理解和分析'],
        confidence: 0.8,
        preview: { dataset: 'sales', description: '按日期聚合销售额趋势', estimatedRecords: 30 },
      });
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Fallback: 基于规则的配置转换
   */
  private fallbackConvert(recommendation: AIRecommendation, _originalInput: string): AIChartConfig {
    const type = recommendation.type;
    const dataset = recommendation.preview?.dataset || 'sales';
    
    const baseConfig: Omit<AIChartConfig, 'transform' | 'dimensions' | 'metrics' | 'dataSource'> = {
      type,
      title: recommendation.title,
      dataset: dataset as DatasetType,
      timeRange: '7d',
    };

    switch (type) {
      case 'line':
        return {
          ...baseConfig,
          dimensions: ['date'],
          metrics: [{ field: 'sales', name: '销售额', aggregation: 'sum' }],
          transform: {
            xDimension: 'date',
            metric: 'sales',
            aggregation: 'sum',
          },
          dataSource: {
            dataset: dataset as DatasetType,
            dimensions: ['date'],
            metrics: [{ field: 'sales', name: '销售额', aggregation: 'sum' }],
            timeRange: '7d',
          },
        };

      case 'bar':
        return {
          ...baseConfig,
          dimensions: ['category'],
          metrics: [{ field: 'sales', name: '销售额', aggregation: 'sum' }],
          transform: {
            xDimension: 'category',
            metric: 'sales',
            aggregation: 'sum',
            sortBy: 'value',
            sortOrder: 'desc',
            limit: 10,
          },
          dataSource: {
            dataset: dataset as DatasetType,
            dimensions: ['category'],
            metrics: [{ field: 'sales', name: '销售额', aggregation: 'sum' }],
            timeRange: '7d',
          },
        };

      case 'pie':
        return {
          ...baseConfig,
          dimensions: ['category'],
          metrics: [{ field: 'sales', name: '销售额', aggregation: 'sum' }],
          transform: {
            xDimension: 'category',
            metric: 'sales',
            aggregation: 'sum',
          },
          dataSource: {
            dataset: dataset as DatasetType,
            dimensions: ['category'],
            metrics: [{ field: 'sales', name: '销售额', aggregation: 'sum' }],
            timeRange: '7d',
          },
        };

      case 'funnel':
        return {
          ...baseConfig,
          dataset: 'conversion',
          dimensions: ['stage'],
          metrics: [{ field: 'users', name: '用户数', aggregation: 'sum' }],
          transform: {
            xDimension: 'stage',
            metric: 'users',
            aggregation: 'sum',
          },
          dataSource: {
            dataset: 'conversion',
            dimensions: ['stage'],
            metrics: [{ field: 'users', name: '用户数', aggregation: 'sum' }],
            timeRange: '7d',
          },
        };

      default:
        return {
          ...baseConfig,
          dimensions: ['date'],
          metrics: [{ field: 'sales', name: '销售额', aggregation: 'sum' }],
          transform: {
            xDimension: 'date',
            metric: 'sales',
            aggregation: 'sum',
          },
          dataSource: {
            dataset: 'sales',
            dimensions: ['date'],
            metrics: [{ field: 'sales', name: '销售额', aggregation: 'sum' }],
            timeRange: '7d',
          },
        };
    }
  }

  // ==========================================
  // 兼容旧架构：直接解析模式
  // ==========================================

  async parseChartConfig(input: string): Promise<AIResponse> {
    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: input },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error('API返回内容为空');
    }

    try {
      const parsed = JSON.parse(content) as AIResponse;
      // Validate response structure
      if (!parsed.config) {
        throw new Error('API返回数据格式不正确');
      }
      return parsed;
    } catch (e) {
      throw new Error('解析AI响应失败: ' + (e as Error).message);
    }
  }
}

// 单例实例
let aiService: AIService | null = null;

export const initAIService = (apiKey: string) => {
  aiService = new AIService({ apiKey });
};

export const getAIService = (): AIService => {
  if (!aiService) {
    const apiKey = import.meta.env.VITE_KIMI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_KIMI_API_KEY 未设置，请在 .env 文件中配置');
    }
    aiService = new AIService({ apiKey });
  }
  return aiService;
};

/**
 * Fallback 解析：当AI API不可用时使用规则引擎
 * 基于电商业务场景的Fallback
 */
export function fallbackParse(input: string): AIResponse {
  const lower = input.toLowerCase();

  // 转化漏斗
  if (lower.includes('漏斗') || lower.includes('转化') || lower.includes('购买流程')) {
    return {
      config: {
        type: 'funnel',
        title: '用户购买转化漏斗',
        dataset: 'conversion',
        dimensions: ['stage'],
        metrics: [{ field: 'users', name: '用户数', aggregation: 'sum' }],
        transform: {
          xDimension: 'stage',
          metric: 'users',
          aggregation: 'sum',
        },
        timeRange: '7d',
      },
      sql: '从conversion数据集查询，按转化阶段统计用户数',
    };
  }

  // 仪表盘 - 目标完成
  if (lower.includes('完成') || lower.includes('进度') || lower.includes('目标') || lower.includes('kpi')) {
    return {
      config: {
        type: 'gauge',
        title: '本月销售目标完成度',
        dataset: 'sales',
        dimensions: [],
        metrics: [{ field: 'sales', name: '销售额', aggregation: 'sum' }],
        transform: {
          metric: 'sales',
          aggregation: 'sum',
        },
        timeRange: '30d',
      },
      sql: '从sales数据集查询本月销售额汇总，计算目标完成百分比',
    };
  }

  // 热力图
  if (lower.includes('热力') || lower.includes('时段') || lower.includes('密集')) {
    return {
      config: {
        type: 'heatmap',
        title: '一周订单时段热力分布',
        dataset: 'sales',
        dimensions: ['hour', 'weekday'],
        metrics: [{ field: 'orders', name: '订单数', aggregation: 'sum' }],
        transform: {
          xDimension: 'hour',
          yDimension: 'weekday',
          metric: 'orders',
          aggregation: 'sum',
        },
        timeRange: '30d',
      },
      sql: '从sales数据集查询，按小时和星期几分组统计订单数',
    };
  }

  // 雷达图
  if (lower.includes('雷达') || lower.includes('综合') || lower.includes('多维度') || lower.includes('类目表现')) {
    return {
      config: {
        type: 'radar',
        title: '各品类综合表现',
        dataset: 'sales',
        dimensions: ['数码家电', '服饰鞋包', '食品生鲜', '美妆个护', '家居日用'] as any[],
        metrics: [
          { field: 'sales', name: '销售额', aggregation: 'sum' },
          { field: 'profit', name: '毛利', aggregation: 'sum' },
        ],
        transform: {
          xDimension: 'category',
          metric: 'sales',
          aggregation: 'sum',
        },
        timeRange: '30d',
      },
      sql: '从sales数据集查询，按类目统计销售额、毛利等多维度指标',
    };
  }

  // 散点图
  if (lower.includes('关系') || lower.includes('相关') || lower.includes('分布')) {
    return {
      config: {
        type: 'scatter',
        title: '销售额与毛利关系分析',
        dataset: 'sales',
        dimensions: ['product'],
        metrics: [
          { field: 'sales', name: '销售额', aggregation: 'sum' },
          { field: 'profit', name: '毛利', aggregation: 'sum' },
        ],
        transform: {
          xDimension: 'sales' as any,
          metric: 'profit',
          aggregation: 'sum',
        },
        timeRange: '30d',
      },
      sql: '从sales数据集查询，按商品统计销售额和毛利，分析相关性',
    };
  }

  // 饼图 - 占比
  if (lower.includes('占比') || lower.includes('份额') || lower.includes('构成')) {
    const dimension = lower.includes('渠道') ? 'channel' : 
                     lower.includes('来源') ? 'source' : 
                     lower.includes('用户') ? 'userType' : 'category';
    const dimensionName = dimension === 'channel' ? '渠道' :
                         dimension === 'source' ? '流量来源' :
                         dimension === 'userType' ? '用户类型' : '品类';
    
    return {
      config: {
        type: 'pie',
        title: `${dimensionName}销售占比`,
        dataset: 'sales',
        dimensions: [dimension],
        metrics: [{ field: 'sales', name: '销售额', aggregation: 'sum' }],
        transform: {
          xDimension: dimension,
          metric: 'sales',
          aggregation: 'sum',
        },
        timeRange: '30d',
      },
      sql: `从sales数据集查询，按${dimensionName}统计销售额占比`,
    };
  }

  // 柱状图 - 对比排名
  if (lower.includes('对比') || lower.includes('排名') || lower.includes('各') || lower.includes('top')) {
    const dimension = lower.includes('省份') || lower.includes('城市') ? 'province' :
                     lower.includes('商品') || lower.includes('产品') ? 'product' :
                     lower.includes('品牌') ? 'brand' : 'category';
    const dimensionName = dimension === 'province' ? '省份' :
                         dimension === 'product' ? '商品' :
                         dimension === 'brand' ? '品牌' : '品类';
    
    return {
      config: {
        type: 'bar',
        title: `各${dimensionName}销售额排名`,
        dataset: 'sales',
        dimensions: [dimension],
        metrics: [{ field: 'sales', name: '销售额', aggregation: 'sum' }],
        transform: {
          xDimension: dimension,
          metric: 'sales',
          aggregation: 'sum',
          sortBy: 'value',
          sortOrder: 'desc',
          limit: 10,
        },
        timeRange: '30d',
      },
      sql: `从sales数据集查询，按${dimensionName}分组汇总销售额，降序排列`,
    };
  }

  // 默认折线图 - 趋势
  return {
    config: {
      type: 'line',
      title: '最近7天销售额趋势',
      dataset: 'sales',
      dimensions: ['date'],
      metrics: [{ field: 'sales', name: '销售额', aggregation: 'sum' }],
      transform: {
        xDimension: 'date',
        metric: 'sales',
        aggregation: 'sum',
      },
      timeRange: '7d',
    },
    sql: '从sales数据集查询最近7天，按日期聚合销售额',
  };
}

/**
 * 生成分享链接
 */
export function generateShareLink(charts: ChartItem[]): string {
  const state = encodeURIComponent(JSON.stringify(charts));
  return `${window.location.origin}?share=${state}`;
}

/**
 * 解析分享链接
 */
export function parseShareLink(search: string): ChartItem[] | null {
  const params = new URLSearchParams(search);
  const share = params.get('share');
  if (!share) return null;
  try {
    return JSON.parse(decodeURIComponent(share));
  } catch {
    return null;
  }
}
