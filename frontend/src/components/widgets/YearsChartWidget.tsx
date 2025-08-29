import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import BaseChartWidget from './BaseChartWidget';

interface YearsData {
  clinicaltrials_years: Record<string, number>;
  eudract_years: Record<string, number>;
}

const YearsChartWidget: React.FC = () => {
  const [data, setData] = useState<YearsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('http://localhost:8000/aggregations/by_year');
        if (!response.ok) {
          throw new Error('Failed to fetch year data');
        }
        const yearsData = await response.json();
        setData(yearsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchYears();
  }, []);

  const getChartData = () => {
    if (!data) return [];

    return Object.keys(data.clinicaltrials_years)
      .sort()
      .map((year) => ({
        year,
        clinicaltrials: data.clinicaltrials_years[year],
        eudract: data.eudract_years[year],
      }));
  };

  const chartData = getChartData();

  return (
    <BaseChartWidget
      title="Enrollment Trends Over Time"
      isLoading={isLoading}
      error={error}
    >
      <LineChart width={350} height={250} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="clinicaltrials"
          stroke="#0088FE"
          name="ClinicalTrials.gov"
        />
        <Line
          type="monotone"
          dataKey="eudract"
          stroke="#FF8042"
          name="EudraCT"
        />
      </LineChart>
    </BaseChartWidget>
  );
};

export default YearsChartWidget;
