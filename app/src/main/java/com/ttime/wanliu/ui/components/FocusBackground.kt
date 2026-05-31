package com.ttime.wanliu.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import coil.compose.AsyncImage
import coil.request.ImageRequest

/**
 * 沉浸式专注背景：真实照片 + 渐变叠加 + 暗角。
 *
 * 与 HTML 原型中 .bg-img / .bg-overlay / 暗角 vignette 的三层结构一致，
 * 供全屏专注页和退出挽留弹窗共用，确保弹窗"浮在当前背景上"。
 *
 * @param themeId 背景主题标识
 * @param fallbackColor 图片加载前显示的兜底纯色
 */
@Composable
fun FocusBackground(
    themeId: String,
    fallbackColor: Color,
    modifier: Modifier = Modifier
) {
    Box(modifier = modifier.fillMaxSize()) {
        // 兜底纯色（图片加载完成前）
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(fallbackColor)
        )
        // 全屏真实照片背景
        AsyncImage(
            model = ImageRequest.Builder(LocalContext.current)
                .data(themeImageUrl(themeId, full = true))
                .crossfade(true)
                .build(),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.matchParentSize()
        )
        // 渐变叠加层，压暗背景让前景文字可读
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    Brush.linearGradient(
                        colors = listOf(
                            Color(0xFF08081C).copy(alpha = 0.68f),
                            Color(0xFF120824).copy(alpha = 0.60f)
                        )
                    )
                )
        )
        // 暗角 vignette，聚焦中心
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            Color.Transparent,
                            Color.Black.copy(alpha = 0.45f)
                        )
                    )
                )
        )
    }
}
