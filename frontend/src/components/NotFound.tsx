import React from 'react';
import { useFontSize } from '../context/FontSizeContext';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  const { fontSize } = useFontSize();

  const getFontSizeClasses = () => {
    if (fontSize === 'large') {
      return {
        heading: 'text-5xl',
        subtext: 'text-xl',
      };
    }
    return {
      heading: 'text-4xl',
      subtext: 'text-lg',
    };
  };

  const { heading, subtext } = getFontSizeClasses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-6">
        <div className="bg-white/30 backdrop-blur-md rounded-3xl p-12 border border-white/50 shadow-xl">
          <h1 className={`${heading} font-bold text-gray-900 mb-6`}>
            404 - Page Not Found
          </h1>
          <p className={`${subtext} text-gray-600 mb-8`}>
            Oops! The page you're looking for doesn't exist.
          </p>
          <Link
            to="/"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Return to Main
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;