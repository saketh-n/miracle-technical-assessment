/**
 * Font Size Context for Accessibility
 *
 * This context provides global font size management across the application,
 * allowing users to adjust text size for better accessibility and readability.
 *
 * Features:
 * - Toggle between 'small' and 'large' font sizes
 * - Persistent across component re-renders
 * - Used by components that need font size awareness
 */

import React, { createContext, useContext, useState, type ReactNode } from 'react'

/** Available font size options for the application */
type FontSize = 'small' | 'large'

/** Context type definition for font size management */
interface FontSizeContextType {
  /** Current font size setting */
  fontSize: FontSize
  /** Toggle between small and large font sizes */
  toggleFontSize: () => void
  /** Set font size to a specific value */
  setFontSize: (size: FontSize) => void
}

/** React context for font size state management */
const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined)

/**
 * Custom hook to access font size context
 *
 * @throws Error if used outside of FontSizeProvider
 * @returns Font size context with current state and controls
 */
export const useFontSize = () => {
  const context = useContext(FontSizeContext)
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider')
  }
  return context
}

/** Props for the FontSizeProvider component */
interface FontSizeProviderProps {
  children: ReactNode
}

/**
 * Font Size Provider Component
 *
 * Wraps the application to provide font size context to all child components.
 * Manages the global font size state and provides controls for changing it.
 */
export const FontSizeProvider: React.FC<FontSizeProviderProps> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSize>('small')

  const toggleFontSize = () => {
    setFontSizeState(prev => prev === 'small' ? 'large' : 'small')
  }

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size)
  }

  const value = {
    fontSize,
    toggleFontSize,
    setFontSize
  }

  return (
    <FontSizeContext.Provider value={value}>
      {children}
    </FontSizeContext.Provider>
  )
}
