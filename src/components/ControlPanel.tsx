import type { BarColor } from '../types'

export interface ControlPanelProps {
  persistSeconds: number
  onPersistSeconds: (v: number) => void
  barColor: BarColor
  onBarColor: (c: BarColor) => void
  maxRange: number
  onMaxRange: (v: number) => void
  detectDistance: number
  onDetectDistance: (v: number) => void
}

export function ControlPanel({
  persistSeconds,
  onPersistSeconds,
  barColor,
  onBarColor,
  maxRange,
  onMaxRange,
  detectDistance,
  onDetectDistance,
}: ControlPanelProps) {
  return (
    <div className="panel">
      <div className="panel-title">Controles de Barrido</div>

      <label className="field">
        <span className="field-label">Persistencia: {persistSeconds.toFixed(1)} s</span>
        <input
          type="range"
          min={0.3}
          max={5}
          step={0.2}
          value={persistSeconds}
          onChange={(e) => onPersistSeconds(Number(e.target.value))}
        />
      </label>

      <label className="field">
        <span className="field-label">Rango de gráfica: {maxRange} cm</span>
        <input
          type="range"
          min={50}
          max={400}
          step={50}
          value={maxRange}
          onChange={(e) => onMaxRange(Number(e.target.value))}
        />
      </label>

      <label className="field">
        <span className="field-label">Distancia de detección: {detectDistance} cm</span>
        <input
          type="range"
          min={20}
          max={400}
          step={10}
          value={detectDistance}
          onChange={(e) => onDetectDistance(Number(e.target.value))}
        />
      </label>

      <div className="field">
        <span className="field-label">Color</span>
        <div className="color-row">
          {(['green', 'amber', 'cyan'] as BarColor[]).map((c) => (
            <button
              key={c}
              className={`color-btn ${c}${barColor === c ? ' active' : ''}`}
              onClick={() => onBarColor(c)}
              aria-label={c}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
