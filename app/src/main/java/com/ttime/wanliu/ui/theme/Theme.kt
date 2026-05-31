package com.ttime.wanliu.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val WanliuDarkScheme = darkColorScheme(
    primary = PurplePrimary,
    onPrimary = Color.White,
    primaryContainer = Color(0xFF2D1B69),
    onPrimaryContainer = PurpleGlow,
    secondary = PurpleLight,
    onSecondary = Color(0xFF1A1033),
    tertiary = Emerald,
    background = DeepBackground,
    onBackground = InkWhite,
    surface = SurfaceDeep,
    onSurface = InkSoft,
    surfaceVariant = SurfaceCard,
    onSurfaceVariant = InkFaint,
    outline = GlassBorder,
    outlineVariant = GlassBorder,
    error = DangerSoft
)

@Composable
fun WanliuTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = WanliuDarkScheme,
        typography = CleanTypography,
        content = content
    )
}
