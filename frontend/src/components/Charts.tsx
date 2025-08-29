import React, { useEffect, useState, Component } from 'react';
import type { ReactNode } from 'react';
import { useFontSize } from '../context/FontSizeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c', '#d0ed57'];

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
  const [statuses, setStatuses] = useState<{ clinicaltrials_statuses: Record<string, number>; eudract_statuses: Record<string, number> } | null>(null);
  const [phases, setPhases] = useState<{ clinicaltrials_phases: Record<string, number>; eudract_phases: Record<string, number> } | null>(null);
  const [years, setYears] = useState<{ clinicaltrials_years: Record<string, number>; eudract_years: Record<string, number> } | null>(null);
  const [countries, setCountries] = useState<{ clinicaltrials_countries: Record<string, number> } | null>(null);
  const [durations, setDurations] = useState<{ clinicaltrials_durations: Record<string, number>; eudract_durations: Record<string, number> } | null>(null);
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

      try {
        const statusRes = await fetch('http://localhost:8000/aggregations/by_status');
        if (!statusRes.ok) throw new Error('Failed to fetch statuses');
        setStatuses(await statusRes.json());
      } catch (error) {
        setErrors((prev) => ({ ...prev, statuses: error.message }));
      }

      try {
        const phaseRes = await fetch('http://localhost:8000/aggregations/by_phase');
        if (!phaseRes.ok) throw new Error('Failed to fetch phases');
        setPhases(await phaseRes.json());
      } catch (error) {
        setErrors((prev) => ({ ...prev, phases: error.message }));
      }

      try {
        const yearRes = await fetch('http://localhost:8000/aggregations/by_year');
        if (!yearRes.ok) throw new Error('Failed to fetch years');
        setYears(await yearRes.json());
      } catch (error) {
        setErrors((prev) => ({ ...prev, years: error.message }));
      }

      try {
        const countryRes = await fetch('http://localhost:8000/aggregations/by_country');
        if (!countryRes.ok) throw new Error('Failed to fetch countries');
        setCountries(await countryRes.json());
      } catch (error) {
        setErrors((prev) => ({ ...prev, countries: error.message }));
      }

      try {
        const durationRes = await fetch('http://localhost:8000/aggregations/by_duration');
        if (!durationRes.ok) throw new Error('Failed to fetch durations');
        setDurations(await durationRes.json());
      } catch (error) {
        setErrors((prev) => ({ ...prev, durations: error.message }));
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
        {
          id: 'chart9',
          title: 'Trial Status Distribution (ClinicalTrials.gov)',
          type: 'pie',
          dataKey: 'statuses_us',
          getData: () =>
            statuses
              ? Object.entries(statuses.clinicaltrials_statuses).map(([name, value]) => ({
                  name,
                  value,
                }))
              : [],
        },
        {
          id: 'chart10',
          title: 'Trial Status Distribution (EudraCT)',
          type: 'pie',
          dataKey: 'statuses_eu',
          getData: () =>
            statuses
              ? Object.entries(statuses.eudract_statuses).map(([name, value]) => ({
                  name,
                  value,
                }))
              : [],
        },
        {
          id: 'chart11',
          title: 'Trials by Phase (ClinicalTrials.gov vs EudraCT)',
          type: 'bar',
          dataKey: 'phases',
          getData: () =>
            phases
              ? Object.keys(phases.clinicaltrials_phases).map((phase) => ({
                  name: phase,
                  clinicaltrials: phases.clinicaltrials_phases[phase],
                  eudract: phases.eudract_phases[phase],
                }))
              : [],
        },
        {
          id: 'chart12',
          title: 'Enrollment Trends Over Time',
          type: 'line',
          dataKey: 'years',
          getData: () =>
            years
              ? Object.keys(years.clinicaltrials_years).map((year) => ({
                  year,
                  clinicaltrials: years.clinicaltrials_years[year],
                  eudract: years.eudract_years[year],
                }))
              : [],
        },
        {
          id: 'chart13',
          title: 'Trials by Country [Top 10] (ClinicalTrials.gov)',
          type: 'bar',
          dataKey: 'countries',
          getData: () =>
            countries
              ? Object.entries(countries.clinicaltrials_countries).map(([name, value]) => ({ name, value }))
              : [],
        },
        {
          id: 'chart14',
          title: 'Trial Duration Distribution (ClinicalTrials.gov vs EudraCT)',
          type: 'bar',
          dataKey: 'durations',
          getData: () =>
            durations
              ? Object.keys(durations.clinicaltrials_durations).map((bin) => ({
                  name: bin,
                  clinicaltrials: durations.clinicaltrials_durations[bin],
                  eudract: durations.eudract_durations[bin],
                }))
              : [],
        },
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
                      {chart.type === 'bar' && chart.dataKey !== 'phases' && chart.dataKey !== 'durations' && chart.dataKey !== 'countries' && (
                        <BarChart width={350} height={250} data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#0088FE" />
                        </BarChart>
                      )}
                      {chart.type === 'bar' && chart.dataKey === 'phases' && (
                        <BarChart width={350} height={250} data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="clinicaltrials" fill="#0088FE" name="ClinicalTrials.gov" />
                          <Bar dataKey="eudract" fill="#FF8042" name="EudraCT" />
                        </BarChart>
                      )}
                      {chart.type === 'bar' && chart.dataKey === 'durations' && (
                        <BarChart width={350} height={250} data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="clinicaltrials" fill="#0088FE" name="ClinicalTrials.gov" />
                          <Bar dataKey="eudract" fill="#FF8042" name="EudraCT" />
                        </BarChart>
                      )}
                      {chart.type === 'bar' && chart.dataKey === 'countries' && (
                        <BarChart width={350} height={250} data={chartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#0088FE" name="ClinicalTrials.gov" />
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
                      )}
                      {chart.type === 'line' && (
                        <LineChart width={350} height={250} data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey={chart.dataKey === 'years' ? 'clinicaltrials' : 'trials'}
                            stroke="#0088FE"
                            name="ClinicalTrials.gov"
                          />
                          {chart.dataKey === 'years' && (
                            <Line
                              type="monotone"
                              dataKey="eudract"
                              stroke="#FF8042"
                              name="EudraCT"
                            />
                          )}
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