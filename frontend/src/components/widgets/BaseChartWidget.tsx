
import { useQuery } from '@tanstack/react-query';
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
  isPreview?: boolean; // Whether this is a preview (prevents API calls)
}

export interface DeleteProps {
  showDeleteButton?: boolean;
  onDelete?: () => void;
}

// Generate realistic dummy data for preview mode
const generateDummyData = (config: ChartConfig) => {
  const { type, dataKeys = ['value'] } = config;
  
  switch (type) {
    case 'bar':
      if (dataKeys.length > 1) {
        // Multi-series bar chart (e.g., phases, durations)
        return [
          { name: 'Phase 1', clinicaltrials: 45, eudract: 32 },
          { name: 'Phase 2', clinicaltrials: 78, eudract: 56 },
          { name: 'Phase 3', clinicaltrials: 34, eudract: 28 },
          { name: 'Phase 4', clinicaltrials: 23, eudract: 19 },
          { name: 'Not Specified', clinicaltrials: 12, eudract: 8 }
        ];
      } else {
        // Single series bar chart (e.g., totals, countries)
        return [
          { name: 'United States', value: 1250 },
          { name: 'Germany', value: 890 },
          { name: 'France', value: 756 },
          { name: 'United Kingdom', value: 634 },
          { name: 'Italy', value: 523 },
          { name: 'Spain', value: 445 },
          { name: 'Canada', value: 398 },
          { name: 'Netherlands', value: 312 }
        ];
      }
      
    case 'pie':
      if (dataKeys.length > 1) {
        // Multi-series pie chart (unlikely, but handle gracefully)
        return [
          { name: 'Category A', value: 45 },
          { name: 'Category B', value: 32 },
          { name: 'Category C', value: 28 },
          { name: 'Category D', value: 19 }
        ];
      } else {
        // Single series pie chart (e.g., conditions, enrollment, status)
        return [
          { name: 'Cardiovascular Disease', value: 234 },
          { name: 'Oncology', value: 189 },
          { name: 'Neurological Disorders', value: 156 },
          { name: 'Respiratory Conditions', value: 134 },
          { name: 'Endocrine Disorders', value: 98 },
          { name: 'Other', value: 67 }
        ];
      }
      
    case 'line':
      // Line chart (e.g., years)
      return [
        { year: '2019', clinicaltrials: 45, eudract: 32 },
        { year: '2020', clinicaltrials: 52, eudract: 38 },
        { year: '2021', clinicaltrials: 67, eudract: 45 },
        { year: '2022', clinicaltrials: 78, eudract: 56 },
        { year: '2023', clinicaltrials: 89, eudract: 67 },
        { year: '2024', clinicaltrials: 95, eudract: 72 }
      ];
      
    default:
      return [
        { name: 'Sample Data 1', value: 100 },
        { name: 'Sample Data 2', value: 75 },
        { name: 'Sample Data 3', value: 50 }
      ];
  }
};

// Render chart with provided data (used for both real and dummy data)
const renderChartWithData = (chartData: any[], chartConfig: ChartConfig) => {
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
              formatter={(value, name) => [value, truncateText(name === 'value' ? 'Count' : String(name), 15)]}
              labelFormatter={(label) => {
                const item = processedChartData.find(d => d.displayName === label);
                const fullName = item?.originalName || label;
                return truncateText(fullName, 15);
              }}
            />
            {showLegend && (
              <Legend 
                formatter={(value) => {
                  const item = processedChartData.find(d => d.displayName === value);
                  return truncateText(item?.originalName || String(value), 25);
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

function BaseChartWidget<T extends Record<string, any>>({
  endpoint,
  title,
  chartConfig,
  transformData,
  className = '',
  refreshTrigger,
  showDeleteButton = false,
  onDelete,
  filters,
  isPreview = false
}: BaseChartWidgetProps<T>) {
  const { fontSize } = useFontSize();

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

  // Use react-query for data fetching with caching
  const { data, isLoading, error } = useQuery({
    queryKey: ['chartData', endpoint, filters, refreshTrigger],
    queryFn: async () => {
      const queryString = buildQueryString(filters);
      const fullUrl = `${endpoint}${queryString}`;
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${fullUrl}`);
      }
      return response.json() as Promise<T>;
    },
    enabled: !isPreview, // Skip query if this is a preview
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // If this is a preview, return a placeholder with dummy data
  if (isPreview) {
    const dummyData = generateDummyData(chartConfig);
    
    return (
      <div className={`bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg ${className} relative overflow-hidden`}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex-1">
            {title}
          </h2>
        </div>
        <div className="w-full" style={{ minHeight: '280px' }}>
          {renderChartWithData(dummyData, chartConfig)}
        </div>
      </div>
    );
  }

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
                formatter={(value, name) => [value, truncateText(name === 'value' ? 'Count' : String(name), 15)]}
                labelFormatter={(label) => {
                  const item = processedChartData.find(d => d.displayName === label);
                  const fullName = item?.originalName || label;
                  return truncateText(fullName, 15);
                }}
              />
              {showLegend && (
                <Legend 
                  formatter={(value) => {
                    const item = processedChartData.find(d => d.displayName === value);
                    return truncateText(item?.originalName || String(value), 25);
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
            className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-sm transition-all duration-200"
            title="Delete widget"
          >
            <svg
              width="18"
              height="18"
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
            <p className="text-sm mt-1">{error instanceof Error ? error.message : 'An error occurred'}</p>
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