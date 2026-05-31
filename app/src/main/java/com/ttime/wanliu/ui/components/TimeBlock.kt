package com.ttime.wanliu.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
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
    val infiniteTransition = rememberInfiniteTransition(label = "float")
    val floatOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = -8f,
        animationSpec = infiniteRepeatable(
            animation = tween(3500, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        ),
        label = "floatY"
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

    val blockModifier = when (style) {
        "glass" -> Modifier
            .shadow(20.dp, RoundedCornerShape(28.dp), ambientColor = PurplePrimary.copy(alpha = 0.15f))
            .clip(RoundedCornerShape(28.dp))
            .background(Color(0x9E080814))
            .border(1.dp, Color.White.copy(alpha = 0.09f), RoundedCornerShape(28.dp))

        "minimal" -> Modifier
            .shadow(4.dp, RoundedCornerShape(24.dp))
            .clip(RoundedCornerShape(24.dp))
            .background(Color(0x99000000))
            .border(0.5.dp, Color.White.copy(alpha = 0.06f), RoundedCornerShape(24.dp))

        "note" -> Modifier
            .shadow(8.dp, RoundedCornerShape(12.dp))
            .clip(RoundedCornerShape(12.dp))
            .background(Brush.verticalGradient(listOf(Color(0xFFFEF3C7), Color(0xFFFDE68A))))
            .border(0.5.dp, Color(0xFFD4A853), RoundedCornerShape(12.dp))

        else -> Modifier
            .clip(RoundedCornerShape(28.dp))
            .background(Color(0x9E080814))
            .border(1.dp, Color.White.copy(alpha = 0.09f), RoundedCornerShape(28.dp))
    }

    val isNoteStyle = style == "note"
    val textColor = if (isNoteStyle) Color(0xFF1A1A2E) else InkWhite
    val faintColor = if (isNoteStyle) Color(0xFF5C5340) else InkFaint
    val softColor = if (isNoteStyle) Color(0xFF3A3328) else InkSoft
    val ghostColor = if (isNoteStyle) Color(0xFF8A7F6B) else InkGhost
    val progressTrack = if (isNoteStyle) Color(0xFFD4C388) else Color.White.copy(alpha = 0.1f)
    val progressFill = if (isNoteStyle)
        Brush.horizontalGradient(listOf(Color(0xFF8B6914), Color(0xFFC4A44A)))
    else
        Brush.horizontalGradient(listOf(PurplePrimary, PurpleLight))

    Box(
        modifier = modifier
            .offset(y = floatOffset.dp)
            .then(blockModifier),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 52.dp, vertical = 44.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "当前任务",
                style = SectionLabelStyle.copy(fontSize = 10.sp, lineHeight = 14.sp),
                color = faintColor
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = taskName,
                style = MaterialTheme.typography.titleMedium,
                color = textColor
            )
            Spacer(modifier = Modifier.height(28.dp))
            Text(
                text = timeText,
                color = textColor,
                style = ClockTextStyle
            )
            Spacer(modifier = Modifier.height(28.dp))
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
            Spacer(modifier = Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(progressTrack)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(progressPercent / 100f)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(2.dp))
                        .background(progressFill)
                )
            }
            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = gentleMessage,
                style = MaterialTheme.typography.bodyMedium,
                color = softColor.copy(alpha = breatheAlpha),
                textAlign = TextAlign.Center,
            )
        }
    }
}
