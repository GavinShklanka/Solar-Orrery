import { useState, useEffect, useCallback } from 'react'
import * as Demo from '../data/demoData.js'

const API_BASE = '/api/v1'

/**
 * Detect if we're on GitHub Pages or any non-localhost host (no API available).
 * On localhost/127.0.0.1, we attempt real API calls.
 */
const IS_STATIC = typeof window !== 'undefined' &&
  !window.location.hostname.includes('localhost') &&
  !window.location.hostname.includes('127.0.0.1')

/**
 * Generic hook for fetching data from the Vela API.
 * Returns { data, loading, error, refetch, isDemo }
 * On static hosting, immediately returns demo data without fetching.
 */
export function useVelaAPI(endpoint, options = {}) {
  const { pollInterval = null, initialData = null, demoData = null } = options
  const [data, setData] = useState(IS_STATIC && demoData ? demoData : initialData)
  const [loading, setLoading] = useState(!IS_STATIC)
  const [error, setError] = useState(null)
  const [isDemo, setIsDemo] = useState(IS_STATIC && !!demoData)

  const fetchData = useCallback(async () => {
    // Skip fetch entirely on static hosting
    if (IS_STATIC) {
      if (demoData) {
        setData(demoData)
        setIsDemo(true)
      }
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`)
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail?.error || errData.detail || `HTTP ${response.status}`)
      }
      const result = await response.json()
      setData(result)
      setError(null)
      setIsDemo(false)
    } catch (err) {
      console.error(`[Vela] API error for ${endpoint}:`, err)
      // Fall back to demo data if available
      if (demoData && !data) {
        setData(demoData)
        setIsDemo(true)
      }
      setError({
        source: endpoint,
        message: err.message,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }, [endpoint, demoData])

  useEffect(() => {
    fetchData()
    if (!IS_STATIC && pollInterval) {
      const interval = setInterval(fetchData, pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, pollInterval])

  return { data, loading, error, refetch: fetchData, isDemo }
}

// ─── Individual Hooks (mapped to demo data) ──────────────────────────────────

export function useSatellites() {
  return useVelaAPI('/satellites?limit=200', {
    pollInterval: 300000,
    demoData: Demo.DEMO_SATELLITES,
  })
}

export function useKpForecast() {
  return useVelaAPI('/kp/current', {
    pollInterval: 180000,
    demoData: Demo.DEMO_KP_CURRENT,
  })
}

export function useKpForecastData() {
  return useVelaAPI('/kp/forecast', {
    pollInterval: 600000,
    demoData: Demo.DEMO_KP_FORECAST,
  })
}

export function useNEO() {
  return useVelaAPI('/neo/upcoming', {
    pollInterval: 3600000,
    demoData: Demo.DEMO_NEO_UPCOMING,
  })
}

export function useSentry() {
  return useVelaAPI('/neo/sentry', {
    pollInterval: 3600000,
    demoData: Demo.DEMO_SENTRY,
  })
}

export function useSolarWindMag() {
  return useVelaAPI('/solar-wind/mag', {
    pollInterval: 60000,
    demoData: Demo.DEMO_SOLAR_WIND_MAG,
  })
}

export function useSolarWindPlasma() {
  return useVelaAPI('/solar-wind/plasma', {
    pollInterval: 60000,
    demoData: Demo.DEMO_SOLAR_WIND_PLASMA,
  })
}

export function useSolarWindCurrent() {
  return useVelaAPI('/solar-wind/current', {
    pollInterval: 60000,
    demoData: Demo.DEMO_SOLAR_WIND_CURRENT,
  })
}

export function useDONKICME() {
  return useVelaAPI('/donki/cme', {
    pollInterval: 3600000,
    demoData: Demo.DEMO_DONKI_CME,
  })
}

export function useDONKIStorms() {
  return useVelaAPI('/donki/storms', {
    pollInterval: 3600000,
    demoData: Demo.DEMO_DONKI_STORMS,
  })
}

export function useDONKIFlares() {
  return useVelaAPI('/donki/flares', {
    pollInterval: 3600000,
    demoData: Demo.DEMO_DONKI_FLARES,
  })
}

export function useSpaceWeatherScales() {
  return useVelaAPI('/space-weather/scales', {
    pollInterval: 300000,
    demoData: Demo.DEMO_SPACE_WEATHER_SCALES,
  })
}

export function useVelaForecast() {
  return useVelaAPI('/kp/vela-forecast', {
    pollInterval: 180000,
    demoData: Demo.DEMO_VELA_FORECAST,
  })
}

/** Expose IS_STATIC for App.jsx to use */
export { IS_STATIC }
