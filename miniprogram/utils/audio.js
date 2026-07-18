/**
 * 小程序提示音：优先 WebAudio，失败则退化为震动节奏。
 */
function createAlertPlayer() {
  let audioCtx = null;
  let oscillators = [];
  let voiceTimer = null;
  let vibrateTimer = null;
  let stopped = true;

  function ensureCtx() {
    if (audioCtx) return audioCtx;
    if (typeof wx.createWebAudioContext === "function") {
      audioCtx = wx.createWebAudioContext();
    }
    return audioCtx;
  }

  function stopOsc() {
    oscillators.forEach((osc) => {
      try { osc.stop(); } catch (e) {}
      try { osc.disconnect(); } catch (e) {}
    });
    oscillators = [];
  }

  function clearTimers() {
    if (voiceTimer) {
      clearInterval(voiceTimer);
      voiceTimer = null;
    }
    if (vibrateTimer) {
      clearInterval(vibrateTimer);
      vibrateTimer = null;
    }
  }

  function beep(ctx, master, freq, start, len, type, gain) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain || 0.22, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + len);
    osc.connect(g);
    g.connect(master);
    osc.start(start);
    osc.stop(start + len + 0.02);
    oscillators.push(osc);
  }

  function playPattern(style, durationSec, volume) {
    const ctx = ensureCtx();
    if (!ctx) return false;
    const now = ctx.currentTime;
    const end = now + durationSec;
    const master = ctx.createGain();
    master.gain.value = Math.max(0.05, Math.min(1, volume));
    master.connect(ctx.destination);

    if (style === "pulse") {
      for (let t = now; t < end; t += 0.9) {
        beep(ctx, master, 440, t, 0.32, "triangle", 0.22);
        beep(ctx, master, 554.37, t + 0.34, 0.32, "triangle", 0.18);
      }
    } else if (style === "ascending") {
      const notes = [261.63, 329.63, 392, 523.25, 659.25];
      let i = 0;
      for (let t = now; t < end; t += 0.34) {
        beep(ctx, master, notes[i % notes.length], t, 0.26, "sine", 0.22);
        i += 1;
      }
    } else if (style === "alarm") {
      for (let t = now; t < end; t += 0.55) {
        beep(ctx, master, 784, t, 0.16, "square", 0.14);
        beep(ctx, master, 988, t + 0.2, 0.16, "square", 0.12);
      }
    } else {
      for (let t = now; t < end; t += 1.55) {
        [523.25, 659.25, 783.99].forEach((f, i) => {
          beep(ctx, master, f, t + i * 0.16, 0.5, "sine", 0.24);
        });
      }
    }
    return true;
  }

  function startVoiceBubble(onTick, settings) {
    if (typeof onTick === "function") onTick(settings.voiceText, true);
    if (!settings.repeatVoice) return;
    const interval = Math.max(1500, Math.round(2400 / (settings.voiceRate || 1)));
    voiceTimer = setInterval(() => {
      if (stopped) return;
      if (typeof onTick === "function") onTick(settings.voiceText, true);
      try { wx.vibrateShort({ type: "medium" }); } catch (e) {}
    }, interval);
  }

  function startVibrateLoop() {
    try { wx.vibrateLong(); } catch (e) {}
    vibrateTimer = setInterval(() => {
      if (stopped) return;
      try { wx.vibrateShort({ type: "heavy" }); } catch (e) {}
    }, 1200);
  }

  function start(settings, onVoiceTick) {
    stop();
    stopped = false;
    const duration = Math.max(1, Number(settings.alertDuration) || 10);
    const volume = Math.max(0, Math.min(100, Number(settings.volume) || 70)) / 100;
    const mode = settings.alertMode || "both";

    if (mode === "music" || mode === "both") {
      const ok = playPattern(settings.musicStyle || "chime", duration, volume);
      if (!ok) startVibrateLoop();
    }

    if (mode === "voice" || mode === "both") {
      startVoiceBubble(onVoiceTick, settings);
      if (mode === "voice") startVibrateLoop();
    }

    if (mode === "music" && !ensureCtx()) {
      startVibrateLoop();
    }
  }

  function stop() {
    stopped = true;
    stopOsc();
    clearTimers();
  }

  return { start, stop, ensureCtx };
}

module.exports = {
  createAlertPlayer
};
