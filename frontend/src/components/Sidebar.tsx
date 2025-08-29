import React from 'react';
import { NavLink } from 'react-router-dom';
import { useFontSize } from '../context/FontSizeContext';

const Sidebar: React.FC = () => {
  const { fontSize } = useFontSize();

  const getFontSizeClasses = () => {
    if (fontSize === 'large') {
      return {
        menuItem: 'text-lg',
        menuTitle: 'text-2xl',
      };
    }
    return {
      menuItem: 'text-base',
      menuTitle: 'text-xl',
    };
  };

  const { menuItem, menuTitle } = getFontSizeClasses();

  return (
    <div className="w-64 bg-gradient-to-b from-blue-600 to-indigo-600 text-white min-h-screen p-6 shadow-lg">
      <h2 className={`${menuTitle} font-bold mb-8`}>Miracle</h2>
      <nav className="space-y-4">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${menuItem} block px-4 py-2 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-white/20 text-white font-semibold'
                : 'hover:bg-white/10 hover:text-white'
            }`
          }
        >
          Main
        </NavLink>
        <NavLink
          to="/charts"
          className={({ isActive }) =>
            `${menuItem} block px-4 py-2 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-white/20 text-white font-semibold'
                : 'hover:bg-white/10 hover:text-white'
            }`
          }
        >
          Charts
        </NavLink>
        <NavLink
          to="/dashboard/1" // Default to dashboard ID 1 for now
          className={({ isActive }) =>
            `${menuItem} block px-4 py-2 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-white/20 text-white font-semibold'
                : 'hover:bg-white/10 hover:text-white'
            }`
          }
        >
          Dashboards
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;