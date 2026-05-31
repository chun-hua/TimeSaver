package com.ttime.wanliu.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp

val WanliuFontFamily = FontFamily.SansSerif

val CleanTypography = Typography(
    headlineLarge = TextStyle(
        fontFamily = WanliuFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 23.sp,
        lineHeight = 30.sp,
        color = InkWhite
    ),
    headlineMedium = TextStyle(
        fontFamily = WanliuFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp,
        lineHeight = 27.sp,
        color = InkWhite
    ),
    titleMedium = TextStyle(
        fontFamily = WanliuFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp,
        lineHeight = 23.sp,
        color = InkWhite
    ),
    bodyLarge = TextStyle(
        fontFamily = WanliuFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
        lineHeight = 24.sp,
        color = InkSoft
    ),
    bodyMedium = TextStyle(
        fontFamily = WanliuFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        lineHeight = 22.sp,
        color = InkFaint
    ),
    bodySmall = TextStyle(
        fontFamily = WanliuFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 11.sp,
        lineHeight = 17.sp,
        color = InkGhost
    ),
    labelMedium = TextStyle(
        fontFamily = WanliuFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.sp,
        color = InkFaint
    )
)

val CreateTitleStyle = TextStyle(
    fontFamily = WanliuFontFamily,
    fontWeight = FontWeight.SemiBold,
    fontSize = 22.sp,
    lineHeight = 29.sp,
    color = InkWhite
)

val CreateSubtitleStyle = TextStyle(
    fontFamily = WanliuFontFamily,
    fontWeight = FontWeight.Normal,
    fontSize = 13.sp,
    lineHeight = 21.sp,
    color = InkFaint
)

val SectionLabelStyle = TextStyle(
    fontFamily = WanliuFontFamily,
    fontWeight = FontWeight.SemiBold,
    fontSize = 12.sp,
    lineHeight = 16.sp,
    letterSpacing = 0.sp,
    color = InkFaint
)

val ControlTextStyle = TextStyle(
    fontFamily = WanliuFontFamily,
    fontWeight = FontWeight.Medium,
    fontSize = 13.sp,
    lineHeight = 18.sp,
    color = InkSoft,
    textAlign = TextAlign.Center
)

val ButtonTextStyle = TextStyle(
    fontFamily = WanliuFontFamily,
    fontWeight = FontWeight.SemiBold,
    fontSize = 14.sp,
    lineHeight = 19.sp,
    color = InkWhite
)

val DialogTitleStyle = TextStyle(
    fontFamily = WanliuFontFamily,
    fontWeight = FontWeight.SemiBold,
    fontSize = 20.sp,
    lineHeight = 27.sp,
    color = InkWhite,
    textAlign = TextAlign.Center
)

val DialogBodyStyle = TextStyle(
    fontFamily = WanliuFontFamily,
    fontWeight = FontWeight.Normal,
    fontSize = 13.sp,
    lineHeight = 23.sp,
    color = InkFaint,
    textAlign = TextAlign.Center
)

val DialogHintStyle = TextStyle(
    fontFamily = WanliuFontFamily,
    fontWeight = FontWeight.Normal,
    fontSize = 11.sp,
    lineHeight = 18.sp,
    color = InkGhost,
    textAlign = TextAlign.Center
)

val ClockTextStyle = TextStyle(
    fontFamily = FontFamily.SansSerif,
    fontWeight = FontWeight.W300,
    fontSize = 70.sp,
    lineHeight = 78.sp,
    letterSpacing = 0.sp,
    color = InkWhite
)

val ClockSmallStyle = TextStyle(
    fontFamily = FontFamily.SansSerif,
    fontWeight = FontWeight.W300,
    fontSize = 31.sp,
    lineHeight = 38.sp,
    letterSpacing = 0.sp,
    color = InkWhite
)

val ClockGhostStyle = TextStyle(
    fontFamily = FontFamily.SansSerif,
    fontWeight = FontWeight.W300,
    fontSize = 60.sp,
    lineHeight = 68.sp,
    letterSpacing = 0.sp,
    color = InkWhite
)
