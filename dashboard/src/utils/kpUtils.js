/**
 * Kp index to G-scale and color mapping.
 */
export function getKpColor(kp) {
  if (kp < 2) return 'var(--kp-quiet)'
  if (kp < 4) return 'var(--kp-unsettled)'
  if (kp < 5) return 'var(--kp-active)'
  if (kp < 6) return 'var(--kp-minor-storm)'
  if (kp < 7) return 'var(--kp-major-storm)'
  if (kp < 8) return 'var(--kp-severe)'
  return 'var(--kp-extreme)'
}

export function getKpClass(kp) {
  if (kp < 2) return 'quiet'
  if (kp < 4) return 'unsettled'
  if (kp < 5) return 'active'
  if (kp < 6) return 'minor-storm'
  if (kp < 7) return 'major-storm'
  if (kp < 8) return 'severe'
  return 'extreme'
}

export function getGScale(kp) {
  if (kp < 5) return { level: 'G0', label: 'Quiet', color: 'var(--kp-quiet)' }
  if (kp < 6) return { level: 'G1', label: 'Minor Storm', color: 'var(--kp-minor-storm)' }
  if (kp < 7) return { level: 'G2', label: 'Moderate Storm', color: 'var(--kp-major-storm)' }
  if (kp < 8) return { level: 'G3', label: 'Strong Storm', color: 'var(--kp-severe)' }
  if (kp < 9) return { level: 'G4', label: 'Severe Storm', color: 'var(--kp-severe)' }
  return { level: 'G5', label: 'Extreme Storm', color: 'var(--kp-extreme)' }
}

export function formatTimestamp(ts) {
  if (!ts) return '—'
  try {
    const d = new Date(ts)
    return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
  } catch {
    return ts
  }
}

export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined) return '—'
  return Number(num).toFixed(decimals)
}
