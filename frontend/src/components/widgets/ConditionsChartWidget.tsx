import React from 'react';
import BaseChartWidget from './BaseChartWidget';
import type { FilterState } from '../FiltersPanel';

interface ConditionsData {
  clinicaltrials_conditions: Record<string, number>;
  eudract_conditions: Record<string, number>;
}

interface ConditionsChartWidgetProps {
  source: 'clinicaltrials' | 'eudract';
  showDeleteButton?: boolean;
  onDelete?: () => void;
  filters?: FilterState;
  isPreview?: boolean; // Whether this is a preview (prevents API calls)
}

const ConditionsChartWidget: React.FC<ConditionsChartWidgetProps> = ({
  source,
  showDeleteButton = false,
  onDelete,
  filters,
  isPreview = false
}) => {
  const sourceName = source === 'clinicaltrials' ? 'ClinicalTrials.gov' : 'EudraCT';

  return (
    <BaseChartWidget<ConditionsData>
      endpoint="http://localhost:8000/aggregations/by_condition"
      title={`Trials by Condition [Top 10] (${sourceName})`}
      chartConfig={{
        type: 'pie',
        height: 320,
        dataKeys: ['value'],
        showLegend: false
      }}
      transformData={(data) => {
        const conditions = source === 'clinicaltrials'
          ? data.clinicaltrials_conditions
          : data.eudract_conditions;

        return Object.entries(conditions)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, value]) => ({ name, value }));
      }}
      showDeleteButton={showDeleteButton}
      onDelete={onDelete}
      filters={filters}
      isPreview={isPreview}
    />
  );
};

export default ConditionsChartWidget;
