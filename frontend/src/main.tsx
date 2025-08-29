/**
 * Main application entry point for the Miracle Pharmaceutical Intelligence Platform
 *
 * This file sets up the core React application with:
 * - React Query for data fetching and caching
 * - React Router for client-side routing
 * - Global CSS imports
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

/**
 * Configure React Query client with optimized settings for clinical trial data
 *
 * Caching Strategy:
 * - staleTime: 5 minutes - API responses remain fresh for 5 minutes
 * - retry: 2 attempts - Retry failed requests up to 2 times
 * - refetchOnWindowFocus: false - Prevent unnecessary refetches when switching tabs
 *
 * This configuration optimizes performance for large datasets (~551k records)
 * while ensuring data stays reasonably fresh.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

/**
 * Mount the React application to the DOM
 *
 * Provider Hierarchy:
 * 1. StrictMode - Development warnings and double-render checks
 * 2. QueryClientProvider - Data fetching and caching context
 * 3. BrowserRouter - Client-side routing context
 * 4. App - Main application component
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
