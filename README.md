# 挽留者 (Time Retainer)

沉浸式专注空间 Android 应用。它不试图强行锁住用户，而是在用户想离开任务时，温和地把注意力带回退出确认与 10 分钟冷静流程。

[![Platform](https://img.shields.io/badge/platform-Android%208.0%2B-3DDC84)]()
[![Language](https://img.shields.io/badge/language-Kotlin-7F52FF)]()
[![UI](https://img.shields.io/badge/UI-Jetpack%20Compose-4285F4)]()

---

## 产品定位

「挽留者」不是惩罚式锁机工具，而是一个专注缓冲空间。

核心体验：当用户产生离开冲动时，不是直接放行或粗暴拦截，而是进入一套温和的退出挽留流程，让用户有机会重新选择。

## 目标用户

学生、考研/考公人群、论文写作者、程序员、自由职业者，以及任何需要在一段时间内保护注意力的人。

---

## 核心功能

### 1. 创建专注空间

- 任务名称：输入当前任务，例如「写论文 introduction」。
- 专注时长：预设 25 / 50 / 90 分钟，支持自定义 1-180 分钟。
- 背景主题：雨夜、图书馆、森林、赛博桌面。
- 时间窗口样式：极简、玻璃、便利贴。
- 视觉优化：创建页采用统一字体层级、紧凑控件比例、沉浸式深色背景。

### 2. 全屏专注空间

- 使用真实照片背景，并叠加渐变压暗和暗角。
- 中央时间块采用毛玻璃质感卡片，包含：
  - 顶部紫色渐变 accent 辉光线
  - 紫色渐变图标 + 标签「当前专注」+ 任务名
  - 大号倒计时数字
  - 专注进度条 + 百分比
  - 温和提示语（呼吸式淡入淡出动画）
- 卡片整体带有呼吸感盒阴影辉光动画，5 秒周期缓慢脉动。
- 左上角提供克制的退出按钮。
- 顶部显示「专注中」状态点，底部显示当前背景氛围说明。
- 专注期间计时持续运行，除非用户确认退出或任务完成。

### 3. 离开保护

专注中用户尝试离开时，会进入退出挽留流程，而不是直接回到普通页面。

已覆盖的离开方式：

- 点击专注页左上角退出按钮。
- Android 返回键或左右返回手势。
- Home 键 / 上滑回主页。
- 上滑进入多任务并切换到其他 App。
- App 进入后台时的生命周期兜底。

实现说明：

- 返回手势由 `BackHandler` 在 `FocusScreen` 中拦截。
- Home / 上滑切 App 由 `MainActivity.onUserLeaveHint()` 捕捉，并通过 `AppLeaveEvents` 通知 Compose 导航层。
- `WanliuNavGraph` 全局监听离开事件和 `Lifecycle.Event.ON_STOP`，在专注中且尚未进入退出流程时，将状态切换为 `ExitStep.EMERGENCY_CHECK`。
- Android 系统不允许应用阻止用户回主页或切换 App；因此当前策略是：用户离开时立即标记退出流程，回到 App 后自动显示退出指示页面。

### 4. 退出挽留流程

| 步骤 | 内容 | 出口 |
|---|---|---|
| 1. 挽留判断 | 「你想离开了吗？冲动会来，也会走。再给自己一次机会。」 | **继续专注工作**（翠绿主按钮）→ 回到专注页；想离开 → 进入下一步；紧急退出 |
| 2. 写下想做的事 | 让用户记录冲动来源，不做评判 | 写好后进入冷静倒计时 |
| 3. 冷静 10 分钟 | 圆环倒计时，轮播温和提示语 | 可随时回到任务；倒计时结束进入选择页 |
| 4. 冷静结束后选择 | 提醒用户重新做决定 | 回到任务或确认离开 |

退出弹窗会浮在当前专注背景之上，背景保留虚化、压暗的时间块，让用户仍然感知到任务没有消失。

**步骤 1 的三级按钮层次**：

```
┌──────────────────────────────────┐
│  ✨  继续专注工作        ← 翠绿  │  最显眼 · 主推荐操作
├──────────────────────────────────┤
│  🍃  我只是想离开一下    ← 紫色  │  次要操作
├──────────────────────────────────┤
│  ⚠  紧急情况 — 立即退出  ← 红色  │  最小 · 弱化警示
└──────────────────────────────────┘
```

### 5. 紧急退出

如果用户确认是紧急情况，应用会立即退出专注流程，并显示祝福式结束页，避免惩罚性体验。

---

## 技术架构

| 层级 | 技术 |
|---|---|
| 语言 | Kotlin |
| UI | Jetpack Compose + Material 3 |
| 导航 | Navigation Compose |
| 状态管理 | ViewModel + StateFlow |
| 数据库 | Room |
| 图片加载 | Coil |
| 构建工具 | Android Gradle Plugin |
| 最低系统 | Android 8.0 (API 26) |
| 目标系统 | Android 15 (API 35) |
| JDK | 17 |

## 项目结构

```text
app/src/main/java/com/ttime/wanliu/
|-- MainActivity.kt              # 入口 Activity，捕捉 onUserLeaveHint
|-- AppLeaveEvents.kt            # 用户离开 App 的事件通道
|-- data/
|   |-- Session.kt               # Room Entity
|   |-- SessionDao.kt            # Room DAO
|   `-- AppDatabase.kt           # Room Database
|-- ui/
|   |-- theme/                   # Color / Type / Theme
|   |-- navigation/
|   |   `-- WanliuNavGraph.kt    # 全局导航与离开事件处理
|   |-- screens/
|   |   |-- CreateScreen.kt      # 创建专注空间
|   |   |-- FocusScreen.kt       # 全屏专注空间
|   |   |-- ExitStep1~4Screen.kt # 四步退出挽留流程
|   |   `-- EmergencyScreen.kt   # 紧急退出页
|   |-- components/
|   |   |-- TimeBlock.kt         # 时间块卡片（毛玻璃质感+呼吸动画）
|   |   |-- ProgressRing.kt      # 圆环进度
|   |   |-- ThemeCard.kt         # 主题卡片
|   |   |-- StyleCard.kt         # 样式卡片
|   |   |-- DurationPill.kt      # 时长选择胶囊
|   |   |-- ThemeAssets.kt       # 主题资源
|   |   |-- FocusBackground.kt   # 专注背景
|   |   `-- Modifiers.kt         # 通用 Modifier
|   `-- viewmodel/
|       `-- FocusViewModel.kt    # 核心状态与计时逻辑
```

---

## 构建与运行

### Android Studio

1. 用 Android Studio 打开项目根目录。
2. 等待 Gradle 同步完成。
3. 连接设备或启动模拟器。
4. 点击 Run。

### 命令行打包

确保已安装 JDK 17 并配置 `JAVA_HOME`。

```bash
# Windows
.\gradlew.bat assembleDebug

# macOS / Linux
./gradlew assembleDebug
```

产物位置：

```text
app/build/outputs/apk/debug/app-debug.apk
```

安装到设备：

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 设计原则

- 深色模式优先，降低视觉刺激。
- 蓝紫色作为强调色，避免高压、警告式表达。
- 退出流程使用温和文案，不使用惩罚性语言。
- 排版层级清晰：标题、正文、标签、按钮、倒计时数字各自有稳定比例。
- 沉浸背景保留真实场景感，但通过压暗与虚化避免干扰阅读。

---

## 版本记录

### v0601 — 2025-06-01

**陪伴者功能（全新）**

- 创建页新增陪伴者选择器：水平滚动卡片行，含粒子预览圆（12 轨道粒子旋转 + 辉光）、名字、格言
- 11 位大师可选：乔布斯、芒格、费曼、塔勒布、马斯克、纳瓦尔、PG、爱因斯坦、达·芬奇、张一鸣、孙宇晨
- 专注页集成 `CompanionStage` 粒子画布（180 粒 × 三层辉光），选陪伴者时显示在 TimeBlock 上方
- 叙事陪伴者（乔布斯/芒格）8 阶段叙事弧，每阶段独立粒子图形 + 阶段圆点 + 金句
- 非叙事陪伴者 3 形态循环，每位大师独立几何图形（原子轨道、黑天鹅弧、火箭、天平……）
- 粒子图形采用与原型一致的几何原语采样（椭圆、环、弧、散点云、线段）
- 精确 `Animatable` 计时驱动形态切换，粒子图/圆点/金句三者严格同步

**专注页毛玻璃卡片全面升级**

- TimeBlock 五层联动呼吸动画：卡片缩放 1.000→1.014 + 外圈辉光 0.06→0.32 + 边框辉光 + accent 线宽度呼吸 + 图标同步脉动
- 顶部紫色渐变 accent 辉光线，任务图标行（星辉图标 + 标签 + 任务名），毛玻璃质感

**退出流程优化**

- 新增「继续专注工作」按钮（翠绿色，三级按钮层次首位）
- 副标题更新为温和文案：「冲动会来，也会走。再给自己一次机会。」

**修复**

- `Icons.Filled.MenuBook` deprecation → `Icons.AutoMirrored.Filled.MenuBook`
- 横向溢出防护（`overflow-x: hidden` + `min-width: 0` + `max-width: 100%`）
- 粒子图与金句/圆点同步问题（`Animatable` 替代 `LaunchedEffect(morphProgress)`）

### v1.3.0

- 新增 Home / 上滑回主页 / 上滑切 App 的离开检测。
- 新增 `AppLeaveEvents`，将 Activity 的 `onUserLeaveHint()` 桥接到 Compose 导航层。
- 将退出流程导航上移到 `WanliuNavGraph`，确保从后台回到 App 时自动显示退出指示页。
- 保留返回键/返回手势拦截，统一进入退出挽留流程。
- 完成字体比例与排版层级优化。

### v1.2.0

- 优化创建专注空间页面视觉比例。
- 修复冷静页提示文案居中问题。
- 增强退出流程页面的视觉一致性。

### v1.1.0

- 接入真实照片背景。
- 增加主题卡片、全屏专注背景与退出弹窗背景复用。

### v1.0.0

- 首次实现创建专注、全屏倒计时、退出挽留与紧急退出核心流程。
