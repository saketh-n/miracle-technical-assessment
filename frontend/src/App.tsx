import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { FontSizeProvider } from './context/FontSizeContext'
import WelcomePage from './components/WelcomePage'
import FontSizeWidget from './components/FontSizeWidget'
import Charts from './components/Charts'
import Sidebar from './components/Sidebar'
import NotFound from './components/NotFound'

function App() {
  return (
    <FontSizeProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <FontSizeWidget />
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </FontSizeProvider>
  )
}

export default App