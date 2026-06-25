package com.ttime.wanliu.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ttime.wanliu.ui.theme.*

@Composable
fun TimeBlock(
    taskName: String,
    timeText: String,
    progressPercent: Float,
    gentleMessage: String,
    style: String = "glass",
    landscape: Boolean = false,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "breatheCard")

    // ── 三层呼吸动画 ──

    // 1. 卡片整体缩放：慢速轻呼吸，避免明显跳动
    val cardScale by infiniteTransition.animateFloat(
        initialValue = 0.998f,
        targetValue = 1.006f,
        animationSpec = infiniteRepeatable(
            animation = tween(6800, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        ),
        label = "cardScale"
    )

    // 2. 外圈辉光强度：低幅度慢明暗变化
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.10f,
        targetValue = 0.20f,
        animationSpec = infiniteRepeatable(
            animation = tween(7200, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glowAlpha"
    )

    // 3. 边框 + accent 线辉光
    val borderGlow by infiniteTransition.animateFloat(
        initialValue = 0.06f,
        targetValue = 0.13f,
        animationSpec = infiniteRepeatable(
            animation = tween(6200, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        ),
        label = "borderGlow"
    )

    // 4. 鼓励语淡入淡出
    val breatheAlpha by infiniteTransition.animateFloat(
        initialValue = 0.58f,
        targetValue = 0.84f,
        animationSpec = infiniteRepeatable(
            animation = tween(5600, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        ),
        label = "breathe"
    )

    // 5. accent 线宽度呼吸
    val accentWidth by infiniteTransition.animateFloat(
        initialValue = 0.46f,
        targetValue = 0.58f,
        animationSpec = infiniteRepeatable(
            animation = tween(7000, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        ),
        label = "accentW"
    )

    val isNoteStyle = style == "note"
    val isMinimal = style == "minimal"

    val blockModifier = when {
        isMinimal -> Modifier
            .clip(RoundedCornerShape(24.dp))
            .background(Color.Transparent)
            .border(0.dp, Color.Transparent, RoundedCornerShape(24.dp))

        isNoteStyle -> Modifier
            .clip(RoundedCornerShape(16.dp))
            .background(Brush.verticalGradient(listOf(Color(0xFFFEF3C7), Color(0xFFFDE68A))))
            .border(0.5.dp, Color(0xFFD4A853), RoundedCornerShape(16.dp))

        else -> Modifier
            .shadow(
                elevation = 30.dp,
                shape = RoundedCornerShape(32.dp),
                ambientColor = PurplePrimary.copy(alpha = glowAlpha * 0.88f),
                spotColor = PurpleLight.copy(alpha = glowAlpha * 0.62f)
            )
            .clip(RoundedCornerShape(32.dp))
            .background(Color(0x72070A16))
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color.White.copy(alpha = 0.105f + borderGlow * 0.22f),
                        Color.White.copy(alpha = 0.020f),
                        Color.Black.copy(alpha = 0.12f)
                    )
                )
            )
            .border(1.dp, Color.White.copy(alpha = 0.12f + borderGlow), RoundedCornerShape(32.dp))
    }

    val textColor = if (isNoteStyle) Color(0xFF1A1A2E) else InkWhite
    val faintColor = if (isNoteStyle) Color(0xFF5C5340) else InkFaint
    val softColor = if (isNoteStyle) Color(0xFF3A3328) else InkSoft
    val progressTrack = if (isNoteStyle) Color(0xFFD4C388) else Color.White.copy(alpha = 0.12f + borderGlow * 0.24f)
    val progressFill = if (isNoteStyle)
        Brush.horizontalGradient(listOf(Color(0xFF8B6914), Color(0xFFC4A44A)))
    else
        Brush.horizontalGradient(listOf(PurplePrimary, PurpleLight, Color(0xFFE9D5FF)))
    val iconBg = if (isNoteStyle) Color(0xFFD4C388).copy(alpha = 0.2f) else PurplePrimary.copy(alpha = 0.18f + borderGlow * 0.8f)
    val iconTint = if (isNoteStyle) Color(0xFF8B6914) else PurpleLight

    Box(
        modifier = modifier
            .widthIn(max = if (landscape) 420.dp else 334.dp)
            .fillMaxWidth()
            .scale(cardScale)
            .then(blockModifier),
        contentAlignment = Alignment.Center
    ) {
        if (!isMinimal && !isNoteStyle) {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                PurpleLight.copy(alpha = 0.16f + glowAlpha * 0.18f),
                                PurplePrimary.copy(alpha = 0.045f),
                                Color.Transparent
                            ),
                            center = Offset(115f, 0f),
                            radius = 430f
                        )
                    )
            )
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .padding(1.dp)
                    .border(
                        width = 0.6.dp,
                        color = Color.White.copy(alpha = 0.08f + borderGlow * 0.36f),
                        shape = RoundedCornerShape(31.dp)
                    )
            )
        }
        Column(
            modifier = Modifier.padding(horizontal = 32.dp, vertical = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // ═══ Top accent glow line ═══
            if (!isMinimal && !isNoteStyle) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(accentWidth)
                        .height(1.dp)
                        .background(
                            Brush.horizontalGradient(
                                listOf(
                                    Color.Transparent,
                                    PurpleLight.copy(alpha = 0.36f + borderGlow * 2.2f),
                                    Color.White.copy(alpha = 0.38f + glowAlpha * 0.32f),
                                    PurplePrimary.copy(alpha = 0.22f + borderGlow),
                                    Color.Transparent
                                )
                            )
                        )
                )
                Spacer(modifier = Modifier.height(14.dp))
            }

            // ═══ Task row: icon + task name ═══
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                if (!isMinimal) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(iconBg),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.AutoAwesome,
                            contentDescription = null,
                            tint = iconTint.copy(alpha = 0.7f + borderGlow * 1.5f),
                            modifier = Modifier.size(15.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                }

                Column(
                    modifier = Modifier.weight(1f, fill = false),
                    horizontalAlignment = if (isMinimal) Alignment.CenterHorizontally else Alignment.Start
                ) {
                    Text(
                        text = "当前专注",
                        style = MaterialTheme.typography.bodySmall.copy(
                            fontSize = 9.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 0.8.sp
                        ),
                        color = faintColor.copy(alpha = 0.7f + borderGlow)
                    )
                    Text(
                        text = taskName,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Medium
                        ),
                        color = textColor,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Spacer(modifier = Modifier.height(22.dp))

            // ═══ Clock ═══（横屏字号略小，对应原型 74px→64px）
            Text(
                text = timeText,
                color = textColor,
                style = if (landscape) ClockTextStyle.copy(fontSize = 60.sp, lineHeight = 66.sp) else ClockTextStyle
            )

            Spacer(modifier = Modifier.height(26.dp))

            // ═══ Progress ═══
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = "专注进度", style = MaterialTheme.typography.bodySmall, color = faintColor)
                Text(
                    text = "${progressPercent.toInt()}%",
                    style = MaterialTheme.typography.bodySmall,
                    color = faintColor
                )
            }
            Spacer(modifier = Modifier.height(9.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(4.dp)
                    .clip(RoundedCornerShape(3.dp))
                    .background(progressTrack)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(progressPercent / 100f)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(3.dp))
                        .background(progressFill)
                )
            }
            Spacer(modifier = Modifier.height(22.dp))

            // ═══ Gentle message ═══
            Text(
                text = gentleMessage,
                style = MaterialTheme.typography.bodyMedium,
                color = softColor.copy(alpha = breatheAlpha),
                textAlign = TextAlign.Center,
            )
        }
    }
}
