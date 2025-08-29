import React from 'react';
import { useFontSize } from '../../context/FontSizeContext';

interface BaseChartWidgetProps {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

const BaseChartWidget: React.FC<BaseChartWidgetProps> = ({
  title,
  children,
  isLoading = false,
  error = null,
  className = ''
}) => {
  const { fontSize } = useFontSize();

  const getFontSizeClasses = () => {
    if (fontSize === 'large') {
      return {
        title: 'text-xl',
        content: 'text-base',
      };
    }
    return {
      title: 'text-lg',
      content: 'text-sm',
    };
  };

  const { title: titleClass, content: contentClass } = getFontSizeClasses();

  return (
    <div className={`bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200 ${className}`}>
      <h2 className={`${titleClass} font-semibold text-gray-800 mb-4`}>
        {title}
      </h2>
      {error ? (
        <div className={`text-center text-red-600 ${contentClass}`}>
          Error: {error}
        </div>
      ) : isLoading ? (
        <div className={`text-center text-gray-500 ${contentClass}`}>
          Loading...
        </div>
      ) : (
        <div className={contentClass}>
          {children}
        </div>
      )}
    </div>
  );
};

export default BaseChartWidget;
