import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import BaseChartWidget from './BaseChartWidget';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c', '#d0ed57'];

interface StatusData {
  clinicaltrials_statuses: Record<string, number>;
  eudract_statuses: Record<string, number>;
}

interface StatusChartWidgetProps {
  source: 'clinicaltrials' | 'eudract';
}

const StatusChartWidget: React.FC<StatusChartWidgetProps> = ({ source }) => {
  const [data, setData] = useState<StatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('http://localhost:8000/aggregations/by_status');
        if (!response.ok) {
          throw new Error('Failed to fetch status data');
        }
        const statusData = await response.json();
        setData(statusData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatuses();
  }, []);

  const getChartData = () => {
    if (!data) return [];

    const statuses = source === 'clinicaltrials'
      ? data.clinicaltrials_statuses
      : data.eudract_statuses;

    return Object.entries(statuses)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  };

  const chartData = getChartData();
  const sourceName = source === 'clinicaltrials' ? 'ClinicalTrials.gov' : 'EudraCT';

  return (
    <BaseChartWidget
      title={`Trial Status Distribution (${sourceName})`}
      isLoading={isLoading}
      error={error}
    >
      <PieChart width={350} height={250}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          label
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </BaseChartWidget>
  );
};

export default StatusChartWidget;
