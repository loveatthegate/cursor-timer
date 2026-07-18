const { formatMs, durationToMs, clamp, modeLabel } = require("../../utils/timer");
const { createAlertPlayer } = require("../../utils/audio");

const RING_FULL = 360;
const player = createAlertPlayer();

Page({
  data: {
    display: "00:05:00",
    status: "准备好啦 ✓",
    statusClass: "ok",
    tagline: "温柔提醒你 · 专注也要轻松",
    startLabel: "开始",
    running: false,
    alerting: false,
    presets: [
      { sec: 60, label: "1 分钟" },
      { sec: 300, label: "5 分钟" },
      { sec: 600, label: "10 分钟" },
      { sec: 1500, label: "25 分钟" },
      { sec: 3600, label: "1 小时" }
    ],
    activePreset: 300,
    progressDeg: 360,
    ringColor: "#61d1b0",
    displayClass: "",
    alertProgress: 100,
    alertRemainText: "10 秒后安静下来",
    alertHint: "语音 + 音乐 · 温柔提醒",
    voiceBubble: "",
    toastVisible: false,
    toastText: ""
  },

  totalMs: 300000,
  remainingMs: 300000,
  endAt: 0,
  tickTimer: null,
  alertTimer: null,
  alertTickTimer: null,
  alertStartedAt: 0,
  settings: null,

  onShow() {
    this.settings = getApp().globalData.settings;
    this.syncFromSettings(false);
    if (wx.getStorageSync("sunny-timer-test-alert")) {
      wx.removeStorageSync("sunny-timer-test-alert");
      setTimeout(() => this.startAlert(true), 250);
    }
  },

  onUnload() {
    this.clearAllTimers();
    player.stop();
  },

  onHide() {
    // 用截止时间校正，后台回来仍准确
    if (this.data.running) {
      this.remainingMs = Math.max(0, this.endAt - Date.now());
    }
  },

  syncFromSettings(resetRunning = true) {
    const s = this.settings || getApp().globalData.settings;
    const ms = durationToMs(s.hours, s.minutes, s.seconds);
    if (resetRunning || (!this.data.running && !this.data.alerting)) {
      this.totalMs = ms;
      this.remainingMs = ms;
      this.setData({
        activePreset: ms / 1000,
        display: formatMs(ms),
        progressDeg: RING_FULL,
        displayClass: "",
        ringColor: "#61d1b0"
      });
      if (ms <= 0) this.setStatus("先设置一个时长哦", "hot");
      else if (!this.data.running && !this.data.alerting) this.setStatus("准备好啦 ✓", "ok");
    }
  },

  setStatus(text, cls = "") {
    this.setData({ status: text, statusClass: cls });
  },

  toast(text) {
    this.setData({ toastVisible: true, toastText: text });
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.setData({ toastVisible: false });
    }, 1600);
  },

  buzz(type = "light") {
    try { wx.vibrateShort({ type }); } catch (e) {}
  },

  updateDisplay() {
    const urgent = this.data.running && this.remainingMs <= 10000 && this.remainingMs > 0;
    const done = this.data.alerting || (!this.data.running && this.remainingMs <= 0);
    const ratio = this.totalMs > 0 ? this.remainingMs / this.totalMs : 0;
    this.setData({
      display: formatMs(this.remainingMs),
      progressDeg: Math.round(RING_FULL * ratio),
      displayClass: urgent ? "urgent" : done ? "done" : "",
      ringColor: urgent ? "#ff8b7d" : done ? "#ffc74a" : "#61d1b0"
    });
  },

  clearTick() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  },

  clearAlertTimers() {
    if (this.alertTimer) {
      clearTimeout(this.alertTimer);
      this.alertTimer = null;
    }
    if (this.alertTickTimer) {
      clearInterval(this.alertTickTimer);
      this.alertTickTimer = null;
    }
  },

  clearAllTimers() {
    this.clearTick();
    this.clearAlertTimers();
  },

  onStart() {
    const s = this.settings || getApp().globalData.settings;
    const ms = this.data.running ? this.remainingMs : durationToMs(s.hours, s.minutes, s.seconds);
    if (ms <= 0) {
      this.setStatus("先设置一个时长哦", "hot");
      this.toast("时长要大于 0");
      this.buzz("medium");
      return;
    }
    this.stopAlert(true);
    player.ensureCtx();
    if (!this.data.running) {
      this.totalMs = ms;
      this.remainingMs = ms;
    }
    this.endAt = Date.now() + this.remainingMs;
    this.setData({
      running: true,
      startLabel: "开始",
      tagline: "专注进行中 · 加油呀"
    });
    this.setStatus("计时中… 加油", "ok");
    this.clearTick();
    this.tickTimer = setInterval(() => this.tick(), 100);
    this.tick();
    this.buzz("light");
  },

  tick() {
    if (!this.data.running) return;
    this.remainingMs = Math.max(0, this.endAt - Date.now());
    this.updateDisplay();
    if (this.remainingMs <= 0) {
      this.clearTick();
      this.setData({ running: false, startLabel: "开始" });
      this.startAlert(false);
    }
  },

  onPause() {
    if (!this.data.running) return;
    this.remainingMs = Math.max(0, this.endAt - Date.now());
    this.clearTick();
    this.setData({
      running: false,
      startLabel: "继续",
      tagline: "随时可以继续哦"
    });
    this.setStatus("先歇一会儿");
    this.updateDisplay();
    this.buzz("light");
  },

  onReset() {
    this.stopAlert(false);
    this.clearTick();
    const s = this.settings || getApp().globalData.settings;
    this.totalMs = durationToMs(s.hours, s.minutes, s.seconds);
    this.remainingMs = this.totalMs;
    this.setData({
      running: false,
      startLabel: "开始",
      tagline: "温柔提醒你 · 专注也要轻松",
      activePreset: this.totalMs / 1000
    });
    this.setStatus(this.totalMs > 0 ? "已重置啦" : "先设置一个时长哦", this.totalMs > 0 ? "ok" : "hot");
    this.updateDisplay();
    this.buzz("light");
  },

  onPreset(e) {
    if (this.data.running || this.data.alerting) return;
    const sec = Number(e.currentTarget.dataset.sec);
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    const app = getApp();
    app.globalData.settings = {
      ...app.globalData.settings,
      hours,
      minutes,
      seconds
    };
    wx.setStorageSync("sunny-timer-settings-v1", app.globalData.settings);
    this.settings = app.globalData.settings;
    this.totalMs = sec * 1000;
    this.remainingMs = this.totalMs;
    this.setData({ activePreset: sec });
    this.setStatus("准备好啦 ✓", "ok");
    this.updateDisplay();
    this.buzz("light");
  },

  startAlert(isTest) {
    const s = this.settings || getApp().globalData.settings;
    const duration = clamp(Number(s.alertDuration) || 10, 1, 120);
    this.alertStartedAt = Date.now();
    this.setData({
      alerting: true,
      tagline: isTest ? "试听中 · 听听舒不舒服" : "时间到啦 · 休息一下吧",
      alertHint: modeLabel(s.alertMode),
      alertProgress: 100,
      alertRemainText: `${duration} 秒后安静下来`,
      voiceBubble: ""
    });
    this.setStatus(isTest ? `试听中 · ${duration} 秒` : `叮咚 · 时间到啦（${duration} 秒）`, "hot");
    this.updateDisplay();
    try { wx.vibrateLong(); } catch (e) {}

    player.start(s, (text) => {
      this.setData({ voiceBubble: text });
    });

    this.clearAlertTimers();
    this.alertTickTimer = setInterval(() => {
      const elapsed = Date.now() - this.alertStartedAt;
      const total = duration * 1000;
      const left = Math.max(0, total - elapsed);
      const ratio = total > 0 ? (left / total) * 100 : 0;
      this.setData({
        alertProgress: ratio,
        alertRemainText: `${Math.ceil(left / 1000)} 秒后安静下来`
      });
    }, 100);

    this.alertTimer = setTimeout(() => {
      this.stopAlert(false);
      this.setStatus(isTest ? "试听结束啦" : "时间到啦 · 提示已自动停下", "ok");
      this.toast(isTest ? "试听完成" : "提示已自动停止");
      this.updateDisplay();
    }, duration * 1000);
  },

  stopAlert(keepUi) {
    player.stop();
    this.clearAlertTimers();
    const next = {
      alerting: false,
      voiceBubble: "",
      alertProgress: 0
    };
    if (!keepUi && !this.data.running) {
      next.tagline = "温柔提醒你 · 专注也要轻松";
    }
    this.setData(next);
    if (!keepUi && !this.data.running) {
      this.setStatus(this.remainingMs <= 0 ? "时间到啦 · 提示已停下" : "已停止提示", "ok");
    }
  },

  onStopAlert() {
    this.stopAlert(false);
    this.toast("已停止提示");
    this.buzz("medium");
  },

  goSettings() {
    wx.navigateTo({ url: "/pages/settings/settings" });
  }
});
