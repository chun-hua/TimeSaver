package com.ttime.wanliu.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ttime.wanliu.ui.theme.*

/**
 * 陪伴者选择行 — 水平滚动的卡片列表，每张卡片含粒子预览圆、名字、格言。
 */
@Composable
fun CompanionPicker(
    selectedId: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // "独自专注" 选项
        CompanionPickerCard(
            info = null,
            isSelected = selectedId == "none",
            onClick = { onSelect("none") }
        )

        // 各大师
        AllCompanions.forEach { companion ->
            CompanionPickerCard(
                info = companion,
                isSelected = selectedId == companion.id,
                onClick = { onSelect(companion.id) }
            )
        }
    }
}

@Composable
private fun CompanionPickerCard(
    info: CompanionInfo?,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val borderColor = if (isSelected) PurplePrimary.copy(alpha = 0.9f) else Color.White.copy(alpha = 0.08f)
    val bgColor = if (isSelected) PurplePrimary.copy(alpha = 0.1f) else Color.White.copy(alpha = 0.03f)

    Column(
        modifier = Modifier
            .width(84.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(bgColor)
            .border(1.5.dp, borderColor, RoundedCornerShape(18.dp))
            .clickableWithoutRipple(onClick = onClick)
            .padding(vertical = 13.dp, horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(9.dp)
    ) {
        // 粒子预览圆
        if (info != null) {
            CompanionOrbPreview(info = info, isSelected = isSelected)
        } else {
            // "独自专注" 的灰色圆
            Box(
                modifier = Modifier
                    .size(58.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF0A0A16))
                    .border(1.dp, Color.White.copy(alpha = 0.08f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "◐",
                    color = InkFaint,
                    fontSize = 18.sp
                )
            }
        }

        // 名字
        Text(
            text = info?.name ?: "独自专注",
            style = MaterialTheme.typography.bodySmall.copy(
                fontWeight = FontWeight.Medium,
                fontSize = 12.sp
            ),
            color = if (isSelected) InkWhite else InkSoft,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )

        // 格言
        Text(
            text = info?.quote ?: "保持当前界面",
            style = MaterialTheme.typography.bodySmall.copy(fontSize = 9.sp),
            color = InkGhost,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center,
            modifier = Modifier.widthIn(max = 74.dp)
        )
    }
}

/**
 * 卡片上的粒子预览圆 — 用 Canvas 画几圈光点。
 */
@Composable
private fun CompanionOrbPreview(
    info: CompanionInfo,
    isSelected: Boolean
) {
    val infiniteTransition = rememberInfiniteTransition(label = "orb")
    val rotate by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(8000, easing = LinearEasing), RepeatMode.Restart),
        label = "rot"
    )

    val borderColor = if (isSelected) PurpleLight.copy(alpha = 0.5f) else info.tintColor.copy(alpha = 0.14f)
    val glowColor = if (isSelected) PurpleLight.copy(alpha = 0.22f) else info.tintColor.copy(alpha = 0.08f)

    Box(
        modifier = Modifier
            .size(58.dp)
            .clip(CircleShape)
            .background(
                Brush.radialGradient(
                    listOf(
                        info.tintColor.copy(alpha = 0.16f),
                        info.tintColor.copy(alpha = 0.06f),
                        Color(0xFF05070F)
                    )
                )
            )
            .border(1.dp, borderColor, CircleShape)
    ) {
        androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
            val cx = size.width / 2f
            val cy = size.height / 2f
            val maxR = size.minDimension / 2f - 4f

            // 外环
            drawCircle(
                color = info.tintColor.copy(alpha = 0.12f),
                radius = maxR,
                center = androidx.compose.ui.geometry.Offset(cx, cy),
                style = Stroke(width = 1f)
            )

            // 轨道粒子
            val count = 12
            for (i in 0 until count) {
                val angle = Math.toRadians((rotate + i * 360.0 / count).toDouble()).toFloat()
                val r = maxR * (0.55f + 0.35f * (i % 3).toFloat() / 2f)
                val x = cx + r * kotlin.math.cos(angle)
                val y = cy + r * kotlin.math.sin(angle)
                val particleR = 1.8f + (i % 3) * 0.8f
                drawCircle(
                    color = info.tintColor.copy(alpha = 0.4f + (i % 3) * 0.2f),
                    radius = particleR,
                    center = androidx.compose.ui.geometry.Offset(x, y)
                )
                // 辉光
                drawCircle(
                    color = info.tintColor.copy(alpha = 0.08f),
                    radius = particleR * 3f,
                    center = androidx.compose.ui.geometry.Offset(x, y)
                )
            }

            // 中心光点
            drawCircle(
                color = info.tintColor.copy(alpha = 0.5f),
                radius = 3f,
                center = androidx.compose.ui.geometry.Offset(cx, cy)
            )
            drawCircle(
                color = info.tintColor.copy(alpha = 0.15f),
                radius = 8f,
                center = androidx.compose.ui.geometry.Offset(cx, cy)
            )
        }
    }
}
