import { useEffect, useRef } from 'react'
import type { BarColor, RadarReading } from '../types'

export interface PolarChartProps {
  data: RadarReading[]
  barColor: BarColor
  maxRange: number
}

const COLOR_LINE: Record<BarColor, string> = {
  green: '#00ff5a',
  amber: '#ffb000',
  cyan: '#00e0ff',
}

export function PolarChart({ data, barColor, maxRange }: PolarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const size = Math.max(1, Math.min(rect.width, rect.height))

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#02100c'
    ctx.fillRect(0, 0, size, size)

    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 10
    const line = COLOR_LINE[barColor]

    // grid
    ctx.strokeStyle = line
    ctx.globalAlpha = 0.25
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx, cy, radius / 2, 0, Math.PI * 2)
    ctx.stroke()

    // polar path
    ctx.globalAlpha = 0.9
    ctx.lineWidth = 1.6
    ctx.beginPath()
    let pen = false
    for (let i = 0; i < data.length; i++) {
      const r = data[i]
      if (!r.detected) {
        pen = false
        continue
      }
      const normalized = Math.min(r.distance / maxRange, 1)
      const x = cx + radius * normalized * Math.cos((r.angle * Math.PI) / 180)
      const y = cy + radius * normalized * Math.sin((r.angle * Math.PI) / 180)
      if (!pen) {
        ctx.moveTo(x, y)
        pen = true
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()

    ctx.globalAlpha = 1
  }, [data, barColor, maxRange])

  return <canvas ref={canvasRef} className="polar-chart" />
}
