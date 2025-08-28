import React from 'react'
import { useFontSize } from '../context/FontSizeContext'

const FontSizeWidget: React.FC = () => {
  const { fontSize, toggleFontSize } = useFontSize()

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={toggleFontSize}
        className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-white/90"
        title={`Switch to ${fontSize === 'small' ? 'large' : 'small'} font size`}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            {fontSize === 'small' ? 'Aa' : 'AA'}
          </span>
          <span className="text-xs text-gray-500">
            {fontSize === 'small' ? 'Small' : 'Large'}
          </span>
        </div>
      </button>
    </div>
  )
}

export default FontSizeWidget
