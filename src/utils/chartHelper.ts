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
    case 'scatter':
      return generateScatterOption(baseOption, data, config, theme);
    case 'radar':
      return generateRadarOption(baseOption, data, config, theme);
    case 'funnel':
      return generateFunnelOption(baseOption, data, config, theme);
    case 'gauge':
      return generateGaugeOption(baseOption, data, config, theme);
    case 'heatmap':
      return generateHeatmapOption(baseOption, data, config, theme);
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
 * 散点图配置
 */
function generateScatterOption(baseOption: any, data: DataPoint[], config: ChartConfig, theme: 'light' | 'dark') {
  const textColor = theme === 'dark' ? '#a1a1a6' : '#86868b';
  const lineColor = theme === 'dark' ? '#444' : '#f0f0f0';
  
  // 支持双指标：metrics[0] 为 X 轴，metrics[1] 为 Y 轴
  const xMetric = config.metrics[0] || { field: 'x', name: 'X轴' };
  const yMetric = config.metrics[1] || config.metrics[0] || { field: 'y', name: 'Y轴' };
  const sizeMetric = config.metrics[2]; // 可选的第三指标控制气泡大小
  
  const nameField = config.dimensions[0] || 'name';

  return {
    ...baseOption,
    grid: {
      ...baseOption.grid,
      bottom: '15%',
    },
    xAxis: {
      type: 'value',
      name: xMetric.name,
      nameLocation: 'middle',
      nameGap: 30,
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: lineColor } },
    },
    yAxis: {
      type: 'value',
      name: yMetric.name,
      nameLocation: 'middle',
      nameGap: 40,
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: lineColor } },
    },
    series: [
      {
        name: `${xMetric.name} vs ${yMetric.name}`,
        type: 'scatter',
        data: data.map((d) => ({
          name: d[nameField],
          value: [d[xMetric.field], d[yMetric.field]],
          symbolSize: sizeMetric ? Math.sqrt(Number(d[sizeMetric.field]) || 10) * 3 : 15,
        })),
        itemStyle: {
          color: '#1677ff',
          opacity: 0.7,
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
            borderColor: '#fff',
            borderWidth: 2,
          },
        },
      },
    ],
  };
}

/**
 * 雷达图配置
 */
function generateRadarOption(baseOption: any, data: DataPoint[], config: ChartConfig, theme: 'light' | 'dark') {
  const textColor = theme === 'dark' ? '#a1a1a6' : '#86868b';
  
  // 维度作为雷达图的指标轴
  const indicators = config.dimensions.map((dim) => {
    const values = data.map((d) => Number(d[dim]) || 0);
    const max = Math.max(...values, 100);
    return {
      name: dim,
      max: Math.ceil(max * 1.1),
    };
  });

  // 每条数据是一个系列
  const seriesData = data.map((d) => ({
    name: d.name || d[config.dimensions[0]] || '数据',
    value: config.dimensions.map((dim) => Number(d[dim]) || 0),
  }));

  return {
    ...baseOption,
    tooltip: {
      trigger: 'item',
    },
    legend: {
      show: true,
      bottom: 10,
      textStyle: { color: textColor },
    },
    radar: {
      indicator: indicators,
      radius: '65%',
      center: ['50%', '45%'],
      axisName: {
        color: textColor,
      },
      splitArea: {
        areaStyle: {
          color: theme === 'dark' 
            ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
            : ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.05)'],
        },
      },
    },
    series: [
      {
        type: 'radar',
        data: seriesData,
        areaStyle: { opacity: 0.2 },
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  };
}

/**
 * 漏斗图配置
 */
function generateFunnelOption(baseOption: any, data: DataPoint[], config: ChartConfig, theme: 'light' | 'dark') {
  const nameField = config.dimensions[0] || 'stage';
  const metric = config.metrics[0] || { field: 'count', name: '数量' };
  
  // 漏斗图数据需要从大到小排序
  const sortedData = [...data].sort((a, b) => Number(b[metric.field]) - Number(a[metric.field]));

  return {
    ...baseOption,
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      show: true,
      bottom: 10,
      textStyle: { 
        color: theme === 'dark' ? '#a1a1a6' : '#86868b' 
      },
    },
    series: [
      {
        name: metric.name,
        type: 'funnel',
        left: '10%',
        top: 20,
        bottom: 60,
        width: '80%',
        min: 0,
        max: Number(sortedData[0]?.[metric.field]) || 100,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}\n{c}',
          color: '#fff',
        },
        labelLine: {
          length: 10,
          lineStyle: {
            width: 1,
            type: 'solid',
          },
        },
        itemStyle: {
          borderColor: theme === 'dark' ? '#2d2d2f' : '#fff',
          borderWidth: 1,
        },
        emphasis: {
          label: {
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: sortedData.map((d) => ({
          name: d[nameField],
          value: d[metric.field],
        })),
      },
    ],
  };
}

