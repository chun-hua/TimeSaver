package com.ttime.wanliu.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ttime.wanliu.ui.components.clickableWithoutRipple
import com.ttime.wanliu.ui.theme.*

@Composable
fun EmergencyScreen(
    onGoHome: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepBackground)
            .background(
                Brush.radialGradient(
                    colors = listOf(
                        Color(0xFF312E81).copy(alpha = 0.3f),
                        Color.Transparent
                    ),
                    center = androidx.compose.ui.geometry.Offset(540f, 400f),
                    radius = 700f
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(40.dp)
        ) {
            Text(
                text = "🌙",
                fontSize = 40.sp
            )

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "去处理吧",
                style = DialogTitleStyle.copy(fontSize = 22.sp, lineHeight = 30.sp),
                color = InkWhite,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = "无论发生什么，都照顾好自己。\n专注空间随时都在，等你回来。",
                style = MaterialTheme.typography.bodyLarge,
                color = InkSoft,
                textAlign = TextAlign.Center,
            )

            Spacer(modifier = Modifier.height(36.dp))

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(15.dp))
                    .background(
                        Brush.horizontalGradient(listOf(PurplePrimary, IndigoDeep))
                    )
                    .clickableWithoutRipple(onClick = onGoHome)
                    .padding(horizontal = 38.dp, vertical = 14.dp)
            ) {
                Text(
                    text = "回到主页",
                    color = Color.White,
                    style = ButtonTextStyle
                )
            }
        }
    }
}
