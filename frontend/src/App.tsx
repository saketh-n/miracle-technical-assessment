import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { FontSizeProvider } from './context/FontSizeContext'
import WelcomePage from './components/WelcomePage'
import FontSizeWidget from './components/FontSizeWidget'

function App() {
  return (
    <FontSizeProvider>
      <FontSizeWidget />
      <Routes>
        <Route path="/" element={<WelcomePage />} />
      </Routes>
    </FontSizeProvider>
  )
}

export default App
