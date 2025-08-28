import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { FontSizeProvider } from './context/FontSizeContext'
import WelcomePage from './components/WelcomePage'
import FontSizeWidget from './components/FontSizeWidget'
import Charts from './components/Charts'

function App() {
  return (
    <FontSizeProvider>
      <FontSizeWidget />
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/charts" element={<Charts />} />
      </Routes>
    </FontSizeProvider>
  )
}

export default App
