package com.ttime.wanliu.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.ttime.wanliu.ui.theme.*
import kotlin.math.*
import kotlin.random.Random
import kotlinx.coroutines.isActive

// ════════════════════════════════════════════════════════════════
// 陪伴者粒子引擎 — 对齐 design/wanliu/app.js 的原语点云系统
// 每个「演变形态」由一组带颜色/透明度/权重的几何原语组成，
// 按权重采样出 N 颗粒子，在形态之间持续 morph 轮播。
// ════════════════════════════════════════════════════════════════

data class StageInfo(
    val name: String,
    val chinese: String,
    val english: String,
    val tintRed: Int, val tintGreen: Int, val tintBlue: Int
)

val JOBS_STAGES = listOf(
    StageInfo("初心", "求知若饥\n虚心若愚", "Stay Hungry. Stay Foolish.", 220,210,180),
    StageInfo("连线", "你无法前瞻连接人生的点\n只能回溯地理解", "You can't connect the dots looking forward.", 180,200,230),
    StageInfo("聚焦", "聚焦不是对想做之事说Yes\n而是对其他好主意说No", "Focus is saying no.", 230,180,170),
    StageInfo("交汇", "技术必须与人文结合\n才能让心灵歌唱", "Technology alone is not enough.", 170,210,220),
    StageInfo("力场", "那些疯狂到想改变世界的人\n才是真正改变世界的人", "The ones who are crazy enough.", 200,170,230),
    StageInfo("涅槃", "被Apple开除\n是我一生最好的事", "Getting fired was the best thing.", 240,190,130),
    StageInfo("死亡", "把每一天当作最后一天来过\n总有一天你会是对的", "If you live each day as if it was your last.", 210,200,240),
    StageInfo("前行", "你的时间有限\n不要活成别人的样子", "Your time is limited.", 240,225,195),
)

val MUNGER_STAGES = listOf(
    StageInfo("初心", "我这辈子遇到的聪明人\n没有一个不每天阅读的", "No wise people who didn't read all the time.", 190,175,230),
    StageInfo("格栅", "你必须拥有多元思维模型\n用不同学科看同一个问题", "Know the big ideas in all disciplines.", 167,139,250),
    StageInfo("逆向", "反过来想\n总是反过来想", "Invert, always invert.", 180,155,240),
    StageInfo("误判", "如果我知道会死在哪里\n我就永远不去那个地方", "If I know where I'll die, I'll never go there.", 200,150,220),
    StageInfo("能力圈", "知道自己不知道什么\n比聪明更重要", "Knowing what you don't know.", 190,160,200),
    StageInfo("等待", "大钱不在买卖里\n在等待里", "The big money is in the waiting.", 210,180,200),
    StageInfo("简单", "把问题简化到最基本的元素\n然后诚实面对", "Take a simple idea and take it seriously.", 220,190,210),
    StageInfo("传承", "获取智慧是一种道德责任\n不传下去就是浪费", "Acquiring wisdom is a moral duty.", 230,210,220),
)

fun stagesFor(companion: CompanionInfo): List<StageInfo>? = when (companion.id) {
    "jobs" -> JOBS_STAGES
    "munger" -> MUNGER_STAGES
    else -> null
}

// ════════════════════════════════════════════════════════════════
// 原语定义 — 对应 JS 的 p(type, {...})
//   s=散点  l=线段  e=椭圆(实心)  r=环  arc=弧
// ════════════════════════════════════════════════════════════════
private enum class PType { S, L, E, R, ARC }

private class Prim(
    val type: PType,
    val n: Int,
    val r: Int, val g: Int, val b: Int, val a: Float,
    // geometry — 视类型而定
    val x: Float = 0f, val y: Float = 0f,
    val rx: Float = 0f, val ry: Float = 0f,
    val t: Float = 0.16f,
    val x1: Float = 0f, val y1: Float = 0f, val x2: Float = 0f, val y2: Float = 0f,
    val w: Float = 0.01f,
    val a0: Float = 0f, val a1: Float = 0f,
    val rot: Float = 0f,
)

// 便捷构造器 —— 镜像 JS 的 p('type', {...})
private fun s(x: Float, y: Float, rx: Float, ry: Float, n: Int, c: IntArray, a: Float) =
    Prim(PType.S, n, c[0], c[1], c[2], a, x = x, y = y, rx = rx, ry = ry)
private fun l(x1: Float, y1: Float, x2: Float, y2: Float, w: Float, n: Int, c: IntArray, a: Float) =
    Prim(PType.L, n, c[0], c[1], c[2], a, x1 = x1, y1 = y1, x2 = x2, y2 = y2, w = w)
private fun e(x: Float, y: Float, rx: Float, ry: Float, n: Int, c: IntArray, a: Float) =
    Prim(PType.E, n, c[0], c[1], c[2], a, x = x, y = y, rx = rx, ry = ry)
private fun r(x: Float, y: Float, rx: Float, ry: Float, t: Float, n: Int, c: IntArray, a: Float, rot: Float = 0f) =
    Prim(PType.R, n, c[0], c[1], c[2], a, x = x, y = y, rx = rx, ry = ry, t = t, rot = rot)
private fun arc(x: Float, y: Float, rx: Float, ry: Float, a0: Float, a1: Float, t: Float, n: Int, c: IntArray, a: Float) =
    Prim(PType.ARC, n, c[0], c[1], c[2], a, x = x, y = y, rx = rx, ry = ry, a0 = a0, a1 = a1, t = t)

// 采样结果：归一化坐标(0..1, 居中正方形) + 颜色 + 透明度
private class TPoint(val nx: Float, val ny: Float, val r: Int, val g: Int, val b: Int, val a: Float)

// ── 原语单点采样（对应 JS samplePrim）──
private fun samplePrim(pr: Prim, rng: Random): Pair<Float, Float> {
    val tau = (PI * 2).toFloat()
    var ox: Float; var oy: Float
    when (pr.type) {
        PType.L -> {
            val tt = rng.nextFloat()
            return Pair(
                pr.x1 + (pr.x2 - pr.x1) * tt + (rng.nextFloat() - 0.5f) * pr.w,
                pr.y1 + (pr.y2 - pr.y1) * tt + (rng.nextFloat() - 0.5f) * pr.w
            )
        }
        PType.E -> {
            val u = sqrt(rng.nextFloat()); val a = rng.nextFloat() * tau
            ox = cos(a) * pr.rx * u; oy = sin(a) * pr.ry * u
        }
        PType.R -> {
            val a = rng.nextFloat() * tau; val rr = 1f + (rng.nextFloat() - 0.5f) * pr.t
            ox = cos(a) * pr.rx * rr; oy = sin(a) * pr.ry * rr
        }
        PType.ARC -> {
            val tt = rng.nextFloat(); val ang = pr.a0 + (pr.a1 - pr.a0) * tt
            val rr = 1f + (rng.nextFloat() - 0.5f) * pr.t
            ox = cos(ang) * pr.rx * rr; oy = sin(ang) * pr.ry * rr
        }
        PType.S -> { // scatter — rim-biased
            val u = 0.5f + rng.nextFloat() * 0.55f; val a = rng.nextFloat() * tau
            ox = cos(a) * pr.rx * u; oy = sin(a) * pr.ry * u
        }
    }
    if (pr.rot != 0f) {
        val c = cos(pr.rot); val sn = sin(pr.rot)
        val rxv = ox * c - oy * sn; val ryv = ox * sn + oy * c
        ox = rxv; oy = ryv
    }
    return Pair(pr.x + ox, pr.y + oy)
}

