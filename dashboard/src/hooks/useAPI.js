import { useState, useEffect, useCallback } from 'react'

const API_BASE = '/api/v1'

/**
 * Generic hook for fetching data from the Vela API.
 * Returns { data, loading, error, refetch }
 * On error, surfaces source name and last-known timestamp per spec requirement.
 */
export function useVelaAPI(endpoint, options = {}) {
  const { pollInterval = null, initialData = null } = options
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`)
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail?.error || errData.detail || `HTTP ${response.status}`)
      }
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      console.error(`[Vela] API error for ${endpoint}:`, err)
      setError({
        source: endpoint,
        message: err.message,
        timestamp: new Date().toISOString(),
      })
      // Don't clear existing data — show stale data with error indicator
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    fetchData()
    if (pollInterval) {
      const interval = setInterval(fetchData, pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, pollInterval])

  return { data, loading, error, refetch: fetchData }
}

export function useSatellites() {
  return useVelaAPI('/satellites?limit=200', { pollInterval: 300000 }) // 5 min
}

export function useKpForecast() {
  return useVelaAPI('/kp/current', { pollInterval: 180000 }) // 3 min
}

export function useKpForecastData() {
  return useVelaAPI('/kp/forecast', { pollInterval: 600000 }) // 10 min
}

export function useNEO() {
  return useVelaAPI('/neo/upcoming', { pollInterval: 3600000 }) // 1 hr
}

export function useSentry() {
  return useVelaAPI('/neo/sentry', { pollInterval: 3600000 })
}

export function useSolarWindMag() {
  return useVelaAPI('/solar-wind/mag', { pollInterval: 60000 }) // 1 min
}

export function useSolarWindPlasma() {
  return useVelaAPI('/solar-wind/plasma', { pollInterval: 60000 })
}

export function useSolarWindCurrent() {
  return useVelaAPI('/solar-wind/current', { pollInterval: 60000 })
}

export function useDONKICME() {
  return useVelaAPI('/donki/cme', { pollInterval: 3600000 })
}

export function useDONKIStorms() {
  return useVelaAPI('/donki/storms', { pollInterval: 3600000 })
}

export function useDONKIFlares() {
  return useVelaAPI('/donki/flares', { pollInterval: 3600000 })
}

export function useSpaceWeatherScales() {
  return useVelaAPI('/space-weather/scales', { pollInterval: 300000 })
}

export function useVelaForecast() {
  return useVelaAPI('/kp/vela-forecast', { pollInterval: 180000 }) // 3 min
}
