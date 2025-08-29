import React from 'react';
import BaseChartWidget from './BaseChartWidget';
import type { FilterState } from '../FiltersPanel';
interface StatusData {
  clinicaltrials_statuses: Record<string, number>;
  eudract_statuses: Record<string, number>;
}

interface StatusChartWidgetProps {
  source: 'clinicaltrials' | 'eudract';
  showDeleteButton?: boolean;
  onDelete?: () => void;
  filters?: FilterState;
}

const StatusChartWidget: React.FC<StatusChartWidgetProps> = ({
  source,
  showDeleteButton = false,
  onDelete,
  filters
}) => {
  const sourceName = source === 'clinicaltrials' ? 'ClinicalTrials.gov' : 'EudraCT';

  return (
    <BaseChartWidget<StatusData>
      endpoint="http://localhost:8000/aggregations/by_status"
      title={`Trial Status Distribution (${sourceName})`}
      chartConfig={{
        type: 'pie',
        width: 350,
        height: 250,
        dataKeys: ['value'],
        showLegend: true
      }}
      transformData={(data) => {
        const statuses = source === 'clinicaltrials'
          ? data.clinicaltrials_statuses
          : data.eudract_statuses;

        return Object.entries(statuses)
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => ({ name, value }));
      }}
      showDeleteButton={showDeleteButton}
      onDelete={onDelete}
      filters={filters}
    />
  );
};

export default StatusChartWidget;
