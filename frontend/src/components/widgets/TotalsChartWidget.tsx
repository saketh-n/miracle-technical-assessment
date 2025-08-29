import React from 'react';
import BaseChartWidget from './BaseChartWidget';
import type { FilterState } from '../FiltersPanel';

interface TotalsData {
  clinicaltrials_total: number;
  eudract_total: number;
}

interface TotalsChartWidgetProps {
  showDeleteButton?: boolean;
  onDelete?: () => void;
  filters?: FilterState;
  isPreview?: boolean; // Whether this is a preview (prevents API calls)
}

const TotalsChartWidget: React.FC<TotalsChartWidgetProps> = ({
  showDeleteButton = false,
  onDelete,
  filters,
  isPreview = false
}) => {
  return (
    <BaseChartWidget<TotalsData>
      endpoint="http://localhost:8000/aggregations/totals"
      title="Total Clinical Trials (ClinicalTrials.gov vs EudraCT)"
      chartConfig={{
        type: 'bar',
        height: 350,
        dataKeys: ['value'],
        showLegend: true
      }}
      transformData={(data) => [
        { name: 'ClinicalTrials.gov', value: data.clinicaltrials_total },
        { name: 'EudraCT', value: data.eudract_total }
      ]}
      showDeleteButton={showDeleteButton}
      onDelete={onDelete}
      filters={filters}
      isPreview={isPreview}
    />
  );
};

export default TotalsChartWidget;
