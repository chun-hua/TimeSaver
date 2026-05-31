package com.ttime.wanliu.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.HourglassBottom
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
fun ExitStep2Screen(
    themeId: String,
    ghostTimeText: String,
    reason: String,
    onReasonChange: (String) -> Unit,
    onStartCooldown: () -> Unit,
    onGoBack: () -> Unit
) {
    ExitScaffold(themeId = themeId, ghostTimeText = ghostTimeText) {
        // Icon
        Box(
            modifier = Modifier
                .size(52.dp)
                .clip(RoundedCornerShape(18.dp))
                .background(PurplePrimary.copy(alpha = 0.18f))
                .border(1.dp, PurplePrimary.copy(alpha = 0.3f), RoundedCornerShape(18.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Filled.Edit,
                contentDescription = null,
                tint = PurpleLight,
                modifier = Modifier.size(22.dp)
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "你现在想去做什么？",
            style = DialogTitleStyle,
            color = InkWhite,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "写下来，不是为了批评你，\n只是让冲动慢一点。",
            style = DialogBodyStyle,
            color = InkFaint,
            textAlign = TextAlign.Center,
        )

        Spacer(modifier = Modifier.height(22.dp))

        OutlinedTextField(
            value = reason,
            onValueChange = onReasonChange,
            placeholder = {
                Text("例如：刷视频、回消息、躺一下、查资料……", style = MaterialTheme.typography.bodyMedium, color = InkGhost)
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(100.dp),
            shape = RoundedCornerShape(14.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = InkWhite,
                unfocusedTextColor = InkWhite,
                cursorColor = PurplePrimary,
                focusedBorderColor = PurplePrimary.copy(alpha = 0.65f),
                unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                focusedContainerColor = Color.White.copy(alpha = 0.05f),
                unfocusedContainerColor = Color.White.copy(alpha = 0.05f)
            ),
            textStyle = MaterialTheme.typography.bodyMedium
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Start cooldown button
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(
                    Brush.horizontalGradient(listOf(PurplePrimary, IndigoDeep))
                )
                .clickableWithoutRipple(onClick = onStartCooldown)
                .padding(14.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.HourglassBottom,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "我写好了，先冷静 10 分钟",
                    color = Color.White,
                    style = ButtonTextStyle.copy(fontSize = 13.sp, lineHeight = 18.sp)
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Back button
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(Color.White.copy(alpha = 0.06f))
                .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(14.dp))
                .clickableWithoutRipple(onClick = onGoBack)
                .padding(12.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.ArrowBack,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.5f),
                    modifier = Modifier.size(12.dp)
                )
                Spacer(modifier = Modifier.width(7.dp))
                Text(
                    text = "返回",
                    color = Color.White.copy(alpha = 0.5f),
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}
