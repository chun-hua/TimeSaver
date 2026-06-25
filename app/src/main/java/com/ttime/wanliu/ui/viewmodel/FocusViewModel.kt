package com.ttime.wanliu.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.ttime.wanliu.data.AppDatabase
import com.ttime.wanliu.data.Session
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class FocusConfig(
    val taskName: String = "",
    val durationMinutes: Int = 50,
    val backgroundTheme: String = "rain",
    val timeWindowStyle: String = "glass",
    val companionId: String = "none",
    val isCustomDuration: Boolean = false,
    val customDurationMinutes: Int = 30
)

data class FocusState(
    val config: FocusConfig = FocusConfig(),
    val isFocusActive: Boolean = false,
    val totalSeconds: Int = 0,
    val remainingSeconds: Int = 0,
    val elapsedSeconds: Int = 0,
    val sessionId: Long = 0,
    val exitStep: ExitStep = ExitStep.NONE,
    val exitReason: String = "",
    val coolDownSeconds: Int = 0,
    val coolDownActive: Boolean = false,
    val currentGentleMessage: String = GentleMessages.messages.first(),
    val messageIndex: Int = 0
) {
    val progressPercent: Float
        get() = if (totalSeconds > 0) (elapsedSeconds.toFloat() / totalSeconds) * 100f else 0f

    val formattedTime: String
        get() = formatSeconds(remainingSeconds)

    val formattedCoolDown: String
        get() = formatSeconds(coolDownSeconds)

    companion object {
        fun formatSeconds(totalSeconds: Int): String {
            val minutes = totalSeconds / 60
            val seconds = totalSeconds % 60
            return "%02d:%02d".format(minutes, seconds)
        }
    }
}

enum class ExitStep {
    NONE,
    EMERGENCY_CHECK,
    WRITE_REASON,
    COOL_DOWN,
    COOL_DOWN_ENDED,
    EMERGENCY_EXIT
}

object GentleMessages {
    val messages = listOf(
        "先留下这一段时间，不用追求完美。",
        "你不需要完成所有事，\n只是继续待着，就已经很好了。",
        "冲动像浪潮，会来，也会退去。\n你现在只需要等待。",
        "写下那些想法，是为了看清它，\n不是为了评判你自己。",
        "10 分钟很短，\n也足够深呼吸几次。",
        "任何时候回来，都不算晚。\n你一直都有选择权。",
        "冲动会升起，也会下降。\n你仍然有选择权。",
        "不着急，慢慢来。\n你已经在这里了。"
    )
}

class FocusViewModel(application: Application) : AndroidViewModel(application) {

    private val dao = AppDatabase.getInstance(application).sessionDao()

    private val _state = MutableStateFlow(FocusState())
    val state: StateFlow<FocusState> = _state.asStateFlow()

    private var focusTimerJob: Job? = null
    private var coolDownTimerJob: Job? = null
    private var messageCycleJob: Job? = null

    fun updateConfig(config: FocusConfig) {
        _state.value = _state.value.copy(config = config)
    }

    fun updateTaskName(name: String) {
        _state.value = _state.value.copy(
            config = _state.value.config.copy(taskName = name)
        )
    }

    fun updateDuration(minutes: Int, isCustom: Boolean = false) {
        _state.value = _state.value.copy(
            config = _state.value.config.copy(
                durationMinutes = minutes,
                isCustomDuration = isCustom
            )
        )
    }

    fun updateCustomDuration(minutes: Int) {
        val clamped = minutes.coerceIn(1, 180)
        _state.value = _state.value.copy(
            config = _state.value.config.copy(customDurationMinutes = clamped)
        )
    }

    fun updateBackgroundTheme(theme: String) {
        _state.value = _state.value.copy(
            config = _state.value.config.copy(backgroundTheme = theme)
        )
    }

    fun updateTimeWindowStyle(style: String) {
        _state.value = _state.value.copy(
            config = _state.value.config.copy(timeWindowStyle = style)
        )
    }

    fun updateCompanion(companionId: String) {
        _state.value = _state.value.copy(
            config = _state.value.config.copy(companionId = companionId)
        )
    }

    fun startFocus() {
        val config = _state.value.config
        val duration = if (config.isCustomDuration) config.customDurationMinutes else config.durationMinutes
        val totalSeconds = duration * 60

        _state.value = _state.value.copy(
            isFocusActive = true,
            totalSeconds = totalSeconds,
            remainingSeconds = totalSeconds,
            elapsedSeconds = 0,
            exitStep = ExitStep.NONE
        )

        viewModelScope.launch {
            val session = Session(
                taskName = config.taskName.ifBlank { "专注任务" },
                durationMinutes = duration,
                backgroundTheme = config.backgroundTheme,
                timeWindowStyle = config.timeWindowStyle,
                startTimeMillis = System.currentTimeMillis()
            )
            val id = dao.insert(session)
            _state.value = _state.value.copy(sessionId = id)
        }

        startFocusTimer()
    }

