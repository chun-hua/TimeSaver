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
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ttime.wanliu.ui.theme.*
import kotlin.math.*
import kotlin.random.Random
import kotlinx.coroutines.isActive

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

// ═══ 原语采样（略，保持不变）═══
private fun sampleEllipse(cx: Float, cy: Float, rx: Float, ry: Float, rng: Random) = run {
    val u = sqrt(rng.nextFloat()); val a = rng.nextFloat() * PI.toFloat() * 2f
    Pair(cx + cos(a) * rx * u, cy + sin(a) * ry * u)
}
private fun sampleRing(cx: Float, cy: Float, rx: Float, ry: Float, t: Float, rng: Random) = run {
    val a = rng.nextFloat() * PI.toFloat() * 2f; val rr = 1f + (rng.nextFloat() - 0.5f) * t
    Pair(cx + cos(a) * rx * rr, cy + sin(a) * ry * rr)
}
private fun sampleArc(cx: Float, cy: Float, rx: Float, ry: Float, a0: Float, a1: Float, t: Float, rng: Random) = run {
    val f = rng.nextFloat(); val ang = a0 + (a1 - a0) * f; val rr = 1f + (rng.nextFloat() - 0.5f) * t
    Pair(cx + cos(ang) * rx * rr, cy + sin(ang) * ry * rr)
}
private fun sampleScatter(cx: Float, cy: Float, rx: Float, ry: Float, rng: Random) = run {
    val a = rng.nextFloat() * PI.toFloat() * 2f; val u = 0.1f + rng.nextFloat() * 0.9f
    Pair(cx + cos(a) * rx * u, cy + sin(a) * ry * u)
}
private fun sampleLine(x1: Float, y1: Float, x2: Float, y2: Float, w: Float, rng: Random) = run {
    val t = rng.nextFloat()
    Pair(x1 + (x2 - x1) * t + (rng.nextFloat() - 0.5f) * w, y1 + (y2 - y1) * t + (rng.nextFloat() - 0.5f) * w)
}

private fun buildFormAnchors(companion: CompanionInfo, idx: Int, count: Int, rng: Random): List<Pair<Float, Float>> =
    if (stagesFor(companion) != null) buildNarrative(companion.id, idx, count, rng)
    else buildCyclic(companion.id, idx, count, rng)

private fun buildNarrative(id: String, idx: Int, count: Int, rng: Random) = List(count) {
    when (id) {
        "jobs" -> jobsAnchor(idx, rng)
        "munger" -> mungerAnchor(idx, rng)
        else -> sampleScatter(0.5f, 0.5f, 0.35f, 0.35f, rng)
    }
}
private fun buildCyclic(id: String, idx: Int, count: Int, rng: Random) = List(count) {
    when (id) {
        "einstein" -> einsteinAnchor(idx, rng); "davinci" -> davinciAnchor(idx, rng)
        "feynman" -> feynmanAnchor(idx, rng); "taleb" -> talebAnchor(idx, rng)
        "musk" -> muskAnchor(idx, rng); "naval" -> navalAnchor(idx, rng)
        "pg" -> pgAnchor(idx, rng); "zhangyiming" -> zhangyimingAnchor(idx, rng)
        "sunyuchen" -> sunyuchenAnchor(idx, rng)
        else -> sampleScatter(0.5f, 0.5f, 0.35f, 0.35f, rng)
    }
}

