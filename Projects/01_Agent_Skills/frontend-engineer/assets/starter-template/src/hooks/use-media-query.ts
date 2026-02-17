'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to check if a media query matches
 * @param query - Media query string (e.g., '(min-width: 768px)')
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Set initial value
    setMatches(media.matches)

    // Create listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener
    media.addEventListener('change', listener)

    // Cleanup
    return () => {
      media.removeEventListener('change', listener)
    }
  }, [query])

  return matches
}

/**
 * Hook to check if user prefers reduced motion
 * @returns Boolean indicating if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/**
 * Hook to check if user prefers dark color scheme
 * @returns Boolean indicating if user prefers dark mode
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

/**
 * Hook to check if screen is mobile size
 * @returns Boolean indicating if screen is mobile
 */
export function useIsMobile(): boolean {
  return !useMediaQuery('(min-width: 768px)')
}

/**
 * Hook to check if screen is tablet size or larger
 * @returns Boolean indicating if screen is tablet or larger
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px)')
}

/**
 * Hook to check if screen is desktop size or larger
 * @returns Boolean indicating if screen is desktop or larger
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}