// ── 从一组原语按权重 n 采样出 count 颗目标点（对应 JS sampleForm）──
private fun sampleForm(prims: List<Prim>, count: Int, rng: Random): List<TPoint> {
    var total = 0; for (pr in prims) total += pr.n
    if (total <= 0) return List(count) { TPoint(0.5f, 0.5f, 220, 230, 245, 0.5f) }
    return List(count) {
        var rr = rng.nextFloat() * total
        var pr = prims[0]
        for (q in prims) { rr -= q.n; if (rr <= 0f) { pr = q; break } }
        val (nx, ny) = samplePrim(pr, rng)
        val j = { (rng.nextFloat() - 0.5f) * 0.012f }
        TPoint(nx + j(), ny + j(), pr.r, pr.g, pr.b, pr.a * (0.7f + rng.nextFloat() * 0.45f))
    }
}

// ════════════════════════════════════════════════════════════════
// 形态库 — 与 app.js 的 JOBS_FORMS / MUNGER_FORMS / C_FORMS 一一对应
// ════════════════════════════════════════════════════════════════
private fun ci(vararg v: Int) = intArrayOf(v[0], v[1], v[2])

private val JOBS_FORMS: List<List<Prim>> = listOf(
    // [0] 初心 — 散点云团
    listOf(
        s(.5f,.5f,.32f,.30f,280, ci(220,210,180),.38f),
        s(.5f,.5f,.18f,.16f,120, ci(220,210,180),.55f),
        s(.5f,.5f,.08f,.07f,60,  ci(240,230,200),.7f),
    ),
    // [1] 连线 — 散点+连线网络
    listOf(
        s(.28f,.32f,.08f,.07f,40, ci(180,200,230),.65f),
        s(.62f,.24f,.07f,.06f,35, ci(180,200,230),.6f),
        s(.44f,.58f,.09f,.08f,45, ci(180,200,230),.65f),
        s(.72f,.55f,.06f,.05f,30, ci(180,200,230),.55f),
        s(.20f,.65f,.07f,.06f,35, ci(180,200,230),.55f),
        s(.55f,.38f,.06f,.05f,30, ci(180,200,230),.6f),
        l(.28f,.32f,.55f,.38f,.004f,30, ci(210,230,255),.5f),
        l(.55f,.38f,.62f,.24f,.004f,25, ci(210,230,255),.45f),
        l(.55f,.38f,.44f,.58f,.004f,30, ci(210,230,255),.5f),
        l(.44f,.58f,.72f,.55f,.004f,25, ci(210,230,255),.45f),
        l(.44f,.58f,.20f,.65f,.004f,30, ci(210,230,255),.45f),
        l(.28f,.32f,.62f,.24f,.003f,20, ci(200,220,250),.35f),
    ),
    // [2] 苹果 — 被咬一口的苹果
    listOf(
        arc(.495f,.55f,.23f,.27f,4.7f,9.5f,.06f,180, ci(230,180,170),.7f),
        arc(.505f,.55f,.14f,.27f,9.3f,4.9f,.05f,120, ci(230,180,170),.6f),
        l(.5f,.305f,.5f,.22f,.005f,28, ci(230,180,170),.7f),
        arc(.5f,.24f,.06f,.03f,1.2f,5.0f,.015f,40, ci(255,205,185),.65f),
        e(.5f,.52f,.10f,.12f,80, ci(255,210,200),.25f),
    ),
    // [3] 交汇 — 科技×人文 双环
    listOf(
        r(.40f,.50f,.20f,.20f,.025f,140, ci(170,210,230),.6f),
        r(.60f,.50f,.20f,.20f,.025f,140, ci(230,200,170),.6f),
        e(.50f,.50f,.08f,.14f,80, ci(240,225,195),.5f),
        s(.50f,.50f,.06f,.06f,80, ci(255,240,210),.4f),
    ),
    // [4] 力场 — 同心环+放射线
    buildList {
        add(r(.5f,.5f,.10f,.10f,.012f,50, ci(200,170,230),.7f))
        add(r(.5f,.5f,.18f,.18f,.014f,70, ci(200,170,230),.55f))
        add(r(.5f,.5f,.27f,.27f,.014f,90, ci(200,170,230),.35f))
        add(r(.5f,.5f,.36f,.36f,.012f,100, ci(200,170,230),.18f))
        val rays = listOf(
            floatArrayOf(.5f,.5f,.5f,.08f), floatArrayOf(.5f,.5f,.72f,.18f),
            floatArrayOf(.5f,.5f,.88f,.50f), floatArrayOf(.5f,.5f,.72f,.82f),
            floatArrayOf(.5f,.5f,.5f,.92f), floatArrayOf(.5f,.5f,.28f,.82f),
            floatArrayOf(.5f,.5f,.12f,.50f), floatArrayOf(.5f,.5f,.28f,.18f),
        )
        for (ray in rays) add(l(ray[0],ray[1],ray[2],ray[3],.004f,22, ci(200,170,230),.5f))
    },
    // [5] 涅槃 — 凤凰展翅
    listOf(
        arc(.5f,.55f,.30f,.20f,3.2f,6.1f,.05f,130, ci(240,190,130),.6f),
        arc(.5f,.55f,.30f,.20f,0.0f,3.1f,.05f,130, ci(240,190,130),.6f),
        arc(.5f,.55f,.17f,.11f,3.3f,6.0f,.04f,80, ci(255,220,160),.65f),
        arc(.5f,.55f,.17f,.11f,0.0f,3.0f,.04f,80, ci(255,220,160),.65f),
        e(.5f,.52f,.04f,.16f,70, ci(255,230,170),.7f),
        s(.5f,.35f,.10f,.08f,50, ci(240,190,130),.3f),
    ),
    // [6] 死亡 — 沙漏
    listOf(
        e(.5f,.38f,.14f,.16f,90, ci(210,200,240),.5f),
        arc(.5f,.38f,.14f,.16f,0f,6.283f,.02f,70, ci(210,200,240),.6f),
        e(.5f,.64f,.14f,.16f,90, ci(210,200,240),.5f),
        arc(.5f,.64f,.14f,.16f,0f,6.283f,.02f,70, ci(210,200,240),.6f),
        l(.44f,.48f,.44f,.56f,.003f,15, ci(210,200,240),.5f),
        l(.56f,.48f,.56f,.56f,.003f,15, ci(210,200,240),.5f),
        e(.5f,.52f,.03f,.04f,40, ci(255,240,255),.7f),
        e(.5f,.68f,.10f,.04f,60, ci(210,200,240),.55f),
        r(.5f,.26f,.16f,.02f,.008f,40, ci(210,200,240),.5f),
        r(.5f,.78f,.16f,.02f,.008f,40, ci(210,200,240),.5f),
    ),
    // [7] 前行 — 分岔路
    listOf(
        l(.5f,.78f,.5f,.45f,.015f,60, ci(240,225,195),.65f),
        l(.5f,.45f,.28f,.18f,.012f,50, ci(240,225,195),.55f),
        l(.5f,.45f,.68f,.14f,.012f,50, ci(240,225,195),.55f),
        l(.5f,.45f,.5f,.08f,.008f,35, ci(255,245,220),.45f),
        e(.5f,.45f,.05f,.05f,60, ci(255,245,220),.6f),
        s(.30f,.22f,.04f,.04f,25, ci(240,225,195),.4f),
        s(.66f,.18f,.04f,.04f,25, ci(240,225,195),.4f),
        s(.5f,.12f,.03f,.03f,20, ci(255,245,220),.35f),
        s(.5f,.80f,.30f,.04f,60, ci(240,225,195),.2f),
    ),
)

