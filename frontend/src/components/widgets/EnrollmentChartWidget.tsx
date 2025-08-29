import React from 'react';
import BaseChartWidget from './BaseChartWidget';

interface EnrollmentData {
  clinicaltrials_enrollment: Record<string, number>;
  eudract_enrollment: Record<string, number>;
}

interface EnrollmentChartWidgetProps {
  source: 'clinicaltrials' | 'eudract';
}

const EnrollmentChartWidget: React.FC<EnrollmentChartWidgetProps> = ({ source }) => {
  const sourceName = source === 'clinicaltrials' ? 'ClinicalTrials.gov' : 'EudraCT';

  return (
    <BaseChartWidget<EnrollmentData>
      endpoint="http://localhost:8000/aggregations/enrollment_by_region"
      title={`Enrollment by Region (${sourceName})`}
      chartConfig={{
        type: 'pie',
        width: 350,
        height: 250,
        dataKeys: ['value'],
        showLegend: true
      }}
      transformData={(data) => {
        const enrollment = source === 'clinicaltrials'
          ? data.clinicaltrials_enrollment
          : data.eudract_enrollment;

        return Object.entries(enrollment)
          .filter(([_, value]) => value > 0)
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => ({ name, value }));
      }}
    />
  );
};

export default EnrollmentChartWidget;
