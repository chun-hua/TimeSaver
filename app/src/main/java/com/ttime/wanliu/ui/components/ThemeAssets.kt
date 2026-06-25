package com.ttime.wanliu.ui.components

import androidx.compose.ui.graphics.Color

/**
 * 背景主题对应的兜底纯色（照片加载完成前显示），色调与各主题照片接近。
 */
fun themeFallbackColor(themeId: String): Color = when (themeId) {
    "rain" -> Color(0xFF1A1A4E)
    "library" -> Color(0xFF2D1F1A)
    "forest" -> Color(0xFF1A2E1A)
    "cyber" -> Color(0xFF1A1A2E)
    else -> Color(0xFF0E0E1A)
}

/**
 * 背景主题对应的真实照片资源。
 *
 * 这些 URL 与 HTML 原型 (wanliu.html) 中使用的 Unsplash 图片完全一致，
 * 保证 Android 端的沉浸式背景与原型视觉统一。
 *
 * @param themeId 主题标识：rain / library / forest / cyber
 * @param full true 返回全屏专注页用的大图，false 返回卡片缩略图
 */
fun themeImageUrl(themeId: String, full: Boolean): String {
    val photoId = when (themeId) {
        "rain" -> "photo-1519692933481-e162a57d6721"
        "library" -> "photo-1481627834876-b7833e8f5570"
        "forest" -> "photo-1441974231531-c6227db76b6e"
        "cyber" -> "photo-1536599018102-9f803c140fc1"
        else -> "photo-1519692933481-e162a57d6721"
    }
    val query = if (full) {
        "w=1920&q=80&auto=format"
    } else {
        "w=520&h=220&fit=crop&q=60&auto=format"
    }
    return "https://images.unsplash.com/$photoId?$query"
}