private val MUNGER_FORMS: List<List<Prim>> = listOf(
    // [0] 初心 — 散点云团
    listOf(
        s(.5f,.5f,.32f,.30f,280, ci(190,175,230),.38f),
        s(.5f,.5f,.18f,.16f,120, ci(190,175,230),.55f),
        s(.5f,.5f,.08f,.07f,60,  ci(210,200,245),.7f),
    ),
    // [1] 格栅 — 多元思维模型网络
    buildList {
        for (x in listOf(.32f,.44f,.56f,.68f)) add(l(x,.30f,x,.70f,.004f,30, ci(167,139,250),.65f))
        for (y in listOf(.30f,.42f,.54f,.66f)) add(l(.30f,y,.70f,y,.004f,30, ci(167,139,250),.65f))
        for (x in listOf(.32f,.44f,.56f,.68f)) for (y in listOf(.30f,.42f,.54f,.66f))
            add(e(x,y,.012f,.012f,7, ci(214,202,255),.9f))
        add(e(.50f,.50f,.04f,.04f,20, ci(230,220,255),.85f))
    },
    // [2] 逆向 — 镜像反转
    listOf(
        arc(.38f,.50f,.18f,.16f,4.2f,5.5f,.04f,70, ci(180,155,240),.7f),
        arc(.38f,.50f,.10f,.09f,4.0f,5.7f,.03f,40, ci(200,180,250),.65f),
        arc(.62f,.50f,.18f,.16f,0.8f,2.1f,.04f,70, ci(180,155,240),.7f),
        arc(.62f,.50f,.10f,.09f,0.5f,2.3f,.03f,40, ci(200,180,250),.65f),
        l(.50f,.26f,.50f,.74f,.003f,20, ci(180,155,240),.4f),
    ),
    // [3] 误判 — 大脑/神经元
    listOf(
        e(.50f,.44f,.20f,.18f,90, ci(200,150,220),.55f),
        arc(.50f,.44f,.20f,.18f,0f,6.283f,.02f,60, ci(200,150,220),.6f),
        l(.38f,.36f,.30f,.26f,.003f,16, ci(200,150,220),.5f),
        l(.62f,.36f,.70f,.26f,.003f,16, ci(200,150,220),.5f),
        l(.42f,.52f,.34f,.62f,.003f,14, ci(200,150,220),.45f),
        l(.58f,.52f,.66f,.62f,.003f,14, ci(200,150,220),.45f),
        e(.50f,.44f,.04f,.04f,22, ci(240,210,255),.75f),
    ),
    // [4] 能力圈 — 圆圈+清晰边界
    listOf(
        r(.50f,.50f,.30f,.30f,.025f,130, ci(190,160,200),.6f),
        r(.50f,.50f,.20f,.20f,.02f,90, ci(190,160,200),.5f),
        r(.50f,.50f,.10f,.10f,.015f,50, ci(190,160,200),.7f),
        e(.50f,.50f,.03f,.03f,20, ci(255,255,255),.85f),
        e(.70f,.80f,.015f,.015f,12, ci(190,160,200),.5f),
        e(.25f,.35f,.015f,.015f,12, ci(190,160,200),.5f),
    ),
    // [5] 等待 — 沙漏/时钟
    listOf(
        e(.50f,.38f,.14f,.16f,90, ci(210,180,200),.5f),
        arc(.50f,.38f,.14f,.16f,0f,6.283f,.02f,70, ci(210,180,200),.6f),
        e(.50f,.64f,.14f,.16f,90, ci(210,180,200),.5f),
        arc(.50f,.64f,.14f,.16f,0f,6.283f,.02f,70, ci(210,180,200),.6f),
        l(.44f,.48f,.44f,.56f,.003f,15, ci(210,180,200),.5f),
        l(.56f,.48f,.56f,.56f,.003f,15, ci(210,180,200),.5f),
        e(.50f,.68f,.10f,.04f,60, ci(210,180,200),.55f),
    ),
    // [6] 简单 — 一个强几何形
    listOf(
        e(.50f,.50f,.26f,.26f,160, ci(220,190,210),.5f),
        r(.50f,.50f,.26f,.26f,.03f,100, ci(220,190,210),.7f),
        e(.50f,.50f,.06f,.06f,40, ci(255,235,250),.8f),
        l(.50f,.24f,.50f,.18f,.004f,18, ci(220,190,210),.55f),
    ),
    // [7] 传承 — 桥梁/路径
    listOf(
        l(.18f,.55f,.50f,.55f,.015f,50, ci(230,210,220),.6f),
        l(.50f,.55f,.82f,.55f,.015f,50, ci(230,210,220),.6f),
        l(.24f,.45f,.24f,.65f,.008f,24, ci(230,210,220),.55f),
        l(.76f,.45f,.76f,.65f,.008f,24, ci(230,210,220),.55f),
        e(.50f,.55f,.04f,.04f,24, ci(255,245,255),.75f),
        s(.50f,.40f,.12f,.10f,40, ci(230,210,220),.35f),
    ),
)

