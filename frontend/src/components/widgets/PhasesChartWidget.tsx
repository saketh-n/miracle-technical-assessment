import React from 'react';
import BaseChartWidget from './BaseChartWidget';
import type { FilterState } from '../FiltersPanel';
interface PhasesData {
  clinicaltrials_phases: Record<string, number>;
  eudract_phases: Record<string, number>;
}

interface PhasesChartWidgetProps {
  showDeleteButton?: boolean;
  onDelete?: () => void;
  filters?: FilterState;
}

const PhasesChartWidget: React.FC<PhasesChartWidgetProps> = ({
  showDeleteButton = false,
  onDelete,
  filters
}) => {
  return (
    <BaseChartWidget<PhasesData>
      endpoint="http://localhost:8000/aggregations/by_phase"
      title="Trials by Phase (ClinicalTrials.gov vs EudraCT)"
      chartConfig={{
        type: 'bar',
        height: 350,
        dataKeys: ['clinicaltrials', 'eudract'],
        showLegend: true
      }}
      transformData={(data) =>
        Object.keys(data.clinicaltrials_phases).map((phase) => ({
          name: phase,
          clinicaltrials: data.clinicaltrials_phases[phase],
          eudract: data.eudract_phases[phase],
        }))
      }
      showDeleteButton={showDeleteButton}
      onDelete={onDelete}
      filters={filters}
    />
  );
};

export default PhasesChartWidget;
