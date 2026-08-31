import type { RadarReading } from '../types'

export interface DataPanelProps {
  current: RadarReading | null
  sampleCount: number
  active: boolean
}

export function DataPanel({ current, sampleCount, active }: DataPanelProps) {
  return (
    <div className="panel">
      <div className="panel-title">Lecturas en Vivo</div>
      <div className="readings">
        <div className="reading">
          <span className="muted">Ángulo</span>
          <strong>{current ? `${Math.round(current.angle)}°` : '—'}</strong>
        </div>
        <div className="reading">
          <span className="muted">Distancia</span>
          <strong>{current ? `${Math.round(current.distance)} cm` : '—'}</strong>
        </div>
        <div className="reading">
          <span className="muted">Muestras</span>
          <strong>{sampleCount}</strong>
        </div>
        <div className="reading">
          <span className="muted">Barrido</span>
          <strong>{active ? 'Activo' : 'Detenido'}</strong>
        </div>
      </div>
    </div>
  )
}
