import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 注册 dayjs 插件（必须在 Ant Design 使用前注册）
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);
dayjs.extend(weekOfYear);
dayjs.extend(advancedFormat);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
