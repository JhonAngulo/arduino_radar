const MIN_BLIP_INTERVAL_MS = 400

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
    const t = audio.currentTime

    // Dragon Radar "ping" principal - agudo y電子ico
    const osc1 = audio.createOscillator()
    const gain1 = audio.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(2200, t)
    osc1.frequency.exponentialRampToValueAtTime(1600, t + 0.08)
    gain1.gain.setValueAtTime(0.4, t)
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
    osc1.connect(gain1)
    gain1.connect(audio.destination)
    osc1.start(t)
    osc1.stop(t + 0.18)

    // Armónico superior para el carácter "digital"
    const osc2 = audio.createOscillator()
    const gain2 = audio.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(4400, t)
    osc2.frequency.exponentialRampToValueAtTime(3200, t + 0.06)
    gain2.gain.setValueAtTime(0.15, t)
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
    osc2.connect(gain2)
    gain2.connect(audio.destination)
    osc2.start(t)
    osc2.stop(t + 0.1)

    // Eco sutil para efecto de sonar
    const osc3 = audio.createOscillator()
    const gain3 = audio.createGain()
    osc3.type = 'sine'
    osc3.frequency.setValueAtTime(1800, t + 0.05)
    osc3.frequency.exponentialRampToValueAtTime(1200, t + 0.2)
    gain3.gain.setValueAtTime(0.0001, t)
    gain3.gain.linearRampToValueAtTime(0.12, t + 0.06)
    gain3.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    osc3.connect(gain3)
    gain3.connect(audio.destination)
    osc3.start(t + 0.05)
    osc3.stop(t + 0.22)
  } catch {
    // silencioso
  }
}
