package com.ttime.wanliu.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.RotateLeft
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ttime.wanliu.ui.components.ProgressRing
import com.ttime.wanliu.ui.components.clickableWithoutRipple
import com.ttime.wanliu.ui.theme.*

@Composable
fun ExitStep3Screen(
    themeId: String,
    ghostTimeText: String,
    coolDownText: String,
    coolDownProgress: Float,
    gentleMessage: String,
    exitReason: String,
    onBackToFocus: () -> Unit,
    onSkipCooldown: () -> Unit
) {
    ExitScaffold(themeId = themeId, ghostTimeText = ghostTimeText) {
        // Ring timer
        Box(
            modifier = Modifier
                .size(128.dp)
                .clickableWithoutRipple(onClick = onSkipCooldown),
            contentAlignment = Alignment.Center
        ) {
            ProgressRing(
                timeText = coolDownText,
                progress = coolDownProgress,
                size = 128f
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "先冷静 10 分钟",
            style = DialogTitleStyle,
            color = InkWhite,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(10.dp))

        Text(
            text = "冲动会升起，也会下降。",
            style = DialogBodyStyle,
            color = InkFaint.copy(alpha = 0.72f),
            textAlign = TextAlign.Center,
        )

        Text(
            text = "你仍然有选择权。",
            style = DialogBodyStyle,
            color = InkFaint.copy(alpha = 0.72f),
            textAlign = TextAlign.Center,
        )

        if (exitReason.isNotBlank()) {
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = "你说你想：$exitReason",
                style = DialogHintStyle.copy(fontSize = 12.sp, lineHeight = 19.sp),
                color = InkFaint,
                fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                textAlign = TextAlign.Center
            )
        }

        Spacer(modifier = Modifier.height(18.dp))

        // Gentle message box
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(Color.White.copy(alpha = 0.07f))
                .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(14.dp))
                .padding(14.dp),
            contentAlignment = Alignment.Center
        ) {
            AnimatedContent(
                targetState = gentleMessage,
                modifier = Modifier.fillMaxWidth(),
                contentAlignment = Alignment.Center,
                transitionSpec = {
                    fadeIn(tween(400)) + slideInVertically(tween(400)) { it / 4 } togetherWith
                        fadeOut(tween(400)) + slideOutVertically(tween(400)) { -it / 4 }
                },
                label = "gentleMsg"
            ) { msg ->
                Text(
                    text = msg,
                    modifier = Modifier.fillMaxWidth(),
                    style = MaterialTheme.typography.bodyMedium,
                    color = InkSoft.copy(alpha = 0.72f),
                    textAlign = TextAlign.Center,
                )
            }
        }

        Spacer(modifier = Modifier.height(22.dp))

        // Back to focus button
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(Color.White.copy(alpha = 0.06f))
                .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(14.dp))
                .clickableWithoutRipple(onClick = onBackToFocus)
                .padding(13.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.RotateLeft,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.5f),
                    modifier = Modifier.size(13.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "我现在就想回到任务",
                    color = Color.White.copy(alpha = 0.5f),
                    style = ButtonTextStyle.copy(fontSize = 13.sp, lineHeight = 18.sp, fontWeight = FontWeight.Medium)
                )
            }
        }
    }
}
