import React, { createContext, useContext, useState, ReactNode } from 'react'

type FontSize = 'small' | 'large'

interface FontSizeContextType {
  fontSize: FontSize
  toggleFontSize: () => void
  setFontSize: (size: FontSize) => void
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined)

export const useFontSize = () => {
  const context = useContext(FontSizeContext)
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider')
  }
  return context
}

interface FontSizeProviderProps {
  children: ReactNode
}

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
