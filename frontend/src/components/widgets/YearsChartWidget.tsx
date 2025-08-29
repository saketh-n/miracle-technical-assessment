import React from 'react';
import BaseChartWidget from './BaseChartWidget';
import type { FilterState } from '../FiltersPanel';
interface YearsData {
  clinicaltrials_years: Record<string, number>;
  eudract_years: Record<string, number>;
}

interface YearsChartWidgetProps {
  showDeleteButton?: boolean;
  onDelete?: () => void;
  filters?: FilterState;
  isPreview?: boolean; // Whether this is a preview (prevents API calls)
}

const YearsChartWidget: React.FC<YearsChartWidgetProps> = ({
  showDeleteButton = false,
  onDelete,
  filters,
  isPreview = false
}) => {
  return (
    <BaseChartWidget<YearsData>
      endpoint="http://localhost:8000/aggregations/by_year"
      title="Enrollment Trends Over Time"
      chartConfig={{
        type: 'line',
        height: 300,
        dataKeys: ['clinicaltrials', 'eudract'],
        showLegend: true
      }}
      transformData={(data) =>
        Object.keys(data.clinicaltrials_years)
          .sort()
          .map((year) => ({
            year,
            clinicaltrials: data.clinicaltrials_years[year],
            eudract: data.eudract_years[year],
          }))
      }
      showDeleteButton={showDeleteButton}
      onDelete={onDelete}
      filters={filters}
      isPreview={isPreview}
    />
  );
};

export default YearsChartWidget;
