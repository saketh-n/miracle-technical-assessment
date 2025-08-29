import React from 'react';
import BaseChartWidget from './BaseChartWidget';
import type { FilterState } from '../FiltersPanel';
interface CountriesData {
  clinicaltrials_countries: Record<string, number>;
}

interface CountriesChartWidgetProps {
  showDeleteButton?: boolean;
  onDelete?: () => void;
  filters?: FilterState;
}

const CountriesChartWidget: React.FC<CountriesChartWidgetProps> = ({
  showDeleteButton = false,
  onDelete,
  filters
}) => {
  return (
    <BaseChartWidget<CountriesData>
      endpoint="http://localhost:8000/aggregations/by_country"
      title="Trials by Country [Top 10] (ClinicalTrials.gov)"
      chartConfig={{
        type: 'bar',
        width: 350,
        height: 250,
        dataKeys: ['value'],
        layout: 'vertical',
        showLegend: true
      }}
      transformData={(data) =>
        Object.entries(data.clinicaltrials_countries)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, value]) => ({ name, value }))
      }
      showDeleteButton={showDeleteButton}
      onDelete={onDelete}
      filters={filters}
    />
  );
};

export default CountriesChartWidget;
