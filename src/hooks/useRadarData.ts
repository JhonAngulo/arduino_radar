import { useCallback, useEffect, useRef, useState } from 'react'
import { createSerialPort, isWebSerialSupported } from '../serial/serialConnection'
import { parseReading } from '../serial/parser'
import { playRadarBlip } from '../utils/radarSound'
import { ConnectionStatus, type RadarReading, type SerialSettings } from '../types'

const MAX_HISTORY = 360

export function useRadarData(settings: SerialSettings, detectDistance: number) {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.Disconnected)
  const [portName, setPortName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [current, setCurrent] = useState<RadarReading | null>(null)
  const [history, setHistory] = useState<RadarReading[]>([])

  const supported = isWebSerialSupported()
  const serialRef = useRef(createSerialPort())
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const detectDistanceRef = useRef(detectDistance)
  detectDistanceRef.current = detectDistance

  useEffect(() => {
    return () => {
      serialRef.current.disconnect().catch(() => {})
    }
  }, [])

  const connect = useCallback(async () => {
    if (!supported) {
      setError('Web Serial API no está disponible. Usa Chrome o Edge con HTTPS o localhost.')
      return
    }
    setStatus(ConnectionStatus.Connecting)
    setError(null)
    try {
      await serialRef.current.connect({
        baudRate: settingsRef.current.baudRate,
        onData: (line) => {
          const parsed = parseReading(line)
          if (parsed) {
            const reading: RadarReading = { ...parsed, timestamp: performance.now() }
            reading.detected = parsed.distance > 0 && parsed.distance <= detectDistanceRef.current
            if (reading.detected) playRadarBlip()
            setCurrent(reading)
            setHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), reading])
          }
        },
        onError: (err) => {
          setStatus(ConnectionStatus.Error)
          setError(err.message)
        },
      })
      setPortName(serialRef.current.info?.name ?? null)
      setStatus(ConnectionStatus.Connected)
    } catch (err) {
      setStatus(ConnectionStatus.Disconnected)
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [supported])

  const disconnect = useCallback(async () => {
    await serialRef.current.disconnect()
    setStatus(ConnectionStatus.Disconnected)
    setPortName(null)
  }, [])

  return {
    supported,
    status,
    portName,
    error,
    current,
    history,
    connect,
    disconnect,
  }
}
