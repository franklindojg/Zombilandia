export const IS_MOBILE = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || window.matchMedia('(pointer: coarse)').matches;
const modes = { auto: [30, 1.15], battery: [24, 0.8], balanced: [30, 1], fluid: [60, 1.15] };
let mode = 'auto';
try { mode = localStorage.getItem('v8-quality') || 'auto'; } catch {}
if (!modes[mode]) mode = 'auto';
export const quality = { mode, targetFps: IS_MOBILE ? modes[mode][0] : 60,
  pixelRatio: Math.min(window.devicePixelRatio || 1, IS_MOBILE ? modes[mode][1] : 1.65), lowWindows: 0, highWindows: 0 };
export function chooseQuality(next) {
  if (!modes[next]) return;
  quality.mode = next;
  quality.targetFps = next === 'auto' && !IS_MOBILE ? 60 : modes[next][0];
  quality.pixelRatio = Math.min(window.devicePixelRatio || 1, next === 'auto' && !IS_MOBILE ? 1.65 : modes[next][1]);
  quality.lowWindows = quality.highWindows = 0;
  try { localStorage.setItem('v8-quality', next); } catch {}
}
export function sampleQuality(fps) {
  if (quality.mode !== 'auto') return false;
  quality.lowWindows = fps < quality.targetFps * 0.78 ? quality.lowWindows + 1 : 0;
  quality.highWindows = fps > quality.targetFps * 0.95 ? quality.highWindows + 1 : 0;
  const old = quality.pixelRatio;
  if (quality.lowWindows >= 2) { quality.pixelRatio = Math.max(0.7, old - 0.15); quality.lowWindows = 0; }
  if (quality.highWindows >= 5) { quality.pixelRatio = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.15 : 1.65, old + 0.1); quality.highWindows = 0; }
  return quality.pixelRatio !== old;
}