// ── 共享符号 ──
private val SYM_ATOM: List<Prim> = listOf(
    e(.5f,.5f,.03f,.03f,34, ci(255,255,255),1f),
    r(.5f,.5f,.30f,.10f,.04f,74, ci(140,210,255),.8f, rot = 0f),
    r(.5f,.5f,.30f,.10f,.04f,74, ci(140,210,255),.8f, rot = 1.05f),
    r(.5f,.5f,.30f,.10f,.04f,74, ci(140,210,255),.8f, rot = -1.05f),
    e(.80f,.50f,.02f,.02f,16, ci(125,211,252),1f),
    e(.355f,.31f,.018f,.018f,14, ci(125,211,252),1f),
    e(.355f,.69f,.018f,.018f,14, ci(125,211,252),1f),
)
private val SYM_VITRUVIAN: List<Prim> = listOf(
    r(.5f,.52f,.32f,.32f,.03f,130, ci(240,206,150),.7f),
    l(.20f,.22f,.80f,.22f,.004f,22, ci(224,196,150),.5f),
    l(.20f,.82f,.80f,.82f,.004f,22, ci(224,196,150),.5f),
    l(.20f,.22f,.20f,.82f,.004f,22, ci(224,196,150),.5f),
    l(.80f,.22f,.80f,.82f,.004f,22, ci(224,196,150),.5f),
    e(.5f,.30f,.045f,.05f,32, ci(244,222,180),.72f),
    l(.5f,.35f,.5f,.62f,.006f,26, ci(242,220,180),.7f),
    l(.5f,.42f,.24f,.35f,.005f,18, ci(242,220,180),.6f),
    l(.5f,.42f,.76f,.35f,.005f,18, ci(242,220,180),.6f),
    l(.5f,.42f,.26f,.47f,.005f,14, ci(242,220,180),.5f),
    l(.5f,.42f,.74f,.47f,.005f,14, ci(242,220,180),.5f),
    l(.5f,.62f,.40f,.81f,.006f,18, ci(242,220,180),.6f),
    l(.5f,.62f,.60f,.81f,.006f,18, ci(242,220,180),.6f),
)

// ── 程序化生成形态（黄金螺旋）──
private fun spiralForm(count: Int, c: IntArray, rng: Random): List<TPoint> {
    val tau = (PI * 2).toFloat()
    return List(count) { i ->
        val t = i.toFloat() / count
        val ang = t * tau * 3.0f
        val rad = 0.02f + 0.32f * t
        // 0..1 坐标系（围绕 0.5 居中），与原型一致
        TPoint(0.5f + cos(ang) * rad, 0.5f + sin(ang) * rad, c[0], c[1], c[2], 0.45f + rng.nextFloat() * 0.45f)
    }
}

// ── 三态轮播的其余大师（einstein/davinci/feynman/...）──
// 用 lambda 包装：部分形态是参数化生成而非原语列表
private sealed interface FormSpec {
    class Prims(val list: List<Prim>) : FormSpec
    class Gen(val build: (Int, Random) -> List<TPoint>) : FormSpec
}

