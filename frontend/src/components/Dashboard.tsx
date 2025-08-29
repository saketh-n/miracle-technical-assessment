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

// Widget information for display names
const WIDGET_INFO = {
  'totals': 'Total Clinical Trials',
  'conditions-clinicaltrials': 'Conditions (ClinicalTrials.gov)',
  'conditions-eudract': 'Conditions (EudraCT)',
  'sponsors-clinicaltrials': 'Sponsors (ClinicalTrials.gov)',
  'sponsors-eudract': 'Sponsors (EudraCT)',
  'sponsors-combined': 'Sponsors (Combined)',
  'enrollment-clinicaltrials': 'Enrollment (ClinicalTrials.gov)',
  'enrollment-eudract': 'Enrollment (EudraCT)',
  'status-clinicaltrials': 'Status (ClinicalTrials.gov)',
  'status-eudract': 'Status (EudraCT)',
  'phases': 'Trial Phases',
  'years': 'Enrollment Trends',
  'countries': 'Countries',
  'durations': 'Trial Durations',
};

const Dashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { fontSize } = useFontSize();
  const [layout, setLayout] = useState<DashboardLayout>({});
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);

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

  // Get missing widgets (widgets not in current layout)
  const getMissingWidgets = () => {
    const defaultLayout = getDefaultLayout();
    return Object.keys(defaultLayout).filter(chartId => !(chartId in layout));
  };

  // Handle adding a widget
  const handleAddWidget = (chartId: string) => {
    if (!id) return;

    const newLayout = { ...layout };

    // Find the next available position
    const existingPositions = Object.values(layout);
    let nextPosition = 1;
    while (existingPositions.includes(nextPosition)) {
      nextPosition++;
    }

    newLayout[chartId] = nextPosition;
    setLayout(newLayout);
    updateDashboard(id, newLayout);
    setShowAddWidgetModal(false);
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

        {/* Add Widget Button */}
        {getMissingWidgets().length > 0 && (
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setShowAddWidgetModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Chart
            </button>
          </div>
        )}

        {/* Add Widget Modal */}
        {showAddWidgetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Add Widget</h3>
                <button
                  onClick={() => setShowAddWidgetModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <p className="text-gray-600 mb-4">Select a widget to add to your dashboard:</p>

              <div className="space-y-2">
                {getMissingWidgets().map((chartId) => (
                  <button
                    key={chartId}
                    onClick={() => handleAddWidget(chartId)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200"
                  >
                    <span className="font-medium text-gray-900">{WIDGET_INFO[chartId as keyof typeof WIDGET_INFO]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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