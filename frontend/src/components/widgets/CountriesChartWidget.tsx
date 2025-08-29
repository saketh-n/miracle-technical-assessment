import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import BaseChartWidget from './BaseChartWidget';

interface CountriesData {
  clinicaltrials_countries: Record<string, number>;
}

const CountriesChartWidget: React.FC = () => {
  const [data, setData] = useState<CountriesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('http://localhost:8000/aggregations/by_country');
        if (!response.ok) {
          throw new Error('Failed to fetch country data');
        }
        const countriesData = await response.json();
        setData(countriesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const getChartData = () => {
    if (!data) return [];

    return Object.entries(data.clinicaltrials_countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  };

  const chartData = getChartData();

  return (
    <BaseChartWidget
      title="Trials by Country [Top 10] (ClinicalTrials.gov)"
      isLoading={isLoading}
      error={error}
    >
      <BarChart width={350} height={250} data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={100} />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#0088FE" name="ClinicalTrials.gov" />
      </BarChart>
    </BaseChartWidget>
  );
};

export default CountriesChartWidget;
