package com.ttime.wanliu.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ttime.wanliu.ui.theme.*

data class StyleInfo(
    val id: String,
    val label: String,
    val previewText: String,
    val previewColor: Color,
    val previewBg: Color = Color.Transparent
)

val TimeWindowStyles = listOf(
    StyleInfo("minimal", "极简", "24:00", PurpleLight),
    StyleInfo("glass", "玻璃", "24:00", InkWhite, Color.White.copy(alpha = 0.07f)),
    StyleInfo("note", "便利贴", "24:00", Color(0xFF1A1A2E), Color(0xFFFEF3C7))
)

@Composable
fun StyleCard(
    style: StyleInfo,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val borderColor = if (isSelected) PurplePrimary.copy(alpha = 0.82f) else Color.White.copy(alpha = 0.08f)
    val bgColor = if (isSelected) PurplePrimary.copy(alpha = 0.13f) else Color.White.copy(alpha = 0.03f)
    val borderWidth = if (isSelected) 1.5.dp else 1.5.dp

    Column(
        modifier = modifier
            .height(74.dp)
            .clip(RoundedCornerShape(13.dp))
            .background(bgColor)
            .border(borderWidth, borderColor, RoundedCornerShape(13.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp, horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        if (style.previewBg != Color.Transparent) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(style.previewBg)
                    .padding(horizontal = 9.dp, vertical = 2.dp)
            ) {
                Text(
                    text = style.previewText,
                    color = style.previewColor,
                    fontSize = 15.sp,
                    lineHeight = 18.sp,
                    fontWeight = FontWeight.Medium,
                    fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                )
            }
        } else {
            Text(
                text = style.previewText,
                color = style.previewColor,
                fontSize = 15.sp,
                lineHeight = 18.sp,
                fontWeight = FontWeight.W300,
                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
            )
        }
        Spacer(modifier = Modifier.height(7.dp))
        Text(
            text = style.label,
            style = MaterialTheme.typography.bodySmall,
            color = InkGhost,
        )
    }
}
