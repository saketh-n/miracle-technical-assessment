import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFontSize } from '../context/FontSizeContext';
import { getDashboard } from '../utils/dashboardStorage';
import type { DashboardLayout } from '../utils/dashboardStorage';

const Dashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Get the dynamic :id from URL
  const { fontSize } = useFontSize();
  const [layout, setLayout] = useState<DashboardLayout>({});

  const getFontSizeClasses = () => {
    if (fontSize === 'large') {
      return { title: 'text-4xl', subtitle: 'text-xl' };
    }
    return { title: 'text-3xl', subtitle: 'text-lg' };
  };

  const { title, subtitle } = getFontSizeClasses();

  // Load dashboard layout from localStorage
  useEffect(() => {
    if (id) {
      const dashboardLayout = getDashboard(id);
      setLayout(dashboardLayout);
    }
  }, [id]);

  // Sort charts by position for rendering
  const sortedCharts = Object.entries(layout)
    .sort(([, posA], [, posB]) => posA - posB)
    .map(([chartId]) => chartId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className={`${title} font-bold text-gray-900 mb-6 text-center`}>
          Custom Dashboard
        </h1>
        <p className={`${subtitle} text-gray-600 mb-12 text-center`}>
          Dashboard ID: {id}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedCharts.length > 0 ? (
            sortedCharts.map((chartId) => (
              <div
                key={chartId}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Chart: {chartId} (Position: {layout[chartId]})
                </h2>
                <p className="text-gray-600">Placeholder for chart {chartId}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-center col-span-full">
              No charts added yet. Click "+ Add Chart" to start customizing.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;