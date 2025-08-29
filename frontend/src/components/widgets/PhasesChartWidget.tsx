import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import BaseChartWidget from './BaseChartWidget';

interface PhasesData {
  clinicaltrials_phases: Record<string, number>;
  eudract_phases: Record<string, number>;
}

const PhasesChartWidget: React.FC = () => {
  const [data, setData] = useState<PhasesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhases = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('http://localhost:8000/aggregations/by_phase');
        if (!response.ok) {
          throw new Error('Failed to fetch phase data');
        }
        const phasesData = await response.json();
        setData(phasesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhases();
  }, []);

  const getChartData = () => {
    if (!data) return [];

    return Object.keys(data.clinicaltrials_phases).map((phase) => ({
      name: phase,
      clinicaltrials: data.clinicaltrials_phases[phase],
      eudract: data.eudract_phases[phase],
    }));
  };

  const chartData = getChartData();

  return (
    <BaseChartWidget
      title="Trials by Phase (ClinicalTrials.gov vs EudraCT)"
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

export default PhasesChartWidget;
