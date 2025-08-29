import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import BaseChartWidget from './BaseChartWidget';

interface TotalsData {
  clinicaltrials_total: number;
  eudract_total: number;
}

const TotalsChartWidget: React.FC = () => {
  const [data, setData] = useState<TotalsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('http://localhost:8000/aggregations/totals');
        if (!response.ok) {
          throw new Error('Failed to fetch totals');
        }
        const totalsData = await response.json();
        setData(totalsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTotals();
  }, []);

  const chartData = data
    ? [
        { name: 'ClinicalTrials.gov', value: data.clinicaltrials_total },
        { name: 'EudraCT', value: data.eudract_total }
      ]
    : [];

  return (
    <BaseChartWidget
      title="Total Clinical Trials (ClinicalTrials.gov vs EudraCT)"
      isLoading={isLoading}
      error={error}
    >
      <BarChart width={350} height={250} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#0088FE" />
      </BarChart>
    </BaseChartWidget>
  );
};

export default TotalsChartWidget;
