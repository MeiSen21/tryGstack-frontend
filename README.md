# AI Dashboard Builder - 前端

AI 驱动的数据可视化看板工具，用户通过自然语言描述需求，AI 自动生成图表。

## 功能特性

### P0 - 核心功能 ✅

1. **项目初始化**
   - Vite + React 18 + TypeScript
   - Tailwind CSS + Ant Design 5
   - ECharts 5 + react-grid-layout + Zustand

2. **基础布局**
   - Header：Logo + Workspace选择器 + 分享 + 主题切换
   - InputArea：自然语言输入框 + 示例提示
   - Dashboard：12列网格画布容器

3. **AI图表生成**
   - 调用 Kimi API 解析用户需求
   - 自动生成图表配置和 SQL 语句
   - Mock 数据生成
   - ECharts 渲染（折线/柱状/饼图）
   - SQL 展示（可展开/折叠）

4. **拖拽布局**
   - react-grid-layout 实现
   - 12列网格系统
   - 支持拖拽调整位置
   - 支持调整大小
   - 自动保存布局

5. **图表管理**
   - 添加图表
   - 删除图表（带确认）
   - 切换图表类型
   - 编辑图表标题

6. **状态管理**
   - Zustand 状态管理
   - localStorage 持久化
   - Workspace 多工作区支持

### P1 - 增强功能 ✅

- ✅ 编辑图表标题
- ✅ 历史记录（通过 Workspace）
- ✅ 分享链接（URL 参数）
- ✅ 主题切换（浅色/深色）

## 技术栈

- **框架**: React 18 + TypeScript
- **构建**: Vite 5
- **UI库**: Ant Design 5
- **图表**: ECharts 5 + echarts-for-react
- **布局**: react-grid-layout
- **状态**: Zustand + persist middleware
- **样式**: Tailwind CSS
- **日期**: dayjs

## 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，添加你的 Kimi API Key：

```bash
VITE_KIMI_API_KEY=your_api_key_here
```

> 获取 API Key: https://platform.moonshot.cn/

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 4. 构建生产版本

```bash
npm run build
```

输出到 `dist/` 目录

## 项目结构

```
frontend/
├── src/
│   ├── components/           # 组件
│   │   ├── Header/          # 顶部导航
│   │   ├── InputArea/       # 输入区域
│   │   ├── Dashboard/       # 网格画布
│   │   ├── ChartCard/       # 图表卡片
│   │   ├── SQLDisplay/      # SQL展示
│   │   └── WorkspaceSelector/ # 工作区选择器
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useAI.ts         # AI 调用逻辑
│   │   └── useChart.ts      # 图表管理逻辑
│   ├── services/            # 服务层
│   │   ├── aiService.ts     # Kimi API 封装
│   │   └── mockService.ts   # Mock 数据生成
│   ├── store/               # 状态管理
│   │   └── dashboardStore.ts # Zustand store
│   ├── types/               # 类型定义
│   │   └── index.ts
│   ├── utils/               # 工具函数
│   │   └── chartHelper.ts   # 图表配置生成
│   ├── App.tsx              # 根组件
│   ├── main.tsx             # 入口
│   └── index.css            # 全局样式
├── public/                  # 静态资源
├── .env.example             # 环境变量示例
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## 使用说明

### 创建图表

1. 在输入框中输入自然语言描述，例如：
   - "最近7天销售额趋势"
   - "各品类订单量对比"
   - "用户来源占比分析"

2. 点击"生成图表"或按 Enter 键

3. AI 会自动解析需求，生成图表和 SQL

### 管理图表

- **拖拽**: 拖动图表卡片调整位置
- **调整大小**: 拖动右下角调整图表大小
- **切换类型**: 点击图表类型下拉菜单
- **编辑标题**: 点击更多菜单 → 编辑标题
- **删除**: 点击更多菜单 → 删除图表

### 工作区

- 支持多个工作区管理不同的看板
- 可以创建、编辑、删除工作区
- 工作区数据自动保存到 localStorage

### 分享

- 点击顶部"分享"按钮
- 复制生成的链接
- 他人打开链接即可查看相同的看板

### 主题切换

- 点击顶部月亮/太阳图标切换深色/浅色模式

## 注意事项

1. **API Key**: 如果没有配置 Kimi API Key，系统会使用 fallback 规则解析（功能有限）

2. **数据**: 当前版本使用 Mock 数据，不会真正查询数据库

3. **浏览器**: 推荐使用 Chrome、Edge、Firefox 最新版本

## 开发计划

- [ ] 后端 API 集成
- [ ] 真实数据库连接
- [ ] 用户认证系统
- [ ] 更多图表类型
- [ ] 数据导出功能
- [ ] 图表联动

## License

MIT
