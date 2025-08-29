import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import BaseChartWidget from './BaseChartWidget';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c', '#d0ed57'];

interface ConditionsData {
  clinicaltrials_conditions: Record<string, number>;
  eudract_conditions: Record<string, number>;
}

interface ConditionsChartWidgetProps {
  source: 'clinicaltrials' | 'eudract';
}

const ConditionsChartWidget: React.FC<ConditionsChartWidgetProps> = ({ source }) => {
  const [data, setData] = useState<ConditionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConditions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('http://localhost:8000/aggregations/by_condition');
        if (!response.ok) {
          throw new Error('Failed to fetch conditions');
        }
        const conditionsData = await response.json();
        setData(conditionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConditions();
  }, []);

  const getChartData = () => {
    if (!data) return [];

    const conditions = source === 'clinicaltrials'
      ? data.clinicaltrials_conditions
      : data.eudract_conditions;

    return Object.entries(conditions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  };

  const chartData = getChartData();
  const sourceName = source === 'clinicaltrials' ? 'ClinicalTrials.gov' : 'EudraCT';

  return (
    <BaseChartWidget
      title={`Trials by Condition [Top 10] (${sourceName})`}
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

export default ConditionsChartWidget;
