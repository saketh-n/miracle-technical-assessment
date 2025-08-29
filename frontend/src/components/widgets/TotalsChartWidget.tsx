import React from 'react';
import BaseChartWidget from './BaseChartWidget';

interface TotalsData {
  clinicaltrials_total: number;
  eudract_total: number;
}

const TotalsChartWidget: React.FC = () => {
  return (
    <BaseChartWidget<TotalsData>
      endpoint="http://localhost:8000/aggregations/totals"
      title="Total Clinical Trials (ClinicalTrials.gov vs EudraCT)"
      chartConfig={{
        type: 'bar',
        width: 350,
        height: 250,
        dataKeys: ['value'],
        showLegend: true
      }}
      transformData={(data) => [
        { name: 'ClinicalTrials.gov', value: data.clinicaltrials_total },
        { name: 'EudraCT', value: data.eudract_total }
      ]}
    />
  );
};

export default TotalsChartWidget;
