import { useEffect, useRef } from 'react'
import type { BarColor, RadarReading } from '../types'

export interface PolarChartProps {
  data: RadarReading[]
  barColor: BarColor
  maxRange: number
  width: number
  height: number
}

const COLOR_LINE: Record<BarColor, string> = {
  green: '#00ff5a',
  amber: '#ffb000',
  cyan: '#00e0ff',
}

export function PolarChart({ data, barColor, maxRange, width, height }: PolarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#02100c'
    ctx.fillRect(0, 0, width, height)

    const cx = width / 2
    const cy = height / 2
    const radius = Math.min(width, height) / 2 - 10
    const line = COLOR_LINE[barColor]

    // grid
    ctx.strokeStyle = line
    ctx.globalAlpha = 0.25
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
    for (let i = 0; i < data.length; i++) {
      const r = data[i]
      const normalized = Math.min(r.distance / maxRange, 1)
      const x = cx + radius * normalized * Math.cos((r.angle * Math.PI) / 180)
      const y = cy + radius * normalized * Math.sin((r.angle * Math.PI) / 180)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = line
    ctx.stroke()

    ctx.globalAlpha = 1
  }, [data, barColor, maxRange, width, height])

  return <canvas ref={canvasRef} style={{ width, height }} className="polar-chart" />
}
