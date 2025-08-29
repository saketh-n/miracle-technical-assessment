import React from 'react';

export interface FilterState {
  region: 'ALL' | 'US' | 'EU';
  condition: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface FiltersPanelProps {
  filters: FilterState;
  onFiltersChange: (newFilters: FilterState) => void;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({ filters, onFiltersChange }) => {
  const handleRegionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      region: event.target.value as FilterState['region'],
    });
  };

  const handleConditionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      condition: event.target.value,
    });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value ? new Date(value) : null,
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Region Selector */}
        <div className="flex-1 min-w-[200px]">
          <select
            value={filters.region}
            onChange={handleRegionChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="ALL">All Regions</option>
            <option value="US">United States</option>
            <option value="EU">European Union</option>
          </select>
        </div>

        {/* Condition Search */}
        <div className="flex-1 min-w-[300px]">
          <input
            type="text"
            placeholder="Search conditions..."
            value={filters.condition}
            onChange={handleConditionChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Date Range Picker */}
        <div className="flex gap-4 flex-1 min-w-[400px]">
          <input
            type="date"
            value={filters.startDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="date"
            value={filters.endDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel;