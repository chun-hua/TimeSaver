package com.ttime.wanliu.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material.icons.filled.DesktopWindows
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Nature
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import androidx.compose.ui.platform.LocalContext
import com.ttime.wanliu.ui.theme.*

data class ThemeInfo(
    val id: String,
    val label: String,
    val icon: ImageVector,
    val bgColor: Color
)

val BackgroundThemes = listOf(
    ThemeInfo("rain", "雨夜", Icons.Filled.Cloud, Color(0xFF1A1A3E)),
    ThemeInfo("library", "图书馆", Icons.Filled.MenuBook, Color(0xFF2D1F1A)),
    ThemeInfo("forest", "森林", Icons.Filled.Nature, Color(0xFF1A2E1A)),
    ThemeInfo("cyber", "赛博桌面", Icons.Filled.DesktopWindows, Color(0xFF1A1A2E))
)

@Composable
fun ThemeCard(
    theme: ThemeInfo,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val borderColor = if (isSelected) PurplePrimary.copy(alpha = 0.95f) else Color.Transparent
    val borderWidth = if (isSelected) 1.5.dp else 0.dp

    Box(
        modifier = modifier
            .height(76.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(theme.bgColor)
            .border(borderWidth, borderColor, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        // 真实照片缩略图（对应原型的 .tc-img）
        AsyncImage(
            model = ImageRequest.Builder(LocalContext.current)
                .data(themeImageUrl(theme.id, full = false))
                .crossfade(true)
                .build(),
            contentDescription = theme.label,
            contentScale = ContentScale.Crop,
            modifier = Modifier.matchParentSize()
        )
        // 暗化层，保证图标文字清晰（对应原型的 .tc-dim）
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color.Black.copy(alpha = 0.20f),
                            Color.Black.copy(alpha = 0.58f)
                        )
                    )
                )
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = theme.icon,
                contentDescription = theme.label,
                tint = Color.White.copy(alpha = 0.86f),
                modifier = Modifier.size(22.dp)
            )
            Spacer(modifier = Modifier.height(5.dp))
            Text(
                text = theme.label,
                style = MaterialTheme.typography.labelMedium,
                color = Color.White,
            )
        }

        if (isSelected) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(8.dp)
                    .size(20.dp)
                    .clip(RoundedCornerShape(50))
                    .background(PurplePrimary.copy(alpha = 0.9f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.Check,
                    contentDescription = "已选",
                    tint = Color.White,
                    modifier = Modifier.size(12.dp)
                )
            }
        }
    }
}
