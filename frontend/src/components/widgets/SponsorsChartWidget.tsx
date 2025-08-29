import React from 'react';
import BaseChartWidget from './BaseChartWidget';
import type { FilterState } from '../FiltersPanel';

interface SponsorsData {
  clinicaltrials_sponsors: Record<string, number>;
  eudract_sponsors: Record<string, number>;
}

interface SponsorsChartWidgetProps {
  type: 'clinicaltrials' | 'eudract' | 'combined';
  showDeleteButton?: boolean;
  onDelete?: () => void;
  filters?: FilterState;
}

const SponsorsChartWidget: React.FC<SponsorsChartWidgetProps> = ({
  type,
  showDeleteButton = false,
  onDelete,
  filters
}) => {
  const getTitle = () => {
    switch (type) {
      case 'clinicaltrials':
        return 'Trials by Sponsor (ClinicalTrials.gov)';
      case 'eudract':
        return 'Trials by Sponsor (EudraCT)';
      case 'combined':
        return 'Top 10 Sponsors (Combined)';
      default:
        return 'Trials by Sponsor';
    }
  };

  return (
    <BaseChartWidget<SponsorsData>
      endpoint="http://localhost:8000/aggregations/by_sponsor"
      title={getTitle()}
      chartConfig={{
        type: 'bar',
        height: 350,
        dataKeys: ['value'],
        showLegend: true
      }}
      transformData={(data) => {
        if (type === 'combined') {
          // Combine both sources and get top 10
          const combined = Object.entries({
            ...data.clinicaltrials_sponsors,
            ...data.eudract_sponsors,
          }).reduce((acc, [sponsor, count]) => {
            acc[sponsor] = (acc[sponsor] || 0) + count;
            return acc;
          }, {} as Record<string, number>);

          return Object.entries(combined)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, value]) => ({ name, value }));
        }

        const sponsors = type === 'clinicaltrials'
          ? data.clinicaltrials_sponsors
          : data.eudract_sponsors;

        return Object.entries(sponsors)
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

export default SponsorsChartWidget;
