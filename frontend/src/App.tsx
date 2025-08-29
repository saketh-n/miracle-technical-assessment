/**
 * Main Application Component
 *
 * This component serves as the root of the Miracle Pharmaceutical Intelligence Platform.
 * It manages the overall application layout and routing structure.
 *
 * Layout Structure:
 * - FontSizeProvider: Global font size context for accessibility
 * - Sidebar: Navigation and branding
 * - FontSizeWidget: Accessibility controls
 * - Main content area with routing
 */

import { Routes, Route } from 'react-router-dom'
import { FontSizeProvider } from './context/FontSizeContext'
import WelcomePage from './components/WelcomePage'
import FontSizeWidget from './components/FontSizeWidget'
import Charts from './components/Charts'
import Dashboard from './components/Dashboard'
import Sidebar from './components/Sidebar'
import NotFound from './components/NotFound'

/**
 * Application Routes:
 * - "/" - Welcome/landing page
 * - "/charts" - Main charts and analytics view
 * - "/dashboard/:id" - Individual dashboard view (supports multiple dashboards)
 * - "*" - 404 Not Found page
 */
function App() {
  return (
    <FontSizeProvider>
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <FontSizeWidget />
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/charts" element={<Charts />} />
              <Route path="/dashboard/:id" element={<Dashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </FontSizeProvider>
  )
}

export default App