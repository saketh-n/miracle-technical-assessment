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
}

const YearsChartWidget: React.FC<YearsChartWidgetProps> = ({
  showDeleteButton = false,
  onDelete,
  filters
}) => {
  return (
    <BaseChartWidget<YearsData>
      endpoint="http://localhost:8000/aggregations/by_year"
      title="Enrollment Trends Over Time"
      chartConfig={{
        type: 'line',
        width: 350,
        height: 250,
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
    />
  );
};

export default YearsChartWidget;
