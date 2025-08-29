import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import BaseChartWidget from './BaseChartWidget';

interface DurationsData {
  clinicaltrials_durations: Record<string, number>;
  eudract_durations: Record<string, number>;
}

const DurationsChartWidget: React.FC = () => {
  const [data, setData] = useState<DurationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDurations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('http://localhost:8000/aggregations/by_duration');
        if (!response.ok) {
          throw new Error('Failed to fetch duration data');
        }
        const durationsData = await response.json();
        setData(durationsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDurations();
  }, []);

  const getChartData = () => {
    if (!data) return [];

    return Object.keys(data.clinicaltrials_durations).map((bin) => ({
      name: bin,
      clinicaltrials: data.clinicaltrials_durations[bin],
      eudract: data.eudract_durations[bin],
    }));
  };

  const chartData = getChartData();

  return (
    <BaseChartWidget
      title="Trial Duration Distribution (ClinicalTrials.gov vs EudraCT)"
      isLoading={isLoading}
      error={error}
    >
      <BarChart width={350} height={250} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="clinicaltrials" fill="#0088FE" name="ClinicalTrials.gov" />
        <Bar dataKey="eudract" fill="#FF8042" name="EudraCT" />
      </BarChart>
    </BaseChartWidget>
  );
};

export default DurationsChartWidget;
