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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-8">
      <div className="text-center max-w-3xl mx-auto px-8">
        {/* Enhanced Central Content Block with Frosted Glass Effect */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl px-16 py-12 border border-white/60 shadow-2xl shadow-blue-100/50 relative overflow-hidden">
          {/* Subtle background pattern overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-blue-50/20 pointer-events-none"></div>
          
          {/* Content */}
          <div className="relative z-10" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
            {/* Header Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 className={`${heading} font-bold text-gray-900`}>
                Welcome to{' '}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Miracle
                </span>
              </h1>
            </div>
            
            {/* Subtext Section */}
            <div style={{ marginBottom: '3rem' }}>
              <p className={`${subtext} text-gray-700 leading-relaxed max-w-2xl mx-auto`}>
                Your pharmaceutical intelligence platform. Get insights, track progress, and make data-driven decisions to accelerate drug development and improve patient outcomes.
              </p>
            </div>
            
            {/* Refresh Button Section */}
            <div>
              <RefreshButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;