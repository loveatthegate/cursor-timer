const { clamp } = require("../../utils/timer");

const MUSIC = [
  { value: "chime", label: "阳光钟声" },
  { value: "pulse", label: "轻快脉冲" },
  { value: "ascending", label: "上行音阶" },
  { value: "alarm", label: "活泼提醒" }
];

Page({
  data: {
    settings: {},
    units: [
      { key: "hours", label: "小时" },
      { key: "minutes", label: "分钟" },
      { key: "seconds", label: "秒" }
    ],
    modes: [
      { value: "both", label: "语音 + 音乐" },
      { value: "voice", label: "仅语音" },
      { value: "music", label: "仅音乐" }
    ],
    musicLabels: MUSIC.map((m) => m.label),
    musicIndex: 0,
    rateSlider: 10,
    rateText: "1.0"
  },

  onShow() {
    const settings = { ...getApp().globalData.settings };
    const musicIndex = Math.max(0, MUSIC.findIndex((m) => m.value === settings.musicStyle));
    const rateSlider = Math.round((settings.voiceRate || 1) * 10);
    this.setData({
      settings,
      musicIndex: musicIndex < 0 ? 0 : musicIndex,
      rateSlider,
      rateText: (rateSlider / 10).toFixed(1)
    });
  },

  persist(next) {
    const app = getApp();
    app.globalData.settings = next;
    wx.setStorageSync("sunny-timer-settings-v1", next);
    this.setData({ settings: next });
  },

  patch(partial) {
    this.persist({ ...this.data.settings, ...partial });
  },

  onStep(e) {
    const { key, dir } = e.currentTarget.dataset;
    const max = key === "hours" ? 99 : 59;
    const nextVal = clamp((Number(this.data.settings[key]) || 0) + Number(dir), 0, max);
    this.patch({ [key]: nextVal });
    try { wx.vibrateShort({ type: "light" }); } catch (err) {}
  },

  onMode(e) {
    this.patch({ alertMode: e.currentTarget.dataset.value });
    try { wx.vibrateShort({ type: "light" }); } catch (err) {}
  },

  onDurationChanging(e) {
    this.setData({ "settings.alertDuration": Number(e.detail.value) });
  },
  onDurationChange(e) {
    this.patch({ alertDuration: clamp(Number(e.detail.value), 1, 120) });
  },

  onVolumeChanging(e) {
    this.setData({ "settings.volume": Number(e.detail.value) });
  },
  onVolumeChange(e) {
    this.patch({ volume: clamp(Number(e.detail.value), 0, 100) });
  },

  onMusicChange(e) {
    const idx = Number(e.detail.value);
    this.setData({ musicIndex: idx });
    this.patch({ musicStyle: MUSIC[idx].value });
  },

  onVoiceInput(e) {
    this.patch({ voiceText: e.detail.value });
  },

  onRateChanging(e) {
    const slider = Number(e.detail.value);
    const v = slider / 10;
    this.setData({
      rateSlider: slider,
      rateText: v.toFixed(1),
      "settings.voiceRate": v
    });
  },
  onRateChange(e) {
    const slider = Number(e.detail.value);
    const v = clamp(slider / 10, 0.5, 1.5);
    this.setData({ rateSlider: slider, rateText: v.toFixed(1) });
    this.patch({ voiceRate: v });
  },

  onRepeatChange(e) {
    this.patch({ repeatVoice: !!e.detail.value });
  },

  onTest() {
    wx.setStorageSync("sunny-timer-test-alert", true);
    wx.navigateBack({
      success: () => {},
      fail: () => {
        wx.reLaunch({ url: "/pages/index/index" });
      }
    });
  },

  onSave() {
    this.persist(this.data.settings);
    wx.showToast({ title: "设置已保存", icon: "success" });
    setTimeout(() => wx.navigateBack({ delta: 1 }), 400);
  }
});