/**
 * 仪表盘配置
 */
function generateGaugeOption(baseOption: any, data: DataPoint[], config: ChartConfig, theme: 'light' | 'dark') {
  const textColor = theme === 'dark' ? '#fff' : '#1d1d1f';
  const metric = config.metrics[0] || { field: 'value', name: '数值' };
  
  // 取第一条数据的值
  const value = Number(data[0]?.[metric.field]) || 0;
  const name = data[0]?.name || metric.name;

  return {
    ...baseOption,
    tooltip: {
      formatter: '{a} <br/>{b} : {c}%',
    },
    series: [
      {
        name: metric.name,
        type: 'gauge',
        radius: '80%',
        center: ['50%', '55%'],
        min: 0,
        max: 100,
        startAngle: 200,
        endAngle: -20,
        splitNumber: 10,
        itemStyle: {
          color: '#1677ff',
        },
        progress: {
          show: true,
          roundCap: true,
          width: 18,
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '12%',
          width: 20,
          offsetCenter: [0, '-60%'],
          itemStyle: {
            color: 'auto',
          },
        },
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 18,
            color: theme === 'dark' ? [[1, 'rgba(255,255,255,0.1)']] : [[1, '#e5e5e7']],
          },
        },
        axisTick: {
          splitNumber: 2,
          lineStyle: {
            width: 2,
            color: '#999',
          },
        },
        splitLine: {
          length: 12,
          lineStyle: {
            width: 3,
            color: 'auto',
          },
        },
        axisLabel: {
          distance: 30,
          color: '#999',
          fontSize: 12,
        },
        title: {
          show: true,
          offsetCenter: [0, '20%'],
          fontSize: 16,
          color: textColor,
        },
        detail: {
          backgroundColor: theme === 'dark' ? '#2d2d2f' : '#fff',
          borderColor: theme === 'dark' ? '#444' : '#999',
          borderWidth: 1,
          width: '60%',
          lineHeight: 40,
          height: 40,
          borderRadius: 8,
          offsetCenter: [0, '50%'],
          valueAnimation: true,
          formatter: function (value: number) {
            return '{value|' + value.toFixed(1) + '}{unit|%' + '}';
          },
          rich: {
            value: {
              fontSize: 28,
              fontWeight: 'bolder',
              color: 'auto',
            },
            unit: {
              fontSize: 14,
              color: '#999',
              padding: [0, 0, -10, 5],
            },
          },
        },
        data: [
          {
            value: value,
            name: name,
          },
        ],
      },
    ],
  };
}

/**
 * 热力图配置
 */
function generateHeatmapOption(baseOption: any, data: DataPoint[], config: ChartConfig, theme: 'light' | 'dark') {
  const textColor = theme === 'dark' ? '#a1a1a6' : '#86868b';
  const lineColor = theme === 'dark' ? '#444' : '#f0f0f0';
  
  // 假设 dimensions[0] 是 X 轴，dimensions[1] 是 Y 轴
  const xField = config.dimensions[0] || 'x';
  const yField = config.dimensions[1] || 'y';
  const valueField = config.metrics[0]?.field || 'value';
  
  // 提取唯一的 X 和 Y 值
  const xValues = [...new Set(data.map((d) => String(d[xField])))];
  const yValues = [...new Set(data.map((d) => String(d[yField])))];
  
  // 构建热力图数据 [[xIndex, yIndex, value], ...]
  const heatmapData = data.map((d) => [
    xValues.indexOf(String(d[xField])),
    yValues.indexOf(String(d[yField])),
    Number(d[valueField]) || 0,
  ]);

  return {
    ...baseOption,
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const xName = xValues[params.value[0]];
        const yName = yValues[params.value[1]];
        return `${xName} × ${yName}<br/>${params.value[2]}`;
      },
    },
    grid: {
      ...baseOption.grid,
      top: '10%',
      bottom: '15%',
    },
    xAxis: {
      type: 'category',
      data: xValues,
      splitArea: {
        show: true,
      },
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor },
    },
    yAxis: {
      type: 'category',
      data: yValues,
      splitArea: {
        show: true,
      },
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor },
    },
    visualMap: {
      min: 0,
      max: Math.max(...data.map((d) => Number(d[valueField]) || 0), 100),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      textStyle: {
        color: textColor,
      },
      inRange: {
        color: theme === 'dark'
          ? ['#1a237e', '#0d47a1', '#1976d2', '#42a5f5', '#90caf9']
          : ['#e3f2fd', '#90caf9', '#42a5f5', '#1976d2', '#0d47a1'],
      },
    },
    series: [
      {
        name: config.metrics[0]?.name || '数值',
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: true,
          color: theme === 'dark' ? '#fff' : '#333',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
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
