# cursor-timer

阳光清新风倒计时：桌面版、移动端 H5、微信小程序。

## 版本一览

| 版本 | 路径 | 怎么用 |
|------|------|--------|
| 桌面 / 通用 | `timer.html` | 浏览器打开 |
| 移动端 H5 | `mobile/index.html` | 手机浏览器打开，体验最佳 |
| 微信小程序 | `miniprogram/` | 用微信开发者工具导入 |

## 移动端 H5

```bash
open mobile/index.html
```

手机访问时建议用本地静态服务：

```bash
npx serve mobile
```

### 交互亮点

- 圆形进度环，剩余时间一眼可见
- 底部抽屉设置（可下拉关闭）
- 快捷时长、震动反馈、提示进度条
- 语音 / 音乐提示，默认 10 秒自动停止，均可自定义
- 设置自动保存在本机

## 微信小程序

1. 打开[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入项目目录：`miniprogram/`
3. AppID 可先用测试号 / `touristappid`
4. 编译预览

### 说明

- 音乐：优先使用 `wx.createWebAudioContext` 播放内置旋律
- 语音：小程序无系统 TTS，用**文字气泡 + 震动节奏**模拟播报（文案可自定义）
- 计时用截止时间校正，切后台再回来仍准确

## 共同功能

- 自定义倒计时（时 / 分 / 秒）与快捷预设
- 提示方式：语音 / 音乐 / 两者
- 提示时长、音量、音乐风格、语音文案均可设
- 阳光清新视觉：天蓝、阳光黄、薄荷青
