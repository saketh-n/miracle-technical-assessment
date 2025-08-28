import React from 'react';
import { useFontSize } from '../context/FontSizeContext';
import RefreshButton from './RefreshButton';

const WelcomePage: React.FC = () => {
  const { fontSize } = useFontSize();
  
  const getFontSizeClasses = () => {
    if (fontSize === 'large') {
      return {
        heading: 'text-6xl md:text-7xl',
        subtext: 'text-2xl'
      };
    }
    return {
      heading: 'text-5xl md:text-6xl',
      subtext: 'text-xl'
    };
  };

  const { heading, subtext } = getFontSizeClasses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-6">
        {/* Refresh Button - Outside the main content div */}
        <RefreshButton />
        
        <div className="bg-white/30 backdrop-blur-md rounded-3xl p-12 border border-white/50 shadow-xl">
          <h1 className={`${heading} font-bold text-gray-900 mb-12`}>
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Miracle
            </span>
          </h1>
          <p className={`${subtext} text-gray-600 leading-loose mb-8`}>
            Your pharmaceutical intelligence platform. Get insights, track progress, and make data-driven decisions to accelerate drug development and improve patient outcomes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;