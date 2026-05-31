package com.ttime.wanliu.ui.components

import androidx.compose.ui.graphics.Color

/**
 * 陪伴者数据模型 — 每位大师的元信息与色调。
 */
data class CompanionInfo(
    val id: String,
    val name: String,
    val quote: String,
    val tintRed: Int,
    val tintGreen: Int,
    val tintBlue: Int,
    val isNarrative: Boolean = false  // true = 8-stage narrative (Jobs, Munger)
) {
    val tintColor: Color get() = Color(tintRed, tintGreen, tintBlue)
}

/**
 * 所有可选的陪伴者。
 */
val AllCompanions = listOf(
    CompanionInfo("jobs",       "乔布斯",     "求知若饥，虚心若愚",         125, 211, 252, isNarrative = true),
    CompanionInfo("munger",     "芒格",       "反过来想，总是反过来想",     167, 139, 250, isNarrative = true),
    CompanionInfo("feynman",    "费曼",       "命名不等于理解",             100, 195, 215),
    CompanionInfo("taleb",      "塔勒布",     "Skin in the Game",           215, 165, 95),
    CompanionInfo("musk",       "马斯克",     "从第一性原理出发",           210, 65, 45),
    CompanionInfo("naval",      "纳瓦尔",     "追求特定知识",               185, 165, 120),
    CompanionInfo("pg",         "Paul Graham","做不可规模化的事",            140, 165, 185),
    CompanionInfo("einstein",   "爱因斯坦",   "想象力比知识更重要",         140, 210, 255),
    CompanionInfo("davinci",    "达·芬奇",    "简约，是终极的精致",         240, 206, 150),
    CompanionInfo("zhangyiming","张一鸣",     "延迟满足感",                 80, 140, 200),
    CompanionInfo("sunyuchen",  "孙宇晨",     "注意力即财富",               255, 175, 30),
)

fun companionById(id: String): CompanionInfo? = AllCompanions.find { it.id == id }
