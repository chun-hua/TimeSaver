package com.ttime.wanliu.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ttime.wanliu.ui.theme.*

data class DurationOption(
    val minutes: Int,
    val label: String
)

val DurationOptions = listOf(
    DurationOption(25, "25分钟"),
    DurationOption(50, "50分钟"),
    DurationOption(90, "90分钟"),
    DurationOption(0, "自定义")
)

@Composable
fun DurationPill(
    option: DurationOption,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val borderColor = if (isSelected) PurplePrimary.copy(alpha = 0.86f) else Color.White.copy(alpha = 0.10f)
    val bgColor = if (isSelected) PurplePrimary.copy(alpha = 0.20f) else Color.White.copy(alpha = 0.035f)
    val textColor = if (isSelected) PurpleGlow else InkFaint.copy(alpha = 0.78f)

    Box(
        modifier = modifier
            .height(58.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor)
            .border(1.5.dp, borderColor, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = option.label,
            style = ControlTextStyle.copy(
                fontSize = 13.sp,
                lineHeight = 16.sp
            ),
            color = textColor,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.Center,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            softWrap = false
        )
    }
}
