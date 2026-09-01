export interface RadarReading {
  angle: number
  distance: number
  detected: boolean
}

export interface SerialSettings {
  baudRate: number
}

export const ConnectionStatus = {
  Disconnected: 'disconnected',
  Connecting: 'connecting',
  Connected: 'connected',
  Error: 'error',
} as const

export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus]

export type BarColor = 'green' | 'amber' | 'cyan'
