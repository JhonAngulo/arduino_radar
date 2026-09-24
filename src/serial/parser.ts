import type { RadarReading } from '../types'

export type ParsedReading = Omit<RadarReading, 'timestamp'>

export function parseReading(raw: string): ParsedReading | null {
  const line = raw.trim()
  if (!line) return null

  try {
    const obj = JSON.parse(line)
    const angle = Number(obj.angle)
    const distance = Number(obj.distance)

    if (Number.isNaN(angle) || Number.isNaN(distance)) {
      return null
    }

    const normalizedAngle = ((angle % 360) + 360) % 360

    let detected: boolean
    if (typeof obj.detected === 'boolean') {
      detected = obj.detected
    } else if (obj.detected === 1) {
      detected = true
    } else if (obj.detected === 0) {
      detected = false
    } else {
      detected = distance > 0
    }

    return {
      angle: normalizedAngle,
      distance: Math.max(0, distance),
      detected,
    }
  } catch {
    return null
  }
}
