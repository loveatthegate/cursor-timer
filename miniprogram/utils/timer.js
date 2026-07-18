function pad(n) {
  return String(n).padStart(2, "0");
}

function formatMs(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function durationToMs(hours, minutes, seconds) {
  return ((Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60 + (Number(seconds) || 0)) * 1000;
}

function msToParts(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60
  };
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function modeLabel(mode) {
  if (mode === "voice") return "仅语音 · 温柔提醒";
  if (mode === "music") return "仅音乐 · 温柔提醒";
  return "语音 + 音乐 · 温柔提醒";
}

module.exports = {
  pad,
  formatMs,
  durationToMs,
  msToParts,
  clamp,
  modeLabel
};
