import type { BarColor } from '../types'

export interface ControlPanelProps {
  sweepSpeed: number
  onSweepSpeed: (v: number) => void
  persistBrightness: number
  onPersistBrightness: (v: number) => void
  barColor: BarColor
  onBarColor: (c: BarColor) => void
  maxRange: number
  onMaxRange: (v: number) => void
}

export function ControlPanel({
  sweepSpeed,
  onSweepSpeed,
  persistBrightness,
  onPersistBrightness,
  barColor,
  onBarColor,
  maxRange,
  onMaxRange,
}: ControlPanelProps) {
  return (
    <div className="panel">
      <div className="panel-title">Controles de Barrido</div>

      <label className="field">
        <span className="field-label">Velocidad: {sweepSpeed}</span>
        <input
          type="range"
          min={1}
          max={20}
          value={sweepSpeed}
          onChange={(e) => onSweepSpeed(Number(e.target.value))}
        />
      </label>

      <label className="field">
        <span className="field-label">Persistencia: {Math.round(persistBrightness * 100)}%</span>
        <input
          type="range"
          min={1}
          max={8}
          value={persistBrightness}
          onChange={(e) => onPersistBrightness(Number(e.target.value))}
        />
      </label>

      <label className="field">
        <span className="field-label">Rango máximo: {maxRange} cm</span>
        <input
          type="range"
          min={50}
          max={400}
          step={50}
          value={maxRange}
          onChange={(e) => onMaxRange(Number(e.target.value))}
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
