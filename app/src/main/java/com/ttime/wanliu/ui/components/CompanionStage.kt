package com.ttime.wanliu.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import kotlin.math.*
import kotlin.random.Random

/**
 * 专注页陪伴者粒子画布 — 几何图案在多种形态间持续 morph，带多层辉光与呼吸脉动。
 */
@Composable
fun CompanionStage(
    companion: CompanionInfo,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "stage")

    // 形态轮播进度 (0..1 在一个形态内)
    val morphProgress by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 1f,
        animationSpec = infiniteRepeatable(
            tween(6000, easing = EaseInOutCubic),
            RepeatMode.Restart
        ),
        label = "morph"
    )

    // 形态索引（循环切换）
    var formIndex by remember { mutableIntStateOf(0) }
    val formCount = if (companion.isNarrative) 8 else 3

    LaunchedEffect(morphProgress) {
        if (morphProgress >= 0.98f) {
            formIndex = (formIndex + 1) % formCount
        }
    }

    // 呼吸亮度
    val breathe by infiniteTransition.animateFloat(
        initialValue = 0.6f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(3000, easing = EaseInOutCubic), RepeatMode.Reverse),
        label = "breathe"
    )

    // 旋转
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(20000, easing = LinearEasing), RepeatMode.Restart),
        label = "rot"
    )

    val tint = companion.tintColor
    val particleCount = 180
    val rng = remember { Random(companion.id.hashCode()) }

    // 预生成粒子
    val particles = remember {
        List(particleCount) { Particle(rng) }
    }

    // 构建当前形态的锚点
    val currentForm = remember(formIndex, morphProgress) {
        buildFormAnchors(formIndex, companion, rng)
    }
    val nextForm = remember((formIndex + 1) % formCount, morphProgress) {
        buildFormAnchors((formIndex + 1) % formCount, companion, rng)
    }

    Canvas(modifier = modifier.fillMaxSize()) {
        val cx = size.width / 2f
        val cy = size.height / 2f
        val scale = min(size.width, size.height) * 0.4f

        // 背景径向辉光
        drawCircle(
            brush = Brush.radialGradient(
                listOf(tint.copy(alpha = 0.08f * breathe), Color.Transparent),
                center = Offset(cx, cy),
                radius = size.minDimension * 0.45f
            ),
            radius = size.minDimension * 0.45f,
            center = Offset(cx, cy)
        )

        // 渲染粒子
        for (i in particles.indices) {
            val p = particles[i]
            val from = currentForm[i % currentForm.size]
            val to = nextForm[i % nextForm.size]

            // morph 插值
            val easedP = easeInOutCubic(morphProgress)
            val ax = lerp(from.first, to.first, easedP)
            val ay = lerp(from.second, to.second, easedP)

            // 微旋转
            val rad = Math.toRadians(rotation.toDouble()).toFloat()
            val rx = ax * cos(rad) - ay * sin(rad)
            val ry = ax * sin(rad) + ay * cos(rad)

            val px = cx + rx * scale
            val py = cy + ry * scale

            val particleSize = (1.2f + p.size * 1.6f) * breathe
            val alpha = (0.3f + p.alpha * 0.5f) * breathe

            // 三层辉光
            drawCircle(Color.White.copy(alpha = alpha * 0.06f), particleSize * 5f, Offset(px, py))
            drawCircle(tint.copy(alpha = alpha * 0.12f), particleSize * 2.5f, Offset(px, py))
            drawCircle(tint.copy(alpha = alpha * 0.7f), particleSize, Offset(px, py))
        }

        // 中心柔光核心
        drawCircle(
            brush = Brush.radialGradient(
                listOf(
                    Color.White.copy(alpha = 0.15f * breathe),
                    tint.copy(alpha = 0.06f * breathe),
                    Color.Transparent
                ),
                center = Offset(cx, cy),
                radius = size.minDimension * 0.06f
            ),
            radius = size.minDimension * 0.06f,
            center = Offset(cx, cy)
        )
    }
}

private data class Particle(
    val size: Float,    // 0..1
    val alpha: Float    // 0..1
) {
    constructor(rng: Random) : this(
        size = 0.2f + rng.nextFloat() * 0.8f,
        alpha = 0.3f + rng.nextFloat() * 0.7f
    )
}

private fun easeInOutCubic(t: Float): Float {
    return if (t < 0.5f) 4f * t * t * t else 1f - (-2f * t + 2f).let { it * it * it } / 2f
}

private fun lerp(a: Float, b: Float, t: Float): Float = a + (b - a) * t

/**
 * 生成某个形态的粒子锚点坐标（归一化 -0.5..0.5）。
 */
private fun buildFormAnchors(formIdx: Int, companion: CompanionInfo, rng: Random): List<Pair<Float, Float>> {
    val count = 180
    return when {
        companion.isNarrative -> buildNarrativeForm(formIdx, count, rng)
        else -> buildSimpleForm(formIdx, count, rng)
    }
}

