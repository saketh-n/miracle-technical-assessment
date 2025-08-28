import React, { useState } from 'react';
import { useFontSize } from '../context/FontSizeContext';

const RefreshButton: React.FC = () => {
  const { fontSize } = useFontSize();
  const [refreshStatus, setRefreshStatus] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const getFontSizeClasses = () => {
    if (fontSize === 'large') {
      return {
        button: 'text-lg',
        status: 'text-xl'
      };
    }
    return {
      button: 'text-base',
      status: 'text-lg'
    };
  };

  const { button, status } = getFontSizeClasses();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshStatus('');
    
    try {
      const response = await fetch('http://localhost:8000/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRefreshStatus(`Successfully refreshed ${data.total_records} studies`);
      } else {
        setRefreshStatus('Failed to refresh data');
      }
    } catch (error) {
      setRefreshStatus('Error connecting to server');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="text-center mb-8">
      {/* Refresh Button */}
      <div className="mb-4">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`${button} bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
      
      {/* Refresh Status */}
      {refreshStatus && (
        <div className={`${status} p-4 rounded-lg ${
          refreshStatus.includes('Successfully') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {refreshStatus}
        </div>
      )}
    </div>
  );
};

export default RefreshButton;
