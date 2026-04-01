import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DatabaseOutlined } from '@ant-design/icons';
import { useDashboardStore } from '../../store/dashboardStore';

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  {
    key: 'datacenter',
    icon: <DatabaseOutlined />,
    label: '数据中心',
    path: '/',
  },
];

const Sidebar: React.FC = () => {
  const { theme } = useDashboardStore();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside
      className={`w-60 flex-shrink-0 border-r flex flex-col ${
        theme === 'dark'
          ? 'bg-[#2d2d2f] border-[#3d3d3f]'
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Logo Area */}
      <div className="h-16 px-6 flex items-center border-b border-inherit">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <DatabaseOutlined className="text-white text-lg" />
          </div>
          <h1
            className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-text-primary'
            }`}
          >
            AI Dashboard
          </h1>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.key}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? theme === 'dark'
                      ? 'bg-primary/20 text-primary border-r-2 border-primary'
                      : 'bg-primary/10 text-primary border-r-2 border-primary'
                    : theme === 'dark'
                      ? 'text-[#a1a1a6] hover:bg-[#3d3d3f] hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-inherit">
        <p
          className={`text-xs text-center ${
            theme === 'dark' ? 'text-[#6e6e73]' : 'text-gray-400'
          }`}
        >
          AI Dashboard Builder v1.0
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
