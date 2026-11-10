export type RevealSound = "sweep" | "steps";

/** Original synthesised reveal sounds, shared by the show and admin previews. */
export function playRevealSound(style: RevealSound = "sweep", duration = 3300) {
  let ctx: AudioContext;
  try { ctx = new AudioContext(); } catch { return () => {}; }
  void ctx.resume();
  const oscillator = ctx.createOscillator(), gain = ctx.createGain();
  oscillator.type = style === "steps" ? "sine" : "triangle";
  oscillator.connect(gain); gain.connect(ctx.destination);
  const start = ctx.currentTime;
  if (style === "steps") {
    // Short, separated notes climb a pentatonic ladder; no sampled programme audio.
    const notes = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    gain.gain.setValueAtTime(0, start);
    notes.forEach((note, i) => {
      const t = start + i * duration / 1000 / notes.length;
      oscillator.frequency.setValueAtTime(196 * 2 ** (note / 12), t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.065, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      gain.gain.setValueAtTime(0, t + 0.17);
    });
  } else {
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.045, start + 0.03);
    for (let ms = 0; ms < duration; ms += 20) {
      const t = ms / duration;
      const height = 0.5 + Math.sin(t * (42 - 18 * t)) * 0.5;
      oscillator.frequency.setTargetAtTime(180 + height * 900, start + ms / 1000, 0.018);
    }
  }
  oscillator.start();
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    oscillator.frequency.cancelScheduledValues(ctx.currentTime);
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.012);
    oscillator.stop(ctx.currentTime + 0.06);
    oscillator.onended = () => { void ctx.close(); };
  };
  const timer = window.setTimeout(stop, duration);
  return stop;
}
