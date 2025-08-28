import React, { useEffect, useState, Component } from 'react';
import type { ReactNode } from 'react';
import { useFontSize } from '../context/FontSizeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c', '#d0ed57'];

// Dummy data for placeholder charts
const dummyLineData = [
  { year: '2020', trials: 200 },
  { year: '2021', trials: 300 },
  { year: '2022', trials: 400 },
  { year: '2023', trials: 350 },
  { year: '2024', trials: 500 },
];
const dummyPieData = [
  { name: 'Cancer', value: 400 },
  { name: 'Cardiology', value: 300 },
  { name: 'Neurology', value: 200 },
  { name: 'Other', value: 100 },
];
const dummyBarData = [
  { name: 'US', trials: 400 },
  { name: 'EU', trials: 300 },
];

// Error Boundary Component
interface ChartErrorBoundaryProps {
  chartId: string;
  children: ReactNode;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ChartErrorBoundary extends Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  state: ChartErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center text-red-600 p-4">
          Error in chart {this.props.chartId}: {this.state.errorMessage}
        </div>
      );
    }
    return this.props.children;
  }
}

const Charts: React.FC = () => {
  const { fontSize } = useFontSize();

  const getFontSizeClasses = () => {
    if (fontSize === 'large') {
      return {
        title: 'text-4xl',
        subtitle: 'text-xl',
        chartLabel: 'text-base',
      };
    }
    return {
      title: 'text-3xl',
      subtitle: 'text-lg',
      chartLabel: 'text-sm',
    };
  };

  const { title, subtitle, chartLabel } = getFontSizeClasses();

  const [totals, setTotals] = useState<{ clinicaltrials_total: number; eudract_total: number } | null>(null);
  const [conditions, setConditions] = useState<{ clinicaltrials_conditions: Record<string, number>; eudract_conditions: Record<string, number> } | null>(null);
  const [sponsors, setSponsors] = useState<{ clinicaltrials_sponsors: Record<string, number>; eudract_sponsors: Record<string, number> } | null>(null);
  const [enrollment, setEnrollment] = useState<{ clinicaltrials_enrollment: Record<string, number>; eudract_enrollment: Record<string, number> } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchAggregations = async () => {
      try {
        const totalsRes = await fetch('http://localhost:8000/aggregations/totals');
        if (!totalsRes.ok) throw new Error('Failed to fetch totals');
        setTotals(await totalsRes.json());
      } catch (error) {
        setErrors((prev) => ({ ...prev, totals: error.message }));
      }

      try {
        const conditionsRes = await fetch('http://localhost:8000/aggregations/by_condition');
        if (!conditionsRes.ok) throw new Error('Failed to fetch conditions');
        setConditions(await conditionsRes.json());
      } catch (error) {
        setErrors((prev) => ({ ...prev, conditions: error.message }));
      }

      try {
        const sponsorsRes = await fetch('http://localhost:8000/aggregations/by_sponsor');
        if (!sponsorsRes.ok) throw new Error('Failed to fetch sponsors');
        setSponsors(await sponsorsRes.json());
      } catch (error) {
        setErrors((prev) => ({ ...prev, sponsors: error.message }));
      }

      try {
        const enrollmentRes = await fetch('http://localhost:8000/aggregations/enrollment_by_region');
        if (!enrollmentRes.ok) throw new Error('Failed to fetch enrollment');
        setEnrollment(await enrollmentRes.json());
      } catch (error) {
        setErrors((prev) => ({ ...prev, enrollment: error.message }));
      }
    };

    fetchAggregations();
  }, []);

  // Combined top sponsors
  const topCombinedSponsors = sponsors
    ? Object.entries(
        Object.entries({
          ...sponsors.clinicaltrials_sponsors,
          ...sponsors.eudract_sponsors,
        }).reduce((acc, [sponsor, count]) => {
          acc[sponsor] = (acc[sponsor] || 0) + count;
          return acc;
        }, {} as Record<string, number>)
      )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }))
    : [];

    const chartConfigs = [
        {
          id: 'chart1',
          title: 'Total Clinical Trials (ClinicalTrials.gov vs EudraCT)',
          type: 'bar',
          dataKey: 'totals',
          getData: () =>
            totals ? [{ name: 'ClinicalTrials.gov', value: totals.clinicaltrials_total }, { name: 'EudraCT', value: totals.eudract_total }] : [],
        },
        {
          id: 'chart2',
          title: 'Trials by Condition [Top 10] (ClinicalTrials.gov)',
          type: 'pie',
          dataKey: 'conditions_us',
          getData: () =>
            conditions ? Object.entries(conditions.clinicaltrials_conditions).map(([name, value]) => ({ name, value })) : [],
        },
        {
          id: 'chart3',
          title: 'Trials by Condition [Top 10] (EudraCT)',
          type: 'pie',
          dataKey: 'conditions_eu',
          getData: () =>
            conditions ? Object.entries(conditions.eudract_conditions).map(([name, value]) => ({ name, value })) : [],
        },
        {
          id: 'chart4',
          title: 'Trials by Sponsor (ClinicalTrials.gov)',
          type: 'bar',
          dataKey: 'sponsors_us',
          getData: () =>
            sponsors ? Object.entries(sponsors.clinicaltrials_sponsors).map(([name, value]) => ({ name, value })) : [],
        },
        {
          id: 'chart5',
          title: 'Trials by Sponsor (EudraCT)',
          type: 'bar',
          dataKey: 'sponsors_eu',
          getData: () =>
            sponsors ? Object.entries(sponsors.eudract_sponsors).map(([name, value]) => ({ name, value })) : [],
        },
        {
          id: 'chart6',
          title: 'Top 10 Sponsors (Combined)',
          type: 'bar',
          dataKey: 'top_sponsors',
          getData: () => topCombinedSponsors,
        },
        {
          id: 'chart7',
          title: 'Enrollment by Region (ClinicalTrials.gov)',
          type: 'pie',
          dataKey: 'enrollment_us',
          getData: () =>
            enrollment
              ? Object.entries(enrollment.clinicaltrials_enrollment)
                  .filter(([_, value]) => value > 0)
                  .map(([name, value]) => ({ name, value }))
              : [],
        },
        {
          id: 'chart8',
          title: 'Enrollment by Region (EudraCT)',
          type: 'pie',
          dataKey: 'enrollment_eu',
          getData: () =>
            enrollment
              ? Object.entries(enrollment.eudract_enrollment)
                  .filter(([_, value]) => value > 0)
                  .map(([name, value]) => ({ name, value }))
              : [],
        },
        { id: 'chart9', title: 'Trials Over Time', type: 'line', dataKey: 'dummy_time', getData: () => dummyLineData },
        { id: 'chart10', title: 'Trial Phases', type: 'pie', dataKey: 'dummy_phases', getData: () => dummyPieData },
        { id: 'chart11', title: 'Trial Status', type: 'pie', dataKey: 'dummy_status', getData: () => dummyPieData },
        { id: 'chart12', title: 'Funding Sources', type: 'pie', dataKey: 'dummy_funding', getData: () => dummyPieData },
        { id: 'chart13', title: 'Trial Locations', type: 'bar', dataKey: 'dummy_locations', getData: () => dummyBarData },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className={`${title} font-bold text-gray-900 mb-6 text-center`}>
          Clinical Trial Charts
        </h1>
        <p className={`${subtitle} text-gray-600 mb-12 text-center`}>
          Explore trends and insights from clinical trial data
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {chartConfigs.map((chart) => {
            const chartData = chart.getData();
            const error = errors[chart.dataKey];
            return (
              <ChartErrorBoundary key={chart.id} chartId={chart.id}>
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200">
                  <h2 className={`${chartLabel} font-semibold text-gray-800 mb-4`}>
                    {chart.title}
                  </h2>
                  {error ? (
                    <div className="text-center text-red-600">Error: {error}</div>
                  ) : chartData.length === 0 ? (
                    <div className="text-center text-gray-500">Loading...</div>
                  ) : (
                    <>
                      {chart.type === 'bar' && (
                        <BarChart width={350} height={250} data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey={chart.dataKey.startsWith('dummy') ? 'trials' : 'value'} fill="#0088FE" />
                        </BarChart>
                      )}
                      {chart.type === 'pie' && (
                        <PieChart width={350} height={250}>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey={chart.dataKey.startsWith('dummy') ? 'value' : 'value'}
                            label
                          >
                            {chartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      )}
                      {chart.type === 'line' && (
                        <LineChart width={350} height={250} data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="trials" stroke="#0088FE" />
                        </LineChart>
                      )}
                    </>
                  )}
                </div>
              </ChartErrorBoundary>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Charts;