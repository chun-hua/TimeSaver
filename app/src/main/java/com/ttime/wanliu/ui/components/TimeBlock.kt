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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
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
    modifier: Modifier = Modifier
) {
    // Breathing card animation — box shadow glow pulses
    val infiniteTransition = rememberInfiniteTransition(label = "breatheCard")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.12f,
        targetValue = 0.28f,
        animationSpec = infiniteRepeatable(
            animation = tween(2500, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glowAlpha"
    )

    val breatheAlpha by infiniteTransition.animateFloat(
        initialValue = 0.55f,
        targetValue = 0.9f,
        animationSpec = infiniteRepeatable(
            animation = tween(2250, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        ),
        label = "breathe"
    )

    val isNoteStyle = style == "note"
    val isMinimal = style == "minimal"

    // Glass style — frosted glass with breathing glow
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
                elevation = 16.dp,
                shape = RoundedCornerShape(28.dp),
                ambientColor = PurplePrimary.copy(alpha = glowAlpha),
                spotColor = PurplePrimary.copy(alpha = glowAlpha * 0.7f)
            )
            .clip(RoundedCornerShape(28.dp))
            .background(Color(0x9E080814))
            .border(1.dp, Color.White.copy(alpha = 0.09f), RoundedCornerShape(28.dp))
    }

    val textColor = if (isNoteStyle) Color(0xFF1A1A2E) else InkWhite
    val faintColor = if (isNoteStyle) Color(0xFF5C5340) else InkFaint
    val softColor = if (isNoteStyle) Color(0xFF3A3328) else InkSoft
    val ghostColor = if (isNoteStyle) Color(0xFF8A7F6B) else InkGhost
    val progressTrack = if (isNoteStyle) Color(0xFFD4C388) else Color.White.copy(alpha = 0.1f)
    val progressFill = if (isNoteStyle)
        Brush.horizontalGradient(listOf(Color(0xFF8B6914), Color(0xFFC4A44A)))
    else
        Brush.horizontalGradient(listOf(PurplePrimary, PurpleLight))

    val iconBg = if (isNoteStyle) Color(0xFFD4C388).copy(alpha = 0.2f) else PurplePrimary.copy(alpha = 0.2f)
    val iconTint = if (isNoteStyle) Color(0xFF8B6914) else PurpleLight

    Box(
        modifier = modifier.then(blockModifier),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 32.dp, vertical = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // ═══ Top accent glow line ═══
            if (!isMinimal && !isNoteStyle) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.55f)
                        .height(1.dp)
                        .background(
                            Brush.horizontalGradient(
                                listOf(
                                    Color.Transparent,
                                    PurpleLight.copy(alpha = 0.45f),
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
                            tint = iconTint,
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
                        color = faintColor
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

            // ═══ Clock ═══
            Text(
                text = timeText,
                color = textColor,
                style = ClockTextStyle
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
