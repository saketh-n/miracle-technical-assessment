import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFontSize } from '../context/FontSizeContext';

interface RefreshResponse {
  total_records: number;
}

const RefreshButton: React.FC = () => {
  const { fontSize } = useFontSize();
  const [refreshStatus, setRefreshStatus] = useState<string>('');
  const queryClient = useQueryClient();

  const getFontSizeClasses = () => {
    if (fontSize === 'large') {
      return {
        button: 'text-2xl',
        status: 'text-xl'
      };
    }
    return {
      button: 'text-xl',
      status: 'text-lg'
    };
  };

  const { button, status } = getFontSizeClasses();

  // Use react-query mutation for refresh endpoint
  const refreshMutation = useMutation({
    mutationFn: async (): Promise<RefreshResponse> => {
      const response = await fetch('http://localhost:8000/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh data');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setRefreshStatus(`Successfully refreshed ${data.total_records} studies`);
      // Invalidate all chart data queries to force re-fetch
      queryClient.invalidateQueries({ queryKey: ['chartData'] });
    },
    onError: (error) => {
      setRefreshStatus(error instanceof Error ? error.message : 'Error connecting to server');
    },
  });

  const handleRefresh = () => {
    setRefreshStatus('');
    refreshMutation.mutate();
  };

  const isRefreshing = refreshMutation.isPending;

  return (
    <div className="text-center">
      {/* Enhanced Refresh Button */}
      <div className="mb-6">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`${button} bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-6 rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[220px] relative overflow-hidden group`}
        >
          {/* Button background animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Button content */}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isRefreshing ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </>
            )}
          </span>
        </button>
      </div>
      
      {/* Enhanced Status Display */}
      {refreshStatus && (
        <div className={`${status} p-5 rounded-2xl max-w-md mx-auto transition-all duration-300 ${
          refreshStatus.includes('Successfully') 
            ? 'bg-green-50 text-green-800 border-2 border-green-200 shadow-lg shadow-green-100/50' 
            : 'bg-red-50 text-red-800 border-2 border-red-200 shadow-lg shadow-red-100/50'
        }`}>
          <div className="flex items-center justify-center gap-2">
            {refreshStatus.includes('Successfully') ? (
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="font-semibold">{refreshStatus}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefreshButton;
