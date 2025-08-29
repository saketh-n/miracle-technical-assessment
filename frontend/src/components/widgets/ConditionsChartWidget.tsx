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
}

const ConditionsChartWidget: React.FC<ConditionsChartWidgetProps> = ({
  source,
  showDeleteButton = false,
  onDelete,
  filters
}) => {
  const sourceName = source === 'clinicaltrials' ? 'ClinicalTrials.gov' : 'EudraCT';

  return (
    <BaseChartWidget<ConditionsData>
      endpoint="http://localhost:8000/aggregations/by_condition"
      title={`Trials by Condition [Top 10] (${sourceName})`}
      chartConfig={{
        type: 'pie',
        width: 350,
        height: 250,
        dataKeys: ['value'],
        showLegend: true
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
    />
  );
};

export default ConditionsChartWidget;
