'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to get computed chart colors from CSS variables.
 * Recharts SVG fills don't support CSS variables directly,
 * so we need to read the computed values at runtime.
 */
export function useChartColors() {
  const [colors, setColors] = useState<string[]>([
    // Default fallback colors (Vibrant Sage light mode)
    '#059669', // chart-1
    '#10B981', // chart-2
    '#34D399', // chart-3
    '#6EE7B7', // chart-4
    '#A7F3D0', // chart-5
  ])

  useEffect(() => {
    const updateColors = () => {
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      
      const newColors = [
        computedStyle.getPropertyValue('--chart-1').trim(),
        computedStyle.getPropertyValue('--chart-2').trim(),
        computedStyle.getPropertyValue('--chart-3').trim(),
        computedStyle.getPropertyValue('--chart-4').trim(),
        computedStyle.getPropertyValue('--chart-5').trim(),
      ].map(color => color || '#059669') // Fallback if empty

      setColors(newColors)
    }

    // Initial update
    updateColors()

    // Listen for theme changes via class mutations on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateColors()
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    // Also listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateColors)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', updateColors)
    }
  }, [])

  return colors
}
