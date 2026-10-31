// Presentation scheduling only: native ticks, inputs and replay rules are untouched.
const elements = new Map();
export function setText(id, value) {
  let el = elements.get(id);
  if (!el) {
    el = document.getElementById(id);
    if (el) elements.set(id, el);
  }
  const text = String(value);
  if (el && el.textContent !== text) el.textContent = text;
}
export function readQuality() {
  try {
    return localStorage.getItem("utxoplay:quality") || "auto";
  } catch {
    return "auto";
  }
}
export {QualityGovernor as ResolutionBudget} from './nightshift9-engine.mjs';
import {QualityGovernor} from './nightshift9-engine.mjs';
export function startRenderLoop(
  draw,
  { active = () => true, monitor=active, maxFps = 60, onResolution } = {},
) {
  let handle = 0,
    last = 0,
    scheduled = 0,
    stopped = false,
    quality = readQuality(),
    measure = 0,
    frames = 0,
    cpu = 0,
    gpuMs = null,
    wasPlaying = false;
  const budget = new QualityGovernor(
    Math.min(globalThis.devicePixelRatio || 1, 1.5),
  );
  let ratio = budget.ratio;
  function tick(now) {
    handle = 0;
    if (stopped || document.hidden) return;
    handle = requestAnimationFrame(tick);
    const playing = active(), watching=monitor(),
      interval = 1000 / (playing ? maxFps : 30);
    if (scheduled && now + 0.25 < scheduled) return;
    scheduled = scheduled ? scheduled + interval : now + interval;
    if (scheduled < now) scheduled = now + interval;
    const delta = last ? Math.min(now - last, 250) : 1000 / 60;
    last = now;
    if(watching!==wasPlaying){budget.resetWindows();wasPlaying=watching;}
    const next =
      watching || quality !== "auto"
        ? budget.sample(delta, quality, gpuMs)
        : budget.ratio;
    if (next !== ratio) {
      ratio = next;
      onResolution?.(ratio);
    }
    const start = performance.now();
    const result=draw(now, delta, ratio, budget.features);
    gpuMs=result?.gpuMs??null;
    cpu += performance.now() - start;
    frames++;
    if (now - measure >= 1000) {
      document.documentElement.dataset.renderFps = String(
        Math.round((frames * 1000) / (now - measure)),
      );
      document.documentElement.dataset.renderMs = (cpu / frames).toFixed(2);
      document.documentElement.dataset.renderScale = ratio.toFixed(2);
      document.documentElement.dataset.renderTier = String(budget.tier);
      document.documentElement.dataset.renderQualityLocked = String(budget.locked);
      document.documentElement.dataset.renderQualityChanges = String(budget.changes);
      measure = now;
      frames = cpu = 0;
    }
  }
  function visibility() {
    cancelAnimationFrame(handle);
    handle = 0;
    last = scheduled = 0;budget.resetWindows();
    measure = performance.now();
    frames = cpu = 0;
    if (!document.hidden && !stopped) handle = requestAnimationFrame(tick);
  }
  function qualityChange() {
    quality = readQuality();
    budget.reset();
  }
  document.addEventListener("visibilitychange", visibility);
  addEventListener("storage", qualityChange);
  addEventListener("utxoplay:quality", qualityChange);
  visibility();
  return () => {
    stopped = true;
    cancelAnimationFrame(handle);
    document.removeEventListener("visibilitychange", visibility);
    removeEventListener("storage", qualityChange);
    removeEventListener("utxoplay:quality", qualityChange);
  };
}
export function startPolling(
  task,
  { interval = 5000, enabled = () => true } = {},
) {
  let timer,
    stopped = false,
    running = false;
  async function run() {
    if (stopped || running) return;
    clearTimeout(timer);
    running = true;
    try {
      if (!document.hidden && enabled()) await task();
    } catch {
    } finally {
      running = false;
      if (!stopped) timer = setTimeout(run, interval);
    }
  }
  function visible() {
    if (!document.hidden) void run();
  }
  document.addEventListener("visibilitychange", visible);
  timer = setTimeout(run, interval);
  return () => {
    stopped = true;
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", visible);
  };
}