private fun jobsAnchor(idx: Int, rng: Random) = when (idx) {
    0 -> sampleScatter(0.5f, 0.5f, 0.32f, 0.30f, rng)
    1 -> { val n = rng.nextInt(6); val cx = listOf(0.28f,0.62f,0.44f,0.72f,0.20f,0.55f)[n]; val cy = listOf(0.32f,0.24f,0.58f,0.55f,0.65f,0.38f)[n]; if (rng.nextFloat()<0.5f) Pair(cx+(rng.nextFloat()-0.5f)*0.08f, cy+(rng.nextFloat()-0.5f)*0.07f) else sampleScatter(0.5f,0.5f,0.25f,0.25f,rng) }
    2 -> if (rng.nextFloat()<0.7f) sampleArc(0.5f,0.55f,0.23f,0.27f,4.7f,9.5f,0.06f,rng) else sampleLine(0.5f,0.305f,0.5f,0.22f,0.01f,rng)
    3 -> if (rng.nextFloat()<0.5f) sampleRing(0.40f,0.50f,0.20f,0.20f,0.03f,rng) else sampleRing(0.60f,0.50f,0.20f,0.20f,0.03f,rng)
    4 -> if (rng.nextFloat()<0.6f) { val r=0.10f+rng.nextInt(4)*0.09f; sampleRing(0.5f,0.5f,r,r,0.014f,rng) } else { val ray=rng.nextInt(8); val a=ray.toFloat()/8f*PI.toFloat()*2f; sampleLine(0.5f,0.5f,0.5f+cos(a)*0.42f,0.5f+sin(a)*0.42f,0.005f,rng) }
    5 -> if (rng.nextFloat()<0.5f) sampleArc(0.5f,0.55f,0.30f,0.20f,3.2f,6.1f,0.05f,rng) else sampleArc(0.5f,0.55f,0.30f,0.20f,0.0f,3.1f,0.05f,rng)
    6 -> if (rng.nextFloat()<0.5f) sampleEllipse(0.5f,0.38f,0.14f,0.16f,rng) else sampleEllipse(0.5f,0.64f,0.14f,0.16f,rng)
    7 -> { val b=rng.nextInt(3); val xt=listOf(0.28f,0.5f,0.68f)[b]; val yt=listOf(0.18f,0.08f,0.14f)[b]; sampleLine(0.5f,0.78f,xt,yt,0.015f,rng) }
    else -> sampleScatter(0.5f,0.5f,0.3f,0.3f,rng)
}
private fun mungerAnchor(idx: Int, rng: Random) = when (idx) {
    0 -> sampleScatter(0.5f,0.5f,0.32f,0.30f,rng)
    1 -> { val gx=listOf(0.32f,0.44f,0.56f,0.68f)[rng.nextInt(4)]; val gy=listOf(0.30f,0.42f,0.54f,0.66f)[rng.nextInt(4)]; Pair(gx+(rng.nextFloat()-0.5f)*0.02f, gy+(rng.nextFloat()-0.5f)*0.02f) }
    2 -> if (rng.nextFloat()<0.5f) sampleArc(0.38f,0.50f,0.18f,0.16f,4.2f,5.5f,0.04f,rng) else sampleArc(0.62f,0.50f,0.18f,0.16f,0.8f,2.1f,0.04f,rng)
    3 -> sampleEllipse(0.50f,0.44f,0.20f,0.18f,rng)
    4 -> { val r=0.10f+rng.nextInt(3)*0.10f; sampleRing(0.5f,0.5f,r,r,0.025f,rng) }
    5 -> if (rng.nextFloat()<0.5f) sampleEllipse(0.5f,0.38f,0.14f,0.16f,rng) else sampleEllipse(0.5f,0.64f,0.14f,0.16f,rng)
    6 -> sampleEllipse(0.50f,0.50f,0.26f,0.26f,rng)
    7 -> sampleLine(0.18f,0.55f,0.82f,0.55f,0.015f,rng)
    else -> sampleScatter(0.5f,0.5f,0.3f,0.3f,rng)
}
private fun einsteinAnchor(idx: Int, rng: Random) = when (idx) {
    0 -> { val r=0.06f+rng.nextInt(5)*0.06f; sampleRing(0.5f,0.5f,r,r,0.018f,rng) }
    1 -> if (rng.nextFloat()<0.3f) Pair(0.5f+(rng.nextFloat()-0.5f)*0.5f,0.5f+(rng.nextFloat()-0.5f)*0.3f) else sampleScatter(0.5f,0.5f,0.15f,0.15f,rng)
    2 -> { val ring=rng.nextInt(3); val rot=listOf(0f,1.05f,-1.05f)[ring]; val c=cos(rot); val s=sin(rot); val a=rng.nextFloat()*PI.toFloat()*2f; val rx=cos(a)*0.30f; val ry=sin(a)*0.10f; Pair(0.5f+rx*c-ry*s,0.5f+rx*s+ry*c) }
    else -> sampleScatter(0.5f,0.5f,0.3f,0.3f,rng)
}
private fun davinciAnchor(idx: Int, rng: Random) = when (idx) {
    0 -> if (rng.nextFloat()<0.5f) sampleArc(0.5f,0.48f,0.30f,0.18f,3.3f,6.0f,0.06f,rng) else sampleArc(0.5f,0.48f,0.30f,0.18f,0.0f,3.0f,0.06f,rng)
    1 -> if (rng.nextFloat()<0.4f) sampleRing(0.5f,0.52f,0.32f,0.32f,0.03f,rng) else sampleLine(0.20f,0.22f+rng.nextInt(2)*0.6f,0.80f,0.22f+rng.nextInt(2)*0.6f,0.01f,rng)
    2 -> { val a=rng.nextFloat()*PI.toFloat()*4f; val r=0.02f+a*0.04f; Pair(0.5f+cos(a)*r,0.5f+sin(a)*r) }
    else -> sampleScatter(0.5f,0.5f,0.3f,0.3f,rng)
}
private fun feynmanAnchor(idx: Int, rng: Random) = when (idx) {
    0 -> { val ring=rng.nextInt(3); val rot=listOf(0.6f,-1.0f,2.2f)[ring]; val c=cos(rot); val s=sin(rot); val a=rng.nextFloat()*PI.toFloat()*2f; val rr=0.20f+ring*0.05f; val rx=cos(a)*rr; val ry=sin(a)*0.10f; Pair(0.5f+rx*c-ry*s,0.5f+rx*s+ry*c) }
    1 -> if (rng.nextFloat()<0.5f) sampleLine(0.20f,0.55f,0.80f,0.55f,0.006f,rng) else sampleArc(0.5f,0.55f,0.12f,0.08f,4.0f,5.6f,0.018f,rng)
    2 -> sampleArc(0.5f,0.38f,0.14f,0.12f,1.5f,5.8f,0.04f,rng)
    else -> sampleScatter(0.5f,0.5f,0.3f,0.3f,rng)
}
private fun talebAnchor(idx: Int, rng: Random) = when (idx) {
    0 -> if (rng.nextFloat()<0.5f) sampleArc(0.5f,0.52f,0.24f,0.14f,4.0f,5.5f,0.04f,rng) else sampleArc(0.5f,0.52f,0.24f,0.14f,0.8f,2.3f,0.04f,rng)
    1 -> if (rng.nextFloat()<0.5f) sampleEllipse(0.20f,0.50f,0.06f,0.06f,rng) else sampleEllipse(0.80f,0.50f,0.06f,0.06f,rng)
    2 -> sampleArc(0.5f,0.34f,0.05f,0.15f,3.8f,5.6f,0.025f,rng)
    else -> sampleScatter(0.5f,0.5f,0.3f,0.3f,rng)
}
private fun muskAnchor(idx: Int, rng: Random) = when (idx) {
    0 -> if (rng.nextFloat()<0.5f) sampleEllipse(0.5f,0.45f,0.05f,0.22f,rng) else sampleLine(0.5f,0.58f,0.32f+rng.nextInt(2)*0.36f,0.74f,0.008f,rng)
    1 -> { val r=0.12f+rng.nextInt(3)*0.10f; sampleRing(0.5f,0.5f,r,r,0.03f,rng) }
    2 -> if (rng.nextFloat()<0.5f) sampleLine(0.22f,0.26f,0.78f,0.74f,0.014f,rng) else sampleLine(0.78f,0.26f,0.22f,0.74f,0.014f,rng)
    else -> sampleScatter(0.5f,0.5f,0.3f,0.3f,rng)
}
private fun navalAnchor(idx: Int, rng: Random) = when (idx) {
    0 -> if (rng.nextFloat()<0.4f) sampleLine(0.5f,0.20f,0.5f,0.50f,0.008f,rng) else sampleEllipse(0.28f+rng.nextInt(2)*0.44f,0.62f,0.04f,0.04f,rng)
    1 -> if (rng.nextFloat()<0.6f) sampleEllipse(0.5f,0.44f,0.22f,0.20f,rng) else sampleArc(0.5f,0.44f,0.22f,0.20f,0f,6.283f,0.02f,rng)
    2 -> sampleLine(0.5f,0.74f,0.5f,0.26f,0.014f,rng)
    else -> sampleScatter(0.5f,0.5f,0.3f,0.3f,rng)
}
private fun pgAnchor(idx: Int, rng: Random) = when (idx) {
    0 -> if (rng.nextFloat()<0.6f) sampleLine(0.46f,0.22f,0.46f,0.78f,0.01f,rng) else Pair(0.49f+rng.nextFloat()*0.04f,0.22f+rng.nextFloat()*0.04f)
    1 -> { val step=rng.nextInt(3); val y=listOf(0.66f,0.50f,0.34f)[step]; val x=listOf(0.32f,0.48f,0.64f)[step]; sampleLine(x-0.08f,y,x+0.08f,y,0.01f,rng) }
    2 -> if (rng.nextInt(2)==0) sampleLine(0.5f,0.28f,0.30f,0.50f,0.008f,rng) else sampleLine(0.5f,0.28f,0.70f,0.50f,0.008f,rng)
    else -> sampleScatter(0.5f,0.5f,0.3f,0.3f,rng)
}
private fun zhangyimingAnchor(idx: Int, rng: Random) = when (idx) {
    0 -> { val n=rng.nextInt(5); val nx=listOf(0.50f,0.32f,0.68f,0.38f,0.62f)[n]; val ny=listOf(0.30f,0.50f,0.50f,0.68f,0.68f)[n]; Pair(nx+(rng.nextFloat()-0.5f)*0.03f,ny+(rng.nextFloat()-0.5f)*0.03f) }
    1 -> sampleRing(0.5f,0.5f,0.24f,0.24f,0.025f,rng)
    2 -> if (rng.nextFloat()<0.6f) sampleRing(0.5f,0.5f,0.26f,0.26f,0.02f,rng) else sampleArc(0.5f,0.5f,0.26f,0.26f,0.8f,2.3f,0.015f,rng)
    else -> sampleScatter(0.5f,0.5f,0.3f,0.3f,rng)
}
private fun sunyuchenAnchor(idx: Int, rng: Random) = when (idx) {
    0 -> sampleLine(0.44f+rng.nextInt(2)*0.12f,0.40f,0.44f+rng.nextInt(2)*0.12f,0.68f,0.012f,rng)
    1 -> { val r=if(rng.nextFloat()<0.5f) 0.30f else 0.18f; sampleRing(0.5f,0.5f,r,r,0.04f,rng) }
    2 -> sampleLine(0.5f,0.72f,0.4f+rng.nextFloat()*0.2f,0.20f+rng.nextFloat()*0.2f,0.01f,rng)
    else -> sampleScatter(0.5f,0.5f,0.3f,0.3f,rng)
}

// ═══════════════════════════════════════
// CompanionStage — 纵向 Column 布局
// ═══════════════════════════════════════
@Composable
fun CompanionStage(
    companion: CompanionInfo,
    modifier: Modifier = Modifier
) {
    val stages = stagesFor(companion)
    val stageCount = if (stages != null) 8 else 3

    var formIndex by remember { mutableIntStateOf(0) }
    val morphAnim = remember { Animatable(0f) }

    LaunchedEffect(Unit) {
        while (isActive) {
            morphAnim.snapTo(0f)
            morphAnim.animateTo(1f, tween(6000, easing = EaseInOutCubic))
            formIndex = (formIndex + 1) % stageCount
        }
    }

    val infiniteTransition = rememberInfiniteTransition(label = "aux")
    val breathe by infiniteTransition.animateFloat(0.7f, 1f,
        infiniteRepeatable(tween(3000, easing = EaseInOutCubic), RepeatMode.Reverse), "breathe")

    val particleCount = 200
    val rng = remember { Random(companion.id.hashCode()) }
    val particles = remember { List(particleCount) { Pair(rng.nextFloat(), rng.nextFloat()) } }
    val currentTint = if (stages != null) { val s = stages[formIndex]; Color(s.tintRed, s.tintGreen, s.tintBlue) } else companion.tintColor
    val currentForm = remember(formIndex) { buildFormAnchors(companion, formIndex, particleCount, Random(formIndex * 31 + companion.id.hashCode())) }
    val nextForm = remember((formIndex + 1) % stageCount) { buildFormAnchors(companion, (formIndex + 1) % stageCount, particleCount, Random((formIndex + 1) * 31 + companion.id.hashCode())) }

    val capName = if (stages != null) "${companion.name} · ${stages[formIndex].name}" else companion.name
    val capQuote = if (stages != null) stages[formIndex].chinese else companion.quote

    // ── 纵向 Column：圆点 → 画布 → 文字 ──
    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 阶段圆点（仅 8 阶段叙事）
        if (stageCount == 8) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(5.dp),
                modifier = Modifier.padding(top = 12.dp, bottom = 6.dp)
            ) {
                for (i in 0 until 8) {
                    val isCurrent = i == formIndex
                    val isPast = i < formIndex
                    Box(modifier = Modifier
                        .size(if (isCurrent) 7.dp else 5.dp)
                        .clip(CircleShape)
                        .background(when {
                            isCurrent -> Color(0xFFF0E1C3).copy(alpha = 0.9f)
                            isPast -> Color(0xFFB4AA9B).copy(alpha = 0.08f)
                            else -> Color(0xFFB4AA9B).copy(alpha = 0.2f)
                        })
                    )
                }
            }
        }

        // 粒子画布（占据剩余高度）
        Canvas(modifier = Modifier.weight(1f).fillMaxWidth()) {
            val cx = size.width / 2f; val cy = size.height / 2f
            val scale = min(size.width, size.height) * 0.44f

            drawCircle(Brush.radialGradient(
                listOf(currentTint.copy(alpha = 0.12f * breathe), Color.Transparent),
                center = Offset(cx, cy), radius = size.minDimension * 0.5f
            ), radius = size.minDimension * 0.5f, center = Offset(cx, cy))

            val easedP = easeCubic(morphAnim.value)
            for (i in particles.indices) {
                val from = currentForm[i]; val to = nextForm[i]
                val ax = from.first + (to.first - from.first) * easedP
                val ay = from.second + (to.second - from.second) * easedP
                val px = cx + ax * scale; val py = cy + ay * scale
                val sz = (1.5f + particles[i].first * 2.2f) * breathe
                val alpha = (0.4f + particles[i].second * 0.6f) * breathe
                drawCircle(Color.White.copy(alpha = alpha * 0.10f), sz * 5.5f, Offset(px, py))
                drawCircle(currentTint.copy(alpha = alpha * 0.18f), sz * 2.8f, Offset(px, py))
                drawCircle(currentTint.copy(alpha = alpha * 0.80f), sz, Offset(px, py))
            }
            drawCircle(Brush.radialGradient(
                listOf(Color.White.copy(alpha = 0.22f * breathe), currentTint.copy(alpha = 0.10f * breathe), Color.Transparent),
                center = Offset(cx, cy), radius = size.minDimension * 0.08f
            ), radius = size.minDimension * 0.08f, center = Offset(cx, cy))
        }

        // ── 名字 + 金句 ──
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(bottom = 8.dp, top = 4.dp)
        ) {
            Text(
                text = "$capName  正在陪你专注",
                color = currentTint.copy(alpha = 0.92f),
                fontWeight = FontWeight.SemiBold,
                fontSize = 13.sp,
                textAlign = TextAlign.Center
            )
            Text(
                text = capQuote,
                color = Color(0xFFD6E8FF).copy(alpha = 0.40f),
                fontStyle = FontStyle.Italic,
                fontSize = 12.sp,
                lineHeight = 18.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 3.dp)
            )
        }
    }
}

private fun easeCubic(t: Float): Float =
    if (t < 0.5f) 4f * t * t * t else 1f - (-2f * t + 2f).let { it * it * it } / 2f
