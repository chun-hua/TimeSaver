package com.ttime.wanliu.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.QuestionMark
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ttime.wanliu.ui.components.FocusBackground
import com.ttime.wanliu.ui.components.clickableWithoutRipple
import com.ttime.wanliu.ui.components.themeFallbackColor
import com.ttime.wanliu.ui.theme.*

@Composable
fun ExitStep1Screen(
    themeId: String,
    ghostTimeText: String,
    onContinueWorking: () -> Unit,
    onEmergencyExit: () -> Unit,
    onNotEmergency: () -> Unit
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
                imageVector = Icons.Filled.QuestionMark,
                contentDescription = null,
                tint = PurpleLight,
                modifier = Modifier.size(24.dp)
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "你想离开了吗？",
            style = DialogTitleStyle,
            color = InkWhite,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "冲动会来，也会走。再给自己一次机会。",
            style = DialogBodyStyle,
            color = InkFaint,
            textAlign = TextAlign.Center,
        )

        Spacer(modifier = Modifier.height(28.dp))

        // 继续专注工作 — 主推荐操作（翠绿色，最大）
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(
                    Brush.horizontalGradient(
                        listOf(Emerald.copy(alpha = 0.18f), Color(0xFF10B981).copy(alpha = 0.10f))
                    )
                )
                .border(1.dp, Emerald.copy(alpha = 0.35f), RoundedCornerShape(16.dp))
                .clickableWithoutRipple(onClick = onContinueWorking)
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Outlined.AutoAwesome,
                    contentDescription = null,
                    tint = Color(0xFFA7F3D0),
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = "继续专注工作",
                    color = Color(0xFFA7F3D0),
                    style = ButtonTextStyle.copy(fontSize = 14.sp, lineHeight = 19.sp)
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // 我只是想离开一下
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(
                    brush = Brush.horizontalGradient(
                        listOf(PurplePrimary, IndigoDeep)
                    )
                )
                .clickableWithoutRipple(onClick = onNotEmergency)
                .padding(14.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.Spa,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "我只是想离开一下",
                    color = Color.White,
                    style = ButtonTextStyle.copy(fontSize = 13.sp, lineHeight = 18.sp)
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // 紧急情况 — 立即退出（最小）
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(DangerBg)
                .border(1.dp, DangerSoft.copy(alpha = 0.2f), RoundedCornerShape(14.dp))
                .clickableWithoutRipple(onClick = onEmergencyExit)
                .padding(12.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.Warning,
                    contentDescription = null,
                    tint = DangerSoft.copy(alpha = 0.85f),
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(7.dp))
                Text(
                    text = "紧急情况 — 立即退出",
                    color = DangerSoft.copy(alpha = 0.85f),
                    style = ButtonTextStyle.copy(fontSize = 12.sp, lineHeight = 17.sp)
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "如果是紧急情况，我们不会留你。",
            style = DialogHintStyle,
            color = InkGhost,
            textAlign = TextAlign.Center
        )
    }
}

/**
 * 退出挽留弹窗的统一外壳：弹窗浮在当前专注背景之上，背后是虚化、压暗的
 * 时间块"幽灵"，而不是跳到完全空白的页面（对应 HTML 原型的弹窗叠层设计）。
 *
 * @param themeId 当前专注的背景主题
 * @param ghostTimeText 背后虚化时间块显示的倒计时文字
 */
@Composable
fun ExitScaffold(
    themeId: String,
    ghostTimeText: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Box(modifier = Modifier.fillMaxSize()) {
        // 当前专注背景仍然保留
        FocusBackground(
            themeId = themeId,
            fallbackColor = themeFallbackColor(themeId)
        )

        // 背后虚化、压暗的时间块（API 31+ 生效虚化，低版本优雅降级为半透明）
        Box(
            modifier = Modifier
                .fillMaxSize()
                .alpha(0.15f)
                .blur(4.dp),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(28.dp))
                    .background(Color(0x9E080814))
                    .padding(horizontal = 52.dp, vertical = 44.dp)
            ) {
                Text(
                    text = ghostTimeText,
                    style = ClockGhostStyle,
                    color = InkWhite
                )
            }
        }

        // 半透明遮罩 + 居中弹窗卡片
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.55f)),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .padding(horizontal = 24.dp)
                    .clip(RoundedCornerShape(28.dp))
                    .background(Color(0x9E080814))
                    .border(1.dp, Color.White.copy(alpha = 0.09f), RoundedCornerShape(28.dp))
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                content = content
            )
        }
    }
}
