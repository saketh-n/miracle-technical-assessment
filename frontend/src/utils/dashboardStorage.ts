// Utility to manage dashboard layouts in localStorage
import { v4 as uuidv4 } from 'uuid'; // For generating unique dashboard IDs

export interface DashboardLayout {
  [chartId: string]: number; // chartId -> position (1-based index)
}

export interface DashboardStorage {
  [dashboardId: string]: DashboardLayout;
}

// Initialize localStorage with a default dashboard if empty
export const initializeDashboards = (): void => {
  const dashboards = getDashboards();
  if (Object.keys(dashboards).length === 0) {
    const defaultDashboard: DashboardStorage = {
      '1': {}, // Default dashboard with ID "1" and no charts
    };
    localStorage.setItem('dashboards', JSON.stringify(defaultDashboard));
  }
};

// Get all dashboards from localStorage
export const getDashboards = (): DashboardStorage => {
  const dashboards = localStorage.getItem('dashboards');
  return dashboards ? JSON.parse(dashboards) : {};
};

// Get a specific dashboard by ID
export const getDashboard = (dashboardId: string): DashboardLayout => {
  const dashboards = getDashboards();
  return dashboards[dashboardId] || {};
};

// Create a new dashboard and return its ID
export const createDashboard = (): string => {
  const dashboards = getDashboards();
  const newId = uuidv4(); // Generate unique ID
  dashboards[newId] = {};
  localStorage.setItem('dashboards', JSON.stringify(dashboards));
  return newId;
};

// Update a dashboard's layout
export const updateDashboard = (dashboardId: string, layout: DashboardLayout): void => {
  const dashboards = getDashboards();
  dashboards[dashboardId] = layout;
  localStorage.setItem('dashboards', JSON.stringify(dashboards));
};