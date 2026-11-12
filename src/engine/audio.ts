/** Generative ambient music: slow chords plus sparse bells, darker as the scale grows. */

export type MusicState = 'on' | 'off' | 'unavailable';

export interface Music {
  toggle(volume: number): MusicState;
  setVolume(volume: number): void;
  /** One bell now, e.g. when an object is opened. No-op while the music is off. */
  chime(): void;
  /** Call every frame: retunes the filter to the current scale. */
  follow(zoom: number): void;
}

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const CHORDS = [
  [50, 57, 62, 66, 69],
  [43, 55, 59, 62, 66],
  [47, 54, 59, 62, 66],
  [45, 52, 57, 61, 64],
];
const PENTATONIC = [74, 76, 78, 81, 83, 86, 88, 90];

export function createMusic(): Music {
  let context: AudioContext | undefined;
  let master: GainNode | undefined;
  let bus: GainNode | undefined;
  let filter: BiquadFilterNode | undefined;
  let on = false;
  let chordTimer: ReturnType<typeof setTimeout> | undefined;
  let bellTimer: ReturnType<typeof setTimeout> | undefined;
  let chordIndex = 0;
  let zoom = 0;

  /** Small scales play an octave up, cosmic scales an octave down. */
  const transpose = () => (zoom < -9 ? 12 : zoom > 13 ? -12 : 0);

  function impulse(ac: AudioContext, seconds: number): AudioBuffer {
    const length = ac.sampleRate * seconds;
    const buffer = ac.createBuffer(2, length, ac.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const samples = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6);
    }
    return buffer;
  }

  function voice(
    hz: number,
    type: OscillatorType,
    peak: number,
    attack: number,
    hold: number,
    release: number,
    detune = 0,
  ): void {
    if (!context || !bus) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const t = context.currentTime;
    oscillator.type = type;
    oscillator.frequency.value = hz;
    oscillator.detune.value = detune;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + attack);
    gain.gain.setValueAtTime(peak, t + attack + hold);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
    oscillator.connect(gain);
    gain.connect(bus);
    oscillator.start(t);
    oscillator.stop(t + attack + hold + release + 0.1);
  }

  function chord(): void {
    if (!on) return;
    const notes = CHORDS[chordIndex++ % CHORDS.length];
    const shift = transpose();
    notes.forEach((m, i) => {
      const hz = midiToHz(m + shift);
      voice(hz, 'sine', 0.05, 3.2 + i * 0.3, 3, 6, -5);
      voice(hz, 'triangle', 0.022, 3.6, 2.6, 6, 7);
    });
    chordTimer = setTimeout(chord, 7600);
  }

  function bell(now: boolean): void {
    if (!on) return;
    const m = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)] + transpose();
    voice(midiToHz(m), 'sine', now ? 0.05 : 0.032, 0.02, 0.05, 4.5, 0);
    if (!now) bellTimer = setTimeout(() => bell(false), 1800 + Math.random() * 4200);
  }

  function build(ac: AudioContext): void {
    master = ac.createGain();
    master.gain.value = 0;
    bus = ac.createGain();
    filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.4;
    const reverb = ac.createConvolver();
    reverb.buffer = impulse(ac, 5);
    const wet = ac.createGain();
    const dry = ac.createGain();
    const compressor = ac.createDynamicsCompressor();
    wet.gain.value = 0.6;
    dry.gain.value = 0.55;
    bus.connect(filter);
    filter.connect(dry);
    filter.connect(reverb);
    reverb.connect(wet);
    dry.connect(master);
    wet.connect(master);
    master.connect(compressor);
    compressor.connect(ac.destination);
  }

  return {
    toggle(volume) {
      try {
        if (!on) {
          const AudioContextClass =
            window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          context ??= new AudioContextClass();
          void context.resume();
          if (!master) build(context);
          on = true;
          master!.gain.cancelScheduledValues(context.currentTime);
          master!.gain.setTargetAtTime(volume, context.currentTime, 1);
          chord();
          bellTimer = setTimeout(() => bell(false), 2500);
        } else {
          on = false;
          clearTimeout(chordTimer);
          clearTimeout(bellTimer);
          master!.gain.setTargetAtTime(0, context!.currentTime, 0.4);
        }
        return on ? 'on' : 'off';
      } catch {
        on = false;
        return 'unavailable';
      }
    },
    setVolume(volume) {
      if (master && context && on) master.gain.setTargetAtTime(volume, context.currentTime, 0.1);
    },
    chime() {
      bell(true);
    },
    follow(z) {
      zoom = z;
      if (on && filter && context) filter.frequency.setTargetAtTime(520 + ((27 - z) / 62) * 2300, context.currentTime, 0.6);
    },
  };
}
