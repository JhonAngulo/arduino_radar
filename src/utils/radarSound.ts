const MIN_BLIP_INTERVAL_MS = 150

let ctx: AudioContext | null = null
let lastBlip = 0

function getCtx(): AudioContext | null {
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

export function playRadarBlip() {
  const now = performance.now()
  if (now - lastBlip < MIN_BLIP_INTERVAL_MS) return
  lastBlip = now

  const audio = getCtx()
  if (!audio) return
  if (audio.state === 'suspended') {
    audio.resume().catch(() => {})
  }

  try {
    const osc = audio.createOscillator()
    const gain = audio.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(1300, audio.currentTime)
    osc.frequency.exponentialRampToValueAtTime(750, audio.currentTime + 0.12)

    gain.gain.setValueAtTime(0.35, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.15)

    osc.connect(gain)
    gain.connect(audio.destination)
    osc.start()
    osc.stop(audio.currentTime + 0.16)
  } catch {
    // silencioso
  }
}
