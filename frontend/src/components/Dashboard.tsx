import React from 'react';
import { useFontSize } from '../context/FontSizeContext';
import {
  TotalsChartWidget,
  ConditionsChartWidget,
  SponsorsChartWidget,
  EnrollmentChartWidget,
  StatusChartWidget,
  PhasesChartWidget,
  YearsChartWidget,
  CountriesChartWidget,
  DurationsChartWidget,
} from './widgets';

const Dashboard: React.FC = () => {
  const { fontSize } = useFontSize();

  const getFontSizeClasses = () => {
    if (fontSize === 'large') {
      return {
        title: 'text-4xl',
        subtitle: 'text-xl',
      };
    }
    return {
      title: 'text-3xl',
      subtitle: 'text-lg',
    };
  };

  const { title, subtitle } = getFontSizeClasses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className={`${title} font-bold text-gray-900 mb-6 text-center`}>
          Custom Dashboard
        </h1>
        <p className={`${subtitle} text-gray-600 mb-12 text-center`}>
          Explore trends and insights from clinical trial data
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <TotalsChartWidget />
          <ConditionsChartWidget source="clinicaltrials" />
          <ConditionsChartWidget source="eudract" />
          <SponsorsChartWidget type="clinicaltrials" />
          <SponsorsChartWidget type="eudract" />
          <SponsorsChartWidget type="combined" />
          <EnrollmentChartWidget source="clinicaltrials" />
          <EnrollmentChartWidget source="eudract" />
          <StatusChartWidget source="clinicaltrials" />
          <StatusChartWidget source="eudract" />
          <PhasesChartWidget />
          <YearsChartWidget />
          <CountriesChartWidget />
          <DurationsChartWidget />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;