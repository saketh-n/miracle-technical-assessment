import React, { useState, useEffect } from 'react';
import {
  TotalsChartWidget,
  ConditionsChartWidget,
  SponsorsChartWidget,
  EnrollmentChartWidget,
  StatusChartWidget,
  PhasesChartWidget,
  YearsChartWidget,
  CountriesChartWidget,
  DurationsChartWidget,
} from '../widgets';

interface AddChartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingCharts: string[];
  onAddCharts: (chartIds: string[]) => void;
  chartInfo: { [key: string]: string };
}

const AddChartsModal: React.FC<AddChartsModalProps> = ({
  isOpen,
  onClose,
  missingCharts,
  onAddCharts,
  chartInfo
}) => {
  const [selectedCharts, setSelectedCharts] = useState<string[]>([]);

  // Render chart preview based on chartId
  const renderChartPreview = (chartId: string) => {
    const previewProps = {
      key: `preview-${chartId}`,
      showDeleteButton: false,
      className: 'pointer-events-none opacity-90'
    };

    let chartComponent;
    switch (chartId) {
      case 'totals':
        chartComponent = <TotalsChartWidget {...previewProps} />;
        break;
      case 'conditions-clinicaltrials':
        chartComponent = <ConditionsChartWidget source="clinicaltrials" {...previewProps} />;
        break;
      case 'conditions-eudract':
        chartComponent = <ConditionsChartWidget source="eudract" {...previewProps} />;
        break;
      case 'sponsors-clinicaltrials':
        chartComponent = <SponsorsChartWidget type="clinicaltrials" {...previewProps} />;
        break;
      case 'sponsors-eudract':
        chartComponent = <SponsorsChartWidget type="eudract" {...previewProps} />;
        break;
      case 'sponsors-combined':
        chartComponent = <SponsorsChartWidget type="combined" {...previewProps} />;
        break;
      case 'enrollment-clinicaltrials':
        chartComponent = <EnrollmentChartWidget source="clinicaltrials" {...previewProps} />;
        break;
      case 'enrollment-eudract':
        chartComponent = <EnrollmentChartWidget source="eudract" {...previewProps} />;
        break;
      case 'status-clinicaltrials':
        chartComponent = <StatusChartWidget source="clinicaltrials" {...previewProps} />;
        break;
      case 'status-eudract':
        chartComponent = <StatusChartWidget source="eudract" {...previewProps} />;
        break;
      case 'phases':
        chartComponent = <PhasesChartWidget {...previewProps} />;
        break;
      case 'years':
        chartComponent = <YearsChartWidget {...previewProps} />;
        break;
      case 'countries':
        chartComponent = <CountriesChartWidget {...previewProps} />;
        break;
      case 'durations':
        chartComponent = <DurationsChartWidget {...previewProps} />;
        break;
      default:
        return (
          <div className="flex items-center justify-center h-24 bg-gray-100 rounded">
            <div className="text-xs text-gray-600">Preview not available</div>
          </div>
        );
    }

    return (
      <div className="relative overflow-hidden rounded bg-gray-50">
        <div className="transform scale-50 origin-top-left" style={{ width: '200%', height: '200px' }}>
          <div className="w-full h-full bg-white rounded">
            {chartComponent}
          </div>
        </div>
      </div>
    );
  };

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCharts([]);
    }
  }, [isOpen]);

  // Handle individual chart selection
  const handleChartSelection = (chartId: string) => {
    setSelectedCharts(prev =>
      prev.includes(chartId)
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId]
    );
  };

  // Handle select all/deselect all
  const handleSelectAll = () => {
    setSelectedCharts(prev =>
      prev.length === missingCharts.length ? [] : [...missingCharts]
    );
  };

  // Handle adding selected charts
  const handleAddSelectedCharts = () => {
    if (selectedCharts.length > 0) {
      onAddCharts(selectedCharts);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] shadow-2xl border border-gray-200 flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Add Charts</h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedCharts.length} of {missingCharts.length} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Select All Button */}
          <div className="mb-4">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              {selectedCharts.length === missingCharts.length ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12l-9 9-3-3"></path>
                  </svg>
                  Deselect All
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  </svg>
                  Select All
                </>
              )}
            </button>
          </div>

          {/* Chart List */}
          <div className="space-y-4">
            {missingCharts.map((chartId) => (
              <button
                key={chartId}
                onClick={() => handleChartSelection(chartId)}
                className={`w-full text-left p-4 rounded-lg border transition-colors duration-200 ${
                  selectedCharts.includes(chartId)
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-1 flex-shrink-0 ${
                    selectedCharts.includes(chartId)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedCharts.includes(chartId) && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5"></path>
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Chart Name */}
                    <h4 className={`font-semibold text-sm mb-2 ${
                      selectedCharts.includes(chartId) ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {chartInfo[chartId]}
                    </h4>

                    {/* Chart Preview */}
                    <div className="rounded border border-gray-100 overflow-hidden bg-white">
                      {renderChartPreview(chartId)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleAddSelectedCharts}
            disabled={selectedCharts.length === 0}
            className={`px-4 py-2 font-medium rounded-lg transition-colors duration-200 ${
              selectedCharts.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Add Selected ({selectedCharts.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddChartsModal;
