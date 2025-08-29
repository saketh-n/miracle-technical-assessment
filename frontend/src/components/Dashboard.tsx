import React from 'react';
import { useParams } from 'react-router-dom';
import { useFontSize } from '../context/FontSizeContext';

const Dashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Get the dynamic :id from URL
  const { fontSize } = useFontSize();

  const getFontSizeClasses = () => {
    if (fontSize === 'large') {
      return { title: 'text-4xl', subtitle: 'text-xl' };
    }
    return { title: 'text-3xl', subtitle: 'text-lg' };
  };

  const { title, subtitle } = getFontSizeClasses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className={`${title} font-bold text-gray-900 mb-6 text-center`}>
          Custom Dashboard
        </h1>
        <p className={`${subtitle} text-gray-600 mb-12 text-center`}>
          Dashboard ID: {id} (Customize your layout here)
        </p>
        {/* Future: FiltersPanel, chart widgets, + Add Chart button, etc. */}
      </div>
    </div>
  );
};

export default Dashboard;