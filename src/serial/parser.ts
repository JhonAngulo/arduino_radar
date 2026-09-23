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

    return {
      angle: normalizedAngle,
      distance: Math.max(0, distance),
      detected: obj.detected ? obj.detected === 1 || obj.detected === true : distance > 0,
    }
  } catch {
    return null
  }
}
