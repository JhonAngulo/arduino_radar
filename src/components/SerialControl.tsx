import { ConnectionStatus, type SerialSettings } from '../types'

export interface SerialControlProps {
  supported: boolean
  status: ConnectionStatus
  portName: string | null
  settings: SerialSettings
  onSettingsChange: (s: SerialSettings) => void
  onConnect: () => void
  onDisconnect: () => void
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  [ConnectionStatus.Disconnected]: 'Desconectado',
  [ConnectionStatus.Connecting]: 'Conectando…',
  [ConnectionStatus.Connected]: 'Conectado',
  [ConnectionStatus.Error]: 'Error',
}

export function SerialControl({
  supported,
  status,
  portName,
  settings,
  onSettingsChange,
  onConnect,
  onDisconnect,
}: SerialControlProps) {
  if (!supported) {
    return (
      <div className="panel warning">
        <strong>Web Serial API no soportada.</strong>
        <span>Usa Chrome o Edge y sirve la app bajo HTTPS o localhost.</span>
      </div>
    )
  }

  const connected = status === ConnectionStatus.Connected

  return (
    <div className="panel">
      <div className="panel-title">Conexión Serial</div>

      <label className="field">
        <span>Baudrate</span>
        <select
          value={settings.baudRate}
          disabled={connected}
          onChange={(e) => onSettingsChange({ baudRate: Number(e.target.value) })}
        >
          {[9600, 19200, 38400, 57600, 115200].map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>

      <div className="status-row">
        <span className={`status-dot status-${status}`} />
        <span>{STATUS_LABEL[status]}</span>
        {portName && <span className="muted">· {portName}</span>}
      </div>

      {connected ? (
        <button className="btn danger" onClick={onDisconnect}>
          Desconectar
        </button>
      ) : (
        <button
          className="btn primary"
          onClick={onConnect}
          disabled={status === ConnectionStatus.Connecting}
        >
          {status === ConnectionStatus.Connecting ? 'Conectando…' : 'Conectar al puerto'}
        </button>
      )}
    </div>
  )
}
