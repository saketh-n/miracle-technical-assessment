import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useFontSize } from '../context/FontSizeContext';
import { initializeDashboards, getDashboards, createDashboard } from '../utils/dashboardStorage';

const Sidebar: React.FC = () => {
  const { fontSize } = useFontSize();
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<{ id: string; name: string }[]>([]);

  const getFontSizeClasses = () => {
    if (fontSize === 'large') {
      return {
        menuItem: 'text-lg',
        menuTitle: 'text-2xl',
        subMenuItem: 'text-base',
      };
    }
    return {
      menuItem: 'text-base',
      menuTitle: 'text-xl',
      subMenuItem: 'text-sm',
    };
  };

  const { menuItem, menuTitle, subMenuItem } = getFontSizeClasses();

  // Initialize and load dashboards
  useEffect(() => {
    initializeDashboards();
    const storedDashboards = getDashboards();
    const dashboardList = Object.keys(storedDashboards).map((id, index) => ({
      id,
      name: `Dashboard ${index + 1}`,
    }));
    setDashboards(dashboardList);
  }, []);

  // Handle creating a new dashboard
  const handleCreateDashboard = () => {
    const newId = createDashboard();
    setDashboards([...dashboards, { id: newId, name: `Dashboard ${dashboards.length + 1}` }]);
    navigate(`/dashboard/${newId}`);
  };

  return (
    <div className="w-64 bg-gradient-to-b from-blue-600 to-indigo-600 text-white min-h-screen p-6 shadow-lg">
      <h2 className={`${menuTitle} font-bold mb-8`}>Miracle</h2>
      <nav className="space-y-4">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${menuItem} block px-4 py-2 rounded-lg transition-all duration-200 ${
              isActive ? 'bg-white/20 text-white font-semibold' : 'hover:bg-white/10 hover:text-white'
            }`
          }
        >
          Main
        </NavLink>
        <NavLink
          to="/charts"
          className={({ isActive }) =>
            `${menuItem} block px-4 py-2 rounded-lg transition-all duration-200 ${
              isActive ? 'bg-white/20 text-white font-semibold' : 'hover:bg-white/10 hover:text-white'
            }`
          }
        >
          Charts
        </NavLink>
        <div>
          <div className={`${menuItem} block px-4 py-2 font-semibold`}>Dashboards</div>
          <div className="ml-4 space-y-2">
            {dashboards.map((dashboard) => (
              <NavLink
                key={dashboard.id}
                to={`/dashboard/${dashboard.id}`}
                className={({ isActive }) =>
                  `${subMenuItem} block px-4 py-1 rounded-lg transition-all duration-200 ${
                    isActive ? 'bg-white/20 text-white font-semibold' : 'hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {dashboard.name}
              </NavLink>
            ))}
            <button
              onClick={handleCreateDashboard}
              className={`${subMenuItem} block px-4 py-1 rounded-lg hover:bg-white/10 hover:text-white text-left w-full transition-all duration-200`}
            >
              + New Dashboard
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;