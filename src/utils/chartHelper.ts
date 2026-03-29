import type { ChartType, DataPoint, ChartConfig } from '../types';

/**
 * 生成 ECharts 配置选项
 */
export function generateEChartsOption(
  type: ChartType,
  data: DataPoint[],
  config: ChartConfig,
  theme: 'light' | 'dark' = 'light'
) {
  const colors = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];
  
  const baseOption = {
    color: colors,
    title: {
      show: false, // 标题在卡片头部显示
    },
    tooltip: {
      trigger: type === 'pie' ? 'item' : 'axis',
      backgroundColor: theme === 'dark' ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: theme === 'dark' ? '#444' : '#e5e5e7',
      borderWidth: 1,
      textStyle: {
        color: theme === 'dark' ? '#fff' : '#1d1d1f',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '48px',
      top: '10%',
      containLabel: true,
    },
    animation: true,
    animationDuration: 500,
  };

  switch (type) {
    case 'line':
      return generateLineOption(baseOption, data, config, theme);
    case 'bar':
      return generateBarOption(baseOption, data, config, theme);
    case 'pie':
      return generatePieOption(baseOption, data, config, theme);
    default:
      return baseOption;
  }
}

function generateLineOption(baseOption: any, data: DataPoint[], config: ChartConfig, theme: 'light' | 'dark') {
  const xField = config.dimensions[0] || 'date';
  const metric = config.metrics[0];
  const textColor = theme === 'dark' ? '#a1a1a6' : '#86868b';
  const lineColor = theme === 'dark' ? '#444' : '#f0f0f0';

  return {
    ...baseOption,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((d) => d[xField]),
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor },
    },
    series: [
      {
        name: metric?.name || '数值',
        type: 'line',
        data: data.map((d) => d[metric?.field || 'value']),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3 },
        areaStyle: {
          opacity: 0.1,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#1677ff' },
              { offset: 1, color: 'rgba(22, 119, 255, 0)' },
            ],
          },
        },
      },
    ],
  };
}

function generateBarOption(baseOption: any, data: DataPoint[], config: ChartConfig, theme: 'light' | 'dark') {
  const xField = config.dimensions[0] || 'name';
  const metric = config.metrics[0];
  const textColor = theme === 'dark' ? '#a1a1a6' : '#86868b';
  const lineColor = theme === 'dark' ? '#444' : '#f0f0f0';

  return {
    ...baseOption,
    xAxis: {
      type: 'category',
      data: data.map((d) => d[xField]),
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor },
    },
    series: [
      {
        name: metric?.name || '数值',
        type: 'bar',
        data: data.map((d) => d[metric?.field || 'value']),
        barWidth: '40%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };
}

function generatePieOption(baseOption: any, data: DataPoint[], config: ChartConfig, theme: 'light' | 'dark') {
  const nameField = config.dimensions[0] || 'name';
  const metric = config.metrics[0];

  return {
    ...baseOption,
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    series: [
      {
        name: metric?.name || '数值',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        data: data.map((d) => ({
          name: d[nameField],
          value: d[metric?.field || 'value'],
        })),
        itemStyle: {
          borderRadius: 8,
          borderColor: theme === 'dark' ? '#2d2d2f' : '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 计算网格的下一个可用位置
 */
export function getNextGridPosition(
  existingCharts: { position: { x: number; y: number; w: number; h: number } }[]
): { x: number; y: number; w: number; h: number } {
  const cols = 12;
  const defaultW = 6;
  const defaultH = 8;

  if (existingCharts.length === 0) {
    return { x: 0, y: 0, w: defaultW, h: defaultH };
  }

  // 找到最底部的图表
  let maxY = 0;
  existingCharts.forEach((chart) => {
    const bottom = chart.position.y + chart.position.h;
    if (bottom > maxY) {
      maxY = bottom;
    }
  });

  // 尝试在同一行放置（如果空间足够）
  const lastChart = existingCharts[existingCharts.length - 1];
  if (lastChart.position.x + lastChart.position.w + defaultW <= cols) {
    return {
      x: lastChart.position.x + lastChart.position.w,
      y: lastChart.position.y,
      w: defaultW,
      h: defaultH,
    };
  }

  // 新行放置
  return { x: 0, y: maxY, w: defaultW, h: defaultH };
}
