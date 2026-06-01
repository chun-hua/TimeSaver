package com.ttime.wanliu

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

object AppLeaveEvents {
    private val _events = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val events = _events.asSharedFlow()

    /**
     * 「主动锁屏」抑制窗口的截止时间戳。点「锁屏」时，无论是立即锁屏还是拉起系统授权页，
     * app 都会短暂进入后台并触发离开检测（onUserLeaveHint 与 ON_STOP 可能各触发一次）——
     * 这并非用户想退出专注，应抑制挽留。用一个短时间窗覆盖这一动作引发的所有离开回调。
     */
    @Volatile
    private var suppressLeaveUntilMs = 0L

    /** 锁屏前调用：在接下来的短时间窗内，抑制「离开 app」触发的挽留。 */
    fun markIntentionalLock() {
        suppressLeaveUntilMs = System.currentTimeMillis() + 4000L
    }

    /** 离开检测读取该标记；返回 true 表示当前处于锁屏抑制窗内，应跳过挽留。 */
    fun consumeSuppressLeave(): Boolean =
        System.currentTimeMillis() < suppressLeaveUntilMs

    fun notifyUserLeave() {
        if (consumeSuppressLeave()) return
        _events.tryEmit(Unit)
    }
}
