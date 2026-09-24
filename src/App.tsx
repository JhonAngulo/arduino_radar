import { useState } from 'react'
import { useRadarData } from './hooks/useRadarData'
import { SerialControl } from './components/SerialControl'
import { ControlPanel } from './components/ControlPanel'
import { RadarCanvas } from './components/RadarCanvas'
import { PolarChart } from './components/PolarChart'
import { DataPanel } from './components/DataPanel'
import { ConnectionStatus, type BarColor } from './types'

export default function App() {
  const [baudRate, setBaudRate] = useState(9600)
  const [persistSeconds, setPersistSeconds] = useState(2.5)
  const [barColor, setBarColor] = useState<BarColor>('green')
  const [maxRange, setMaxRange] = useState(200)

  const { supported, status, portName, error, current, history, connect, disconnect } = useRadarData({
    baudRate,
  })

  const active = status === ConnectionStatus.Connected

  return (
    <div className="app">
      <header className="app-header">
        <h1>MICRO RADAR</h1>
        <span className="subtitle">Military-style radar interface</span>
        {active && <span className="live-badge">● LIVE</span>}
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="layout">
        <aside className="sidebar">
          <SerialControl
            supported={supported}
            status={status}
            portName={portName}
            settings={{ baudRate }}
            onSettingsChange={(s) => setBaudRate(s.baudRate)}
            onConnect={connect}
            onDisconnect={disconnect}
          />
          <ControlPanel
            persistSeconds={persistSeconds}
            onPersistSeconds={setPersistSeconds}
            barColor={barColor}
            onBarColor={setBarColor}
            maxRange={maxRange}
            onMaxRange={setMaxRange}
          />
          <DataPanel current={current} sampleCount={history.length} active={active} />
        </aside>

        <main className="radar-area">
          <div className="radar-frame">
            <RadarCanvas
              history={history}
              persistSeconds={persistSeconds}
              barColor={barColor}
              maxRange={maxRange}
              active={active}
            />
          </div>
          <div className="chart-frame">
            <div className="panel-title">Distancia vs Ángulo</div>
            <PolarChart
              data={history}
              barColor={barColor}
              maxRange={maxRange}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
