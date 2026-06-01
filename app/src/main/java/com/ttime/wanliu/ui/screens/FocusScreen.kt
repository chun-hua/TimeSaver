package com.ttime.wanliu.ui.screens

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ttime.wanliu.MainActivity
import com.ttime.wanliu.ui.components.FocusBackground
import com.ttime.wanliu.ui.components.TimeBlock
import com.ttime.wanliu.ui.components.CompanionStage
import com.ttime.wanliu.ui.components.companionById
import com.ttime.wanliu.ui.components.clickableWithoutRipple
import com.ttime.wanliu.ui.theme.*
import com.ttime.wanliu.ui.viewmodel.ExitStep
import com.ttime.wanliu.ui.viewmodel.FocusViewModel

/** 从 Compose 的 Context 链中取出宿主 Activity（用于一键锁屏）。 */
private fun Context.findActivity(): Activity? {
    var ctx = this
    while (ctx is ContextWrapper) {
        if (ctx is Activity) return ctx
        ctx = ctx.baseContext
    }
    return null
}

@Composable
fun FocusScreen(
    viewModel: FocusViewModel,
    onExitClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val config = state.config
    val context = LocalContext.current

    // 专注页保持屏幕常亮：计时场景下用户长时间不触屏，否则系统会自动息屏（即“运行一会儿后黑屏”）。
    // 进入专注页时加 FLAG_KEEP_SCREEN_ON，离开时移除，避免影响其它页面/锁屏后耗电。
    DisposableEffect(context) {
        val window = context.findActivity()?.window
        window?.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        onDispose {
            window?.clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }

    BackHandler(enabled = state.isFocusActive && state.exitStep == ExitStep.NONE) {
        viewModel.showExitCheck()
    }

    val themeColor = when (config.backgroundTheme) {
        "rain" -> Color(0xFF1A1A4E)
        "library" -> Color(0xFF2D1F1A)
        "forest" -> Color(0xFF1A2E1A)
        "cyber" -> Color(0xFF1A1A2E)
        else -> SurfaceDeep
    }

    val themeLabel = when (config.backgroundTheme) {
        "rain" -> "雨夜氛围 · 循环播放"
        "library" -> "图书馆氛围 · 循环播放"
        "forest" -> "森林氛围 · 循环播放"
        "cyber" -> "赛博桌面 · 循环播放"
        else -> "沉浸背景 · 循环播放"
    }

    BoxWithConstraints(
        modifier = Modifier.fillMaxSize()
    ) {
        // 横竖屏判定：宽 > 高 即横屏，按原型自适应尺寸/间距
        val landscape = maxWidth > maxHeight

        // 沉浸式真实照片背景（照片 + 渐变 + 暗角）
        FocusBackground(
            themeId = config.backgroundTheme,
            fallbackColor = themeColor
        )

        // Top bar —— 横屏内边距更小（对应原型 .device.landscape .focus-topbar）
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = if (landscape) 30.dp else 18.dp, vertical = 18.dp)
                .statusBarsPadding(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 左侧：退出 + 锁屏
            Row(verticalAlignment = Alignment.CenterVertically) {
                // Exit button
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(Color.White.copy(alpha = 0.06f))
                        .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(10.dp))
                        .clickableWithoutRipple(onClick = onExitClick)
                        .padding(horizontal = 14.dp, vertical = 7.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Filled.Close,
                        contentDescription = "退出",
                        tint = Color.White.copy(alpha = 0.65f),
                        modifier = Modifier.size(11.dp)
                    )
                    Spacer(modifier = Modifier.width(7.dp))
                    Text(
                        text = "退出",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.65f)
                    )
                }

                Spacer(modifier = Modifier.width(10.dp))

                // 一键锁屏按钮
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(Color.White.copy(alpha = 0.06f))
                        .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(10.dp))
                        .clickableWithoutRipple(onClick = {
                            context.findActivity()?.let { act ->
                                (act as? MainActivity)?.lockScreenOrRequestPermission()
                            }
                        })
                        .padding(horizontal = 14.dp, vertical = 7.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Lock,
                        contentDescription = "锁屏专注",
                        tint = Color.White.copy(alpha = 0.65f),
                        modifier = Modifier.size(11.dp)
                    )
                    Spacer(modifier = Modifier.width(7.dp))
                    Text(
                        text = "锁屏",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.65f)
                    )
                }
            }

            // Status indicator
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(Emerald)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "专注中",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.36f)
                )
            }
        }

        // Center — companion stage + time block
        val companion = companionById(config.companionId)

        if (companion != null) {
            if (landscape) {
                // 横屏 + 有陪伴者：左右分置（对应原型 .device.landscape .focus-center.has-companion
                // { flex-direction: row; gap: 18px; }）—— 陪伴者一侧、计时一侧
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 30.dp),
                    horizontalArrangement = Arrangement.spacedBy(18.dp, Alignment.CenterHorizontally),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight(0.78f),
                        contentAlignment = Alignment.Center
                    ) {
                        CompanionStage(
                            companion = companion,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    Box(
                        modifier = Modifier.weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        TimeBlock(
                            taskName = config.taskName.ifBlank { "专注任务" },
                            timeText = state.formattedTime,
                            progressPercent = state.progressPercent,
                            gentleMessage = "先留下这一段时间，不用追求完美。",
                            style = config.timeWindowStyle,
                            landscape = landscape
                        )
                    }
                }
            } else {
                // 竖屏 + 有陪伴者：纵向布局，canvas 在上、time block 在下
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Box(
                        modifier = Modifier.fillMaxWidth(0.84f).fillMaxHeight(0.38f),
                        contentAlignment = Alignment.Center
                    ) {
                        CompanionStage(
                            companion = companion,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    TimeBlock(
                        taskName = config.taskName.ifBlank { "专注任务" },
                        timeText = state.formattedTime,
                        progressPercent = state.progressPercent,
                        gentleMessage = "先留下这一段时间，不用追求完美。",
                        style = config.timeWindowStyle,
                        landscape = landscape
                    )
                }
            }
        } else {
            // 无陪伴者：time block 居中
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                TimeBlock(
                    taskName = config.taskName.ifBlank { "专注任务" },
                    timeText = state.formattedTime,
                    progressPercent = state.progressPercent,
                    gentleMessage = "先留下这一段时间，不用追求完美。",
                    style = config.timeWindowStyle,
                    landscape = landscape
                )
            }
        }

        // Bottom ambient indicator
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(bottom = if (landscape) 14.dp else 24.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Filled.GraphicEq,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.18f),
                modifier = Modifier.size(12.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = themeLabel,
                style = MaterialTheme.typography.bodySmall,
                color = Color.White.copy(alpha = 0.22f)
            )
        }
    }
}
