import React from 'react';
import BaseChartWidget from './BaseChartWidget';

interface PhasesData {
  clinicaltrials_phases: Record<string, number>;
  eudract_phases: Record<string, number>;
}

const PhasesChartWidget: React.FC = () => {
  return (
    <BaseChartWidget<PhasesData>
      endpoint="http://localhost:8000/aggregations/by_phase"
      title="Trials by Phase (ClinicalTrials.gov vs EudraCT)"
      chartConfig={{
        type: 'bar',
        width: 350,
        height: 250,
        dataKeys: ['clinicaltrials', 'eudract'],
        showLegend: true
      }}
      transformData={(data) =>
        Object.keys(data.clinicaltrials_phases).map((phase) => ({
          name: phase,
          clinicaltrials: data.clinicaltrials_phases[phase],
          eudract: data.eudract_phases[phase],
        }))
      }
    />
  );
};

export default PhasesChartWidget;
