import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useFontSize } from '../../context/FontSizeContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c', '#d0ed57'];

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
}

function BaseChartWidget<T extends Record<string, any>>({
  endpoint,
  title,
  chartConfig,
  transformData,
  className = '',
  refreshTrigger
}: BaseChartWidgetProps<T>) {
  const { fontSize } = useFontSize();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch data from ${endpoint}`);
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
  }, [endpoint, refreshTrigger]);

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
    const { type, width = 350, height = 250, dataKeys = ['value'], layout = 'horizontal', showLegend = true } = chartConfig;

    switch (type) {
      case 'bar':
        if (layout === 'vertical') {
          return (
            <BarChart width={width} height={height} data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
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
          );
        }
        return (
          <BarChart width={width} height={height} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip />
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
        );

      case 'pie':
        return (
          <PieChart width={width} height={height}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey={dataKeys[0] || 'value'}
              label
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>
        );

      case 'line':
        return (
          <LineChart width={width} height={height} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
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
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

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
          {renderChart()}
        </div>
      )}
    </div>
  );
}

export default BaseChartWidget;
