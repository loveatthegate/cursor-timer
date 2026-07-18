App({
  globalData: {
    settings: null
  },
  onLaunch() {
    const cached = wx.getStorageSync("sunny-timer-settings-v1");
    this.globalData.settings = cached || {
      hours: 0,
      minutes: 5,
      seconds: 0,
      alertMode: "both",
      alertDuration: 10,
      volume: 70,
      musicStyle: "chime",
      voiceText: "时间到啦，起来伸个懒腰吧～",
      voiceLang: "zh-CN",
      voiceRate: 1,
      repeatVoice: true
    };
  }
});
