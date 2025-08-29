import React from 'react';
import BaseChartWidget from './BaseChartWidget';

interface DurationsData {
  clinicaltrials_durations: Record<string, number>;
  eudract_durations: Record<string, number>;
}

const DurationsChartWidget: React.FC = () => {
  return (
    <BaseChartWidget<DurationsData>
      endpoint="http://localhost:8000/aggregations/by_duration"
      title="Trial Duration Distribution (ClinicalTrials.gov vs EudraCT)"
      chartConfig={{
        type: 'bar',
        width: 350,
        height: 250,
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
    />
  );
};

export default DurationsChartWidget;