/** 简单三态循环：云团 → 环 → 放射线 */
private fun buildSimpleForm(idx: Int, count: Int, rng: Random): List<Pair<Float, Float>> {
    return List(count) { i ->
        when (idx) {
            0 -> { // 散点云团
                val a = rng.nextFloat() * PI.toFloat() * 2f
                val r = rng.nextFloat() * 0.4f
                Pair(cos(a) * r, sin(a) * r)
            }
            1 -> { // 双环
                val ring = if (i < count / 2) 0.22f else 0.32f
                val a = (i.toFloat() / (count / 2)) * PI.toFloat() * 2f
                Pair(cos(a) * ring, sin(a) * ring)
            }
            else -> { // 放射星线
                val arm = i % 6
                val along = (i / 6).toFloat() / (count / 6).toFloat()
                val a = arm.toFloat() / 6f * PI.toFloat() * 2f
                Pair(cos(a) * along * 0.4f, sin(a) * along * 0.4f)
            }
        }
    }
}

/** 8 阶段叙事形态（乔布斯 / 芒格） */
private fun buildNarrativeForm(idx: Int, count: Int, rng: Random): List<Pair<Float, Float>> {
    return List(count) { i ->
        when (idx) {
            0 -> { // 初心 — 散点云团，中心密集
                val a = rng.nextFloat() * PI.toFloat() * 2f
                val r = rng.nextFloat().let { it * it * 0.35f }
                Pair(cos(a) * r, sin(a) * r)
            }
            1 -> { // 探索连线 — 节点+连线
                val nodes = 6
                val nodeIdx = i % nodes
                val nAngle = nodeIdx.toFloat() / nodes * PI.toFloat() * 2f
                val dist = 0.15f + (i / nodes).toFloat() / (count / nodes).toFloat() * 0.2f
                Pair(cos(nAngle) * dist, sin(nAngle) * dist)
            }
            2 -> { // 建立/创造 — 苹果（弧+茎）
                val a = rng.nextFloat() * PI.toFloat() * 2f
                val r = 0.1f + rng.nextFloat() * 0.2f
                // 上凹形成咬痕
                val y0 = sin(a) * r
                val adjusted = if (a > PI.toFloat() * 1.4f && a < PI.toFloat() * 1.7f) y0 - 0.06f else y0
                Pair(cos(a) * r, adjusted)
            }
            3 -> { // 交汇 — 双环重叠
                val ring = if (i < count / 2) 0 else 1
                val cx = if (ring == 0) -0.1f else 0.1f
                val a = (i.toFloat() / (count / 2)) * PI.toFloat() * 2f
                Pair(cx + cos(a) * 0.22f, sin(a) * 0.22f)
            }
            4 -> { // 力场 — 同心环+放射
                if (i < count * 2 / 3) {
                    val rings = 4
                    val r = (0.08f + (i % rings) * 0.07f)
                    val a = (i.toFloat() / (count * 2 / 3)) * PI.toFloat() * 2f
                    Pair(cos(a) * r, sin(a) * r)
                } else {
                    val ray = i % 8
                    val along = (i / 8).toFloat() / (count / 24).toFloat()
                    val a = ray.toFloat() / 8f * PI.toFloat() * 2f
                    Pair(cos(a) * along * 0.42f, sin(a) * along * 0.42f)
                }
            }
            5 -> { // 坠落/涅槃 — 凤凰展翅（双弧）
                val upper = i < count / 2
                val a = (if (upper) PI.toFloat() * 1.2f else PI.toFloat() * 1.8f) +
                        rng.nextFloat() * PI.toFloat() * 0.6f
                val r = 0.1f + rng.nextFloat() * 0.25f
                Pair(cos(a) * r, sin(a) * r + if (upper) -0.05f else 0.05f)
            }
            6 -> { // 死亡/终极 — 沙漏
                val upper = i < count / 2
                val a = rng.nextFloat() * PI.toFloat() * 2f
                val r = 0.05f + rng.nextFloat() * 0.22f
                val yOff = if (upper) -0.12f - r * 0.5f else 0.12f + r * 0.5f
                Pair(cos(a) * r * 1.3f, yOff)
            }
            else -> { // 前行/传承 — 分岔路
                val branch = i % 3 // 左/中/右
                val along = (i / 3).toFloat() / (count / 3).toFloat()
                val xOff = when (branch) { 0 -> -0.18f; 1 -> 0f; else -> 0.18f }
                val spread = along * 0.15f * if (branch == 1) 0.5f else 1f
                Pair(xOff * (0.3f + along) + spread * (if (branch == 0) -1f else if (branch == 2) 1f else 0f),
                     -0.35f + along * 0.6f)
            }
        }
    }
}
