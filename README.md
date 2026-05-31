# 挽留者 (Time Retainer)

> 沉浸式专注空间 Android 应用 —— 在用户想退出时，温和挽留 10 分钟。

[![Platform](https://img.shields.io/badge/platform-Android%208.0%2B-3DDC84)]()
[![Language](https://img.shields.io/badge/language-Kotlin-7F52FF)]()
[![UI](https://img.shields.io/badge/UI-Jetpack%20Compose-4285F4)]()

---

## 产品定位

「挽留者」不是惩罚用户的强制锁机工具，而是在用户想逃离任务时，给他一个冷静 10 分钟的缓冲空间。

> 核心体验：**不是强行锁住用户，而是温和地挽留他 10 分钟。**

## 目标用户

学生、考研 / 考公人群、论文写作者、程序员、自由职业者。

---

## 核心功能

### 1. 创建专注空间
- **任务名称**：输入当前任务，例如「写论文 introduction」
- **专注时长**：预设 25 / 50 / 90 分钟，也支持自定义 1–180 分钟
- **背景主题**：4 种沉浸式主题
  - 🌧️ 雨夜 —— 深蓝紫色，适合安静思考
  - 📚 图书馆 —— 暖棕色，适合阅读写作
  - 🌲 森林 —— 深绿色，适合创意工作
  - 🖥️ 赛博桌面 —— 深紫黑色，适合编程
- **时间窗口样式**：3 种风格
  - 极简 —— 简洁透明
  - 玻璃 —— 磨砂玻璃拟态
  - 便利贴 —— 暖黄色便签风格

### 2. 全屏专注空间
- 全屏沉浸式真实照片背景（照片 + 渐变压暗 + 暗角）
- 半透明时间 Block 叠加显示：当前任务名、倒计时（大字体低刺激）、专注进度条（紫蓝渐变）、温和提示语
- 左上角克制的小退出按钮，不破坏沉浸感
- 顶部「专注中」状态点、底部氛围标签
- **离开即挽留**：按返回键或切到后台（`ON_PAUSE`）时，自动触发退出挽留流程，而非直接退出

### 3. 退出挽留流程（多步骤弹窗）

| 步骤 | 内容 | 出口 |
|------|------|------|
| ① 判断是否紧急 | 「你想离开了吗？这是紧急情况吗？」 | [紧急] → 立即退出 + 祝福语；[不是紧急] → 进入 ② |
| ② 写下想做的事 | 「你现在想去做什么？」写下来，让冲动慢一点 | [写好了] → 进入 ③ |
| ③ 冷静 10 分钟 | 圆环倒计时 + 温柔提示语轮播（每 5 秒切换） | [马上回到任务] 随时可用；可跳过（演示） |
| ④ 冷静结束做选择 | 「10 分钟已经结束，现在你想怎么选择？」 | [回到任务] 主按钮 / [确认离开，下次再来] 次按钮 |

> 退出弹窗各步骤悬浮在当前专注背景之上，背后保留一个虚化、压暗的时间块「幽灵」，不会跳到空白页。

### 4. 紧急退出
- 月亮 + 祝福语：「无论发生什么，都照顾好自己。专注空间随时都在，等你回来。」
- [回到主页]

---

## 技术架构

| 层次 | 技术 |
|------|------|
| 语言 | Kotlin 2.1.0 |
| UI 框架 | Jetpack Compose (Material 3, BOM 2024.12.01) |
| 导航 | Navigation Compose 2.8.5 |
| 数据库 | Room 2.6.1 (SQLite)，KSP 注解处理 |
| 状态管理 | ViewModel + StateFlow |
| 图片加载 | Coil 2.7.0 |
| 构建工具 | Android Gradle Plugin 8.7.3 |
| 最低 SDK | Android 8.0 (API 26) |
| 目标 SDK | Android 15 (API 35) |
| JDK | 17 |

## 项目结构

```
app/src/main/java/com/ttime/wanliu/
├── MainActivity.kt              # 入口 Activity
├── data/
│   ├── Session.kt               # Room Entity（专注会话）
│   ├── SessionDao.kt            # Room DAO
│   └── AppDatabase.kt           # Room Database
├── ui/
│   ├── theme/                   # Color / Type / Theme 主题系统
│   ├── navigation/
│   │   └── WanliuNavGraph.kt    # 导航图
│   ├── screens/
│   │   ├── CreateScreen.kt      # 创建专注空间
│   │   ├── FocusScreen.kt       # 全屏专注空间
│   │   ├── ExitStep1~4Screen.kt # 退出挽留四步流程
│   │   └── EmergencyScreen.kt   # 紧急退出
│   ├── components/
│   │   ├── TimeBlock.kt         # 时间窗口组件
│   │   ├── ProgressRing.kt      # 圆环进度组件
│   │   ├── ThemeCard.kt         # 主题卡片（真实照片缩略图）
│   │   ├── StyleCard.kt         # 样式卡片
│   │   ├── DurationPill.kt      # 时长选择药丸
│   │   ├── ThemeAssets.kt       # 主题照片 URL / 兜底色映射
│   │   ├── FocusBackground.kt   # 沉浸式照片背景（照片+渐变+暗角）
│   │   └── Modifiers.kt         # 通用 Modifier 扩展
│   └── viewmodel/
│       └── FocusViewModel.kt    # 核心状态管理
```

## 数据模型

### Session（专注会话）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 自增主键 |
| taskName | String | 任务名称 |
| durationMinutes | Int | 设定时长（分钟） |
| backgroundTheme | String | 背景主题标识 |
| timeWindowStyle | String | 时间窗口样式 |
| startTimeMillis | Long | 开始时间戳 |
| actualFocusSeconds | Int | 实际专注秒数 |
| exitReason | String? | 退出原因 |
| isEmergencyExit | Boolean | 是否紧急退出 |
| isCompleted | Boolean | 是否完成 |

---

## 构建与运行

### 方式一：Android Studio（推荐）
1. 用 Android Studio 打开项目根目录
2. 等待 Gradle 同步完成
3. 连接设备或启动模拟器（API 26+）
4. 点击 **Run**

### 方式二：命令行打包 APK
确保已安装 **JDK 17** 并配置 `JAVA_HOME`，根目录执行：

```bash
# Windows
.\gradlew.bat assembleDebug

# macOS / Linux
./gradlew assembleDebug
```

产物位置：

```
app/build/outputs/apk/debug/app-debug.apk
```

### 安装到手机
- **数据线**：手机开启「开发者选项 → USB 调试」，连接电脑后执行
  ```bash
  adb install -r app/build/outputs/apk/debug/app-debug.apk
  ```
- **手动安装**：把 `app-debug.apk` 传到手机（微信文件传输助手 / 网盘等），点击安装并允许「未知来源」。

> debug 版可正常使用，仅未做体积压缩、使用调试签名。如需长期升级覆盖安装，建议配置 release 签名打 release 包。

---

## 沉浸式背景实现

为与 HTML 原型保持一致，背景采用真实照片（与原型相同的 Unsplash 图片）：

- **主题映射**：`ui/components/ThemeAssets.kt` 统一管理每个主题对应的照片 URL（卡片缩略图 `w=500` / 全屏大图 `w=1920`）和兜底纯色。
- **图片加载**：使用 Coil 的 `AsyncImage` 加载，带淡入动画。
- **三层结构**：`FocusBackground` = 真实照片 + 渐变压暗层 + 暗角，供全屏专注页和退出弹窗共用。
- **退出叠层**：退出挽留各步骤通过 `ExitScaffold` 浮在当前专注背景之上，背后保留虚化压暗的时间块「幽灵」。
- **离线 / 加载中**：图片未就绪时显示与主题色调接近的兜底纯色；首次加载需要网络（已声明 `INTERNET` 权限），之后由 Coil 缓存。

> 退出弹窗背后时间块的虚化依赖 `Modifier.blur`，在 Android 12 (API 31) 及以上生效；更低版本优雅降级为半透明，不影响功能。

---

## 设计原则

- 深色模式优先，低刺激
- 蓝紫色（`#7C3AED`、`#4F46E5`）作为强调色
- 玻璃拟态风格
- 温和文案，不使用惩罚性语言
- 保持留白，避免信息拥挤
- 整体感觉：**安静、克制、温柔、沉浸**

---

## 版本记录

- **v1.2.0** —— 优化全屏专注页：切后台 / 返回键统一触发退出挽留流程；时间块温和提示语文案调整；修订图标弃用警告。
- **v1.1.0** —— 接入真实照片背景（主题卡片 / 全屏专注 / 退出弹窗叠层），修复冷静圆环尺寸计算。
- **v1.0.0** —— 首次发布，包含完整核心功能。
