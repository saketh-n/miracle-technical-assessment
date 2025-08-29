import type { FilterState } from '../components/FiltersPanel';

const FILTERS_STORAGE_KEY = 'dashboard_filters';

interface StoredFilterState {
  region: 'ALL' | 'US' | 'EU';
  condition: string[];
  startDate: string | null;  // ISO string for storage
  endDate: string | null;    // ISO string for storage
}

interface DashboardFilters {
  [dashboardId: string]: StoredFilterState;
}

export const getDefaultFilters = (): FilterState => ({
  region: 'ALL',
  condition: [],
  startDate: null,
  endDate: null,
});

export const saveFilters = (dashboardId: string, filters: FilterState): void => {
  try {
    const storedFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
    const allFilters: DashboardFilters = storedFilters ? JSON.parse(storedFilters) : {};
    
    allFilters[dashboardId] = {
      region: filters.region,
      condition: filters.condition,
      // Convert dates to ISO strings for storage
      startDate: filters.startDate ? filters.startDate.toISOString() : null,
      endDate: filters.endDate ? filters.endDate.toISOString() : null,
    };
    
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(allFilters));
  } catch (error) {
    console.error('Error saving filters:', error);
  }
};

export const loadFilters = (dashboardId: string): FilterState => {
  try {
    const storedFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!storedFilters) return getDefaultFilters();

    const allFilters: DashboardFilters = JSON.parse(storedFilters);
    const dashboardFilters = allFilters[dashboardId];
    
    if (!dashboardFilters) return getDefaultFilters();

    // Convert ISO strings back to Date objects
    return {
      ...dashboardFilters,
      startDate: dashboardFilters.startDate ? new Date(dashboardFilters.startDate) : null,
      endDate: dashboardFilters.endDate ? new Date(dashboardFilters.endDate) : null,
    };
  } catch (error) {
    console.error('Error loading filters:', error);
    return getDefaultFilters();
  }
};
