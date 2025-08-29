import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { useFontSize } from '../../context/FontSizeContext';
import type { FilterState } from '../FiltersPanel';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c', '#d0ed57'];

// Utility function to truncate text
const truncateText = (text: string, maxLength: number = 20): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Custom label renderer for pie charts that handles overflow
const renderCustomPieLabel = (entry: any) => {
  const { name, percent } = entry;
  if (percent < 0.05) return null; // Hide labels for very small slices
  return `${truncateText(name, 15)} (${(percent * 100).toFixed(0)}%)`;
};



export type ChartType = 'bar' | 'pie' | 'line';
export type BarLayout = 'horizontal' | 'vertical';

export interface ChartConfig {
  type: ChartType;
  width?: number;
  height?: number;
  dataKeys?: string[];
  layout?: BarLayout;
  showLegend?: boolean;
}

export interface BaseChartWidgetProps<T> {
  endpoint: string;
  title: string;
  chartConfig: ChartConfig;
  transformData: (data: T) => any[];
  className?: string;
  refreshTrigger?: number; // Optional prop to trigger re-fetch
  showDeleteButton?: boolean; // Whether to show delete button
  onDelete?: () => void; // Callback when delete button is clicked
  filters?: FilterState; // Optional filters to apply
}

export interface DeleteProps {
  showDeleteButton?: boolean;
  onDelete?: () => void;
}

function BaseChartWidget<T extends Record<string, any>>({
  endpoint,
  title,
  chartConfig,
  transformData,
  className = '',
  refreshTrigger,
  showDeleteButton = false,
  onDelete,
  filters
}: BaseChartWidgetProps<T>) {
  const { fontSize } = useFontSize();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildQueryString = (filters?: FilterState): string => {
    if (!filters) return '';
    
    const params = new URLSearchParams();
    
    if (filters.region && filters.region !== 'ALL') {
      params.append('region', filters.region);
    }
    
    if (filters.condition && filters.condition.length > 0) {
      filters.condition.forEach(condition => {
        params.append('conditions', condition);
      });
    }
    
    if (filters.startDate) {
      params.append('start_date', filters.startDate.toISOString().split('T')[0]);
    }
    
    if (filters.endDate) {
      params.append('end_date', filters.endDate.toISOString().split('T')[0]);
    }
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const queryString = buildQueryString(filters);
        const fullUrl = `${endpoint}${queryString}`;
        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch data from ${fullUrl}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [endpoint, refreshTrigger, filters]);

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
  const chartData = data ? transformData(data) : [];

  const renderChart = () => {
    const { type, height = 300, dataKeys = ['value'], layout = 'horizontal', showLegend = true } = chartConfig;

    // Transform chart data to truncate long names for better display
    const processedChartData = chartData.map(item => ({
      ...item,
      displayName: item.name ? truncateText(item.name, 20) : item.name,
      originalName: item.name // Keep original for tooltips
    }));

    switch (type) {
      case 'bar':
        if (layout === 'vertical') {
          return (
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={processedChartData} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="displayName" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'value' ? 'Count' : name]}
                  labelFormatter={(label) => {
                    const item = processedChartData.find(d => d.displayName === label);
                    return item?.originalName || label;
                  }}
                />
                {showLegend && <Legend />}
                {dataKeys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={COLORS[index % COLORS.length]}
                    name={key === 'value' ? 'Count' : key}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          );
        }
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={processedChartData} margin={{ top: 10, right: 20, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="displayName" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name === 'value' ? 'Count' : name]}
                labelFormatter={(label) => {
                  const item = processedChartData.find(d => d.displayName === label);
                  return item?.originalName || label;
                }}
              />
              {showLegend && <Legend />}
              {dataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={COLORS[index % COLORS.length]}
                  name={key === 'value' ? 'Count' : key}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={processedChartData}
                cx="50%"
                cy="50%"
                outerRadius="70%"
                fill="#8884d8"
                dataKey={dataKeys[0] || 'value'}
                label={renderCustomPieLabel}
                labelLine={false}
              >
                {processedChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, _name) => [value, 'Count']}
                labelFormatter={(label) => {
                  const item = processedChartData.find(d => d.displayName === label);
                  const fullName = item?.originalName || label;
                  return fullName;
                }}
              />
              {showLegend && (
                <Legend 
                  formatter={(value) => {
                    const item = processedChartData.find(d => d.displayName === value);
                    return truncateText(item?.originalName || value, 25);
                  }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={processedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              {showLegend && <Legend />}
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[index % COLORS.length]}
                  name={key}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className={`bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200 ${className} relative overflow-hidden`}>
      <div className="flex justify-between items-start mb-4">
        <h2 className={`${titleClass} font-semibold text-gray-800 flex-1`}>
          {title}
        </h2>
        {showDeleteButton && onDelete && (
          <button
            onClick={onDelete}
            className="ml-2 p-1.5 rounded-full hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors duration-200"
            title="Delete widget"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      {error ? (
        <div className={`text-center text-red-600 ${contentClass} h-64 flex items-center justify-center`}>
          <div>
            <p className="font-medium">Error loading chart</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      ) : isLoading ? (
        <div className={`text-center text-gray-500 ${contentClass} h-64 flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="w-full" style={{ minHeight: '280px' }}>
          {renderChart()}
        </div>
      )}
    </div>
  );
}

export default BaseChartWidget;
