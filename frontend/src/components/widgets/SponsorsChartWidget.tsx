import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import BaseChartWidget from './BaseChartWidget';

interface SponsorsData {
  clinicaltrials_sponsors: Record<string, number>;
  eudract_sponsors: Record<string, number>;
}

interface SponsorsChartWidgetProps {
  type: 'clinicaltrials' | 'eudract' | 'combined';
}

const SponsorsChartWidget: React.FC<SponsorsChartWidgetProps> = ({ type }) => {
  const [data, setData] = useState<SponsorsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('http://localhost:8000/aggregations/by_sponsor');
        if (!response.ok) {
          throw new Error('Failed to fetch sponsors');
        }
        const sponsorsData = await response.json();
        setData(sponsorsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  const getChartData = () => {
    if (!data) return [];

    if (type === 'combined') {
      // Combine both sources and get top 10
      const combined = Object.entries({
        ...data.clinicaltrials_sponsors,
        ...data.eudract_sponsors,
      }).reduce((acc, [sponsor, count]) => {
        acc[sponsor] = (acc[sponsor] || 0) + count;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(combined)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));
    }

    const sponsors = type === 'clinicaltrials'
      ? data.clinicaltrials_sponsors
      : data.eudract_sponsors;

    return Object.entries(sponsors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  };

  const getTitle = () => {
    switch (type) {
      case 'clinicaltrials':
        return 'Trials by Sponsor (ClinicalTrials.gov)';
      case 'eudract':
        return 'Trials by Sponsor (EudraCT)';
      case 'combined':
        return 'Top 10 Sponsors (Combined)';
      default:
        return 'Trials by Sponsor';
    }
  };

  const chartData = getChartData();

  return (
    <BaseChartWidget
      title={getTitle()}
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

export default SponsorsChartWidget;
