import { useEffect, useRef } from 'react'
import type { BarColor, RadarReading } from '../types'

export interface RadarCanvasProps {
  history: RadarReading[]
  persistSeconds: number
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
  persistSeconds: number
  maxRange: number
  active: boolean
  color: { phosphor: string; line: string }
  sweepAngle: number
}

export function RadarCanvas({ history, persistSeconds, barColor, maxRange, active }: RadarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<RadarState>({
    history,
    persistSeconds,
    maxRange,
    active,
    color: COLOR_PALETTE[barColor],
    sweepAngle: 0,
  })

  stateRef.current.history = history
  stateRef.current.persistSeconds = persistSeconds
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
      const cw = canvas.clientWidth
      const ch = canvas.clientHeight
      const size = Math.max(1, Math.min(cw, ch))
      canvas.width = size * dpr
      canvas.height = size * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const state = stateRef.current

      ctx.fillStyle = 'rgba(2, 8, 6, 0.02)'
      ctx.fillRect(0, 0, size, size)

      const center = size / 2
      const radius = center - 24
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now

      // Barrido de IDA Y VUELTA: el ángulo del Arduino va y viene entre 0° y
      // 360° (invierte al llegar al límite) para no enredar los cables.
      // El barrido visual se acerca al ángulo objetivo por el camino más corto,
      // aceptando movimiento en ambos sentidos.
      const last = state.history[state.history.length - 1]

      if (state.active && last) {
        const target = last.angle
        const rawDiff = ((target - state.sweepAngle) % 360 + 360) % 360
        const diff = rawDiff > 180 ? rawDiff - 360 : rawDiff
        const follow = Math.min(Math.abs(diff), 720 * dt)
        state.sweepAngle = (state.sweepAngle + Math.sign(diff) * follow + 360) % 360
      }
      // Si no hay conexión activa, el barrido permanece estático.

      drawReticle(ctx, center, radius, state)
      drawPlots(ctx, center, radius, state, now)
      if (state.active) {
        drawSweep(ctx, center, radius, state)
      }
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
  return center - radius * Math.sin((angleDeg * Math.PI) / 180)
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
  ctx.fillStyle = color
  ctx.globalAlpha = 0.6
  ctx.textAlign = 'center'
  ctx.fillText('0°', polarX(center, radius + 14, 0), polarY(center, radius + 14, 0) + 3)
  ctx.textAlign = 'center'
  ctx.fillText('90°', polarX(center, radius + 14, 90), polarY(center, radius + 14, 90) + 4)
  ctx.fillText('180°', polarX(center, radius + 14, 180), polarY(center, radius + 14, 180) + 3)
  ctx.fillText('270°', polarX(center, radius + 14, 270), polarY(center, radius + 14, 270) + 4)

  ctx.globalAlpha = 1
}

function drawPlots(
  ctx: CanvasRenderingContext2D,
  center: number,
  radius: number,
  s: RadarState,
  now: number
) {
  const color = s.color.phosphor
  const hist = s.history
  const persistSec = Math.max(0.1, s.persistSeconds)

  for (let i = 0; i < hist.length; i++) {
    const r = hist[i]
    if (!r.detected) continue

    // Persistencia basada en TIEMPO REAL: el brillo decae según los segundos
    // transcurridos desde la medición. A los `persistSeconds`, el punto desaparece.
    const elapsed = (now - r.timestamp) / 1000
    if (elapsed >= persistSec) continue
    const alpha = Math.max(0, 0.9 * (1 - elapsed / persistSec))

    const normalized = Math.min(r.distance / s.maxRange, 1)
    const dotRadius = 2 + normalized * 2
    const x = polarX(center, radius * normalized, r.angle)
    const y = polarY(center, radius * normalized, r.angle)

    ctx.fillStyle = `${color}${alpha.toFixed(3)})`
    ctx.beginPath()
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `${color}${alpha.toFixed(3)})`
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
  ctx.arc(center, center, radius, (-(angle + 13) * Math.PI) / 180, (-(angle - 13) * Math.PI) / 180)
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
