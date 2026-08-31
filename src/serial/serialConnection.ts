export interface SerialPortInfo {
  id: string
  name: string
}

export interface SerialConnectionOptions {
  baudRate: number
  onData: (line: string) => void
  onError?: (error: Error) => void
}

export interface SerialPortNative {
  connected: boolean
  info: SerialPortInfo | null
  connect: (options: SerialConnectionOptions) => Promise<void>
  disconnect: () => Promise<void>
}

interface SerialNavigator extends Navigator {
  serial?: {
    requestPort: (options?: { filters?: unknown[] }) => Promise<{ getInfo: () => { usbVendorId: number; usbProductId: number } }>
    getPorts: () => Promise<{ getInfo: () => { usbVendorId: number; usbProductId: number } }[]>
  }
}

export function isWebSerialSupported(): boolean {
  return 'serial' in navigator
}

function getInfoLabel(info: { usbVendorId: number; usbProductId: number }): string {
  if (info.usbVendorId && info.usbProductId) {
    return `USB ${info.usbVendorId.toString(16)}:${info.usbProductId.toString(16)}`
  }
  return 'Puerto serial'
}

export function createSerialPort(): SerialPortNative {
  let port: SerialLine | null = null

  return {
    get connected() {
      return port?.connected ?? false
    },
    get info() {
      return port ? port.info : null
    },
    async connect({ baudRate, onData, onError }) {
      port = new SerialLine({ baudRate, onData, onError })
      await port.open()
    },
    async disconnect() {
      await port?.close()
      port = null
    },
  }
}

class SerialLine {
  private underlying: any
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  private buffer = ''
  connected = false
  info: SerialPortInfo | null = null

  private readonly baudRate: number
  private readonly onData: (line: string) => void
  private readonly onError?: (error: Error) => void

  constructor({ baudRate, onData, onError }: SerialConnectionOptions) {
    this.baudRate = baudRate
    this.onData = onData
    this.onError = onError
  }

  async open() {
    const serialNav = navigator as SerialNavigator
    if (!serialNav.serial) {
      throw new Error('Web Serial API no está disponible en este navegador')
    }

    const port = await serialNav.serial.requestPort()
    const info = port.getInfo()

    this.underlying = port
    this.info = { id: `${info.usbVendorId}_${info.usbProductId}`, name: getInfoLabel(info) }

    await this.underlying.open({ baudRate: this.baudRate })

    this.connected = true
    this.readLoop().catch((err) => {
      this.connected = false
      this.onError?.(err instanceof Error ? err : new Error(String(err)))
    })
  }

  private async readLoop() {
    const reader = this.underlying.readable.getReader()
    this.reader = reader

    const decoder = new TextDecoder()
    try {
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) {
          this.buffer += decoder.decode(value, { stream: true })
          this.processBuffer()
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  private processBuffer() {
    let newlineIndex: number
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const rawLine = this.buffer.slice(0, newlineIndex)
      this.buffer = this.buffer.slice(newlineIndex + 1)
      const line = rawLine.replace(/\r$/, '').trim()
      if (line) {
        this.onData(line)
      }
    }
  }

  async close() {
    this.connected = false
    if (this.reader) {
      try {
        await this.reader.cancel()
      } catch {
        // ignore
      }
      this.reader = null
    }
    if (this.underlying) {
      try {
        await this.underlying.close()
      } catch {
        // ignore
      }
    }
  }
}