private fun cyclicForms(id: String): List<FormSpec> = when (id) {
    "einstein" -> listOf(
        FormSpec.Prims(buildList {
            for (rr in listOf(0.06f,0.12f,0.18f,0.24f,0.30f))
                add(r(.50f,.50f,rr,rr,.018f, (30 + rr*140).toInt(), ci(110,185,235), .38f + rr*.5f))
            add(e(.50f,.50f,.028f,.028f,40, ci(200,235,255),.96f))
            add(e(.50f,.50f,.06f,.06f,22, ci(140,210,255),.55f))
            add(arc(.50f,.50f,.35f,.35f,5.6f,0.7f,.025f,40, ci(120,200,250),.55f))
            add(arc(.50f,.50f,.35f,.35f,2.4f,3.8f,.025f,40, ci(120,200,250),.50f))
        }),
        // E=mc² — 用文字几何不易，退化为方程符号点云近似（中心明亮带）
        FormSpec.Prims(listOf(
            l(.30f,.50f,.70f,.50f,.06f,140, ci(140,210,255),.85f),
            e(.30f,.50f,.05f,.05f,30, ci(180,225,255),.9f),
            e(.62f,.44f,.04f,.04f,24, ci(180,225,255),.85f),
        )),
        FormSpec.Prims(SYM_ATOM),
    )
    "davinci" -> listOf(
        FormSpec.Prims(listOf(
            arc(.50f,.48f,.30f,.18f,3.3f,6.0f,.06f,100, ci(235,205,155),.68f),
            arc(.50f,.48f,.30f,.18f,0.0f,3.0f,.06f,100, ci(235,205,155),.68f),
            arc(.50f,.48f,.16f,.10f,3.2f,6.1f,.04f,50, ci(245,218,170),.55f),
            arc(.50f,.48f,.16f,.10f,0.0f,3.1f,.04f,50, ci(245,218,170),.55f),
            e(.50f,.54f,.05f,.09f,36, ci(225,195,148),.74f),
            l(.50f,.60f,.50f,.82f,.008f,20, ci(210,180,132),.65f),
            e(.50f,.42f,.048f,.04f,28, ci(245,225,178),.80f),
            e(.50f,.48f,.025f,.025f,14, ci(255,240,200),.88f),
        )),
        FormSpec.Prims(SYM_VITRUVIAN),
        FormSpec.Gen { n, rng -> spiralForm(n, ci(244,214,160), rng) },
    )
    "feynman" -> listOf(
        FormSpec.Prims(listOf(
            e(.5f,.5f,.03f,.03f,34, ci(100,195,215),1f),
            r(.5f,.5f,.30f,.10f,.035f,70, ci(100,195,215),.7f, rot = 0.6f),
            r(.5f,.5f,.25f,.10f,.035f,60, ci(100,195,215),.65f, rot = -1.0f),
            r(.5f,.5f,.20f,.10f,.03f,50, ci(100,195,215),.55f, rot = 2.2f),
            e(.72f,.45f,.015f,.015f,12, ci(130,220,240),.9f),
            e(.40f,.30f,.015f,.015f,12, ci(130,220,240),.9f),
        )),
        FormSpec.Prims(listOf(
            l(.20f,.55f,.80f,.55f,.004f,26, ci(130,210,230),.6f),
            l(.50f,.20f,.50f,.80f,.004f,26, ci(130,210,230),.6f),
            arc(.50f,.55f,.12f,.08f,4.0f,5.6f,.018f,50, ci(100,195,215),.7f),
            arc(.50f,.55f,.12f,.08f,0.8f,2.4f,.018f,50, ci(100,195,215),.7f),
            e(.50f,.55f,.025f,.025f,24, ci(255,255,255),.9f),
        )),
        FormSpec.Prims(listOf(
            arc(.50f,.38f,.14f,.12f,1.5f,5.8f,.04f,90, ci(100,195,215),.7f),
            e(.50f,.68f,.02f,.02f,16, ci(100,195,215),.85f),
            l(.50f,.62f,.50f,.74f,.004f,16, ci(100,195,215),.8f),
            s(.50f,.42f,.04f,.04f,40, ci(130,220,240),.5f),
        )),
    )
    "taleb" -> listOf(
        FormSpec.Prims(listOf(
            arc(.50f,.52f,.24f,.14f,4.0f,5.5f,.04f,80, ci(215,165,95),.75f),
            arc(.50f,.52f,.24f,.14f,0.8f,2.3f,.04f,80, ci(215,165,95),.75f),
            arc(.50f,.52f,.16f,.09f,3.8f,5.7f,.03f,50, ci(235,190,120),.65f),
            arc(.50f,.52f,.16f,.09f,0.5f,2.5f,.03f,50, ci(235,190,120),.65f),
            e(.50f,.56f,.04f,.10f,36, ci(225,180,110),.75f),
        )),
        FormSpec.Prims(listOf(
            e(.20f,.50f,.06f,.06f,40, ci(215,165,95),.85f),
            e(.80f,.50f,.06f,.06f,40, ci(215,165,95),.85f),
            l(.26f,.50f,.74f,.50f,.006f,50, ci(215,165,95),.65f),
            e(.20f,.50f,.10f,.10f,24, ci(240,200,140),.3f),
            e(.80f,.50f,.10f,.10f,24, ci(240,200,140),.3f),
        )),
        FormSpec.Prims(listOf(
            e(.50f,.48f,.06f,.10f,40, ci(215,165,95),.7f),
            arc(.50f,.34f,.05f,.15f,3.8f,5.6f,.025f,30, ci(215,165,95),.55f),
            arc(.50f,.34f,.05f,.15f,0.5f,2.5f,.025f,30, ci(215,165,95),.55f),
            arc(.50f,.34f,.04f,.12f,3.9f,5.5f,.02f,25, ci(240,200,140),.45f),
            arc(.50f,.34f,.04f,.12f,0.6f,2.4f,.02f,25, ci(240,200,140),.45f),
        )),
    )
    "musk" -> listOf(
        FormSpec.Prims(listOf(
            e(.50f,.45f,.05f,.22f,80, ci(210,65,45),.75f),
            e(.50f,.24f,.04f,.06f,30, ci(240,100,80),.65f),
            l(.50f,.58f,.32f,.74f,.005f,22, ci(210,65,45),.6f),
            l(.50f,.58f,.68f,.74f,.005f,22, ci(210,65,45),.6f),
            l(.50f,.68f,.50f,.85f,.005f,18, ci(240,100,80),.5f),
            s(.50f,.78f,.06f,.04f,40, ci(255,140,100),.4f),
        )),
        FormSpec.Prims(listOf(
            e(.50f,.50f,.04f,.04f,28, ci(255,255,255),.9f),
            r(.50f,.50f,.12f,.12f,.03f,40, ci(210,65,45),.7f),
            r(.50f,.50f,.22f,.22f,.025f,50, ci(210,65,45),.55f),
            r(.50f,.50f,.32f,.32f,.02f,60, ci(210,65,45),.35f),
            l(.50f,.50f,.65f,.20f,.003f,16, ci(240,100,80),.5f),
            l(.50f,.50f,.28f,.72f,.003f,16, ci(240,100,80),.5f),
        )),
        FormSpec.Prims(listOf(
            l(.22f,.26f,.78f,.74f,.012f,60, ci(210,65,45),.7f),
            l(.78f,.26f,.22f,.74f,.012f,60, ci(210,65,45),.7f),
            e(.50f,.50f,.03f,.03f,20, ci(255,160,120),.85f),
        )),
    )
    "naval" -> listOf(
        FormSpec.Prims(listOf(
            l(.50f,.20f,.50f,.50f,.006f,26, ci(185,165,120),.7f),
            l(.28f,.62f,.72f,.62f,.006f,40, ci(185,165,120),.65f),
            e(.28f,.62f,.04f,.04f,24, ci(210,190,145),.7f),
            e(.72f,.62f,.04f,.04f,24, ci(210,190,145),.7f),
            e(.50f,.50f,.02f,.02f,10, ci(255,235,200),.85f),
        )),
        FormSpec.Prims(listOf(
            e(.50f,.44f,.22f,.20f,100, ci(185,165,120),.5f),
            arc(.50f,.44f,.22f,.20f,0f,6.283f,.02f,60, ci(185,165,120),.6f),
            arc(.38f,.36f,.05f,.08f,0.5f,2.6f,.015f,28, ci(210,190,145),.55f),
            arc(.62f,.36f,.05f,.08f,0.5f,2.6f,.015f,28, ci(210,190,145),.55f),
            e(.50f,.44f,.05f,.05f,28, ci(255,235,200),.55f),
        )),
        FormSpec.Prims(listOf(
            l(.50f,.74f,.50f,.26f,.012f,40, ci(185,165,120),.7f),
            l(.50f,.26f,.34f,.40f,.010f,30, ci(185,165,120),.65f),
            l(.50f,.26f,.66f,.40f,.010f,30, ci(185,165,120),.65f),
            s(.50f,.50f,.20f,.22f,60, ci(210,190,145),.3f),
        )),
    )
    "pg" -> listOf(
        FormSpec.Prims(listOf(
            l(.46f,.22f,.46f,.78f,.008f,40, ci(140,165,185),.7f),
            l(.46f,.22f,.56f,.26f,.008f,20, ci(140,165,185),.65f),
            l(.46f,.78f,.54f,.74f,.008f,20, ci(140,165,185),.65f),
            e(.51f,.22f,.025f,.025f,14, ci(170,190,210),.8f),
            l(.34f,.32f,.58f,.32f,.004f,16, ci(170,190,210),.5f),
            l(.34f,.38f,.58f,.38f,.004f,16, ci(170,190,210),.5f),
        )),
        FormSpec.Prims(listOf(
            l(.24f,.66f,.40f,.66f,.008f,24, ci(140,165,185),.65f),
            l(.40f,.66f,.40f,.50f,.008f,18, ci(140,165,185),.65f),
            l(.40f,.50f,.56f,.50f,.008f,24, ci(140,165,185),.7f),
            l(.56f,.50f,.56f,.34f,.008f,18, ci(140,165,185),.7f),
            l(.56f,.34f,.72f,.34f,.008f,24, ci(140,165,185),.75f),
            e(.72f,.34f,.02f,.02f,12, ci(255,255,255),.8f),
        )),
        FormSpec.Prims(listOf(
            l(.50f,.28f,.30f,.50f,.006f,26, ci(140,165,185),.6f),
            l(.50f,.28f,.70f,.50f,.006f,26, ci(140,165,185),.6f),
            l(.30f,.50f,.18f,.70f,.005f,20, ci(140,165,185),.5f),
            l(.30f,.50f,.42f,.70f,.005f,20, ci(140,165,185),.5f),
            l(.70f,.50f,.58f,.70f,.005f,20, ci(140,165,185),.5f),
            l(.70f,.50f,.82f,.70f,.005f,20, ci(140,165,185),.5f),
            e(.50f,.28f,.02f,.02f,12, ci(255,255,255),.8f),
        )),
    )
    "zhangyiming" -> listOf(
        FormSpec.Prims(listOf(
            e(.50f,.30f,.02f,.02f,12, ci(80,140,200),.85f),
            e(.32f,.50f,.02f,.02f,12, ci(80,140,200),.85f),
            e(.68f,.50f,.02f,.02f,12, ci(80,140,200),.85f),
            e(.38f,.68f,.02f,.02f,12, ci(80,140,200),.85f),
            e(.62f,.68f,.02f,.02f,12, ci(80,140,200),.85f),
            l(.50f,.30f,.32f,.50f,.003f,18, ci(80,140,200),.45f),
            l(.50f,.30f,.68f,.50f,.003f,18, ci(80,140,200),.45f),
            l(.32f,.50f,.38f,.68f,.003f,18, ci(80,140,200),.45f),
            l(.68f,.50f,.62f,.68f,.003f,18, ci(80,140,200),.45f),
            l(.32f,.50f,.68f,.50f,.003f,18, ci(80,140,200),.4f),
            l(.38f,.68f,.62f,.68f,.003f,18, ci(80,140,200),.4f),
            r(.50f,.50f,.28f,.28f,.02f,60, ci(80,140,200),.25f),
        )),
        FormSpec.Prims(listOf(
            r(.50f,.50f,.24f,.24f,.025f,90, ci(80,140,200),.55f),
            l(.50f,.50f,.50f,.32f,.005f,22, ci(80,140,200),.75f),
            l(.50f,.50f,.61f,.44f,.003f,16, ci(80,140,200),.55f),
            e(.50f,.50f,.015f,.015f,10, ci(255,255,255),.85f),
        )),
        FormSpec.Prims(listOf(
            r(.50f,.50f,.26f,.26f,.02f,100, ci(80,140,200),.5f),
            arc(.50f,.50f,.26f,.26f,0.8f,2.3f,.015f,40, ci(80,140,200),.45f),
            arc(.50f,.50f,.26f,.26f,3.9f,5.5f,.015f,40, ci(80,140,200),.45f),
            l(.30f,.50f,.70f,.50f,.003f,20, ci(80,140,200),.5f),
            l(.50f,.30f,.50f,.70f,.003f,20, ci(80,140,200),.5f),
        )),
    )
    "sunyuchen" -> listOf(
        FormSpec.Prims(listOf(
            l(.44f,.40f,.34f,.28f,.010f,30, ci(255,175,30),.7f),
            l(.56f,.40f,.66f,.28f,.010f,30, ci(255,175,30),.7f),
            l(.44f,.40f,.44f,.68f,.008f,30, ci(255,175,30),.65f),
            l(.56f,.40f,.56f,.68f,.008f,30, ci(255,175,30),.65f),
            r(.50f,.68f,.12f,.04f,.015f,40, ci(255,175,30),.55f),
            s(.40f,.26f,.08f,.06f,50, ci(255,200,80),.5f),
        )),
        FormSpec.Prims(listOf(
            r(.50f,.50f,.30f,.30f,.04f,110, ci(255,175,30),.65f),
            r(.50f,.50f,.18f,.18f,.03f,70, ci(255,200,80),.5f),
            e(.50f,.50f,.04f,.04f,24, ci(255,255,200),.8f),
            e(.50f,.50f,.12f,.12f,36, ci(255,220,120),.25f),
        )),
        FormSpec.Prims(listOf(
            l(.50f,.72f,.50f,.30f,.010f,30, ci(255,175,30),.7f),
            l(.50f,.44f,.34f,.28f,.008f,24, ci(255,200,80),.6f),
            l(.50f,.44f,.66f,.28f,.008f,24, ci(255,200,80),.6f),
            l(.50f,.36f,.40f,.18f,.006f,20, ci(255,220,120),.5f),
            l(.50f,.36f,.60f,.18f,.006f,20, ci(255,220,120),.5f),
            s(.50f,.30f,.12f,.10f,60, ci(255,200,80),.4f),
        )),
    )
    else -> listOf(FormSpec.Prims(listOf(s(.5f,.5f,.30f,.28f,200, ci(225,233,246),.5f))))
}

