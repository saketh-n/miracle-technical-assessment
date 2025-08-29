import React, { useState, useEffect, useRef } from 'react';

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

interface DateConstraints {
  min_date: string | null;
  max_date: string | null;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({ filters, onFiltersChange }) => {
  const [conditions, setConditions] = useState<string[]>([]);
  const [dateConstraints, setDateConstraints] = useState<DateConstraints>({ min_date: null, max_date: null });
  const [isLoading, setIsLoading] = useState(true);
  const [showConditionsDropdown, setShowConditionsDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch conditions
        const conditionsResponse = await fetch('http://localhost:8000/conditions');
        const conditionsData = await conditionsResponse.json();
        setConditions(conditionsData.conditions || []);

        // Fetch date constraints
        const dateResponse = await fetch('http://localhost:8000/min_max_date');
        const dateData = await dateResponse.json();
        if (dateData.min_date && dateData.max_date) {
          setDateConstraints(dateData);
          // Only set default dates if they haven't been set before
          if (!filters.startDate) {
            onFiltersChange({
              ...filters,
              startDate: new Date(dateData.min_date)
            });
          }
          if (!filters.endDate) {
            onFiltersChange({
              ...filters,
              endDate: new Date(dateData.max_date)
            });
          }
        }
      } catch (error) {
        console.error('Error fetching filter data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Add click outside listener for conditions dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowConditionsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRegionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      region: event.target.value as FilterState['region'],
    });
  };

  const handleConditionInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setShowConditionsDropdown(true);
  };

  const handleConditionSelect = (condition: string) => {
    onFiltersChange({
      ...filters,
      condition
    });
    setSearchTerm(condition);
    setShowConditionsDropdown(false);
  };

  const filteredConditions = conditions.filter(condition =>
    condition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value ? new Date(value) : null,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="flex justify-center items-center h-20">
          <div className="animate-pulse text-gray-500">Loading filters...</div>
        </div>
      </div>
    );
  }

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

        {/* Condition Search with Dropdown */}
        <div className="flex-1 min-w-[300px] relative" ref={dropdownRef}>
          <input
            type="text"
            placeholder="Search conditions..."
            value={searchTerm}
            onChange={handleConditionInputChange}
            onFocus={() => setShowConditionsDropdown(true)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {showConditionsDropdown && filteredConditions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border border-gray-300 rounded-lg shadow-lg">
              {filteredConditions.map((condition) => (
                <div
                  key={condition}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleConditionSelect(condition)}
                >
                  {condition}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Date Range Picker */}
        <div className="flex gap-4 flex-1 min-w-[400px]">
          <input
            type="date"
            value={filters.startDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            min={dateConstraints.min_date || undefined}
            max={dateConstraints.max_date || undefined}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="date"
            value={filters.endDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            min={dateConstraints.min_date || undefined}
            max={dateConstraints.max_date || undefined}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel;