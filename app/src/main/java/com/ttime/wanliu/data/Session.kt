package com.ttime.wanliu.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "sessions")
data class Session(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val taskName: String,
    val durationMinutes: Int,
    val backgroundTheme: String,
    val timeWindowStyle: String,
    val startTimeMillis: Long,
    val actualFocusSeconds: Int = 0,
    val exitReason: String? = null,
    val isEmergencyExit: Boolean = false,
    val isCompleted: Boolean = false
)
