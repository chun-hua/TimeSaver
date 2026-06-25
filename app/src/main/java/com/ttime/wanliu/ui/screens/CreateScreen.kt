package com.ttime.wanliu.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ttime.wanliu.ui.components.*
import com.ttime.wanliu.ui.theme.*
import com.ttime.wanliu.ui.viewmodel.FocusViewModel

@Composable
fun CreateScreen(
    viewModel: FocusViewModel,
    onStartFocus: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val config = state.config
    var showCustomDur by remember { mutableStateOf(config.isCustomDuration) }
    var customMin by remember { mutableStateOf(config.customDurationMinutes.toString()) }
    var showCompanionPicker by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepBackground)
            .background(
                Brush.radialGradient(
                    colors = listOf(
                        Color(0xFF581C87).copy(alpha = 0.22f),
                        Color.Transparent
                    ),
                    center = androidx.compose.ui.geometry.Offset(180f, 300f),
                    radius = 800f
                )
            )
            .background(
                Brush.radialGradient(
                    colors = listOf(
                        Color(0xFF312E81).copy(alpha = 0.26f),
                        Color.Transparent
                    ),
                    center = androidx.compose.ui.geometry.Offset(800f, 800f),
                    radius = 700f
                )
            )
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 28.dp, top = 64.dp, end = 28.dp, bottom = 40.dp),
            horizontalAlignment = Alignment.Start
        ) {
            item { HeaderSection() }

            item { Spacer(modifier = Modifier.height(34.dp)) }

            item {
                TaskInputSection(
                    value = config.taskName,
                    onValueChange = { viewModel.updateTaskName(it) }
                )
            }

            item { Spacer(modifier = Modifier.height(28.dp)) }

            item {
                DurationSection(
                    selectedMinutes = if (config.isCustomDuration) 0 else config.durationMinutes,
                    showCustom = showCustomDur,
                    customValue = customMin,
                    onSelect = { mins ->
                        if (mins == 0) {
                            showCustomDur = true
                            viewModel.updateDuration(mins, isCustom = true)
                        } else {
                            showCustomDur = false
                            viewModel.updateDuration(mins, isCustom = false)
                        }
                    },
                    onCustomValueChange = { v ->
                        customMin = v
                        v.toIntOrNull()?.let { viewModel.updateCustomDuration(it) }
                    }
                )
            }

            item { Spacer(modifier = Modifier.height(28.dp)) }

            item {
                StyleSection(
                    selectedStyle = config.timeWindowStyle,
                    onStyleSelect = { viewModel.updateTimeWindowStyle(it) }
                )
            }

            item { Spacer(modifier = Modifier.height(28.dp)) }

            item {
                ThemeSection(
                    selectedTheme = config.backgroundTheme,
                    onThemeSelect = { viewModel.updateBackgroundTheme(it) }
                )
            }

            item { Spacer(modifier = Modifier.height(28.dp)) }

            item {
                CompanionSection(
                    selectedId = config.companionId,
                    expanded = showCompanionPicker,
                    onExpandedChange = { showCompanionPicker = it },
                    onSelect = { viewModel.updateCompanion(it) }
                )
            }

            item { Spacer(modifier = Modifier.height(28.dp)) }

            item {
                Button(
                    onClick = {
                        if (config.taskName.isBlank()) {
                            viewModel.updateTaskName("专注任务")
                        }
                        onStartFocus()
                        viewModel.startFocus()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.Transparent
                    ),
                    contentPadding = PaddingValues(0.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(RoundedCornerShape(16.dp))
                            .background(
                                Brush.horizontalGradient(listOf(PurplePrimary, IndigoDeep))
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Filled.PlayArrow,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "进入专注空间",
                                style = ButtonTextStyle,
                                color = Color.White,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HeaderSection() {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(13.dp))
                    .background(
                        Brush.horizontalGradient(listOf(PurplePrimary, IndigoDeep))
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.Bedtime,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(19.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = "创建专注空间",
                style = CreateTitleStyle,
                color = InkWhite
            )
        }
        Spacer(modifier = Modifier.height(10.dp))
        Text(
            text = "给自己一段完整的时间，不被打扰。",
            style = CreateSubtitleStyle,
            color = InkFaint
        )
    }
}

@Composable
private fun SectionLabel(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    text: String
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = PurpleLight,
            modifier = Modifier.size(13.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = text,
            style = SectionLabelStyle,
            color = InkFaint,
        )
    }
}

@Composable
private fun CompactTaskField(
    value: String,
    onValueChange: (String) -> Unit
) {
    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        singleLine = true,
        textStyle = MaterialTheme.typography.bodyLarge.copy(
            color = InkWhite,
            fontSize = 14.sp,
            lineHeight = 20.sp
        ),
        cursorBrush = SolidColor(PurplePrimary),
        modifier = Modifier
            .fillMaxWidth()
            .height(34.dp)
            .clip(RoundedCornerShape(13.dp))
            .background(Color.White.copy(alpha = 0.035f))
            .border(1.3.dp, Color.White.copy(alpha = 0.10f), RoundedCornerShape(13.dp))
            .padding(horizontal = 13.dp),
        decorationBox = { innerTextField ->
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.CenterStart
            ) {
                if (value.isBlank()) {
                    Text(
                        text = "例如：写论文 introduction",
                        color = InkGhost,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                innerTextField()
            }
        }
    )
}

@Composable
private fun CustomDurationField(
    value: String,
    onValueChange: (String) -> Unit
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text("30", color = InkGhost) },
            modifier = Modifier.width(90.dp),
            shape = RoundedCornerShape(14.dp),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = InkWhite,
                unfocusedTextColor = InkWhite,
                cursorColor = PurplePrimary,
                focusedBorderColor = PurplePrimary.copy(alpha = 0.65f),
                unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                focusedContainerColor = Color.White.copy(alpha = 0.05f),
                unfocusedContainerColor = Color.White.copy(alpha = 0.05f)
            ),
            textStyle = MaterialTheme.typography.bodyLarge.copy(
                textAlign = TextAlign.Center
            ),
            singleLine = true
        )
        Text(text = "分钟（1-180）", style = MaterialTheme.typography.bodyMedium, color = InkFaint)
    }
}

@Composable
private fun TaskInputSection(
    value: String,
    onValueChange: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        SectionLabel(Icons.Filled.Edit, "当前任务")
        Spacer(modifier = Modifier.height(10.dp))
        CompactTaskField(
            value = value,
            onValueChange = onValueChange
        )
    }
}

@Composable
private fun DurationSection(
    selectedMinutes: Int,
    showCustom: Boolean,
    customValue: String,
    onSelect: (Int) -> Unit,
    onCustomValueChange: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        SectionLabel(Icons.Filled.HourglassBottom, "专注时长")
        Spacer(modifier = Modifier.height(10.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            DurationOptions.forEach { option ->
                val isSel = if (option.minutes == 0) showCustom else option.minutes == selectedMinutes && !showCustom
                DurationPill(
                    option = option,
                    isSelected = isSel,
                    onClick = { onSelect(option.minutes) },
                    modifier = Modifier.weight(1f)
                )
            }
        }

        if (showCustom) {
            Spacer(modifier = Modifier.height(12.dp))
            CustomDurationField(
                value = customValue,
                onValueChange = onCustomValueChange
            )
        }
    }
}

@Composable
private fun ThemeSection(
    selectedTheme: String,
    onThemeSelect: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        SectionLabel(Icons.Filled.PhotoLibrary, "背景主题")
        Spacer(modifier = Modifier.height(10.dp))
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                BackgroundThemes.take(2).forEach { theme ->
                    ThemeCard(
                        theme = theme,
                        isSelected = theme.id == selectedTheme,
                        onClick = { onThemeSelect(theme.id) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                BackgroundThemes.drop(2).forEach { theme ->
                    ThemeCard(
                        theme = theme,
                        isSelected = theme.id == selectedTheme,
                        onClick = { onThemeSelect(theme.id) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
private fun StyleSection(
    selectedStyle: String,
    onStyleSelect: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        SectionLabel(Icons.Filled.Layers, "时间窗口样式")
        Spacer(modifier = Modifier.height(10.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            TimeWindowStyles.forEach { style ->
                StyleCard(
                    modifier = Modifier.weight(1f),
                    style = style,
                    isSelected = style.id == selectedStyle,
                    onClick = { onStyleSelect(style.id) }
                )
            }
        }
    }
}

@Composable
private fun CompanionSection(
    selectedId: String,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
    onSelect: (String) -> Unit
) {
    val selectedCompanion = companionById(selectedId)
    val selectedLabel = selectedCompanion?.name ?: "独自专注"

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            SectionLabel(Icons.Filled.Person, "陪伴者")
            Text(
                text = "可选",
                style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                color = InkGhost,
                modifier = Modifier.padding(start = 4.dp)
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = "选一位大师陪你工作。Ta 的粒子影像会浮现在专注计时的上方，安静地陪着你。",
            style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp, lineHeight = 17.sp),
            color = InkFaint,
            modifier = Modifier.padding(bottom = 12.dp)
        )
        OutlinedButton(
            onClick = { onExpandedChange(!expanded) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = InkSoft
            )
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "已选择：$selectedLabel",
                    style = MaterialTheme.typography.bodyMedium,
                    color = InkSoft
                )
                Icon(
                    imageVector = if (expanded) Icons.Filled.KeyboardArrowUp else Icons.Filled.KeyboardArrowDown,
                    contentDescription = null,
                    tint = InkFaint,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
        if (expanded) {
            Spacer(modifier = Modifier.height(12.dp))
            CompanionPicker(
                selectedId = selectedId,
                onSelect = onSelect
            )
        }
    }
}
