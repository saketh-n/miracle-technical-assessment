import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useFontSize } from '../context/FontSizeContext';
import { initializeDashboards, getDashboards, createDashboard, deleteDashboard } from '../utils/dashboardStorage';

const Sidebar: React.FC = () => {
  const { fontSize } = useFontSize();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Handle deleting a dashboard
  const handleDeleteDashboard = (dashboardId: string, event: React.MouseEvent) => {
    event.preventDefault(); // Prevent navigation when clicking delete
    event.stopPropagation();

    deleteDashboard(dashboardId);
    const updatedDashboards = dashboards.filter(d => d.id !== dashboardId);
    setDashboards(updatedDashboards);

    // If we're currently on the deleted dashboard, navigate away
    const currentDashboardId = location.pathname.split('/dashboard/')[1];
    if (currentDashboardId === dashboardId) {
      if (updatedDashboards.length > 0) {
        // Navigate to the first available dashboard
        navigate(`/dashboard/${updatedDashboards[0].id}`);
      } else {
        // No dashboards left, navigate to main page
        navigate('/');
      }
    }
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
            {dashboards.length === 0 ? (
              <div className={`${subMenuItem} block px-4 py-1 text-gray-400 italic`}>
                No dashboards available
              </div>
            ) : (
              dashboards.map((dashboard) => (
              <div key={dashboard.id} className="flex items-center group">
                <NavLink
                  to={`/dashboard/${dashboard.id}`}
                  className={({ isActive }) =>
                    `${subMenuItem} flex-1 block px-4 py-1 rounded-lg transition-all duration-200 ${
                      isActive ? 'bg-white/20 text-white font-semibold' : 'hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {dashboard.name}
                </NavLink>
                <button
                  onClick={(e) => handleDeleteDashboard(dashboard.id, e)}
                  className="ml-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all duration-200"
                  title="Delete dashboard"
                >
                  <svg
                    className="w-4 h-4 text-red-300 hover:text-red-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
              ))
            )}
            <button
              onClick={handleCreateDashboard}
              className={`${subMenuItem} block px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 hover:scale-105 text-white font-semibold text-left w-full transition-all duration-200 border border-white/20 hover:border-white/30 shadow-sm hover:shadow-md`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Dashboard
              </span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;