// ── 给定 companion + 形态索引 + 粒子数，构建目标点（含颜色）──
private fun buildFormPoints(companion: CompanionInfo, idx: Int, count: Int, rng: Random): List<TPoint> {
    return when (companion.id) {
        "jobs" -> sampleForm(JOBS_FORMS[idx % JOBS_FORMS.size], count, rng)
        "munger" -> sampleForm(MUNGER_FORMS[idx % MUNGER_FORMS.size], count, rng)
        else -> {
            val specs = cyclicForms(companion.id)
            when (val sp = specs[idx % specs.size]) {
                is FormSpec.Prims -> sampleForm(sp.list, count, rng)
                is FormSpec.Gen -> sp.build(count, rng)
            }
        }
    }
}

// ════════════════════════════════════════════════════════════════
// CompanionStage — 纵向 Column 布局（圆点 → 画布 → 文字）
// ════════════════════════════════════════════════════════════════
@Composable
fun CompanionStage(
    companion: CompanionInfo,
    modifier: Modifier = Modifier
) {
    val stages = stagesFor(companion)
    val stageCount = if (stages != null) 8 else 3

    // 对齐原型：focus morph 用 560 颗粒子
    val particleCount = 560
    val morphMs = if (stages != null) 2800 else 2600
    val holdMs = if (stages != null) 3800 else 2100

    // ── 单一真相来源驱动 morph，杜绝「索引」与「系数」分离造成的竞态跳帧 ──
    // 此前用 formIndex(状态/重组) + morphAnim(动画) 两套来源：animateTo 结束那一帧系数=1，
    // 同一时刻 formIndex++ 让 current/next 前移，但 snapTo(0) 尚未在该帧生效，于是会用
    // 「系数=1」插值新的 current→next，闪现「再下一张」后才被拉回——即你看到的向前跳转+修正。
    //
    // 改为：一个单调递增的连续时钟 cycleTime（单位：毫秒），每段时长 = holdMs + morphMs。
    // 渲染帧里「同时」从同一个 cycleTime 推导 段索引 与 段内 morph 系数，二者永不错配。
    val segMs = (holdMs + morphMs).toFloat()
    val loopMs = segMs * stageCount
    val cycleTime = remember(companion.id) { Animatable(0f) }
    LaunchedEffect(companion.id) {
        // 在 [0, loopMs) 上无限匀速递增，整段循环一次后回到 0（回到的也是同一形态，无缝）。
        cycleTime.snapTo(0f)
        while (isActive) {
            cycleTime.snapTo(0f)
            cycleTime.animateTo(
                targetValue = loopMs,
                animationSpec = tween(durationMillis = loopMs.toInt(), easing = LinearEasing)
            )
        }
    }

    // 由同一个时钟推导：当前段索引、段内 [0,1] 进度
    val tNow = cycleTime.value
    val segIndexRaw = (tNow / segMs).toInt().coerceIn(0, stageCount - 1)
    val segLocalMs = tNow - segIndexRaw * segMs
    // 段内：前 holdMs 停留(系数0)，后 morphMs 缓变(0→1)
    val rawMorph = if (segLocalMs <= holdMs) 0f
                   else ((segLocalMs - holdMs) / morphMs).coerceIn(0f, 1f)
    val morphCoef = easeCubic(rawMorph)
    val formIndex = segIndexRaw

    // 全局呼吸脉动（对应 JS: 1 + sin(t*0.55)*0.07）
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulse by infiniteTransition.animateFloat(
        0.93f, 1.07f,
        infiniteRepeatable(tween(5712, easing = LinearEasing), RepeatMode.Reverse), "pulse"
    )
    // 每帧驱动粒子漂移用的连续时间
    val driftTime by infiniteTransition.animateFloat(
        0f, ((PI * 2).toFloat()),
        infiniteRepeatable(tween(10000, easing = LinearEasing), RepeatMode.Restart), "drift"
    )

    val currentTint = if (stages != null) {
        val st = stages[formIndex]; Color(st.tintRed, st.tintGreen, st.tintBlue)
    } else companion.tintColor
    val tintStr = currentTint

    // 每颗粒子的稳定随机种子（大小/相位差异）
    val seeds = remember(companion.id) {
        val r = Random(companion.id.hashCode())
        FloatArray(particleCount) { r.nextFloat() * (PI * 2).toFloat() }
    }
    // 一次性为每个形态各采样一份固定点集并缓存。morph 只在这些固定点集之间插值，
    // 保证「本轮终点形态」与「下一轮起点形态」是同一份点集 → 完全无缝、无跳变。
    val forms = remember(companion.id) {
        List(stageCount) { idx ->
            buildFormPoints(companion, idx, particleCount, Random(idx * 31 + companion.id.hashCode()))
        }
    }
    val currentForm = forms[formIndex]
    val nextForm = forms[(formIndex + 1) % stageCount]

    val capName = if (stages != null) "${companion.name} · ${stages[formIndex].name}" else companion.name
    val capQuote = if (stages != null) stages[formIndex].chinese else companion.quote

    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 阶段圆点（仅 8 阶段叙事）—— 对齐原型 .sdot：普通 5px / 当前 6px，色 rgba(240,225,195,.x)
        if (stageCount == 8) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(5.dp),
                modifier = Modifier.padding(top = 8.dp, bottom = 6.dp)
            ) {
                for (i in 0 until 8) {
                    val isCurrent = i == formIndex
                    val isPast = i < formIndex
                    Box(modifier = Modifier
                        .size(if (isCurrent) 6.dp else 5.dp)
                        .clip(CircleShape)
                        .background(when {
                            isCurrent -> Color(0xFFF0E1C3).copy(alpha = 0.8f)   // rgba(240,225,195,.8)
                            isPast -> Color(0xFFB4AA9B).copy(alpha = 0.08f)      // rgba(180,170,155,.08)
                            else -> Color(0xFFB4AA9B).copy(alpha = 0.2f)         // rgba(180,170,155,.2)
                        })
                    )
                }
            }
        }

        // 粒子画布
        Canvas(modifier = Modifier.weight(1f).fillMaxWidth()) {
            val w = size.width; val h = size.height
            val sq = min(w, h)
            val boxX = (w - sq) / 2f; val boxY = (h - sq) / 2f
            val cx = boxX + sq * 0.5f; val cy = boxY + sq * 0.5f

            // 背景环境光 — 柔和径向辉光（对应 JS bgGrad）
            drawCircle(
                brush = Brush.radialGradient(
                    colorStops = arrayOf(
                        0.0f to tintStr.copy(alpha = 0.06f * pulse),
                        0.5f to tintStr.copy(alpha = 0.02f * pulse),
                        1.0f to Color.Transparent
                    ),
                    center = Offset(cx, cy), radius = sq * 0.48f
                ),
                radius = sq * 0.48f, center = Offset(cx, cy)
            )

            val eP = morphCoef
            val t = driftTime
            // 原型画布参考边长≈300 CSS px；按当前正方形边长等比缩放粒子半径与漂移幅度，
            // 使任意分辨率/DPI 下都与原型视觉比例一致。
            val unit = sq / 300f
            for (i in 0 until particleCount) {
                val from = currentForm[i]; val to = nextForm[i]
                val nx = from.nx + (to.nx - from.nx) * eP
                val ny = from.ny + (to.ny - from.ny) * eP
                // 颜色/透明度同步 morph
                val pr = (from.r + (to.r - from.r) * eP)
                val pg = (from.g + (to.g - from.g) * eP)
                val pb = (from.b + (to.b - from.b) * eP)
                val pa = from.a + (to.a - from.a) * eP

                val seed = seeds[i]
                val dx = sin(t * 1.2f + seed) * 1.6f * unit
                val dy = cos(t * 0.85f + seed * 1.4f) * 1.6f * unit
                // nx/ny 为原型 0..1 坐标，直接映射到正方形画布
                val px = boxX + nx * sq + dx
                val py = boxY + ny * sq + dy

                val col = Color(pr.toInt().coerceIn(0,255), pg.toInt().coerceIn(0,255), pb.toInt().coerceIn(0,255))
                val sz = (0.75f + (seed % 1f) * 0.55f) * unit

                // 第一层 — 大气柔光晕
                drawCircle(col.copy(alpha = (pa * 0.055f * pulse).coerceIn(0f, 1f)), 5.5f * sz, Offset(px, py))
                // 第二层 — 中等辉光
                drawCircle(col.copy(alpha = (pa * 0.14f * pulse).coerceIn(0f, 1f)), 2.8f * sz, Offset(px, py))
                // 第三层 — 明亮核心
                drawCircle(col.copy(alpha = (pa * 0.88f * pulse).coerceIn(0f, 1f)), 0.95f * sz, Offset(px, py))
            }
        }

        // 名字 + 金句 —— 对齐原型 .companion-cap
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(bottom = 6.dp, top = 4.dp)
        ) {
            // 「<b>名字</b> 正在陪你专注」：名字固定青色 rgba(125,211,252,.92) + 600，
            // 说明文字偏白 rgba(214,232,255,.6)。同一行两种颜色。
            Text(
                text = buildAnnotatedString {
                    withStyle(SpanStyle(
                        color = Color(125, 211, 252).copy(alpha = 0.92f),
                        fontWeight = FontWeight.SemiBold
                    )) { append(capName) }
                    withStyle(SpanStyle(color = Color(214, 232, 255).copy(alpha = 0.6f))) {
                        append(" 正在陪你专注")
                    }
                },
                fontSize = 11.sp,
                letterSpacing = 0.04.em,
                textAlign = TextAlign.Center
            )
            // 金句：italic，rgba(214,232,255,.34)，10px，line-height 1.55，margin-top 4px
            Text(
                text = capQuote,
                color = Color(214, 232, 255).copy(alpha = 0.34f),
                fontStyle = FontStyle.Italic,
                fontSize = 10.sp,
                lineHeight = 15.5.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}

private fun easeCubic(t: Float): Float =
    if (t < 0.5f) 4f * t * t * t else 1f - (-2f * t + 2f).let { it * it * it } / 2f

// ════════════════════════════════════════════════════════════════
// CompanionOrb — 首页卡片上的小尺寸粒子预览
// 复用同一套形态点云引擎，对应原型 buildCardPreviews()：
//   count:150, morphMs:2400, holdMs:1900, loopForms:false
// loopForms:false → 只在「第 0 形态」上做微动 morph（点位轻微重排+呼吸），
// 与原型卡片预览完全一致（展示大师标志形态的雏形，而非旋转轨道）。
// ════════════════════════════════════════════════════════════════
@Composable
fun CompanionOrb(
    companion: CompanionInfo,
    modifier: Modifier = Modifier
) {
    val particleCount = 150
    val morphMs = 2400
    val holdMs = 1900

    val tint = companion.tintColor

    // 第 0 形态的两份采样（loopForms:false → 在 form0 的不同采样之间来回 morph，
    // 形成轻微的呼吸/点位浮动，整体保持该大师标志形态的轮廓）。
    val formA = remember(companion.id) {
        buildFormPoints(companion, 0, particleCount, Random(companion.id.hashCode()))
    }
    val formB = remember(companion.id) {
        buildFormPoints(companion, 0, particleCount, Random(companion.id.hashCode() + 101))
    }

    val morphAnim = remember(companion.id) { Animatable(0f) }
    LaunchedEffect(companion.id) {
        // 在 A↔B 之间无缝往返：0→1（A→B）hold，1→0（B→A）hold …
        var forward = true
        while (isActive) {
            kotlinx.coroutines.delay(holdMs.toLong())
            if (forward) morphAnim.animateTo(1f, tween(morphMs, easing = EaseInOutCubic))
            else morphAnim.animateTo(0f, tween(morphMs, easing = EaseInOutCubic))
            forward = !forward
        }
    }

    val infiniteTransition = rememberInfiniteTransition(label = "orbPulse")
    val pulse by infiniteTransition.animateFloat(
        0.93f, 1.07f,
        infiniteRepeatable(tween(5712, easing = LinearEasing), RepeatMode.Reverse), "orbPulse"
    )
    val driftTime by infiniteTransition.animateFloat(
        0f, ((PI * 2).toFloat()),
        infiniteRepeatable(tween(10000, easing = LinearEasing), RepeatMode.Restart), "orbDrift"
    )

    val seeds = remember(companion.id) {
        val r = Random(companion.id.hashCode() * 7)
        FloatArray(particleCount) { r.nextFloat() * (PI * 2).toFloat() }
    }

    Canvas(modifier = modifier) {
        val w = size.width; val h = size.height
        val sq = min(w, h)
        val boxX = (w - sq) / 2f; val boxY = (h - sq) / 2f
        val cx = boxX + sq * 0.5f; val cy = boxY + sq * 0.5f

        // 背景径向辉光（与 stage 一致）
        drawCircle(
            brush = Brush.radialGradient(
                colorStops = arrayOf(
                    0.0f to tint.copy(alpha = 0.06f * pulse),
                    0.5f to tint.copy(alpha = 0.02f * pulse),
                    1.0f to Color.Transparent
                ),
                center = Offset(cx, cy), radius = sq * 0.48f
            ),
            radius = sq * 0.48f, center = Offset(cx, cy)
        )

        val eP = easeCubic(morphAnim.value)
        val t = driftTime
        val unit = sq / 300f
        for (i in 0 until particleCount) {
            val from = formA[i]; val to = formB[i]
            val nx = from.nx + (to.nx - from.nx) * eP
            val ny = from.ny + (to.ny - from.ny) * eP
            val pr = (from.r + (to.r - from.r) * eP)
            val pg = (from.g + (to.g - from.g) * eP)
            val pb = (from.b + (to.b - from.b) * eP)
            val pa = from.a + (to.a - from.a) * eP

            val seed = seeds[i]
            val dx = sin(t * 1.2f + seed) * 1.6f * unit
            val dy = cos(t * 0.85f + seed * 1.4f) * 1.6f * unit
            val px = boxX + nx * sq + dx
            val py = boxY + ny * sq + dy

            val col = Color(pr.toInt().coerceIn(0,255), pg.toInt().coerceIn(0,255), pb.toInt().coerceIn(0,255))
            val sz = (0.75f + (seed % 1f) * 0.55f) * unit

            drawCircle(col.copy(alpha = (pa * 0.055f * pulse).coerceIn(0f, 1f)), 5.5f * sz, Offset(px, py))
            drawCircle(col.copy(alpha = (pa * 0.14f * pulse).coerceIn(0f, 1f)), 2.8f * sz, Offset(px, py))
            drawCircle(col.copy(alpha = (pa * 0.88f * pulse).coerceIn(0f, 1f)), 0.95f * sz, Offset(px, py))
        }
    }
}