    private fun startFocusTimer() {
        focusTimerJob?.cancel()
        focusTimerJob = viewModelScope.launch {
            while (isActive && _state.value.remainingSeconds > 0) {
                delay(1000L)
                val current = _state.value
                if (current.remainingSeconds > 0) {
                    val newRemaining = current.remainingSeconds - 1
                    val newElapsed = current.totalSeconds - newRemaining
                    _state.value = current.copy(
                        remainingSeconds = newRemaining,
                        elapsedSeconds = newElapsed
                    )
                }
            }
            if (_state.value.remainingSeconds == 0 && _state.value.isFocusActive) {
                completeFocus()
            }
        }
    }

    private fun completeFocus() {
        val s = _state.value
        val finalElapsed = s.totalSeconds.coerceAtLeast(s.elapsedSeconds)
        focusTimerJob = null
        _state.value = s.copy(
            isFocusActive = false,
            remainingSeconds = 0,
            elapsedSeconds = finalElapsed,
            exitStep = ExitStep.NONE,
            exitReason = "",
            coolDownSeconds = 0,
            coolDownActive = false
        )
        viewModelScope.launch {
            dao.finishSession(s.sessionId, finalElapsed, completed = true)
        }
    }

    fun showExitCheck() {
        _state.value = _state.value.copy(exitStep = ExitStep.EMERGENCY_CHECK)
    }

    fun emergencyExit() {
        focusTimerJob?.cancel()
        val s = _state.value
        viewModelScope.launch {
            dao.finishSession(s.sessionId, s.elapsedSeconds, completed = false)
            dao.update(
                dao.getById(s.sessionId)?.copy(
                    isEmergencyExit = true,
                    actualFocusSeconds = s.elapsedSeconds
                ) ?: return@launch
            )
        }
        _state.value = _state.value.copy(
            exitStep = ExitStep.EMERGENCY_EXIT,
            isFocusActive = false
        )
    }

    fun showWriteReason() {
        _state.value = _state.value.copy(exitStep = ExitStep.WRITE_REASON)
    }

    fun goBackToEmergencyCheck() {
        _state.value = _state.value.copy(
            exitStep = ExitStep.EMERGENCY_CHECK,
            exitReason = ""
        )
    }

    fun updateExitReason(reason: String) {
        _state.value = _state.value.copy(exitReason = reason)
    }

    fun startCooldown() {
        _state.value = _state.value.copy(
            exitStep = ExitStep.COOL_DOWN,
            coolDownSeconds = 600,
            coolDownActive = true,
            messageIndex = 0,
            currentGentleMessage = GentleMessages.messages.first()
        )
        startCoolDownTimer()
        startMessageCycle()
    }

    private fun startCoolDownTimer() {
        coolDownTimerJob?.cancel()
        coolDownTimerJob = viewModelScope.launch {
            while (isActive && _state.value.coolDownSeconds > 0) {
                delay(1000L)
                val current = _state.value
                val newSeconds = (current.coolDownSeconds - 1).coerceAtLeast(0)
                _state.value = current.copy(coolDownSeconds = newSeconds)
            }
            if (_state.value.coolDownSeconds == 0) {
                _state.value = _state.value.copy(
                    exitStep = ExitStep.COOL_DOWN_ENDED,
                    coolDownActive = false
                )
                messageCycleJob?.cancel()
            }
        }
    }

    private fun startMessageCycle() {
        messageCycleJob?.cancel()
        messageCycleJob = viewModelScope.launch {
            while (isActive && _state.value.coolDownActive) {
                delay(5000L)
                val current = _state.value
                val newIndex = (current.messageIndex + 1) % GentleMessages.messages.size
                _state.value = current.copy(
                    messageIndex = newIndex,
                    currentGentleMessage = GentleMessages.messages[newIndex]
                )
            }
        }
    }

    fun returnToFocus() {
        focusTimerJob?.cancel()
        coolDownTimerJob?.cancel()
        messageCycleJob?.cancel()
        _state.value = _state.value.copy(
            exitStep = ExitStep.NONE,
            exitReason = "",
            coolDownSeconds = 0,
            coolDownActive = false
        )
        if (_state.value.remainingSeconds > 0) {
            startFocusTimer()
        }
    }

    fun confirmExit() {
        focusTimerJob?.cancel()
        coolDownTimerJob?.cancel()
        messageCycleJob?.cancel()
        val s = _state.value
        viewModelScope.launch {
            dao.finishSession(s.sessionId, s.elapsedSeconds, completed = false)
            dao.update(
                dao.getById(s.sessionId)?.copy(
                    exitReason = s.exitReason,
                    actualFocusSeconds = s.elapsedSeconds
                ) ?: return@launch
            )
        }
        _state.value = FocusState()
    }

    fun skipCooldown() {
        coolDownTimerJob?.cancel()
        messageCycleJob?.cancel()
        _state.value = _state.value.copy(
            exitStep = ExitStep.COOL_DOWN_ENDED,
            coolDownSeconds = 0,
            coolDownActive = false
        )
    }

    fun resetToCreate() {
        focusTimerJob?.cancel()
        coolDownTimerJob?.cancel()
        messageCycleJob?.cancel()
        _state.value = FocusState()
    }

    override fun onCleared() {
        super.onCleared()
        focusTimerJob?.cancel()
        coolDownTimerJob?.cancel()
        messageCycleJob?.cancel()
    }
}
