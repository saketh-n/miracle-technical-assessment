import React from 'react'
import { FontSizeProvider } from './context/FontSizeContext'
import WelcomePage from './components/WelcomePage'
import FontSizeWidget from './components/FontSizeWidget'

function App() {
  return (
    <FontSizeProvider>
      <FontSizeWidget />
      <WelcomePage />
    </FontSizeProvider>
  )
}

export default App
