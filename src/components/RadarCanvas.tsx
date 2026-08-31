import { useEffect, useRef } from 'react'
import type { BarColor, RadarReading } from '../types'

export interface RadarCanvasProps {
  history: RadarReading[]
  sweepSpeed: number
  persistBrightness: number
  barColor: BarColor
  maxRange: number
  active: boolean
}

const COLOR_PALETTE: Record<BarColor, { phosphor: string; line: string }> = {
  green: { phosphor: 'rgba(0,255,90,', line: '#00ff5a' },
  amber: { phosphor: 'rgba(255,176,0,', line: '#ffb000' },
  cyan: { phosphor: 'rgba(0,224,255,', line: '#00e0ff' },
}

interface RadarState {
  history: RadarReading[]
  sweepSpeed: number
  persistBrightness: number
  maxRange: number
  active: boolean
  color: { phosphor: string; line: string }
  sweepAngle: number
}

export function RadarCanvas({ history, sweepSpeed, persistBrightness, barColor, maxRange, active }: RadarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<RadarState>({
    history,
    sweepSpeed,
    persistBrightness,
    maxRange,
    active,
    color: COLOR_PALETTE[barColor],
    sweepAngle: 0,
  })

  stateRef.current.history = history
  stateRef.current.sweepSpeed = sweepSpeed
  stateRef.current.persistBrightness = persistBrightness
  stateRef.current.maxRange = maxRange
  stateRef.current.active = active
  stateRef.current.color = COLOR_PALETTE[barColor]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId: number
    let lastTime = performance.now()

    const draw = (now: number) => {
      const dpr = window.devicePixelRatio || 1
      const size = canvas.clientWidth
      canvas.width = size * dpr
      canvas.height = size * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const state = stateRef.current

      ctx.fillStyle = `rgba(2, 8, 6, ${1 - state.persistBrightness * 0.12})`
      ctx.fillRect(0, 0, size, size)

      const center = size / 2
      const radius = center - 14
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now

      if (state.active) {
        state.sweepAngle = (state.sweepAngle + state.sweepSpeed * dt * 60) % 360
      }

      drawReticle(ctx, center, radius, state)
      drawPlots(ctx, center, radius, state)
      drawSweep(ctx, center, radius, state)
      drawAmbientGlow(ctx, center, state)

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <canvas ref={canvasRef} className="radar-canvas" />
}

function polarX(center: number, radius: number, angleDeg: number): number {
  return center + radius * Math.cos((angleDeg * Math.PI) / 180)
}

function polarY(center: number, radius: number, angleDeg: number): number {
  return center + radius * Math.sin((angleDeg * Math.PI) / 180)
}

function drawReticle(ctx: CanvasRenderingContext2D, center: number, radius: number, s: RadarState) {
  const color = s.color.line
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 1

  const ringCount = 5
  for (let i = 1; i <= ringCount; i++) {
    const r = (radius * i) / ringCount
    ctx.beginPath()
    ctx.arc(center, center, r, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = color
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`${Math.round((s.maxRange * i) / ringCount)}`, center + 3, center - r + 3)
  }

  ctx.globalAlpha = 0.3
  ctx.beginPath()
  for (let deg = 0; deg < 360; deg += 15) {
    ctx.moveTo(center, center)
    ctx.lineTo(polarX(center, radius, deg), polarY(center, radius, deg))
  }
  ctx.stroke()

  ctx.globalAlpha = 0.5
  ctx.beginPath()
  for (const deg of [0, 90, 180, 270]) {
    ctx.moveTo(center, center)
    ctx.lineTo(polarX(center, radius, deg), polarY(center, radius, deg))
  }
  ctx.stroke()

  ctx.font = '10px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = color
  ctx.globalAlpha = 0.6
  ctx.fillText('0°', polarX(center, radius + 12, 0), polarY(center, radius + 12, 0) + 3)
  ctx.fillText('90°', polarX(center, radius + 12, 90), polarY(center, radius + 12, 90) + 3)
  ctx.fillText('180°', polarX(center, radius + 12, 180), polarY(center, radius + 12, 180) + 3)
  ctx.fillText('270°', polarX(center, radius + 12, 270), polarY(center, radius + 12, 270) + 3)

  ctx.globalAlpha = 1
}

function drawPlots(ctx: CanvasRenderingContext2D, center: number, radius: number, s: RadarState) {
  const color = s.color.phosphor
  const hist = s.history

  for (let i = 0; i < hist.length; i++) {
    const r = hist[i]
    const normalized = Math.min(r.distance / s.maxRange, 1)
    const dotRadius = 2 + normalized * 2
    const x = polarX(center, radius * normalized, r.angle)
    const y = polarY(center, radius * normalized, r.angle)

    ctx.fillStyle = `${color}${0.9 - (i / hist.length) * 0.5})`
    ctx.beginPath()
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `${color}1)`
    ctx.beginPath()
    ctx.arc(x, y, dotRadius * 0.45, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawSweep(ctx: CanvasRenderingContext2D, center: number, radius: number, s: RadarState) {
  const line = s.color.line
  const angle = s.sweepAngle

  ctx.fillStyle = 'rgba(0,255,90,0.10)'
  ctx.beginPath()
  ctx.moveTo(center, center)
  ctx.arc(center, center, radius, ((angle - 26) * Math.PI) / 180, (angle * Math.PI) / 180)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = line
  ctx.lineWidth = 1.8
  ctx.shadowColor = line
  ctx.shadowBlur = 12
  ctx.globalAlpha = 1
  ctx.beginPath()
  ctx.moveTo(center, center)
  ctx.lineTo(polarX(center, radius, angle), polarY(center, radius, angle))
  ctx.stroke()
  ctx.shadowBlur = 0

  ctx.fillStyle = line
  ctx.beginPath()
  ctx.arc(center, center, 3, 0, Math.PI * 2)
  ctx.fill()
}

function drawAmbientGlow(ctx: CanvasRenderingContext2D, center: number, s: RadarState) {
  ctx.strokeStyle = s.color.line
  ctx.globalAlpha = 0.12
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(center, center, center, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 1
}
