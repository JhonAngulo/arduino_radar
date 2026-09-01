import type { RadarReading } from '../types'

export interface DataPanelProps {
  current: RadarReading | null
  sampleCount: number
  active: boolean
}

export function DataPanel({ current, sampleCount, active }: DataPanelProps) {
  const detected = current?.detected === true

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
          <strong>{detected ? `${Math.round(current.distance)} cm` : '—'}</strong>
        </div>
        <div className={`reading ${detected ? 'det' : 'no-det'}`}>
          <span className="muted">Detección</span>
          <strong className={detected ? 'det' : 'no-det'}>
            {current ? (detected ? 'OBJETO' : 'vacío') : '—'}
          </strong>
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
