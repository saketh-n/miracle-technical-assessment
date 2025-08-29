import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { getDashboard, updateDashboard } from '../utils/dashboardStorage';
import type { DashboardLayout } from '../utils/dashboardStorage';

const Dashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { fontSize } = useFontSize();
  const [layout, setLayout] = useState<DashboardLayout>({});

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

  // Default layout with all widgets and their positions
  const getDefaultLayout = (): DashboardLayout => ({
    'totals': 1,
    'conditions-clinicaltrials': 2,
    'conditions-eudract': 3,
    'sponsors-clinicaltrials': 4,
    'sponsors-eudract': 5,
    'sponsors-combined': 6,
    'enrollment-clinicaltrials': 7,
    'enrollment-eudract': 8,
    'status-clinicaltrials': 9,
    'status-eudract': 10,
    'phases': 11,
    'years': 12,
    'countries': 13,
    'durations': 14,
  });

  // Load dashboard layout from localStorage
  useEffect(() => {
    if (id) {
      const dashboardLayout = getDashboard(id);
      // If no layout exists, use default layout with all widgets
      if (Object.keys(dashboardLayout).length === 0) {
        const defaultLayout = getDefaultLayout();
        setLayout(defaultLayout);
        updateDashboard(id, defaultLayout);
      } else {
        setLayout(dashboardLayout);
      }
    }
  }, [id]);

  // Handle widget deletion
  const handleDeleteWidget = (chartId: string) => {
    if (!id) return;

    const newLayout = { ...layout };
    delete newLayout[chartId];
    setLayout(newLayout);
    updateDashboard(id, newLayout);
  };

  // Map chartIds to widget components
  const widgetComponents: { [key: string]: React.ReactElement } = {
    'totals': (
      <TotalsChartWidget
        key="totals"
        showDeleteButton={true}
        onDelete={() => handleDeleteWidget('totals')}
      />
    ),
    'conditions-clinicaltrials': (
      <ConditionsChartWidget
        key="conditions-clinicaltrials"
        source="clinicaltrials"
        showDeleteButton={true}
        onDelete={() => handleDeleteWidget('conditions-clinicaltrials')}
      />
    ),
    'conditions-eudract': (
      <ConditionsChartWidget
        key="conditions-eudract"
        source="eudract"
        showDeleteButton={true}
        onDelete={() => handleDeleteWidget('conditions-eudract')}
      />
    ),
    'sponsors-clinicaltrials': (
      <SponsorsChartWidget
        key="sponsors-clinicaltrials"
        type="clinicaltrials"
        showDeleteButton={true}
        onDelete={() => handleDeleteWidget('sponsors-clinicaltrials')}
      />
    ),
    'sponsors-eudract': (
      <SponsorsChartWidget
        key="sponsors-eudract"
        type="eudract"
        showDeleteButton={true}
        onDelete={() => handleDeleteWidget('sponsors-eudract')}
      />
    ),
    'sponsors-combined': (
      <SponsorsChartWidget
        key="sponsors-combined"
        type="combined"
        showDeleteButton={true}
        onDelete={() => handleDeleteWidget('sponsors-combined')}
      />
    ),
    'enrollment-clinicaltrials': (
      <EnrollmentChartWidget
        key="enrollment-clinicaltrials"
        source="clinicaltrials"
        showDeleteButton={true}
        onDelete={() => handleDeleteWidget('enrollment-clinicaltrials')}
      />
    ),
    'enrollment-eudract': (
      <EnrollmentChartWidget
        key="enrollment-eudract"
        source="eudract"
        showDeleteButton={true}
        onDelete={() => handleDeleteWidget('enrollment-eudract')}
      />
    ),
    'status-clinicaltrials': (
      <StatusChartWidget
        key="status-clinicaltrials"
        source="clinicaltrials"
        showDeleteButton={true}
        onDelete={() => handleDeleteWidget('status-clinicaltrials')}
      />
    ),
    'status-eudract': (
      <StatusChartWidget
        key="status-eudract"
        source="eudract"
        showDeleteButton={true}
        onDelete={() => handleDeleteWidget('status-eudract')}
      />
    ),
    'phases': (
      <PhasesChartWidget
        key="phases"
        showDeleteButton={true}
        onDelete={() => handleDeleteWidget('phases')}
      />
    ),
    'years': (
      <YearsChartWidget
        key="years"
        showDeleteButton={true}
        onDelete={() => handleDeleteWidget('years')}
      />
    ),
    'countries': (
      <CountriesChartWidget
        key="countries"
        showDeleteButton={true}
        onDelete={() => handleDeleteWidget('countries')}
      />
    ),
    'durations': (
      <DurationsChartWidget
        key="durations"
        showDeleteButton={true}
        onDelete={() => handleDeleteWidget('durations')}
      />
    ),
  };

  // Sort widgets by position
  const sortedWidgets = Object.entries(layout)
    .sort(([, posA], [, posB]) => posA - posB)
    .map(([chartId]) => widgetComponents[chartId])
    .filter(Boolean); // Remove undefined widgets

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className={`${title} font-bold text-gray-900 mb-6 text-center`}>
          Custom Dashboard
        </h1>
        <p className={`${subtitle} text-gray-600 mb-12 text-center`}>
          Dashboard ID: {id}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedWidgets.length > 0 ? (
            sortedWidgets
          ) : (
            <p className="text-gray-600 text-center col-span-full">
              No widgets in this dashboard. Click "Add Widget" to start customizing.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;