import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useFontSize } from '../context/FontSizeContext';
import FiltersPanel from './FiltersPanel';
import type { FilterState } from './FiltersPanel';
import { loadFilters, saveFilters } from '../utils/filtersStorage';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { AddChartsModal } from './modals';

// Chart information for display names
const CHART_INFO = {
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

// Sortable chart item component
interface SortableChartItemProps {
  id: string;
  children: React.ReactNode;
}

const SortableChartItem: React.FC<SortableChartItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-12 h-4 flex items-center justify-center cursor-move bg-gray-100 hover:bg-gray-200 rounded-b-lg transition-colors duration-200"
        title="Drag to reorder"
      >
        <svg width="20" height="10" viewBox="0 0 20 10" fill="currentColor" className="text-gray-400">
          <rect x="0" y="0" width="20" height="2" rx="1" />
          <rect x="0" y="4" width="20" height="2" rx="1" />
          <rect x="0" y="8" width="20" height="2" rx="1" />
        </svg>
      </div>
      {children}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { fontSize } = useFontSize();
  const [layout, setLayout] = useState<DashboardLayout>({});
  const [showAddChartModal, setShowAddChartModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    region: 'ALL',
    condition: [],
    startDate: null,
    endDate: null,
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

      // Load filters
      const savedFilters = loadFilters(id);
      setFilters(savedFilters);
    }
  }, [id]);

  const handleFiltersChange = (newFilters: FilterState) => {
    if (!id) return;
    setFilters(newFilters);
    saveFilters(id, newFilters);
  };

  // Handle chart deletion
  const handleDeleteChart = (chartId: string) => {
    if (!id) return;

    const newLayout = { ...layout };
    delete newLayout[chartId];
    setLayout(newLayout);
    updateDashboard(id, newLayout);
  };

  // Get missing charts (charts not in current layout)
  const getMissingCharts = () => {
    const defaultLayout = getDefaultLayout();
    return Object.keys(defaultLayout).filter(chartId => !(chartId in layout));
  };

  // Handle adding multiple charts from modal
  const handleAddSelectedCharts = (chartIds: string[]) => {
    if (!id || chartIds.length === 0) return;

    const newLayout = { ...layout };
    const existingPositions = Object.values(layout);
    let nextPosition = 1;

    // Find the next available position
    while (existingPositions.includes(nextPosition)) {
      nextPosition++;
    }

    // Add all selected charts with sequential positions
    chartIds.forEach((chartId) => {
      newLayout[chartId] = nextPosition++;
    });

    setLayout(newLayout);
    updateDashboard(id, newLayout);
    setShowAddChartModal(false);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowAddChartModal(false);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedCharts.findIndex((chart) => chart.key === active.id);
      const newIndex = sortedCharts.findIndex((chart) => chart.key === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSortedCharts = arrayMove(sortedCharts, oldIndex, newIndex);

        // Update layout with new positions
        const newLayout: DashboardLayout = {};
        newSortedCharts.forEach((chart, index) => {
          const chartId = chart.key as string;
          newLayout[chartId] = index + 1; // 1-based positioning
        });

        setLayout(newLayout);
        updateDashboard(id!, newLayout);
      }
    }
  };

  // Map chartIds to chart components
  const chartComponents: { [key: string]: React.ReactElement } = {
    'totals': (
      <TotalsChartWidget
        key="totals"
        showDeleteButton={true}
        onDelete={() => handleDeleteChart('totals')}
        filters={filters}
      />
    ),
    'conditions-clinicaltrials': (
      <ConditionsChartWidget
        key="conditions-clinicaltrials"
        source="clinicaltrials"
        showDeleteButton={true}
        onDelete={() => handleDeleteChart('conditions-clinicaltrials')}
        filters={filters}
      />
    ),
    'conditions-eudract': (
      <ConditionsChartWidget
        key="conditions-eudract"
        source="eudract"
        showDeleteButton={true}
        onDelete={() => handleDeleteChart('conditions-eudract')}
        filters={filters}
      />
    ),
    'sponsors-clinicaltrials': (
      <SponsorsChartWidget
        key="sponsors-clinicaltrials"
        type="clinicaltrials"
        showDeleteButton={true}
        onDelete={() => handleDeleteChart('sponsors-clinicaltrials')}
        filters={filters}
      />
    ),
    'sponsors-eudract': (
      <SponsorsChartWidget
        key="sponsors-eudract"
        type="eudract"
        showDeleteButton={true}
        onDelete={() => handleDeleteChart('sponsors-eudract')}
        filters={filters}
      />
    ),
    'sponsors-combined': (
      <SponsorsChartWidget
        key="sponsors-combined"
        type="combined"
        showDeleteButton={true}
        onDelete={() => handleDeleteChart('sponsors-combined')}
        filters={filters}
      />
    ),
    'enrollment-clinicaltrials': (
      <EnrollmentChartWidget
        key="enrollment-clinicaltrials"
        source="clinicaltrials"
        showDeleteButton={true}
        onDelete={() => handleDeleteChart('enrollment-clinicaltrials')}
        filters={filters}
      />
    ),
    'enrollment-eudract': (
      <EnrollmentChartWidget
        key="enrollment-eudract"
        source="eudract"
        showDeleteButton={true}
        onDelete={() => handleDeleteChart('enrollment-eudract')}
        filters={filters}
      />
    ),
    'status-clinicaltrials': (
      <StatusChartWidget
        key="status-clinicaltrials"
        source="clinicaltrials"
        showDeleteButton={true}
        onDelete={() => handleDeleteChart('status-clinicaltrials')}
        filters={filters}
      />
    ),
    'status-eudract': (
      <StatusChartWidget
        key="status-eudract"
        source="eudract"
        showDeleteButton={true}
        onDelete={() => handleDeleteChart('status-eudract')}
        filters={filters}
      />
    ),
    'phases': (
      <PhasesChartWidget
        key="phases"
        showDeleteButton={true}
        onDelete={() => handleDeleteChart('phases')}
        filters={filters}
      />
    ),
    'years': (
      <YearsChartWidget
        key="years"
        showDeleteButton={true}
        onDelete={() => handleDeleteChart('years')}
        filters={filters}
      />
    ),
    'countries': (
      <CountriesChartWidget
        key="countries"
        showDeleteButton={true}
        onDelete={() => handleDeleteChart('countries')}
        filters={filters}
      />
    ),
    'durations': (
      <DurationsChartWidget
        key="durations"
        showDeleteButton={true}
        onDelete={() => handleDeleteChart('durations')}
        filters={filters}
      />
    ),
  };

  // Sort charts by position
  const sortedCharts = Object.entries(layout)
    .sort(([, posA], [, posB]) => posA - posB)
    .map(([chartId]) => chartComponents[chartId])
    .filter(Boolean); // Remove undefined charts

  // Get chart IDs for sortable context
  const chartIds = Object.keys(layout).sort((a, b) => layout[a] - layout[b]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className={`${title} font-bold text-gray-900 mb-6 text-center`}>
          Custom Dashboard
        </h1>
        <p className={`${subtitle} text-gray-600 mb-6 text-center`}>
          Dashboard ID: {id}
        </p>

        {/* Filters Panel */}
        <div className="mb-8">
          <FiltersPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* Add Chart Button */}
        {getMissingCharts().length > 0 && (
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setShowAddChartModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Charts
            </button>
          </div>
        )}

        {/* Add Charts Modal */}
        <AddChartsModal
          isOpen={showAddChartModal}
          onClose={handleCloseModal}
          missingCharts={getMissingCharts()}
          onAddCharts={handleAddSelectedCharts}
          chartInfo={CHART_INFO}
        />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={chartIds} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedCharts.length > 0 ? (
                sortedCharts.map((chart, index) => {
                  const chartId = chartIds[index];
                  return (
                    <SortableChartItem key={chartId} id={chartId}>
                      {chart}
                    </SortableChartItem>
                  );
                })
              ) : (
                <p className="text-gray-600 text-center col-span-full">
                  No charts in this dashboard. Click "Add Charts" to start customizing.
                </p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default Dashboard;