import React from 'react';
import BaseChartWidget from './BaseChartWidget';
import type { FilterState } from '../FiltersPanel';
interface DurationsData {
  clinicaltrials_durations: Record<string, number>;
  eudract_durations: Record<string, number>;
}

interface DurationsChartWidgetProps {
  showDeleteButton?: boolean;
  onDelete?: () => void;
  filters?: FilterState;
  isPreview?: boolean; // Whether this is a preview (prevents API calls)
}

const DurationsChartWidget: React.FC<DurationsChartWidgetProps> = ({
  showDeleteButton = false,
  onDelete,
  filters,
  isPreview = false
}) => {
  return (
    <BaseChartWidget<DurationsData>
      endpoint="http://localhost:8000/aggregations/by_duration"
      title="Trial Duration Distribution (ClinicalTrials.gov vs EudraCT)"
      chartConfig={{
        type: 'bar',
        height: 350,
        dataKeys: ['clinicaltrials', 'eudract'],
        showLegend: true
      }}
      transformData={(data) =>
        Object.keys(data.clinicaltrials_durations).map((bin) => ({
          name: bin,
          clinicaltrials: data.clinicaltrials_durations[bin],
          eudract: data.eudract_durations[bin],
        }))
      }
      showDeleteButton={showDeleteButton}
      onDelete={onDelete}
      filters={filters}
      isPreview={isPreview}
    />
  );
};

export default DurationsChartWidget;
