<p align="center">
  <img src="public/logo.png" width="88" alt="JListen logo" />
</p>

<h1 align="center">JListen</h1>

<p align="center">JLPT N1 日语听力练习</p>

<p align="center">
  <strong><a href="https://j-listen.vercel.app/">在线使用 JListen ↗</a></strong>
</p>

<p align="center">
  <a href="#界面与演示">界面与演示</a> ·
  <a href="#功能">功能</a> ·
  <a href="#快速开始">快速开始</a> ·
  <a href="#使用方法">使用方法</a> ·
  <a href="#音频配置">音频配置</a>
</p>

## 界面与演示

### 题库

选择考试年份、月份和题型，打开题目开始练习。

<p align="center">
  <img src="assets/readme/library.png" width="720" alt="JListen 题库" />
</p>

### 逐句精听

一句一句听，支持假名显示、变速播放和单句循环。

<p align="center">
  <img src="assets/readme/sentence.png" width="720" alt="JListen 单句精听" />
</p>

<details>
<summary>查看全文与手机界面</summary>

点击原文中的句子，跳到对应的录音位置。

<p align="center">
  <img src="assets/readme/transcript.png" width="720" alt="JListen 全文定位" />
</p>

<p align="center">
  <img src="assets/readme/mobile.png" width="260" alt="JListen 手机端单句精听界面" />
</p>

</details>

### 操作演示

演示选题、逐句播放、循环、点击原文跳转和切换界面语言。

<p align="center">
  <img src="assets/readme/demo.gif" width="720" alt="JListen 操作演示：选题、单句播放、循环、全文定位与语言切换" />
</p>

<p align="center"><sub>约 26 秒 · 无声 · 自动循环播放</sub></p>

## 功能

JListen 用于 JLPT N1 听力练习，收录 2010–2026 年的 32 场听力资料，可以在电脑或手机上使用。

- **播放**：逐句播放、单句循环、A–B 循环和变速播放。
- **原文**：切换盲听、单句或全文，点击句子跳转到录音位置。
- **假名与听写**：显示汉字读音，查看已标注的词义，写下听到的内容后对照原文。
- **界面**：支持中英文切换和键盘快捷键。

## 快速开始

安装 Git、Git LFS 和 Node.js，然后运行：

```bash
git lfs install
git clone https://github.com/1716285375/JListen.git
cd JListen
npm ci
npm run dev
```

启动后打开 [http://127.0.0.1:5173](http://127.0.0.1:5173)。克隆仓库时会通过 Git LFS 下载音频；如果音频没有下载完整，在项目目录运行 `git lfs pull`，也可使用下方的网盘音频包。

## 使用方法

1. 在题库选择一场考试，打开题目或例题。
2. 用「单句」逐句练习，或在「全文」中点击想重听的句子。
3. 听不清时放慢速度或开启循环。设置 A、B 两点，可以反复播放选定的一段。
4. 需要时显示假名或展开听写。切换题目、刷新页面后，听写内容会清空。

| 快捷键 | 操作 |
| :--- | :--- |
| `Space` | 播放 / 暂停 |
| `↑` / `↓` | 上一句 / 下一句 |
| `←` / `→` | 后退 / 前进 3 秒 |
| `L` · `[` / `]` | 单句循环 · 设置 A / B 点 |
| `?` | 查看完整使用说明 |

> 资料仍在校对，文字、假名和时间标注可能有误。尚未确定句子起止时间的内容，会定位到关联的录音片段。

## 音频配置

### 本地音频

共 33 个 MP3，约 1.16 GB，未重新编码。

不使用 Git LFS 时，可从 [Google Drive 下载音频包](https://drive.google.com/file/d/1ZPX5TtASaxfJAssbiA08CWX-BrwbsGMZ/view?usp=drive_link)（约 927 MB）。

解压后按考试场次放入 `public/audio/n1/`，例如：

```text
public/audio/n1/2010-07/jlpt-n1-2010-07-listening.mp3
```

其他场次按相同规则命名。2025 年 7 月另有两个版本：`jlpt-n1-2025-07-listening-live.mp3`（现场版）和 `jlpt-n1-2025-07-listening-ai.mp3`（AI 发音版）。

### 外部音频

如果音频放在外部服务器，将 `.env.example` 复制为 `.env.local`，填入服务器地址：

```dotenv
VITE_AUDIO_BASE_URL=https://audio.example.com
```

服务器上的目录应与本地一致，例如 `https://audio.example.com/audio/n1/2010-07/jlpt-n1-2010-07-listening.mp3`。服务器须支持 HTTPS 和 Range 请求，才能跳转到指定位置播放。

留空则使用本地音频。配置外部地址后，打包时会排除本地音频。应用是纯前端项目，无需后端。

## 联系方式

QQ：**1716285375** · QQ 群：**1130094528**

有使用问题或发现文稿错误，可以通过 QQ 联系，也可以加入交流群。

<p align="center">
  <img src="public/qq-group.png" width="260" alt="JListen 官方交流群二维码，群号 1130094528" />
</p>
