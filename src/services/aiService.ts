import type { AIResponse, ChartItem } from '../types';

const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_MODEL = 'kimi-k2-0905-preview';

const SYSTEM_PROMPT = `你是数据分析师，专门将用户的自然语言需求转换为图表配置JSON和SQL语句。

## 支持的图表类型
- line: 折线图，用于展示时间趋势（如销售额趋势、用户增长）
- bar: 柱状图，用于数据对比（如各地区对比、品类对比）
- pie: 饼图，用于展示占比（如市场份额、用户来源）

## SQL生成规则
- 数据库类型：MySQL
- 表名推断规则：
  * 销售额/订单相关 → orders 表
  * 用户相关 → users 表
  * 产品相关 → products 表
- 字段命名：使用下划线命名法（created_at, order_amount）
- 时间处理：使用DATE()函数提取日期，使用DATE_SUB处理时间范围
- 聚合函数：SUM用于金额，COUNT用于数量，AVG用于平均值
- 必须包含：WHERE条件过滤时间范围，GROUP BY按维度分组

## 维度识别规则
- 时间类词汇 → dimensions: ["date"]，并提取timeRange
  * "最近7天"、"本周" → timeRange: "7d"
  * "最近30天"、"本月" → timeRange: "30d"
  * "今年"、"全年" → timeRange: "1y"
- 地区类词汇 → dimensions: ["region"]
  * 如：按地区、各省份、华东华北等
- 品类/类型类词汇 → dimensions: ["category"]
  * 如：按品类、各产品类型等

## 指标识别规则
- 销售额、营收、GMV → field: "amount", aggregation: "sum"
- 订单量、成交量、单数 → field: "count", aggregation: "count"
- 用户数、UV、访客 → field: "users", aggregation: "count"
- 客单价、均价 → field: "avg_price", aggregation: "avg"

## 输出格式（严格JSON，不要任何其他文字）
{
  "config": {
    "type": "line | bar | pie",
    "title": "图表标题（简洁明了）",
    "dimensions": ["维度字段名"],
    "metrics": [{"field": "指标字段名", "name": "显示名称", "aggregation": "sum | count | avg"}],
    "timeRange": "7d | 30d | this_month | 1y"
  },
  "sql": "生成的SQL语句，使用标准MySQL语法，包含格式化换行"
}

## 示例
输入："最近7天销售额趋势"
输出：{"config":{"type":"line","title":"销售额趋势","dimensions":["date"],"metrics":[{"field":"amount","name":"销售额"}],"timeRange":"7d"},"sql":"SELECT DATE(created_at) as date,\\n       SUM(order_amount) as amount\\nFROM orders\\nWHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)\\nGROUP BY DATE(created_at)\\nORDER BY date"}

输入："各品类订单量对比"
输出：{"config":{"type":"bar","title":"各品类订单量对比","dimensions":["category"],"metrics":[{"field":"order_count","name":"订单量","aggregation":"count"}]},"sql":"SELECT p.category,\\n       COUNT(o.id) as order_count\\nFROM orders o\\nJOIN products p ON o.product_id = p.id\\nGROUP BY p.category"}

输入："用户来源占比"
输出：{"config":{"type":"pie","title":"用户来源占比","dimensions":["source"],"metrics":[{"field":"user_count","name":"用户数"}]},"sql":"SELECT source,\\n       COUNT(*) as user_count\\nFROM users\\nGROUP BY source"}`;

export interface AIServiceOptions {
  apiKey: string;
}

export class AIService {
  private apiKey: string;

  constructor(options: AIServiceOptions) {
    this.apiKey = options.apiKey;
  }

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
      if (!parsed.config || !parsed.sql) {
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
 */
export function fallbackParse(input: string): AIResponse {
  const lower = input.toLowerCase();

  // 规则匹配
  if (lower.includes('趋势') || lower.includes('走势')) {
    return {
      config: {
        type: 'line',
        title: input.slice(0, 20),
        dimensions: ['date'],
        metrics: [{ field: 'value', name: '数值' }],
        timeRange: '7d',
      },
      sql: `SELECT DATE(created_at) as date,\n       COUNT(*) as value\nFROM orders\nWHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)\nGROUP BY DATE(created_at)\nORDER BY date`,
    };
  }

  if (lower.includes('对比') || lower.includes('排名')) {
    return {
      config: {
        type: 'bar',
        title: input.slice(0, 20),
        dimensions: ['name'],
        metrics: [{ field: 'value', name: '数值' }],
      },
      sql: `SELECT name,\n       COUNT(*) as value\nFROM orders\nGROUP BY name\nORDER BY value DESC`,
    };
  }

  if (lower.includes('占比') || lower.includes('分布')) {
    return {
      config: {
        type: 'pie',
        title: input.slice(0, 20),
        dimensions: ['name'],
        metrics: [{ field: 'value', name: '数值' }],
      },
      sql: `SELECT name,\n       COUNT(*) as value\nFROM orders\nGROUP BY name`,
    };
  }

  // 默认折线图
  return {
    config: {
      type: 'line',
      title: input.slice(0, 20),
      dimensions: ['date'],
      metrics: [{ field: 'value', name: '数值' }],
      timeRange: '7d',
    },
    sql: `SELECT DATE(created_at) as date,\n       COUNT(*) as value\nFROM orders\nWHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)\nGROUP BY DATE(created_at)\nORDER BY date`,
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
