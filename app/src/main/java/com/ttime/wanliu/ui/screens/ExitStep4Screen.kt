package com.ttime.wanliu.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.RotateLeft
import androidx.compose.material3.Icon
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
fun ExitStep4Screen(
    themeId: String,
    ghostTimeText: String,
    onBackToFocus: () -> Unit,
    onConfirmExit: () -> Unit
) {
    ExitScaffold(themeId = themeId, ghostTimeText = ghostTimeText) {
        // Check icon
        Box(
            modifier = Modifier
                .size(52.dp)
                .clip(RoundedCornerShape(18.dp))
                .background(EmeraldBg)
                .border(1.dp, Emerald.copy(alpha = 0.28f), RoundedCornerShape(18.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Filled.Check,
                contentDescription = null,
                tint = Emerald,
                modifier = Modifier.size(22.dp)
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "10 分钟已经结束",
            style = DialogTitleStyle,
            color = InkWhite,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "现在你想怎么选择？",
            style = DialogBodyStyle,
            color = InkFaint,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = "无论你选择什么，都请温柔对待自己。",
            style = DialogHintStyle,
            color = InkGhost,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(28.dp))

        // Back to focus button
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(
                    Brush.horizontalGradient(listOf(PurplePrimary, IndigoDeep))
                )
                .clickableWithoutRipple(onClick = onBackToFocus)
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.RotateLeft,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(15.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = "回到任务",
                    color = Color.White,
                    style = ButtonTextStyle
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Confirm exit button
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(Color.White.copy(alpha = 0.06f))
                .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(16.dp))
                .clickableWithoutRipple(onClick = onConfirmExit)
                .padding(14.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "确认离开，下次再来",
                color = Color.White.copy(alpha = 0.45f),
                style = ButtonTextStyle.copy(fontSize = 13.sp, lineHeight = 18.sp, fontWeight = FontWeight.Medium)
            )
        }

        Spacer(modifier = Modifier.height(22.dp))

        Text(
            text = "今天能坚持到这里，已经很了不起了。",
            style = DialogHintStyle,
            color = InkGhost,
            textAlign = TextAlign.Center,
        )
    }
}
